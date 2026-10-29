import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import {
  CrewCashDiscrepancyEntity,
  CrewCashSettlementEntity,
  CrewCashSettlementStatus,
  SettlementUjStatus,
  SettlementRevenueStatus,
  DiscrepancyResolutionStatus,
  DiscrepancyResolutionDecision,
  DiscrepancySourceType,
  SpjEntity,
  SpjFinancialStatus,
  SpjOperationalStatus,
  TripServiceType,
  AccountEntity,
  CashAccountEntity,
  JournalSourceType,
} from '../../@models';
import { AccountingPostingService } from '../../finance/services/accounting-posting.service';
import { DocumentSequenceService } from '../../finance/services/document-sequence.service';
import { MoneyHelper } from '../../@common/helpers/money.helper';
import {
  CreateDiscrepancyDto,
  ResolveDiscrepancyDto,
  DiscrepancyFilterQueryDto,
} from '../../@dto/cashier';

@Injectable()
export class CashierDiscrepancyService {
  constructor(
    @InjectRepository(CrewCashDiscrepancyEntity)
    private readonly discrepancyRepo: Repository<CrewCashDiscrepancyEntity>,
    @InjectRepository(CrewCashSettlementEntity)
    private readonly settlementRepo: Repository<CrewCashSettlementEntity>,
    @InjectRepository(SpjEntity)
    private readonly spjRepo: Repository<SpjEntity>,
    @InjectRepository(AccountEntity)
    private readonly accountRepo: Repository<AccountEntity>,
    @InjectRepository(CashAccountEntity)
    private readonly cashAccountRepo: Repository<CashAccountEntity>,
    private readonly accountingPostingService: AccountingPostingService,
    private readonly documentSequenceService: DocumentSequenceService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Mengambil daftar selisih kas kasir dengan filter dan paginasi
   */
  async getDiscrepancies(
    query: DiscrepancyFilterQueryDto,
  ): Promise<{ items: CrewCashDiscrepancyEntity[]; total: number }> {
    const qb = this.discrepancyRepo
      .createQueryBuilder('d')
      .leftJoinAndSelect('d.spj', 'spj')
      .leftJoinAndSelect('spj.vehicle', 'vehicle')
      .leftJoinAndSelect('d.settlement', 'settlement')
      .leftJoinAndSelect('d.reportedBy', 'reportedBy')
      .leftJoinAndSelect('d.responsibleCrew', 'responsibleCrew')
      .leftJoinAndSelect('d.resolvedBy', 'resolvedBy')
      .leftJoinAndSelect('d.resolutionAccount', 'resolutionAccount');

    if (query.resolutionStatus) {
      qb.andWhere('d.resolutionStatus = :resStatus', {
        resStatus: query.resolutionStatus,
      });
    }

    if (query.search) {
      qb.andWhere(
        '(d.discrepancyNo ILIKE :search OR spj.spjNo ILIKE :search OR d.reason ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    qb.orderBy('d.createdAt', 'DESC');

    const page = query.page || 1;
    const limit = query.limit || 10;
    qb.skip((page - 1) * limit).take(limit);

    const [items, total] = await qb.getManyAndCount();
    return { items, total };
  }

  /**
   * Detail satu temuan selisih kas
   */
  async getDiscrepancyById(id: string): Promise<CrewCashDiscrepancyEntity> {
    const disc = await this.discrepancyRepo.findOne({
      where: { id },
      relations: [
        'spj',
        'spj.vehicle',
        'settlement',
        'reportedBy',
        'responsibleCrew',
        'resolvedBy',
        'resolutionAccount',
      ],
    });

    if (!disc) {
      throw new NotFoundException(`Temuan selisih kas dengan ID '${id}' tidak ditemukan.`);
    }

    return disc;
  }

  /**
   * Mencatat temuan selisih kas operasional di meja kasir (Lapis 2 Jalur Sistemik)
   */
  async createDiscrepancy(
    dto: CreateDiscrepancyDto,
    reportedById: string,
  ): Promise<CrewCashDiscrepancyEntity> {
    return this.dataSource.transaction(async (manager) => {
      const spj = await manager.findOne<SpjEntity>(SpjEntity, {
        where: { id: dto.spjId },
      });

      if (!spj) {
        throw new NotFoundException(`SPJ '${dto.spjId}' tidak ditemukan.`);
      }

      const periodKey = this.getPeriodKey(new Date());
      const discrepancyNo = await this.documentSequenceService.getNextDocumentNumber(
        'DISCREPANCY',
        periodKey,
        `DISC/${periodKey}`,
        4,
        spj.companyId,
        manager,
      );

      const diffAmount =
        dto.differenceAmount !== undefined
          ? dto.differenceAmount
          : Number(
              MoneyHelper.sub(dto.expectedAmount, dto.actualAmount),
            );

      const discrepancy = manager.create(CrewCashDiscrepancyEntity, {
        companyId: spj.companyId,
        discrepancyNo,
        spjId: spj.id,
        settlementId: dto.settlementId,
        sourceType: dto.sourceType,
        expectedAmount: dto.expectedAmount,
        actualAmount: dto.actualAmount,
        differenceAmount: diffAmount,
        reportedById,
        responsibleCrewId: dto.responsibleCrewId,
        reason: dto.reason,
        investigationNotes: dto.investigationNotes,
        resolutionStatus: DiscrepancyResolutionStatus.PENDING_INVESTIGATION,
      });

      const savedDiscrepancy: CrewCashDiscrepancyEntity = await manager.save(discrepancy);

      // Ubah status SPJ menjadi DISCREPANCY
      spj.financialStatus = SpjFinancialStatus.DISCREPANCY;
      await manager.save(spj);

      // Jika settlement sudah ada, update statusnya
      if (dto.settlementId) {
        const settlement = await manager.findOne<CrewCashSettlementEntity>(CrewCashSettlementEntity, {
          where: { id: dto.settlementId },
        });
        if (settlement) {
          settlement.status = CrewCashSettlementStatus.SUBMITTED;
          if (dto.sourceType === DiscrepancySourceType.UJ_EXPENSE_UNVERIFIED) {
            settlement.ujStatus = SettlementUjStatus.DISCREPANCY;
          } else {
            settlement.revenueStatus = SettlementRevenueStatus.DISCREPANCY_RECORDED;
          }
          await manager.save(settlement);
        }
      }

      return savedDiscrepancy;
    });
  }

  /**
   * Otorisasi Keputusan Manajer Keuangan atas Selisih Kas (Dispensasi Perusahaan vs Klaim Kru)
   */
  async resolveDiscrepancy(
    id: string,
    dto: ResolveDiscrepancyDto,
    resolvedById: string,
  ): Promise<CrewCashDiscrepancyEntity> {
    return this.dataSource.transaction(async (manager) => {
      const discrepancy = await manager.findOne<CrewCashDiscrepancyEntity>(CrewCashDiscrepancyEntity, {
        where: { id },
        relations: ['spj', 'spj.vehicle', 'settlement'],
      });

      if (!discrepancy) {
        throw new NotFoundException(`Temuan selisih kas '${id}' tidak ditemukan.`);
      }

      if (discrepancy.resolutionStatus === DiscrepancyResolutionStatus.RESOLVED) {
        throw new BadRequestException('Temuan selisih kas ini sudah diselesaikan sebelumnya.');
      }

      const spj = discrepancy.spj;
      if (!spj) {
        throw new NotFoundException('SPJ terkait tidak ditemukan.');
      }

      let resolutionAccount: AccountEntity | null = null;

      if (dto.decision === DiscrepancyResolutionDecision.COMPANY_WAIVER) {
        resolutionAccount = dto.resolutionAccountId
          ? await manager.findOne<AccountEntity>(AccountEntity, { where: { id: dto.resolutionAccountId } })
          : await manager.findOne<AccountEntity>(AccountEntity, { where: { code: '58101' } });

        if (!resolutionAccount) {
          resolutionAccount = await manager.findOne<AccountEntity>(AccountEntity, { where: { code: '51101' } });
        }
      } else if (dto.decision === DiscrepancyResolutionDecision.CHARGE_TO_CREW) {
        resolutionAccount = dto.resolutionAccountId
          ? await manager.findOne<AccountEntity>(AccountEntity, { where: { id: dto.resolutionAccountId } })
          : await manager.findOne<AccountEntity>(AccountEntity, { where: { code: '12901' } });
      }

      discrepancy.resolutionStatus = DiscrepancyResolutionStatus.RESOLVED;
      discrepancy.resolutionDecision = dto.decision;
      discrepancy.resolutionAccountId = resolutionAccount?.id;
      discrepancy.resolvedById = resolvedById;
      discrepancy.resolvedAt = new Date();
      discrepancy.investigationNotes = dto.resolutionNotes;

      await manager.save(discrepancy);

      // Update dokumen settlement jika terhubung
      let settlement = discrepancy.settlement;
      if (!settlement && discrepancy.settlementId) {
        settlement = await manager.findOne<CrewCashSettlementEntity>(CrewCashSettlementEntity, {
          where: { id: discrepancy.settlementId },
        });
      }

      if (settlement) {
        if (discrepancy.sourceType === DiscrepancySourceType.UJ_EXPENSE_UNVERIFIED) {
          settlement.ujStatus = SettlementUjStatus.BALANCED;
        } else {
          settlement.revenueStatus = SettlementRevenueStatus.MATCHED;
        }

        settlement.status = CrewCashSettlementStatus.VERIFIED;
        settlement.reviewedById = resolvedById;
        settlement.reviewedAt = new Date();
        await manager.save(settlement);

        // Posting Jurnal Rekonsiliasi SPJ lengkap pasca resolusi selisih
        const journal = await this.postResolvedSettlementJournal(
          settlement,
          spj,
          discrepancy,
          resolutionAccount,
          resolvedById,
          manager,
        );

        discrepancy.journalEntryId = journal.id;
        settlement.journalEntryId = journal.id;
        await manager.save(discrepancy);
        await manager.save(settlement);

        // Update status SPJ menjadi SETTLED
        spj.financialStatus = SpjFinancialStatus.SETTLED;
        spj.operationalStatus = SpjOperationalStatus.COMPLETED;
        spj.closedAt = new Date();
        await manager.save(spj);
      }

      return discrepancy;
    });
  }

  /**
   * Memposting Jurnal Rekonsiliasi SPJ dengan akun selisih terinvestigasi (Beban 58101 atau Piutang 12901)
   */
  private async postResolvedSettlementJournal(
    settlement: CrewCashSettlementEntity,
    spj: SpjEntity,
    discrepancy: CrewCashDiscrepancyEntity,
    resolutionAccount: AccountEntity | null,
    actorId: string,
    manager: any,
  ) {
    const accounts = await this.accountRepo.find({
      where: {
        code: In(['11101', '13101', '51101', '52101', '52103', '41101', '43101', '58101', '12901']),
      },
    });

    const accountMap = new Map<string, AccountEntity>();
    for (const acc of accounts) {
      accountMap.set(acc.code, acc);
    }

    const kasPoolAcc = accountMap.get('11101');
    const ujAcc = accountMap.get('13101');
    const bbmAcc = accountMap.get('51101');
    const tiketAcc = accountMap.get('41101');

    if (!kasPoolAcc || !ujAcc) {
      throw new BadRequestException('Akun Kas Pool atau UJ Kru tidak ditemukan dalam COA.');
    }

    // Auto-map Cost Center & Dimensi SPJ
    let costCenterId = spj.costCenterId;
    if (!costCenterId) {
      const ccCode = spj.serviceType === TripServiceType.AKAP ? 'CC-OPS-AKAP' : 'CC-OPS-WISATA';
      if (typeof manager?.query === 'function') {
        const ccRows = await manager.query(`SELECT id FROM "cost_centers" WHERE code = $1 LIMIT 1`, [ccCode]);
        if (ccRows && ccRows.length > 0) costCenterId = ccRows[0].id;
      }
    }
    const businessUnitId = spj.businessUnitId;
    const profitCenterId = spj.profitCenterId;

    const lines: any[] = [];

    // --- SISI DEBIT ---
    const netCash = Number(
      MoneyHelper.sub(settlement.totalCashReceived, settlement.totalCashPaid),
    );
    if (MoneyHelper.isGreaterThan(netCash, 0)) {
      lines.push({
        accountId: kasPoolAcc.id,
        debit: netCash,
        credit: 0,
        description: `Penerimaan fisik meja kasir SPJ ${spj.spjNo} (${settlement.bkmNo || 'BKM'})`,
        tripId: spj.id,
        vehicleId: spj.vehicleId,
        businessUnitId,
        profitCenterId,
        costCenterId,
      });
    }

    const actualExpense = Number(settlement.totalUjSpent);
    if (bbmAcc && MoneyHelper.isGreaterThan(actualExpense, 0)) {
      lines.push({
        accountId: bbmAcc.id,
        debit: actualExpense,
        credit: 0,
        description: `Beban operasional BBM sah SPJ ${spj.spjNo}`,
        tripId: spj.id,
        vehicleId: spj.vehicleId,
        businessUnitId,
        profitCenterId,
        costCenterId,
      });
    }

    if (resolutionAccount && MoneyHelper.isGreaterThan(discrepancy.differenceAmount, 0)) {
      lines.push({
        accountId: resolutionAccount.id,
        debit: discrepancy.differenceAmount,
        credit: 0,
        description: `Hasil Investigasi Kasir FM (${discrepancy.resolutionDecision}): ${discrepancy.reason}`,
        tripId: spj.id,
        vehicleId: spj.vehicleId,
        businessUnitId,
        profitCenterId,
        costCenterId,
      });
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
        businessUnitId,
        profitCenterId,
        costCenterId,
      });
    }

    const revenueAmount = settlement.totalRevenueRemitted;
    if (tiketAcc && MoneyHelper.isGreaterThan(revenueAmount, 0)) {
      lines.push({
        accountId: tiketAcc.id,
        debit: 0,
        credit: revenueAmount,
        description: `Pendapatan tiket kas perjalanan SPJ ${spj.spjNo}`,
        tripId: spj.id,
        vehicleId: spj.vehicleId,
        businessUnitId,
        profitCenterId,
        costCenterId,
      });
    }

    return this.accountingPostingService.postJournal(
      {
        journalDate: new Date().toISOString().split('T')[0],
        sourceType: JournalSourceType.SETTLEMENT,
        sourceId: settlement.id,
        description: `Jurnal Rekonsiliasi SPJ ${spj.spjNo} (Resolusi Selisih FM: ${discrepancy.resolutionDecision})`,
        lines,
      },
      actorId,
      manager,
    );
  }

  private getPeriodKey(date: Date): string {
    const yy = String(date.getFullYear()).slice(-2);
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    return `${yy}${mm}`;
  }
}
