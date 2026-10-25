import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import {
  FiscalPeriodEntity,
  FiscalPeriodStatus,
} from '../../@models/finance/fiscal-period.entity';
import {
  PeriodCloseCheckEntity,
  PeriodCheckStatus,
} from '../../@models/finance/period-close-check.entity';
import {
  JournalEntryEntity,
  JournalStatus,
} from '../../@models/finance/journal-entry.entity';
import { SpjEntity } from '../../@models/trips/spj.entity';
import { SpjFinancialStatus } from '../../@models/trips/trip.enums';
import {
  CrewCashDiscrepancyEntity,
} from '../../@models/cashier/crew-cash-discrepancy.entity';
import {
  DiscrepancyResolutionStatus,
} from '../../@models/cashier/cashier.enums';
import { ApInvoiceEntity } from '../../@models/finance/ap-invoice.entity';
import { ArInvoiceEntity } from '../../@models/finance/ar-invoice.entity';
import { FinancialReportsService } from './financial-reports.service';
import { MoneyHelper } from '../../@common/helpers/money.helper';
import {
  ClosePeriodDto,
  ReopenPeriodDto,
  PeriodClosingFilterDto,
} from '../../@dto/finance/period-closing.dto';

export interface PeriodCloseCheckItemResult {
  checkCode: string;
  checkName: string;
  status: PeriodCheckStatus;
  description: string;
  details?: Record<string, any>;
}

export interface PeriodClosingChecklistResponse {
  period: {
    id: string;
    periodNo: number;
    name: string;
    startDate: string;
    endDate: string;
    status: FiscalPeriodStatus;
    closedAt?: Date;
    closedByName?: string;
    closeReason?: string;
  };
  canClose: boolean;
  blockerReasons: string[];
  warningReasons: string[];
  checks: PeriodCloseCheckItemResult[];
  lastCheckedAt?: Date;
}

@Injectable()
export class PeriodClosingService {
  constructor(
    @InjectRepository(FiscalPeriodEntity)
    private readonly periodRepo: Repository<FiscalPeriodEntity>,
    @InjectRepository(PeriodCloseCheckEntity)
    private readonly checkRepo: Repository<PeriodCloseCheckEntity>,
    @InjectRepository(JournalEntryEntity)
    private readonly journalRepo: Repository<JournalEntryEntity>,
    @InjectRepository(SpjEntity)
    private readonly spjRepo: Repository<SpjEntity>,
    @InjectRepository(CrewCashDiscrepancyEntity)
    private readonly discrepancyRepo: Repository<CrewCashDiscrepancyEntity>,
    @InjectRepository(ApInvoiceEntity)
    private readonly apInvoiceRepo: Repository<ApInvoiceEntity>,
    @InjectRepository(ArInvoiceEntity)
    private readonly arInvoiceRepo: Repository<ArInvoiceEntity>,
    private readonly financialReportsService: FinancialReportsService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Menampilkan daftar periode fiskal beserta status kesiapan tutup buku
   */
  async getPeriods(filter: PeriodClosingFilterDto): Promise<FiscalPeriodEntity[]> {
    const qb = this.periodRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.fiscalYear', 'y')
      .leftJoinAndSelect('p.closedByUser', 'u')
      .orderBy('y.year', 'DESC')
      .addOrderBy('p.periodNo', 'ASC');

    if (filter.year) {
      qb.andWhere('y.year = :year', { year: filter.year });
    }
    if (filter.status) {
      qb.andWhere('p.status = :status', { status: filter.status });
    }

    return await qb.getMany();
  }

  /**
   * Menjalankan Audit Checklist Otomatis 6 Poin untuk Periode Fiskal
   */
  async runChecklist(
    periodId: string,
    userId?: string,
  ): Promise<PeriodClosingChecklistResponse> {
    const period = await this.periodRepo.findOne({
      where: { id: periodId },
      relations: ['fiscalYear', 'closedByUser'],
    });

    if (!period) {
      throw new NotFoundException(`Periode fiskal dengan ID '${periodId}' tidak ditemukan.`);
    }

    const checks: PeriodCloseCheckItemResult[] = [];
    const blockerReasons: string[] = [];
    const warningReasons: string[] = [];

    // =========================================================================
    // 1. CHECK 1: Keseimbangan Jurnal & Tidak Ada Jurnal DRAFT (JOURNAL_BALANCE)
    // =========================================================================
    const journalsInPeriod = await this.journalRepo.find({
      where: { periodId: period.id },
    });

    const draftJournals = journalsInPeriod.filter((j) => j.status === JournalStatus.DRAFT);
    const unbalancedJournals = journalsInPeriod.filter(
      (j) =>
        j.status === JournalStatus.POSTED &&
        !MoneyHelper.isEqual(j.totalDebit, j.totalCredit),
    );

    let jStatus = PeriodCheckStatus.PASSED;
    let jDesc = 'Seluruh jurnal dalam periode ini seimbang dan telah terposting (POSTED).';
    if (unbalancedJournals.length > 0 || draftJournals.length > 0) {
      jStatus = PeriodCheckStatus.BLOCKED;
      jDesc = `Ditemukan ${unbalancedJournals.length} jurnal tidak balance dan ${draftJournals.length} jurnal masih berstatus DRAFT.`;
      blockerReasons.push(jDesc);
    }

    checks.push({
      checkCode: 'JOURNAL_BALANCE',
      checkName: 'Keseimbangan & Kelengkapan Posting Jurnal',
      status: jStatus,
      description: jDesc,
      details: {
        totalJournals: journalsInPeriod.length,
        unbalancedCount: unbalancedJournals.length,
        draftCount: draftJournals.length,
        unbalancedJournals: unbalancedJournals.map((j) => ({
          journalNo: j.journalNo,
          totalDebit: j.totalDebit,
          totalCredit: j.totalCredit,
        })),
      },
    });

    // =========================================================================
    // 2. CHECK 2: Status SPJ di Meja Kasir Pool (CASHIER_SPJ_STATUS)
    // Aturan Blueprint Bab 5: Peringatan (WARNING), BUKAN Pemblokir Otomatis!
    // =========================================================================
    const openSpjs = await this.spjRepo
      .createQueryBuilder('spj')
      .leftJoinAndSelect('spj.vehicle', 'v')
      .leftJoinAndSelect('spj.crewAssignments', 'ca')
      .leftJoinAndSelect('ca.crew', 'u')
      .leftJoinAndSelect('spj.tripSchedule', 'sch')
      .where('spj.financialStatus != :settled', {
        settled: SpjFinancialStatus.SETTLED,
      })
      .andWhere(
        'DATE(COALESCE(sch.plannedDepartureAt, spj.issuedAt, spj.createdAt)) <= :periodEnd',
        { periodEnd: period.endDate },
      )
      .getMany();

    let spjStatus = PeriodCheckStatus.PASSED;
    let spjDesc = 'Seluruh SPJ pada periode ini telah tuntas diselesaikan di meja kasir pool.';
    if (openSpjs.length > 0) {
      spjStatus = PeriodCheckStatus.WARNING;
      spjDesc = `Terdapat ${openSpjs.length} SPJ yang belum selesai rekonsiliasi (Warning: Bukan pemblokir tutup buku).`;
      warningReasons.push(spjDesc);
    }

    checks.push({
      checkCode: 'CASHIER_SPJ_STATUS',
      checkName: 'Penyelesaian Dokumen SPJ Kru di Meja Kasir',
      status: spjStatus,
      description: spjDesc,
      details: {
        openSpjCount: openSpjs.length,
        openSpjs: openSpjs.map((s) => ({
          spjNo: s.spjNo,
          vehicle: s.vehicle?.code || 'ARMADA',
          financialStatus: s.financialStatus,
          operationalStatus: s.operationalStatus,
        })),
      },
    });

    // =========================================================================
    // 3. CHECK 3: Saldo Akun Penampung 11999 Selisih Kasir (UNRESOLVED_DISCREPANCY_11999)
    // Aturan Blueprint Bab 5 & Skenario 4: Kemerdekaan Tutup Buku Unblocked! (WARNING)
    // =========================================================================
    const account11999Raw = await this.dataSource.query(
      `
      SELECT 
        a.id, a.code, a.name,
        COALESCE(SUM(CAST(jl.debit AS numeric)) - SUM(CAST(jl.credit AS numeric)), 0) AS "balance"
      FROM accounts a
      LEFT JOIN journal_lines jl ON jl.account_id = a.id
      LEFT JOIN journal_entries j ON j.id = jl.journal_entry_id AND j.status = 'POSTED' AND j.journal_date <= $1
      WHERE a.code = '11999'
      GROUP BY a.id, a.code, a.name
    `,
      [period.endDate],
    );

    const balance11999 = account11999Raw.length > 0 ? account11999Raw[0].balance : '0.00';

    const pendingDiscrepancies = await this.discrepancyRepo.find({
      where: { resolutionStatus: DiscrepancyResolutionStatus.PENDING_INVESTIGATION },
      relations: ['spj', 'reportedBy'],
    });

    let discStatus = PeriodCheckStatus.PASSED;
    let discDesc = 'Saldo akun penampung selisih kas 11999 bernilai Rp 0 dan tidak ada investigasi terbuka.';
    if (!MoneyHelper.isEqual(balance11999, 0) || pendingDiscrepancies.length > 0) {
      discStatus = PeriodCheckStatus.WARNING;
      discDesc = `Terdapat saldo terbuka Rp ${Number(balance11999).toLocaleString('id-ID')} di akun 11999 (${pendingDiscrepancies.length} kasus investigasi FM). Sesuai Skenario 4: Tidak memblokir tutup buku.`;
      warningReasons.push(discDesc);
    }

    checks.push({
      checkCode: 'UNRESOLVED_DISCREPANCY_11999',
      checkName: 'Penampung Selisih Kas Operasional (Akun 11999)',
      status: discStatus,
      description: discDesc,
      details: {
        accountCode: '11999',
        balance: balance11999,
        pendingInvestigationCount: pendingDiscrepancies.length,
        discrepancies: pendingDiscrepancies.map((d: any) => ({
          discrepancyNo: d.discrepancyNo,
          spjNo: d.spj?.spjNo || '-',
          amount: d.differenceAmount,
          reason: d.reason,
          status: d.resolutionStatus,
        })),
      },
    });

    // =========================================================================
    // 4. CHECK 4: Rekonsiliasi Kas & Bank (CASH_BANK_RECON)
    // =========================================================================
    const cashBankAccountsRaw = await this.dataSource.query(
      `
      SELECT 
        a.code, a.name,
        COALESCE(SUM(CAST(jl.debit AS numeric)) - SUM(CAST(jl.credit AS numeric)), 0) AS "balance"
      FROM accounts a
      LEFT JOIN journal_lines jl ON jl.account_id = a.id
      LEFT JOIN journal_entries j ON j.id = jl.journal_entry_id AND j.status = 'POSTED' AND j.journal_date <= $1
      WHERE a.code IN ('11101', '11102', '11103', '11104', '11105')
      GROUP BY a.code, a.name
      ORDER BY a.code ASC
    `,
      [period.endDate],
    );

    checks.push({
      checkCode: 'CASH_BANK_RECON',
      checkName: 'Posisi Saldo Kas Operasional & Rekening Bank',
      status: PeriodCheckStatus.PASSED,
      description: 'Posisi saldo seluruh akun kas fisik pool dan rekening bank telah terangkum.',
      details: {
        accounts: cashBankAccountsRaw.map((a: any) => ({
          code: a.code,
          name: a.name,
          balance: a.balance,
        })),
      },
    });

    // =========================================================================
    // 5. CHECK 5: Tinjauan Saldo Piutang (AR) & Utang Usaha (AP) Terbuka (OPEN_AR_AP)
    // =========================================================================
    const openArCount = await this.arInvoiceRepo
      .createQueryBuilder('ar')
      .where('ar.status NOT IN (:...done)', { done: ['PAID', 'CANCELLED'] })
      .andWhere('ar.invoiceDate <= :endDate', { endDate: period.endDate })
      .getCount();

    const openApCount = await this.apInvoiceRepo
      .createQueryBuilder('ap')
      .where('ap.status NOT IN (:...done)', { done: ['PAID', 'CANCELLED'] })
      .andWhere('ap.invoiceDate <= :endDate', { endDate: period.endDate })
      .getCount();

    checks.push({
      checkCode: 'OPEN_AR_AP',
      checkName: 'Tinjauan Saldo Terbuka Piutang (AR) & Utang (AP)',
      status: PeriodCheckStatus.PASSED,
      description: `Terdapat ${openArCount} invoice piutang terbuka dan ${openApCount} tagihan vendor terbuka. (Informasi penyajian neraca, bukan blocker).`,
      details: {
        openArInvoicesCount: openArCount,
        openApInvoicesCount: openApCount,
      },
    });

    // =========================================================================
    // 6. CHECK 6: Keseimbangan Neraca Saldo Akhir (TRIAL_BALANCE_EQUAL)
    // =========================================================================
    const tb = await this.financialReportsService.getTrialBalance({
      periodId: period.id,
    });

    let tbStatus = PeriodCheckStatus.PASSED;
    let tbDesc = `Neraca Saldo Periode seimbang. Total Debit: Rp ${Number(tb.totals.endingDebit).toLocaleString('id-ID')} == Total Kredit: Rp ${Number(tb.totals.endingCredit).toLocaleString('id-ID')}.`;
    if (!tb.totals.isBalanced) {
      tbStatus = PeriodCheckStatus.BLOCKED;
      tbDesc = `Neraca Saldo TIDAK SEIMBANG! Selisih: Rp ${MoneyHelper.sub(tb.totals.endingDebit, tb.totals.endingCredit)}.`;
      blockerReasons.push(tbDesc);
    }

    checks.push({
      checkCode: 'TRIAL_BALANCE_EQUAL',
      checkName: 'Keseimbangan Neraca Saldo (Trial Balance)',
      status: tbStatus,
      description: tbDesc,
      details: {
        totalDebit: tb.totals.endingDebit,
        totalCredit: tb.totals.endingCredit,
        isBalanced: tb.totals.isBalanced,
      },
    });

    // =========================================================================
    // SIMPAN RIWAYAT CHECK KE TABEL period_close_checks
    // =========================================================================
    await this.checkRepo.delete({ periodId: period.id });

    for (const c of checks) {
      const entity = this.checkRepo.create({
        periodId: period.id,
        checkCode: c.checkCode,
        checkName: c.checkName,
        status: c.status,
        details: { description: c.description, ...c.details },
        checkedAt: new Date(),
        checkedBy: userId,
      });
      await this.checkRepo.save(entity);
    }

    const canClose = blockerReasons.length === 0;

    return {
      period: {
        id: period.id,
        periodNo: period.periodNo,
        name: period.name,
        startDate: period.startDate,
        endDate: period.endDate,
        status: period.status,
        closedAt: period.closedAt,
        closedByName: period.closedByUser?.name,
        closeReason: period.closeReason,
      },
      canClose,
      blockerReasons,
      warningReasons,
      checks,
      lastCheckedAt: new Date(),
    };
  }

  /**
   * Eksekusi Penutupan Periode Fiskal (Close Period)
   */
  async closePeriod(
    periodId: string,
    dto: ClosePeriodDto,
    userId?: string,
  ): Promise<FiscalPeriodEntity> {
    const period = await this.periodRepo.findOne({
      where: { id: periodId },
      relations: ['closedByUser'],
    });

    if (!period) {
      throw new NotFoundException(`Periode fiskal '${periodId}' tidak ditemukan.`);
    }

    if (period.status === FiscalPeriodStatus.CLOSED) {
      throw new BadRequestException(`Periode '${period.name}' sudah berstatus CLOSED.`);
    }

    // Jalankan audit checklist
    const checklistResult = await this.runChecklist(periodId, userId);

    if (!checklistResult.canClose) {
      throw new BadRequestException(
        `Tutup buku ditolak karena terdapat pemeriksaan berstatus BLOCKED:\n- ${checklistResult.blockerReasons.join('\n- ')}`,
      );
    }

    // Simpan snapshot checklist ke kolom checklist_snapshot
    period.checklistSnapshot = {
      checklistDate: new Date().toISOString(),
      closedByUserId: userId,
      summary: {
        canClose: checklistResult.canClose,
        warnings: checklistResult.warningReasons,
      },
      checks: checklistResult.checks,
    };

    period.status = FiscalPeriodStatus.CLOSED;
    period.closedAt = new Date();
    period.closedBy = userId;
    period.closeReason = dto.notes || 'Penutupan buku bulanan normal.';

    return await this.periodRepo.save(period);
  }

  /**
   * Otorisasi Pembukaan Kembali Periode Fiskal Tertutup (Reopen Period)
   */
  async reopenPeriod(
    periodId: string,
    dto: ReopenPeriodDto,
    userId?: string,
  ): Promise<FiscalPeriodEntity> {
    const period = await this.periodRepo.findOne({
      where: { id: periodId },
      relations: ['closedByUser'],
    });

    if (!period) {
      throw new NotFoundException(`Periode fiskal '${periodId}' tidak ditemukan.`);
    }

    if (period.status !== FiscalPeriodStatus.CLOSED) {
      throw new BadRequestException(`Periode '${period.name}' tidak dalam status CLOSED.`);
    }

    period.status = FiscalPeriodStatus.REOPENED;
    period.closeReason = `[REOPENED pada ${new Date().toISOString()}] Alasan: ${dto.reason} (Sebelumnya: ${period.closeReason || '-'})`;
    period.closedAt = undefined;
    period.closedBy = userId;

    return await this.periodRepo.save(period);
  }
}
