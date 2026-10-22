import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import {
  CrewCashSettlementEntity,
  CrewCashRemittanceEntity,
  CrewCashRemittanceAllocationEntity,
  CrewCashDiscrepancyEntity,
  CrewCashSettlementStatus,
  SettlementUjStatus,
  SettlementRevenueStatus,
  RemittanceStatus,
  SpjEntity,
  SpjFinancialStatus,
  SpjOperationalStatus,
  SpjExpenseType,
  SpjRevenueDeclarationEntity,
  CrewMealPaymentEntity,
  CrewMealPaymentStatus,
  SpjExpensePaymentSource,
  CashAccountEntity,
  AccountEntity,
  JournalSourceType,
} from '../../@models';
import { AccountingPostingService } from '../../finance/services/accounting-posting.service';
import { DocumentSequenceService } from '../../finance/services/document-sequence.service';
import { MoneyHelper } from '../../@common/helpers/money.helper';
import { CreateSettlementDto, CashierFilterQueryDto } from '../../@dto/cashier';

export interface SettlementSummaryResult {
  spj: SpjEntity;
  existingSettlement: CrewCashSettlementEntity | null;
  // Kantong 1: Uang Jalan
  kantong1Uj: {
    totalDisbursed: number;
    totalSpent: number;
    totalReturned: number;
    balance: number;
    status: SettlementUjStatus;
    breakdownExpenses: Array<{
      type: string;
      amount: number;
      fuelLiters?: number;
      odometerKm?: number;
      notes?: string;
    }>;
  };
  // Kantong 2: Penerimaan Bruto Perusahaan (Anti-Netting)
  kantong2Revenue: {
    totalExpected: number;
    totalRemitted: number;
    balance: number;
    status: SettlementRevenueStatus;
    breakdownDeclarations: Array<{
      id: string;
      type: string;
      amount: number;
      sourceReference?: string;
      crewCommissionAmount?: number;
      allocatedAmount: number;
      status: string;
    }>;
    remittances: CrewCashRemittanceEntity[];
  };
  // Posisi Kas Kasir Pool
  cashDesk: {
    totalCashReceived: number; // Sisa UJ + Setoran Kas Tiket & Kargo
    totalCrewCompensationPayable: number; // Hak kru yang belum dibayar (Uang makan / komisi kargo)
    netCashPosition: number; // Kas diterima - Kas dibayar kru
    pendingMealPayments: CrewMealPaymentEntity[];
  };
  discrepancies: CrewCashDiscrepancyEntity[];
}

@Injectable()
export class CashierSettlementService {
  constructor(
    @InjectRepository(CrewCashSettlementEntity)
    private readonly settlementRepo: Repository<CrewCashSettlementEntity>,
    @InjectRepository(CrewCashRemittanceEntity)
    private readonly remittanceRepo: Repository<CrewCashRemittanceEntity>,
    @InjectRepository(CrewCashRemittanceAllocationEntity)
    private readonly allocationRepo: Repository<CrewCashRemittanceAllocationEntity>,
    @InjectRepository(CrewCashDiscrepancyEntity)
    private readonly discrepancyRepo: Repository<CrewCashDiscrepancyEntity>,
    @InjectRepository(SpjEntity)
    private readonly spjRepo: Repository<SpjEntity>,
    @InjectRepository(CashAccountEntity)
    private readonly cashAccountRepo: Repository<CashAccountEntity>,
    @InjectRepository(AccountEntity)
    private readonly accountRepo: Repository<AccountEntity>,
    private readonly accountingPostingService: AccountingPostingService,
    private readonly documentSequenceService: DocumentSequenceService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Menampilkan daftar SPJ yang menunggu penyelesaian di Meja Kasir Pool
   */
  async getPendingSpjs(query: CashierFilterQueryDto): Promise<{ items: any[]; total: number }> {
    const qb = this.spjRepo
      .createQueryBuilder('spj')
      .leftJoinAndSelect('spj.vehicle', 'vehicle')
      .leftJoinAndSelect('spj.legs', 'legs')
      .leftJoinAndSelect('spj.crewAssignments', 'crewAssignments')
      .leftJoinAndSelect('crewAssignments.crew', 'crew')
      .leftJoinAndSelect('spj.settlements', 'settlements')
      .where('spj.financialStatus IN (:...statuses)', {
        statuses: [
          SpjFinancialStatus.PENDING_SETTLEMENT,
          SpjFinancialStatus.UNDER_REVIEW,
          SpjFinancialStatus.DISCREPANCY,
        ],
      });

    if (query.search) {
      qb.andWhere('(spj.spjNo ILIKE :search OR vehicle.code ILIKE :search OR vehicle.plateNumber ILIKE :search)', {
        search: `%${query.search}%`,
      });
    }

    if (query.status) {
      qb.andWhere('settlements.status = :settleStatus', { settleStatus: query.status });
    }

    qb.orderBy('spj.createdAt', 'DESC');

    const page = query.page || 1;
    const limit = query.limit || 10;
    qb.skip((page - 1) * limit).take(limit);

    const [items, total] = await qb.getManyAndCount();
    return { items, total };
  }

  /**
   * Menampilkan riwayat seluruh settlement kas kasir
   */
  async getSettlements(query: CashierFilterQueryDto): Promise<{ items: CrewCashSettlementEntity[]; total: number }> {
    const qb = this.settlementRepo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.spj', 'spj')
      .leftJoinAndSelect('spj.vehicle', 'vehicle')
      .leftJoinAndSelect('s.cashier', 'cashier')
      .leftJoinAndSelect('s.reviewedBy', 'reviewedBy')
      .leftJoinAndSelect('s.remittances', 'remittances')
      .leftJoinAndSelect('s.discrepancies', 'discrepancies');

    if (query.status) {
      qb.andWhere('s.status = :status', { status: query.status });
    }

    if (query.search) {
      qb.andWhere('(s.settlementNo ILIKE :search OR spj.spjNo ILIKE :search)', {
        search: `%${query.search}%`,
      });
    }

    qb.orderBy('s.createdAt', 'DESC');

    const page = query.page || 1;
    const limit = query.limit || 10;
    qb.skip((page - 1) * limit).take(limit);

    const [items, total] = await qb.getManyAndCount();
    return { items, total };
  }

  /**
   * Menghitung dan menyajikan kalkulasi Dua Kantong Kas Kru (Anti-Netting) secara real-time
   */
  async calculateSettlement(spjId: string): Promise<SettlementSummaryResult> {
    const spj = await this.spjRepo.findOne({
      where: { id: spjId },
      relations: [
        'vehicle',
        'legs',
        'crewAssignments',
        'crewAssignments.crew',
        'ujs',
        'ujs.disbursements',
        'ujs.returns',
        'expenses',
        'revenueDeclarations',
        'crewMealPayments',
        'settlements',
        'discrepancies',
      ],
    });

    if (!spj) {
      throw new NotFoundException(`SPJ dengan ID '${spjId}' tidak ditemukan.`);
    }

    // Ambil settlement terakhir jika ada
    const existingSettlement =
      spj.settlements && spj.settlements.length > 0
        ? spj.settlements.sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          )[0]
        : null;

    // Ambil setoran aktual remittances
    const remittances = await this.remittanceRepo.find({
      where: { spjId },
      relations: ['allocations', 'depositorCrew', 'cashAccount'],
      order: { createdAt: 'ASC' },
    });

    // 1. KANTONG 1: Uang Jalan (Plafon vs Nota vs Sisa Fisik Kembali)
    let totalUjDisbursed = 0;
    let totalUjReturned = 0;

    if (spj.ujs && spj.ujs.length > 0) {
      for (const uj of spj.ujs) {
        if (uj.disbursements) {
          for (const d of uj.disbursements) {
            totalUjDisbursed = Number(
              MoneyHelper.add(totalUjDisbursed, d.amount),
            );
          }
        }
        if (uj.returns) {
          for (const r of uj.returns) {
            totalUjReturned = Number(
              MoneyHelper.add(totalUjReturned, r.amount),
            );
          }
        }
      }
    }

    // Biaya UJ yang sah (disetujui dan paymentSource = UJ)
    let totalUjSpent = 0;
    const breakdownExpenses: Array<{
      type: string;
      amount: number;
      fuelLiters?: number;
      odometerKm?: number;
      notes?: string;
    }> = [];

    if (spj.expenses && spj.expenses.length > 0) {
      for (const exp of spj.expenses) {
        if (exp.paymentSource === SpjExpensePaymentSource.UJ) {
          totalUjSpent = Number(
            MoneyHelper.add(totalUjSpent, exp.amount),
          );
          breakdownExpenses.push({
            type: exp.expenseType,
            amount: Number(exp.amount),
            fuelLiters: exp.fuelLiters ? Number(exp.fuelLiters) : undefined,
            odometerKm: exp.odometerKm,
            notes: exp.notes,
          });
        }
      }
    }

    // Saldo UJ = Disbursed - Spent - Returned (0 = BALANCED)
    const ujBalance = Number(
      MoneyHelper.sub(
        totalUjDisbursed,
        MoneyHelper.add(totalUjSpent, totalUjReturned),
      ),
    );
    const ujStatus = MoneyHelper.isEqual(ujBalance, 0)
      ? SettlementUjStatus.BALANCED
      : SettlementUjStatus.DISCREPANCY;

    // 2. KANTONG 2: Penerimaan Bruto Perusahaan (Anti-Netting)
    let totalRevenueExpected = 0;
    const breakdownDeclarations: Array<{
      id: string;
      type: string;
      amount: number;
      sourceReference?: string;
      crewCommissionAmount?: number;
      allocatedAmount: number;
      status: string;
    }> = [];

    if (spj.revenueDeclarations && spj.revenueDeclarations.length > 0) {
      for (const rev of spj.revenueDeclarations) {
        const revAmount = Number(rev.amount);
        totalRevenueExpected = Number(
          MoneyHelper.add(totalRevenueExpected, revAmount),
        );

        // Cari total alokasi dari remittances untuk deklarasi ini
        let allocated = 0;
        for (const rem of remittances) {
          if (rem.allocations) {
            for (const alloc of rem.allocations) {
              if (alloc.revenueDeclarationId === rev.id) {
                allocated = Number(
                  MoneyHelper.add(allocated, alloc.allocatedAmount),
                );
              }
            }
          }
        }

        breakdownDeclarations.push({
          id: rev.id,
          type: rev.declarationType,
          amount: revAmount,
          sourceReference: rev.sourceReference,
          crewCommissionAmount: rev.crewCommissionAmount ? Number(rev.crewCommissionAmount) : 0,
          allocatedAmount: allocated,
          status: rev.status,
        });
      }
    }

    let totalRevenueRemitted = 0;
    for (const rem of remittances) {
      if (rem.status === RemittanceStatus.VERIFIED) {
        totalRevenueRemitted = Number(
          MoneyHelper.add(totalRevenueRemitted, rem.amount),
        );
      }
    }

    const revenueBalance = Number(
      MoneyHelper.sub(totalRevenueExpected, totalRevenueRemitted),
    );

    // Cek apakah ada temuan selisih yang dicatat di crew_cash_discrepancies
    const discrepancies = await this.discrepancyRepo.find({
      where: { spjId },
      relations: ['reportedBy', 'responsibleCrew', 'resolvedBy'],
    });

    let revenueStatus = SettlementRevenueStatus.PENDING;
    if (MoneyHelper.isEqual(revenueBalance, 0)) {
      revenueStatus = SettlementRevenueStatus.MATCHED;
    } else if (discrepancies.length > 0) {
      revenueStatus = SettlementRevenueStatus.DISCREPANCY_RECORDED;
    }

    // 3. Posisi Kas Kasir Pool (Uang Masuk vs Pembayaran Tunai Kru)
    const totalCashReceived = Number(
      MoneyHelper.add(totalUjReturned, totalRevenueRemitted),
    );

    // Hak kompensasi kru yang berstatus PENDING
    let totalCrewCompensationPayable = 0;
    const pendingMealPayments: CrewMealPaymentEntity[] = [];

    if (spj.crewMealPayments && spj.crewMealPayments.length > 0) {
      for (const pay of spj.crewMealPayments) {
        if (pay.status === CrewMealPaymentStatus.PENDING) {
          totalCrewCompensationPayable = Number(
            MoneyHelper.add(totalCrewCompensationPayable, pay.amount),
          );
          pendingMealPayments.push(pay);
        }
      }
    }

    const netCashPosition = Number(
      MoneyHelper.sub(totalCashReceived, totalCrewCompensationPayable),
    );

    return {
      spj,
      existingSettlement,
      kantong1Uj: {
        totalDisbursed: totalUjDisbursed,
        totalSpent: totalUjSpent,
        totalReturned: totalUjReturned,
        balance: ujBalance,
        status: ujStatus,
        breakdownExpenses,
      },
      kantong2Revenue: {
        totalExpected: totalRevenueExpected,
        totalRemitted: totalRevenueRemitted,
        balance: revenueBalance,
        status: revenueStatus,
        breakdownDeclarations,
        remittances,
      },
      cashDesk: {
        totalCashReceived,
        totalCrewCompensationPayable,
        netCashPosition,
        pendingMealPayments,
      },
      discrepancies,
    };
  }

  /**
   * Memproses penyelesaian kas di meja kasir pool secara atomik
   */
  async processSettlement(
    dto: CreateSettlementDto,
    cashierId: string,
  ): Promise<CrewCashSettlementEntity> {
    return this.dataSource.transaction(async (manager) => {
      const spj = await manager.findOne<SpjEntity>(SpjEntity, {
        where: { id: dto.spjId },
        relations: ['vehicle', 'businessUnit', 'profitCenter', 'revenueDeclarations', 'crewMealPayments'],
      });

      if (!spj) {
        throw new NotFoundException(`SPJ '${dto.spjId}' tidak ditemukan.`);
      }

      if (spj.financialStatus === SpjFinancialStatus.SETTLED) {
        throw new ConflictException(`SPJ '${spj.spjNo}' sudah berstatus SETTLED dan tidak dapat diubah.`);
      }

      // Validasi Akun Kas Pool Kasir
      const cashAccount = await manager.findOne<CashAccountEntity>(CashAccountEntity, {
        where: { id: dto.cashAccountId },
        relations: ['account'],
      });
      if (!cashAccount) {
        throw new NotFoundException(`Kas akun pool '${dto.cashAccountId}' tidak ditemukan.`);
      }

      // 1. Simpan Remittances jika dikirim dalam payload
      const periodKey = this.getPeriodKey(new Date());
      if (dto.remittances && dto.remittances.length > 0) {
        for (const remDto of dto.remittances) {
          const remNo = await this.documentSequenceService.getNextDocumentNumber(
            'REMITTANCE',
            periodKey,
            `REM/${periodKey}`,
            4,
            spj.companyId,
            manager,
          );

          const remittance = manager.create(CrewCashRemittanceEntity, {
            companyId: spj.companyId,
            remittanceNo: remNo,
            spjId: spj.id,
            depositorCrewId: remDto.depositorCrewId,
            amount: remDto.amount,
            cashAccountId: dto.cashAccountId,
            receivedByCashierId: cashierId,
            remittedAt: new Date(),
            paymentMethod: remDto.paymentMethod,
            status: RemittanceStatus.VERIFIED,
            notes: remDto.notes,
          });

          const savedRemittance: CrewCashRemittanceEntity = await manager.save(remittance);

          // Simpan alokasi ke deklarasi penerimaan
          if (remDto.allocations && remDto.allocations.length > 0) {
            for (const allocDto of remDto.allocations) {
              const allocation = manager.create(CrewCashRemittanceAllocationEntity, {
                remittanceId: savedRemittance.id,
                revenueDeclarationId: allocDto.revenueDeclarationId,
                allocatedAmount: allocDto.allocatedAmount,
                notes: allocDto.notes,
              });
              await manager.save(allocation);
            }
          }
        }
      }

      // 2. Hitung kembali kondisi Dua Kantong Kas Kru
      const summary = await this.calculateSettlement(spj.id);

      const totalDisbursed = summary.kantong1Uj.totalDisbursed;
      const totalSpent = summary.kantong1Uj.totalSpent;
      const totalReturned = summary.kantong1Uj.totalReturned;
      const ujBalance = summary.kantong1Uj.balance;
      const ujStatus = summary.kantong1Uj.status;

      const totalRevenueExpected = summary.kantong2Revenue.totalExpected;
      const totalRevenueRemitted = summary.kantong2Revenue.totalRemitted;
      const revenueBalance = summary.kantong2Revenue.balance;
      const revenueStatus = summary.kantong2Revenue.status;

      const totalCashReceived = summary.cashDesk.totalCashReceived;

      // 3. Siapkan atau update dokumen Settlement
      let settlement = await manager.findOne<CrewCashSettlementEntity>(CrewCashSettlementEntity, {
        where: { spjId: spj.id },
      });

      if (!settlement) {
        const settlementNo = await this.documentSequenceService.getNextDocumentNumber(
          'SETTLEMENT',
          periodKey,
          `SETTLE/${periodKey}`,
          4,
          spj.companyId,
          manager,
        );

        settlement = manager.create(CrewCashSettlementEntity, {
          companyId: spj.companyId,
          settlementNo,
          spjId: spj.id,
          cashierId,
          submittedAt: new Date(),
          status: CrewCashSettlementStatus.SUBMITTED,
        });
      }

      settlement.totalUjDisbursed = totalDisbursed;
      settlement.totalUjSpent = totalSpent;
      settlement.totalUjReturned = totalReturned;
      settlement.ujBalance = ujBalance;
      settlement.ujStatus = ujStatus;

      settlement.totalRevenueExpected = totalRevenueExpected;
      settlement.totalRevenueRemitted = totalRevenueRemitted;
      settlement.revenueBalance = revenueBalance;
      settlement.revenueStatus = revenueStatus;

      settlement.totalCashReceived = totalCashReceived;
      settlement.notes = dto.notes || settlement.notes;

      const savedSettlement: CrewCashSettlementEntity = await manager.save(settlement);

      // Tautkan seluruh remittances ke settlement ini
      await manager
        .createQueryBuilder()
        .update(CrewCashRemittanceEntity)
        .set({ settlementId: savedSettlement.id })
        .where('spjId = :sId', { sId: spj.id })
        .execute();

      // 4. Periksa Gerbang Verifikasi Settlement:
      const isEligibleForVerification =
        ujStatus === SettlementUjStatus.BALANCED &&
        (revenueStatus === SettlementRevenueStatus.MATCHED ||
          revenueStatus === SettlementRevenueStatus.DISCREPANCY_RECORDED);

      let totalCashPaid = 0;

      if (isEligibleForVerification) {
        // Terbitkan nomor BKM kasir
        if (!savedSettlement.bkmNo) {
          savedSettlement.bkmNo = await this.documentSequenceService.getNextDocumentNumber(
            'BKM',
            periodKey,
            `BKM/${periodKey}`,
            4,
            spj.companyId,
            manager,
          );
        }

        // Jika kasir membayar tunai hak kru
        if (dto.cashPaidToCrew && summary.cashDesk.pendingMealPayments.length > 0) {
          savedSettlement.bkkNo = await this.documentSequenceService.getNextDocumentNumber(
            'BKK',
            periodKey,
            `BKK/${periodKey}`,
            4,
            spj.companyId,
            manager,
          );

          for (const pay of summary.cashDesk.pendingMealPayments) {
            pay.status = CrewMealPaymentStatus.PAID;
            pay.paidAt = new Date();
            pay.cashAccountId = dto.cashAccountId;
            pay.receiptRef = savedSettlement.bkkNo;
            totalCashPaid = Number(
              MoneyHelper.add(totalCashPaid, pay.amount),
            );
            await manager.save(pay);
          }
        }

        savedSettlement.totalCashPaid = totalCashPaid;
        savedSettlement.status = CrewCashSettlementStatus.VERIFIED;
        savedSettlement.reviewedById = cashierId;
        savedSettlement.reviewedAt = new Date();

        await manager.save(savedSettlement);

        // 5. Posting Jurnal Rekonsiliasi SPJ Otomatis via AccountingPostingService
        const journal = await this.postSettlementReconciliationJournal(
          savedSettlement,
          spj,
          cashAccount,
          summary,
          cashierId,
          manager,
        );

        savedSettlement.journalEntryId = journal.id;
        await manager.save(savedSettlement);

        // Update status SPJ menjadi SETTLED
        spj.financialStatus = SpjFinancialStatus.SETTLED;
        spj.operationalStatus = SpjOperationalStatus.COMPLETED;
        spj.closedAt = new Date();
        await manager.save(spj);
      } else {
        savedSettlement.status = CrewCashSettlementStatus.SUBMITTED;
        await manager.save(savedSettlement);

        spj.financialStatus = SpjFinancialStatus.DISCREPANCY;
        await manager.save(spj);
      }

      return savedSettlement;
    });
  }

  /**
   * Memposting Jurnal Rekonsiliasi Akhir SPJ secara atomik
   */
  async postSettlementReconciliationJournal(
    settlement: CrewCashSettlementEntity,
    spj: SpjEntity,
    cashAccount: CashAccountEntity,
    summary: SettlementSummaryResult,
    actorId: string,
    manager: any,
  ) {
    const accounts = await this.accountRepo.find({
      where: {
        code: In([
          '11101', // Kas Operasional Pool
          '13101', // UJ Kru Perjalanan Bus
          '51101', // Beban BBM
          '52101', // Beban Tol
          '52103', // Beban Cuci & Parkir
          '53101', // Beban Uang Makan Kru
          '53102', // Beban Premi Kru
          '53103', // Beban Bonus Full Seat
          '53104', // Beban Komisi Kargo Kru
          '54102', // Beban Fee Korlap
          '58101', // Beban Selisih Kasir Pool
          '41101', // Pendapatan Tiket AKAP
          '43101', // Pendapatan Kargo
          '23101', // Utang Kompensasi Kru
        ]),
      },
    });

    const accountMap = new Map<string, AccountEntity>();
    for (const acc of accounts) {
      accountMap.set(acc.code, acc);
    }

    const kasPoolAcc = cashAccount.accountId
      ? await this.accountRepo.findOne({ where: { id: cashAccount.accountId } })
      : accountMap.get('11101');

    const ujAcc = accountMap.get('13101');
    const bbmAcc = accountMap.get('51101');
    const tolAcc = accountMap.get('52101');
    const parkirAcc = accountMap.get('52103');
    const tiketAcc = accountMap.get('41101');
    const kargoAcc = accountMap.get('43101');

    if (!kasPoolAcc || !ujAcc) {
      throw new BadRequestException('Akun Kas Pool atau UJ Kru tidak ditemukan dalam bagan akun COA.');
    }

    const lines: any[] = [];

    // --- SISI DEBIT ---
    const netCashDesk = Number(
      MoneyHelper.sub(settlement.totalCashReceived, settlement.totalCashPaid),
    );
    if (MoneyHelper.isGreaterThan(netCashDesk, 0)) {
      lines.push({
        accountId: kasPoolAcc.id,
        debit: netCashDesk,
        credit: 0,
        description: `Penerimaan kas fisik meja kasir SPJ ${spj.spjNo} (${settlement.bkmNo || 'BKM'})`,
        tripId: spj.id,
        vehicleId: spj.vehicleId,
      });
    }

    for (const exp of summary.kantong1Uj.breakdownExpenses) {
      let acc = bbmAcc;
      if (exp.type === SpjExpenseType.TOLL) acc = tolAcc || bbmAcc;
      else if (exp.type === SpjExpenseType.PARKING) acc = parkirAcc || bbmAcc;

      if (acc) {
        lines.push({
          accountId: acc.id,
          debit: exp.amount,
          credit: 0,
          description: `${exp.type} operasional SPJ ${spj.spjNo}${exp.notes ? ' - ' + exp.notes : ''}`,
          tripId: spj.id,
          vehicleId: spj.vehicleId,
        });
      }
    }

    // --- SISI KREDIT ---
    if (MoneyHelper.isGreaterThan(settlement.totalUjDisbursed, 0)) {
      lines.push({
        accountId: ujAcc.id,
        debit: 0,
        credit: settlement.totalUjDisbursed,
        description: `Pelunasan tuntas Uang Jalan SPJ ${spj.spjNo}`,
        tripId: spj.id,
        vehicleId: spj.vehicleId,
      });
    }

    let totalTiketRev = 0;
    let totalKargoRev = 0;

    for (const decl of summary.kantong2Revenue.breakdownDeclarations) {
      if (decl.type.includes('CARGO')) {
        totalKargoRev = Number(
          MoneyHelper.add(totalKargoRev, decl.amount),
        );
      } else {
        totalTiketRev = Number(
          MoneyHelper.add(totalTiketRev, decl.amount),
        );
      }
    }

    if (tiketAcc && MoneyHelper.isGreaterThan(totalTiketRev, 0)) {
      lines.push({
        accountId: tiketAcc.id,
        debit: 0,
        credit: totalTiketRev,
        description: `Pendapatan tiket kas tunai perjalanan SPJ ${spj.spjNo}`,
        tripId: spj.id,
        vehicleId: spj.vehicleId,
      });
    }

    if (kargoAcc && MoneyHelper.isGreaterThan(totalKargoRev, 0)) {
      lines.push({
        accountId: kargoAcc.id,
        debit: 0,
        credit: totalKargoRev,
        description: `Pendapatan paket kargo bagasi SPJ ${spj.spjNo}`,
        tripId: spj.id,
        vehicleId: spj.vehicleId,
      });
    }

    return this.accountingPostingService.postJournal(
      {
        journalDate: new Date().toISOString().split('T')[0],
        sourceType: JournalSourceType.SETTLEMENT,
        sourceId: settlement.id,
        description: `Rekonsiliasi Kasir & Settlement SPJ ${spj.spjNo} (${settlement.settlementNo})`,
        lines,
      },
      actorId,
      manager,
    );
  }

  /**
   * Kemerdekaan Tutup Buku Bulanan (Period Closing Unblocked - Akun Penampung 11999)
   */
  async postUnblockedPendingSettlement(
    settlementId: string,
    actorId: string,
  ): Promise<CrewCashSettlementEntity> {
    return this.dataSource.transaction(async (manager) => {
      const settlement = await manager.findOne<CrewCashSettlementEntity>(CrewCashSettlementEntity, {
        where: { id: settlementId },
        relations: ['spj', 'spj.vehicle'],
      });

      if (!settlement) {
        throw new NotFoundException(`Settlement '${settlementId}' tidak ditemukan.`);
      }

      if (settlement.status === CrewCashSettlementStatus.VERIFIED) {
        throw new BadRequestException('Settlement ini sudah terverifikasi.');
      }

      const account11999 = await this.accountRepo.findOne({
        where: { code: '11999' },
      });
      const kasPoolAcc = await this.accountRepo.findOne({
        where: { code: '11101' },
      });

      if (!account11999 || !kasPoolAcc) {
        throw new BadRequestException('Akun penampung 11999 atau 11101 tidak ditemukan dalam COA.');
      }

      const diff = settlement.ujBalance || settlement.revenueBalance || 0;

      const lines = [
        {
          accountId: kasPoolAcc.id,
          debit: settlement.totalCashReceived,
          credit: 0,
          description: `Kas fisik riil diterima kasir pool SPJ ${settlement.spj?.spjNo}`,
        },
        {
          accountId: account11999.id,
          debit: diff,
          credit: 0,
          description: `Selisih kas operasional sementara dalam investigasi (Unblock Tutup Buku Bulanan)`,
        },
        {
          accountId: kasPoolAcc.id,
          debit: 0,
          credit: Number(
            MoneyHelper.add(settlement.totalCashReceived, diff),
          ),
          description: `Kliring alokasi penerimaan SPJ ${settlement.spj?.spjNo}`,
        },
      ];

      const journal = await this.accountingPostingService.postJournal(
        {
          journalDate: new Date().toISOString().split('T')[0],
          sourceType: JournalSourceType.SETTLEMENT,
          sourceId: settlement.id,
          description: `Posting Penampung Selisih 11999 Unblocked Tutup Buku SPJ ${settlement.spj?.spjNo}`,
          lines,
        },
        actorId,
        manager,
      );

      settlement.journalEntryId = journal.id;
      settlement.notes =
        (settlement.notes || '') +
        ' | Selisih ditampung sementara di akun 11999 untuk unblock tutup buku bulanan.';
      await manager.save(settlement);

      return settlement;
    });
  }

  private getPeriodKey(date: Date): string {
    const yy = String(date.getFullYear()).slice(-2);
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    return `${yy}${mm}`;
  }
}
