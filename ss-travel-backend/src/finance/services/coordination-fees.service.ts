import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not } from 'typeorm';
import {
  SpjEntity,
  SpjLegEntity,
  AccountEntity,
  CashAccountEntity,
  JournalSourceType,
} from '../../@models';
import {
  CoordinatorFeeRuleEntity,
} from '../../@models/master-rules/coordinator-fee-rule.entity';
import {
  SpjCoordinationFeeEntity,
  SpjCoordinationFeeStatus,
} from '../../@models/trips/spj-coordination-fee.entity';
import {
  CoordinationFeeBatchEntity,
  CoordinationFeeBatchStatus,
} from '../../@models/finance/coordination-fee-batch.entity';
import { AccountingPostingService } from './accounting-posting.service';
import { DocumentSequenceService } from './document-sequence.service';
import { JournalReversalService } from './journal-reversal.service';
import { MoneyHelper } from '../../@common/helpers/money.helper';
import {
  CreateCoordinationFeeBatchDto,
  CoordinationFeeFilterDto,
  UpdateCoordinatorFeeRuleDto,
} from '../../@dto/finance/coordination-fee.dto';

@Injectable()
export class CoordinationFeesService {
  constructor(
    @InjectRepository(SpjEntity)
    private readonly spjRepo: Repository<SpjEntity>,

    @InjectRepository(SpjLegEntity)
    private readonly legRepo: Repository<SpjLegEntity>,

    @InjectRepository(CoordinatorFeeRuleEntity)
    private readonly ruleRepo: Repository<CoordinatorFeeRuleEntity>,

    @InjectRepository(SpjCoordinationFeeEntity)
    private readonly spjFeeRepo: Repository<SpjCoordinationFeeEntity>,

    @InjectRepository(CoordinationFeeBatchEntity)
    private readonly batchRepo: Repository<CoordinationFeeBatchEntity>,

    @InjectRepository(AccountEntity)
    private readonly accountRepo: Repository<AccountEntity>,

    @InjectRepository(CashAccountEntity)
    private readonly cashAccountRepo: Repository<CashAccountEntity>,

    private readonly accountingPostingService: AccountingPostingService,
    private readonly sequenceService: DocumentSequenceService,
    private readonly journalReversalService: JournalReversalService,
  ) {}

  /**
   * Menghitung dan menyinkronkan kewajiban Uang Koordinasi Lapangan atas SPJ
   * (Diakui sebagai Beban 52105 vs Utang 22102)
   */
  async syncSpjCoordinationFees(
    spjId: string,
    userId?: string,
  ): Promise<SpjCoordinationFeeEntity[]> {
    const spj = await this.spjRepo.findOne({
      where: { id: spjId },
      relations: ['legs', 'revenueDeclarations', 'revenueDeclarations.agent', 'coordinationFees'],
    });

    if (!spj) {
      throw new NotFoundException(`SPJ ID '${spjId}' tidak ditemukan.`);
    }

    if (!spj.legs || spj.legs.length === 0) {
      return [];
    }

    const rules = await this.ruleRepo.find({
      where: spj.companyId ? { companyId: spj.companyId, isActive: true } : { isActive: true },
      relations: ['coordinatorUser'],
    });

    const ruleFallback = rules.find((r) => r.origin === 'ALL' && r.destination === 'ALL');

    const accounts = await this.accountRepo.find({
      where: { code: In(['52105', '22102']) },
    });
    const accMap = new Map<string, AccountEntity>();
    for (const a of accounts) {
      accMap.set(a.code, a);
    }

    const expenseAcc = accMap.get('52105');
    const payableAcc = accMap.get('22102');

    const result: SpjCoordinationFeeEntity[] = [];

    for (const leg of spj.legs) {
      let rule = spj.routeId ? rules.find((r) => r.routeId === spj.routeId) : null;
      if (!rule) {
        rule = rules.find((r) => r.origin === leg.origin && r.destination === leg.destination);
      }
      if (!rule) {
        rule = ruleFallback;
      }
      
      const feePerPax = rule?.feePerPax || 10000;

      // Cari apakah sudah ada entitas koordinasi fee untuk leg ini
      let feeEntity = await this.spjFeeRepo.findOne({
        where: {
          spjId,
          spjLegId: leg.id,
        },
      });

      // Hitung total tiket riil dari deklarasi pendapatan untuk leg ini
      let ticketCount = 0;
      if (spj.revenueDeclarations && spj.revenueDeclarations.length > 0) {
        const legTickets = spj.revenueDeclarations
          .filter((r) => {
            // 1. Jika terikat langsung ke leg ID
            if (r.spjLegId) {
              return r.spjLegId === leg.id;
            }
            // 2. Fallback: hanya jika leg pertama SPJ (awal keberangkatan)
            return spj.legs?.[0]?.id === leg.id;
          })
          .reduce((acc, r) => acc + (r.ticketCount || 0), 0);
        ticketCount = legTickets;
      }

      // Jika tidak ada deklarasi pendapatan sama sekali pada SPJ ini, baru fallback ke passengerCount leg
      if (ticketCount === 0 && (!spj.revenueDeclarations || spj.revenueDeclarations.length === 0)) {
        ticketCount = leg.passengerCount || 0;
      }

      // JIKA TIKET 0 (misal leg arah sebaliknya belum ada tiket yang terjual):
      if (ticketCount <= 0) {
        if (feeEntity && feeEntity.status === SpjCoordinationFeeStatus.UNPAID) {
          if (feeEntity.journalId) {
            try {
              await this.journalReversalService.reverseJournal(
                feeEntity.journalId,
                { reason: `Pembatalan Akrual Uang Koordinasi Rute ${leg.origin}-${leg.destination} (0 Tiket Terjual) SPJ ${spj.spjNo}` },
                userId,
              );
            } catch (err) {
              console.error('Error reversing coordination fee journal on zero tickets:', err);
            }
          }
          await this.spjFeeRepo.remove(feeEntity);
        }
        continue;
      }

      const totalFee = Number(
        MoneyHelper.mul(MoneyHelper.toAmount(feePerPax), ticketCount),
      );

      if (!feeEntity) {
        feeEntity = this.spjFeeRepo.create({
          companyId: spj.companyId,
          spjId,
          spjLegId: leg.id,
          origin: leg.origin,
          destination: leg.destination,
          ticketCount,
          feePerPax,
          totalFee,
          coordinatorUserId: rule?.coordinatorUserId,
          status: SpjCoordinationFeeStatus.UNPAID,
          notes: `Uang koordinasi Rute (${leg.origin} ➔ ${leg.destination})`,
        });
      } else {
        feeEntity.origin = leg.origin;
        feeEntity.destination = leg.destination;
        feeEntity.ticketCount = ticketCount;
        feeEntity.feePerPax = feePerPax;
        feeEntity.totalFee = totalFee;
        if (rule?.coordinatorUserId) {
          feeEntity.coordinatorUserId = rule.coordinatorUserId;
        }
      }

      // Otomasi Jurnal Akrual Beban Koordinasi Lapangan (Matching Principle)
      if (
        totalFee > 0 &&
        !feeEntity.journalId &&
        expenseAcc &&
        payableAcc
      ) {
        try {
          const jv = await this.accountingPostingService.postJournal(
            {
              journalDate: new Date().toISOString().split('T')[0],
              sourceType: JournalSourceType.SPJ,
              sourceId: spj.id,
              description: `Akrual Beban Koordinasi Lapangan (${ticketCount} Pax @ Rp ${feePerPax.toLocaleString('id-ID')}) SPJ ${spj.spjNo}`,
              lines: [
                {
                  accountId: expenseAcc.id,
                  debit: totalFee,
                  credit: 0,
                  description: `Beban Koordinasi Lapangan Rute ${leg.origin}-${leg.destination} SPJ ${spj.spjNo}`,
                  tripId: spj.id,
                  vehicleId: spj.vehicleId,
                  businessUnitId: spj.businessUnitId,
                  profitCenterId: spj.profitCenterId,
                  costCenterId: spj.costCenterId,
                },
                {
                  accountId: payableAcc.id,
                  debit: 0,
                  credit: totalFee,
                  description: `Utang Koordinasi Lapangan Rute ${leg.origin}-${leg.destination} SPJ ${spj.spjNo}`,
                  tripId: spj.id,
                  vehicleId: spj.vehicleId,
                  businessUnitId: spj.businessUnitId,
                  profitCenterId: spj.profitCenterId,
                  costCenterId: spj.costCenterId,
                },
              ],
              idempotencyKey: `SPJ-KOR-ACCRUAL-${spj.id}-${leg.id}`,
            },
            userId,
          );
          feeEntity.journalId = jv.id;
        } catch (err) {
          console.error('Error posting coordination fee accrual journal:', err);
        }
      }

      await this.spjFeeRepo.save(feeEntity);
      result.push(feeEntity);
    }

    const activeFeeIds = result.map((r) => r.id);
    if (activeFeeIds.length > 0) {
      const obsoleteFees = await this.spjFeeRepo.find({
        where: {
          spjId,
          id: Not(In(activeFeeIds)),
          status: SpjCoordinationFeeStatus.UNPAID,
        },
      });

      for (const obs of obsoleteFees) {
        if (obs.journalId) {
          try {
            await this.journalReversalService.reverseJournal(
              obs.journalId,
              { reason: `Pembersihan Akrual Uang Koordinasi Obsolete SPJ ${spj.spjNo}` },
              userId,
            );
          } catch (err) {
            console.error('Error reversing obsolete fee journal:', err);
          }
        }
        await this.spjFeeRepo.remove(obs);
      }
    }

    return this.getSpjCoordinationFees(spjId);
  }

  /**
   * Menghapus kewajiban koordinasi secara manual dan membatalkan jurnal akrualnya
   */
  async deleteCoordinationFee(feeId: string, userId: string): Promise<boolean> {
    const fee = await this.spjFeeRepo.findOne({
      where: { id: feeId },
      relations: ['spj'],
    });

    if (!fee) {
      throw new NotFoundException(`Data fee koordinasi '${feeId}' tidak ditemukan.`);
    }

    if (fee.status === SpjCoordinationFeeStatus.PAID) {
      throw new BadRequestException('Kewajiban koordinasi yang sudah lunas ditransfer gelondongan tidak dapat dihapus.');
    }

    if (fee.journalId) {
      try {
        await this.journalReversalService.reverseJournal(
          fee.journalId,
          { reason: `Penghapusan Manual Uang Koordinasi Rute ${fee.origin}-${fee.destination} SPJ ${fee.spj?.spjNo || '-'}` },
          userId,
        );
      } catch (err) {
        console.error('Error reversing coordination fee journal on manual delete:', err);
      }
    }

    await this.spjFeeRepo.remove(fee);
    return true;
  }

  /**
   * Mengambil seluruh rincian uang koordinasi pada 1 SPJ
   */
  async getSpjCoordinationFees(spjId: string): Promise<SpjCoordinationFeeEntity[]> {
    return this.spjFeeRepo.find({
      where: { spjId },
      relations: ['spjLeg', 'settlementBatch', 'coordinatorUser'],
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * Mengambil daftar seluruh SPJ yang belum dibayar koordinasinya (Siap Bayar Gelondongan)
   */
  async getPendingCoordinationFees(
    query?: CoordinationFeeFilterDto,
  ): Promise<SpjCoordinationFeeEntity[]> {
    const qb = this.spjFeeRepo
      .createQueryBuilder('fee')
      .leftJoinAndSelect('fee.spj', 'spj')
      .leftJoinAndSelect('spj.vehicle', 'vehicle')
      .leftJoinAndSelect('fee.spjLeg', 'leg')
      .leftJoinAndSelect('fee.coordinatorUser', 'coordinatorUser')
      .where('fee.status = :status', { status: SpjCoordinationFeeStatus.UNPAID })
      .andWhere('fee.total_fee > 0');

    if (query?.origin) {
      qb.andWhere('fee.origin ILIKE :origin', { origin: `%${query.origin}%` });
    }
    
    if (query?.destination) {
      qb.andWhere('fee.destination ILIKE :destination', { destination: `%${query.destination}%` });
    }

    if (query?.search) {
      qb.andWhere(
        '(spj.spjNo ILIKE :search OR leg.origin ILIKE :search OR leg.destination ILIKE :search OR coordinatorUser.name ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    qb.orderBy('spj.issuedAt', 'DESC');
    return qb.getMany();
  }

  /**
   * Membayar uang koordinasi beberapa SPJ secara GELONDONGAN (Bulk Transfer Settlement via Bank)
   */
  async createBatchSettlement(
    dto: CreateCoordinationFeeBatchDto,
    userId: string,
  ): Promise<CoordinationFeeBatchEntity> {
    if (!dto.spjCoordinationFeeIds || dto.spjCoordinationFeeIds.length === 0) {
      throw new BadRequestException('Pilih minimal satu SPJ untuk dibayar gelondongan.');
    }

    const fees = await this.spjFeeRepo.find({
      where: {
        id: In(dto.spjCoordinationFeeIds),
        status: SpjCoordinationFeeStatus.UNPAID,
      },
      relations: ['spj', 'spjLeg', 'coordinatorUser'],
    });

    if (fees.length === 0) {
      throw new BadRequestException('Tidak ada kewajiban koordinasi valid yang siap dibayar.');
    }

    const bankAccount = await this.cashAccountRepo.findOne({
      where: { id: dto.bankAccountId },
      relations: ['account'],
    });

    if (!bankAccount || !bankAccount.accountId) {
      throw new NotFoundException('Akun rekening bank kantor tidak valid.');
    }

    const payableAcc = await this.accountRepo.findOne({
      where: { code: '22102' },
    });

    if (!payableAcc) {
      throw new NotFoundException('Akun COA 22102 (Utang Jasa Koordinator Lapangan) tidak ditemukan.');
    }

    // Hitung total gelondongan
    const totalAmount = fees.reduce(
      (acc, f) => Number(MoneyHelper.add(acc, f.totalFee)),
      0,
    );
    const totalTickets = fees.reduce((acc, f) => acc + (f.ticketCount || 0), 0);
    const uniqueSpjIds = new Set(fees.map((f) => f.spjId));
    const totalSpjs = uniqueSpjIds.size;

    const coordinatorUser = fees.find((f) => f.coordinatorUser)?.coordinatorUser;
    const coordinatorName = coordinatorUser?.name || `Koordinator Rute ${dto.origin}-${dto.destination}`;

    // Generate batch number
    const dateStr = dto.paymentDate.replace(/-/g, '').slice(0, 6);
    const countToday = await this.batchRepo.count();
    const batchNo = `BATCH-KOR-${dateStr}-${String(countToday + 1).padStart(4, '0')}`;

    // Post Jurnal Pengeluaran Bank (Pelunasan Utang Koordinasi Gelondongan)
    const jv = await this.accountingPostingService.postJournal(
      {
        journalDate: dto.paymentDate,
        sourceType: JournalSourceType.BANK_TRANSACTION,
        description: `Pembayaran Gelondongan Fee Koordinasi Rute ${dto.origin}-${dto.destination} (${batchNo}) - ${totalSpjs} SPJ / ${totalTickets} Tiket`,
        lines: [
          {
            accountId: payableAcc.id,
            debit: totalAmount,
            credit: 0,
            description: `Pelunasan Utang Koordinasi Lapangan Rute ${dto.origin}-${dto.destination} (${batchNo})`,
          },
          {
            accountId: bankAccount.accountId,
            debit: 0,
            credit: totalAmount,
            description: `Pengeluaran Bank ${bankAccount.name} untuk Fee Koordinasi Gelondongan`,
          },
        ],
        idempotencyKey: `BATCH-KOR-PAY-${batchNo}`,
      },
      userId,
    );

    // Simpan data batch
    const batch = this.batchRepo.create({
      companyId: fees[0].companyId,
      batchNo,
      origin: dto.origin,
      destination: dto.destination,
      coordinatorUserId: coordinatorUser?.id,
      coordinatorName,
      totalSpjs,
      totalTickets,
      totalAmount,
      paymentDate: dto.paymentDate,
      bankAccountId: dto.bankAccountId,
      referenceNumber: dto.referenceNumber,
      receiptUrl: dto.receiptUrl,
      journalId: jv.id,
      status: CoordinationFeeBatchStatus.COMPLETED,
      notes: dto.notes,
      createdById: userId,
    });

    const savedBatch = await this.batchRepo.save(batch);

    // Update seluruh fee yang dibayar
    for (const f of fees) {
      f.status = SpjCoordinationFeeStatus.PAID;
      f.settlementBatchId = savedBatch.id;
      await this.spjFeeRepo.save(f);
    }

    return this.getBatchDetail(savedBatch.id);
  }

  /**
   * Mengambil riwayat batch pembayaran gelondongan
   */
  async getBatches(): Promise<CoordinationFeeBatchEntity[]> {
    return this.batchRepo.find({
      relations: ['bankAccount', 'createdBy', 'coordinatorUser'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Mengambil rincian 1 batch beserta teks remitan WhatsApp
   */
  async getBatchDetail(batchId: string): Promise<any> {
    const batch = await this.batchRepo.findOne({
      where: { id: batchId },
      relations: [
        'bankAccount',
        'createdBy',
        'coordinatorUser',
        'items',
        'items.spj',
        'items.spj.vehicle',
        'items.spjLeg',
      ],
    });

    if (!batch) {
      throw new NotFoundException(`Batch ID '${batchId}' tidak ditemukan.`);
    }

    // Format pesan WhatsApp rincian siap kirim
    let waText = `*REKAPITULASI PEMBAYARAN UANG KOORDINASI LAPANGAN*\n`;
    waText += `*PT SS TRAVELINK OFFICIAL*\n`;
    waText += `----------------------------------------\n`;
    waText += `No. Batch: ${batch.batchNo}\n`;
    waText += `Rute Korlap: ${batch.origin} ➔ ${batch.destination}\n`;
    waText += `Penerima: ${batch.coordinatorName}\n`;
    waText += `Tanggal Transfer: ${batch.paymentDate}\n`;
    waText += `Rekening Asal: ${batch.bankAccount?.name || 'Bank BCA'}\n`;
    waText += `Ref Transfer: ${batch.referenceNumber || '-'}\n`;
    waText += `Total SPJ: ${batch.totalSpjs} Trip Bus\n`;
    waText += `Total Penumpang: ${batch.totalTickets} Pax\n`;
    waText += `*TOTAL DITRANSFER: Rp ${batch.totalAmount.toLocaleString('id-ID')}*\n`;
    waText += `----------------------------------------\n`;
    waText += `*Rincian SPJ Perjalanan:*\n`;

    if (batch.items && batch.items.length > 0) {
      batch.items.forEach((item, idx) => {
        const spjNo = item.spj?.spjNo || 'SPJ';
        const busNo = item.spj?.vehicle?.plateNumber || 'Bus';
        const route = item.spjLeg ? `${item.spjLeg.origin} ➔ ${item.spjLeg.destination}` : 'Rute';
        waText += `${idx + 1}. ${spjNo} (${busNo}): ${route} | ${item.ticketCount} Pax x Rp ${item.feePerPax.toLocaleString('id-ID')} = Rp ${item.totalFee.toLocaleString('id-ID')}\n`;
      });
    }

    waText += `----------------------------------------\n`;
    waText += `Terima kasih atas kerja samanya. Salam hangat, Finance PT SS Travelink Official.`;

    return {
      ...batch,
      whatsappRemittanceText: waText,
    };
  }

  /**
   * Mengambil daftar aturan tarif koordinasi
   */
  async getRules(): Promise<CoordinatorFeeRuleEntity[]> {
    return this.ruleRepo.find({
      relations: ['coordinatorUser'],
      order: { origin: 'ASC', destination: 'ASC' },
    });
  }

  /**
   * Memperbarui aturan tarif koordinasi
   */
  async updateRule(
    id: string,
    dto: UpdateCoordinatorFeeRuleDto,
  ): Promise<CoordinatorFeeRuleEntity> {
    const rule = await this.ruleRepo.findOne({ where: { id } });
    if (!rule) {
      throw new NotFoundException(`Aturan tarif ID '${id}' tidak ditemukan.`);
    }

    if (dto.feePerPax !== undefined) {
      rule.feePerPax = Number(dto.feePerPax);
    }
    if (dto.coordinatorUserId !== undefined) {
      rule.coordinatorUserId = dto.coordinatorUserId;
    }

    return this.ruleRepo.save(rule);
  }
}
