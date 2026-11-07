import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import {
  SpjEntity,
  SpjLegEntity,
  AccountEntity,
  CashAccountEntity,
  RestaurantEntity,
  JournalSourceType,
} from '../../@models';
import {
  SpjMealRecordEntity,
  SpjMealRecordStatus,
} from '../../@models/trips/spj-meal-record.entity';
import { RestaurantSettlementBatchEntity } from '../../@models/finance/restaurant-settlement-batch.entity';
import { AccountingPostingService } from './accounting-posting.service';
import { JournalReversalService } from './journal-reversal.service';
import { MoneyHelper } from '../../@common/helpers/money.helper';
import {
  RecordSpjMealDto,
  CreateRestaurantSettlementBatchDto,
  RestaurantSettlementFilterDto,
} from '../../@dto/finance/restaurant-settlement.dto';

@Injectable()
export class RestaurantSettlementsService {
  constructor(
    @InjectRepository(SpjEntity)
    private readonly spjRepo: Repository<SpjEntity>,

    @InjectRepository(SpjLegEntity)
    private readonly legRepo: Repository<SpjLegEntity>,

    @InjectRepository(RestaurantEntity)
    private readonly restaurantRepo: Repository<RestaurantEntity>,

    @InjectRepository(SpjMealRecordEntity)
    private readonly mealRecordRepo: Repository<SpjMealRecordEntity>,

    @InjectRepository(RestaurantSettlementBatchEntity)
    private readonly batchRepo: Repository<RestaurantSettlementBatchEntity>,

    @InjectRepository(AccountEntity)
    private readonly accountRepo: Repository<AccountEntity>,

    @InjectRepository(CashAccountEntity)
    private readonly cashAccountRepo: Repository<CashAccountEntity>,

    private readonly accountingPostingService: AccountingPostingService,
    private readonly journalReversalService: JournalReversalService,
  ) {}

  /**
   * Mencatat / memperbarui kupon makan riil pada SPJ leg (dengan akrual Beban 51102 vs Utang 21101)
   */
  async recordSpjMeal(
    spjId: string,
    dto: RecordSpjMealDto,
    userId: string,
  ): Promise<SpjMealRecordEntity> {
    const spj = await this.spjRepo.findOne({
      where: { id: spjId },
      relations: ['legs'],
    });

    if (!spj) {
      throw new NotFoundException(`SPJ ID '${spjId}' tidak ditemukan.`);
    }

    const restaurant = await this.restaurantRepo.findOne({
      where: { id: dto.restaurantId },
    });

    if (!restaurant) {
      throw new NotFoundException(`Restoran ID '${dto.restaurantId}' tidak ditemukan.`);
    }

    let leg: SpjLegEntity | null = null;
    if (dto.spjLegId) {
      leg = await this.legRepo.findOne({ where: { id: dto.spjLegId, spjId } });
    } else if (spj.legs && spj.legs.length > 0) {
      leg = spj.legs[0];
    }

    const manifestPax = leg?.passengerCount || dto.actualPax;
    const actualPax = Number(dto.actualPax) || 0;
    const ratePerPax =
      dto.ratePerPax && Number(dto.ratePerPax) > 0
        ? Number(dto.ratePerPax)
        : Number(restaurant.ratePerPax) || 25000;
    const totalAmount = Number(
      MoneyHelper.mul(MoneyHelper.toAmount(ratePerPax), actualPax),
    );

    // Sync juga ke kolom leg agar legacy report tetap akurat
    if (leg) {
      leg.mealPaxCount = actualPax;
      if (dto.discrepancyNotes !== undefined) {
        leg.mealDiscrepancyNotes = dto.discrepancyNotes || '';
      }
      await this.legRepo.save(leg);
    }

    let record = await this.mealRecordRepo.findOne({
      where: {
        spjId,
        ...(leg?.id ? { spjLegId: leg.id } : {}),
      },
    });

    const accounts = await this.accountRepo.find({
      where: { code: In(['51102', '21101']) },
    });
    const accMap = new Map<string, AccountEntity>();
    for (const a of accounts) {
      accMap.set(a.code, a);
    }
    const expenseAcc = accMap.get('51102');
    const payableAcc = accMap.get('21101');

    if (!record) {
      record = this.mealRecordRepo.create({
        companyId: spj.companyId,
        spjId,
        spjLegId: leg?.id,
        restaurantId: restaurant.id,
        manifestPax,
        actualPax,
        ratePerPax,
        totalAmount,
        status: SpjMealRecordStatus.UNPAID,
        discrepancyNotes: dto.discrepancyNotes,
      });
    } else {
      record.restaurantId = restaurant.id;
      record.manifestPax = manifestPax;
      record.actualPax = actualPax;
      record.ratePerPax = ratePerPax;
      record.totalAmount = totalAmount;
      record.discrepancyNotes = dto.discrepancyNotes;
    }

    // Jurnal Akrual Beban Servis Makan (51102 vs 21101) jika belum pernah dijurnal
    if (totalAmount > 0 && !record.journalId && expenseAcc && payableAcc) {
      try {
        const jv = await this.accountingPostingService.postJournal(
          {
            journalDate: new Date().toISOString().split('T')[0],
            sourceType: JournalSourceType.SPJ,
            sourceId: spj.id,
            description: `Akrual Beban Servis Makan Penumpang (${actualPax} Pax @ Rp ${ratePerPax.toLocaleString('id-ID')}) - ${restaurant.name} SPJ ${spj.spjNo}`,
            lines: [
              {
                accountId: expenseAcc.id,
                debit: totalAmount,
                credit: 0,
                description: `Beban Servis Makan ${restaurant.name} SPJ ${spj.spjNo}`,
                tripId: spj.id,
                vehicleId: spj.vehicleId,
                businessUnitId: spj.businessUnitId,
                profitCenterId: spj.profitCenterId,
                costCenterId: spj.costCenterId,
              },
              {
                accountId: payableAcc.id,
                debit: 0,
                credit: totalAmount,
                description: `Utang Servis Makan Restoran ${restaurant.name} SPJ ${spj.spjNo}`,
                tripId: spj.id,
                vehicleId: spj.vehicleId,
                businessUnitId: spj.businessUnitId,
                profitCenterId: spj.profitCenterId,
                costCenterId: spj.costCenterId,
              },
            ],
            idempotencyKey: `SPJ-MEAL-ACCRUAL-${spj.id}-${leg?.id || 'main'}`,
          },
          userId,
        );
        record.journalId = jv.id;
      } catch (err) {
        console.error('Error posting meal accrual journal:', err);
      }
    }

    return this.mealRecordRepo.save(record);
  }

  /**
   * Mengambil data kupon makan pada 1 SPJ
   */
  async getSpjMealRecords(spjId: string): Promise<SpjMealRecordEntity[]> {
    return this.mealRecordRepo.find({
      where: { spjId },
      relations: ['restaurant', 'spjLeg', 'settlementBatch'],
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * Menghapus catatan servis makan dan membalikkan jurnal akrualnya
   */
  async deleteSpjMealRecord(recordId: string, userId: string): Promise<boolean> {
    const record = await this.mealRecordRepo.findOne({
      where: { id: recordId },
      relations: ['spj'],
    });

    if (!record) {
      throw new NotFoundException(`Data kupon makan '${recordId}' tidak ditemukan.`);
    }

    if (record.status === SpjMealRecordStatus.PAID) {
      throw new BadRequestException('Kupon makan yang sudah lunas ditransfer gelondongan tidak dapat dihapus.');
    }

    if (record.journalId) {
      try {
        await this.journalReversalService.reverseJournal(
          record.journalId,
          { reason: `Penghapusan Manual Kupon Makan SPJ ${record.spj?.spjNo || '-'}` },
          userId,
        );
      } catch (err) {
        console.error('Error reversing meal accrual journal:', err);
      }
    }

    await this.mealRecordRepo.remove(record);
    return true;
  }

  /**
   * Mengambil daftar SPJ yang belum dibayar kupon makannya (Siap Bayar Gelondongan)
   */
  async getPendingMealRecords(
    filter?: RestaurantSettlementFilterDto,
  ): Promise<SpjMealRecordEntity[]> {
    const qb = this.mealRecordRepo
      .createQueryBuilder('meal')
      .leftJoinAndSelect('meal.spj', 'spj')
      .leftJoinAndSelect('spj.vehicle', 'vehicle')
      .leftJoinAndSelect('meal.spjLeg', 'leg')
      .leftJoinAndSelect('meal.restaurant', 'restaurant')
      .where('meal.status = :status', { status: SpjMealRecordStatus.UNPAID })
      .andWhere('meal.total_amount > 0');

    if (filter?.restaurantId) {
      qb.andWhere('meal.restaurant_id = :restId', { restId: filter.restaurantId });
    }

    if (filter?.search) {
      qb.andWhere(
        '(spj.spjNo ILIKE :search OR restaurant.name ILIKE :search OR leg.origin ILIKE :search OR leg.destination ILIKE :search)',
        { search: `%${filter.search}%` },
      );
    }

    qb.orderBy('spj.issuedAt', 'DESC');
    return qb.getMany();
  }

  /**
   * Membayar tagihan restoran beberapa SPJ secara GELONDONGAN (Bulk Transfer Bank)
   */
  async createBatchSettlement(
    dto: CreateRestaurantSettlementBatchDto,
    userId: string,
  ): Promise<RestaurantSettlementBatchEntity> {
    if (!dto.spjMealRecordIds || dto.spjMealRecordIds.length === 0) {
      throw new BadRequestException('Pilih minimal satu SPJ untuk dibayar gelondongan.');
    }

    const records = await this.mealRecordRepo.find({
      where: {
        id: In(dto.spjMealRecordIds),
        status: SpjMealRecordStatus.UNPAID,
      },
      relations: ['spj', 'spjLeg', 'restaurant'],
    });

    if (records.length === 0) {
      throw new BadRequestException('Tidak ada data kupon makan valid yang siap dibayar.');
    }

    const restaurant = await this.restaurantRepo.findOne({
      where: { id: dto.restaurantId },
    });

    if (!restaurant) {
      throw new NotFoundException(`Restoran ID '${dto.restaurantId}' tidak ditemukan.`);
    }

    const bankAccount = await this.cashAccountRepo.findOne({
      where: { id: dto.bankAccountId },
      relations: ['account'],
    });

    if (!bankAccount || !bankAccount.accountId) {
      throw new NotFoundException('Akun rekening bank kantor tidak valid.');
    }

    const payableAcc = await this.accountRepo.findOne({
      where: { code: '21101' },
    });

    if (!payableAcc) {
      throw new NotFoundException('Akun COA 21101 (Utang Usaha Vendor Restoran Mitra) tidak ditemukan.');
    }

    const totalAmount = records.reduce(
      (acc, r) => Number(MoneyHelper.add(acc, r.totalAmount)),
      0,
    );
    const totalCoupons = records.reduce((acc, r) => acc + (r.actualPax || 0), 0);
    const uniqueSpjIds = new Set(records.map((r) => r.spjId));
    const totalSpjs = uniqueSpjIds.size;

    const dateStr = dto.paymentDate.replace(/-/g, '').slice(0, 6);
    const countToday = await this.batchRepo.count();
    const batchNo = `BATCH-RM-${dateStr}-${String(countToday + 1).padStart(4, '0')}`;

    // Jurnal Pelunasan Utang Restoran Gelondongan via Bank
    const jv = await this.accountingPostingService.postJournal(
      {
        journalDate: dto.paymentDate,
        sourceType: JournalSourceType.BANK_TRANSACTION,
        description: `Pembayaran Gelondongan Kupon Makan (${batchNo}) - ${restaurant.name} (${totalSpjs} SPJ / ${totalCoupons} Kupon)`,
        lines: [
          {
            accountId: payableAcc.id,
            debit: totalAmount,
            credit: 0,
            description: `Pelunasan Utang Restoran ${restaurant.name} (${batchNo})`,
          },
          {
            accountId: bankAccount.accountId,
            debit: 0,
            credit: totalAmount,
            description: `Pengeluaran Bank ${bankAccount.name} untuk Kupon Makan Restoran`,
          },
        ],
        idempotencyKey: `BATCH-RM-PAY-${batchNo}`,
      },
      userId,
    );

    const batch = this.batchRepo.create({
      companyId: records[0].companyId,
      batchNo,
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      totalSpjs,
      totalCoupons,
      totalAmount,
      paymentDate: dto.paymentDate,
      bankAccountId: dto.bankAccountId,
      referenceNumber: dto.referenceNumber,
      receiptUrl: dto.receiptUrl,
      journalId: jv.id,
      status: 'COMPLETED',
      notes: dto.notes,
      createdById: userId,
    });

    const savedBatch = await this.batchRepo.save(batch);

    for (const r of records) {
      r.status = SpjMealRecordStatus.PAID;
      r.settlementBatchId = savedBatch.id;
      await this.mealRecordRepo.save(r);
    }

    return this.getBatchDetail(savedBatch.id);
  }

  /**
   * Mengambil riwayat batch pembayaran gelondongan restoran
   */
  async getBatches(): Promise<RestaurantSettlementBatchEntity[]> {
    return this.batchRepo.find({
      relations: ['restaurant', 'bankAccount', 'createdBy'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Mengambil rincian 1 batch pembayaran restoran beserta teks WhatsApp remitan
   */
  async getBatchDetail(batchId: string): Promise<any> {
    const batch = await this.batchRepo.findOne({
      where: { id: batchId },
      relations: [
        'restaurant',
        'bankAccount',
        'createdBy',
        'items',
        'items.spj',
        'items.spj.vehicle',
        'items.spjLeg',
      ],
    });

    if (!batch) {
      throw new NotFoundException(`Batch ID '${batchId}' tidak ditemukan.`);
    }

    // Format WhatsApp remitan rincian kupon
    let waText = `*REKAPITULASI PEMBAYARAN KUPON SERVIS MAKAN PENUMPANG*\n`;
    waText += `*PT SS TRAVELINK OFFICIAL*\n`;
    waText += `----------------------------------------\n`;
    waText += `No. Batch: ${batch.batchNo}\n`;
    waText += `Restoran Mitra: ${batch.restaurantName}\n`;
    waText += `Tanggal Transfer: ${batch.paymentDate}\n`;
    waText += `Rekening Asal: ${batch.bankAccount?.name || 'Bank BCA'}\n`;
    waText += `Ref Transfer: ${batch.referenceNumber || '-'}\n`;
    waText += `Total SPJ Bus: ${batch.totalSpjs} Perjalanan\n`;
    waText += `Total Kupon Makan: ${batch.totalCoupons} Kupon\n`;
    waText += `*TOTAL DITRANSFER: Rp ${batch.totalAmount.toLocaleString('id-ID')}*\n`;
    waText += `----------------------------------------\n`;
    waText += `*Rincian Perjalanan Bus:*\n`;

    if (batch.items && batch.items.length > 0) {
      batch.items.forEach((item, idx) => {
        const spjNo = item.spj?.spjNo || 'SPJ';
        const busNo = item.spj?.vehicle?.plateNumber || 'Bus';
        const route = item.spjLeg ? `${item.spjLeg.origin} ➔ ${item.spjLeg.destination}` : 'Rute';
        waText += `${idx + 1}. ${spjNo} (${busNo}): ${route} | ${item.actualPax} Kupon x Rp ${item.ratePerPax.toLocaleString('id-ID')} = Rp ${item.totalAmount.toLocaleString('id-ID')}\n`;
      });
    }

    waText += `----------------------------------------\n`;
    waText += `Bukti transfer terlampir. Terima kasih atas kerjasama yang terjalin baik dengan PT SS Travelink Official.`;

    return {
      ...batch,
      whatsappRemittanceText: waText,
    };
  }

  /**
   * Mengambil daftar seluruh restoran mitra
   */
  async getRestaurants(): Promise<RestaurantEntity[]> {
    return this.restaurantRepo.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }
}
