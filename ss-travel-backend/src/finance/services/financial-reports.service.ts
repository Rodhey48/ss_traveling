import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThan, DataSource } from 'typeorm';
import {
  AccountEntity,
  AccountType,
  NormalBalance,
} from '../../@models/finance/account.entity';
import {
  JournalEntryEntity,
  JournalStatus,
} from '../../@models/finance/journal-entry.entity';
import { JournalLineEntity } from '../../@models/finance/journal-line.entity';
import {
  FiscalPeriodEntity,
} from '../../@models/finance/fiscal-period.entity';
import { MoneyHelper } from '../../@common/helpers/money.helper';
import {
  GeneralLedgerFilterDto,
  TrialBalanceFilterDto,
  IncomeStatementFilterDto,
  BalanceSheetFilterDto,
} from '../../@dto/finance/reports.dto';

export interface LedgerLineReport {
  lineId: string;
  journalId: string;
  journalNo: string;
  journalDate: string;
  sourceType: string;
  description: string;
  debit: string;
  credit: string;
  runningBalance: string;
  tripId?: string;
  vehicleId?: string;
}

export interface AccountLedgerReport {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: AccountType;
  normalBalance: NormalBalance;
  openingBalance: string;
  totalDebit: string;
  totalCredit: string;
  endingBalance: string;
  lines: LedgerLineReport[];
}

export interface GeneralLedgerResponse {
  periodInfo?: {
    startDate: string;
    endDate: string;
    periodName?: string;
  };
  accounts: AccountLedgerReport[];
  grandTotalDebit: string;
  grandTotalCredit: string;
}

export interface TrialBalanceItem {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: AccountType;
  normalBalance: NormalBalance;
  openingDebit: string;
  openingCredit: string;
  periodDebit: string;
  periodCredit: string;
  endingDebit: string;
  endingCredit: string;
}

export interface TrialBalanceResponse {
  periodInfo: {
    startDate: string;
    endDate: string;
    periodName?: string;
  };
  items: TrialBalanceItem[];
  totals: {
    openingDebit: string;
    openingCredit: string;
    periodDebit: string;
    periodCredit: string;
    endingDebit: string;
    endingCredit: string;
    isBalanced: boolean;
  };
}

export interface PnLGroupItem {
  accountCode: string;
  accountName: string;
  amount: string;
}

export interface PnLGroup {
  groupCode: string;
  groupName: string;
  subtotal: string;
  accounts: PnLGroupItem[];
}

export interface IncomeStatementResponse {
  periodInfo: {
    startDate: string;
    endDate: string;
    periodName?: string;
  };
  revenues: {
    groups: PnLGroup[];
    totalRevenue: string;
  };
  expenses: {
    directFleetCosts: PnLGroup[];
    crewCosts: PnLGroup[];
    agentPartnerCosts: PnLGroup[];
    maintenanceCosts: PnLGroup[];
    generalPoolCosts: PnLGroup[];
    otherCosts: PnLGroup[];
    totalExpense: string;
  };
  grossProfit: string;
  operatingProfit: string;
  netIncome: string;
}

export interface BalanceSheetItem {
  accountCode: string;
  accountName: string;
  amount: string;
}

export interface BalanceSheetCategory {
  categoryCode: string;
  categoryName: string;
  subtotal: string;
  items: BalanceSheetItem[];
}

export interface BalanceSheetResponse {
  asOfDate: string;
  periodName?: string;
  assets: {
    categories: BalanceSheetCategory[];
    totalAssets: string;
  };
  liabilities: {
    categories: BalanceSheetCategory[];
    totalLiabilities: string;
  };
  equity: {
    categories: BalanceSheetCategory[];
    currentPeriodNetIncome: string;
    totalEquity: string;
  };
  isBalanced: boolean;
}

@Injectable()
export class FinancialReportsService {
  constructor(
    @InjectRepository(AccountEntity)
    private readonly accountRepo: Repository<AccountEntity>,
    @InjectRepository(JournalEntryEntity)
    private readonly journalRepo: Repository<JournalEntryEntity>,
    @InjectRepository(JournalLineEntity)
    private readonly lineRepo: Repository<JournalLineEntity>,
    @InjectRepository(FiscalPeriodEntity)
    private readonly periodRepo: Repository<FiscalPeriodEntity>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Helper untuk menentukan rentang tanggal (startDate & endDate)
   * Berdasarkan periodId atau parameter query.
   */
  private async resolveDateRange(
    startDate?: string,
    endDate?: string,
    periodId?: string,
  ): Promise<{ startDate: string; endDate: string; periodName?: string }> {
    if (periodId) {
      const period = await this.periodRepo.findOne({ where: { id: periodId } });
      if (!period) {
        throw new NotFoundException(`Periode fiskal '${periodId}' tidak ditemukan.`);
      }
      return {
        startDate: period.startDate,
        endDate: period.endDate,
        periodName: period.name,
      };
    }

    if (startDate && endDate) {
      return { startDate, endDate };
    }

    // Default ke bulan berjalan
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();

    return {
      startDate: `${year}-${month}-01`,
      endDate: `${year}-${month}-${String(lastDay).padStart(2, '0')}`,
    };
  }

  /**
   * 1. BUKU BESAR (General Ledger)
   * Mengambil saldo awal, baris mutasi jurnal POSTED, running balance, dan saldo akhir per akun.
   */
  async getGeneralLedger(filter: GeneralLedgerFilterDto): Promise<GeneralLedgerResponse> {
    const { startDate, endDate, periodName } = await this.resolveDateRange(
      filter.startDate,
      filter.endDate,
      filter.periodId,
    );

    // Filter Akun
    const accountQb = this.accountRepo.createQueryBuilder('acc').where('acc.isPostable = true');
    if (filter.accountId) {
      accountQb.andWhere('acc.id = :accId', { accId: filter.accountId });
    }
    if (filter.accountCode) {
      accountQb.andWhere('acc.code = :code', { code: filter.accountCode });
    }
    accountQb.orderBy('acc.code', 'ASC');

    const accounts = await accountQb.getMany();
    const resultAccounts: AccountLedgerReport[] = [];

    let grandTotalDebit = '0.00';
    let grandTotalCredit = '0.00';

    for (const acc of accounts) {
      // 1. Hitung Saldo Awal (semua jurnal POSTED sebelum startDate)
      const openingRaw = await this.lineRepo
        .createQueryBuilder('line')
        .innerJoin('line.journalEntry', 'j')
        .where('line.accountId = :accId', { accId: acc.id })
        .andWhere('j.status = :status', { status: JournalStatus.POSTED })
        .andWhere('j.journalDate < :startDate', { startDate })
        .select('SUM(CAST(line.debit AS numeric))', 'totalDebit')
        .addSelect('SUM(CAST(line.credit AS numeric))', 'totalCredit')
        .getRawOne();

      const openDebit = openingRaw?.totalDebit || '0.00';
      const openCredit = openingRaw?.totalCredit || '0.00';

      let openingBalance = '0.00';
      if (acc.normalBalance === NormalBalance.DEBIT) {
        openingBalance = MoneyHelper.sub(openDebit, openCredit);
      } else {
        openingBalance = MoneyHelper.sub(openCredit, openDebit);
      }

      // 2. Ambil baris jurnal mutasi periode berjalan
      const linesQb = this.lineRepo
        .createQueryBuilder('line')
        .innerJoinAndSelect('line.journalEntry', 'j')
        .where('line.accountId = :accId', { accId: acc.id })
        .andWhere('j.status = :status', { status: JournalStatus.POSTED })
        .andWhere('j.journalDate >= :startDate AND j.journalDate <= :endDate', {
          startDate,
          endDate,
        });

      if (filter.businessUnitId) {
        linesQb.andWhere('line.businessUnitId = :buId', { buId: filter.businessUnitId });
      }
      if (filter.costCenterId) {
        linesQb.andWhere('line.costCenterId = :ccId', { ccId: filter.costCenterId });
      }

      linesQb
        .orderBy('j.journalDate', 'ASC')
        .addOrderBy('j.journalNo', 'ASC')
        .addOrderBy('line.lineNo', 'ASC');

      const rawLines = await linesQb.getMany();

      let currentBalance = openingBalance;
      let accTotalDebit = '0.00';
      let accTotalCredit = '0.00';

      const lineReports: LedgerLineReport[] = [];

      for (const line of rawLines) {
        accTotalDebit = MoneyHelper.add(accTotalDebit, line.debit);
        accTotalCredit = MoneyHelper.add(accTotalCredit, line.credit);

        if (acc.normalBalance === NormalBalance.DEBIT) {
          const delta = MoneyHelper.sub(line.debit, line.credit);
          currentBalance = MoneyHelper.add(currentBalance, delta);
        } else {
          const delta = MoneyHelper.sub(line.credit, line.debit);
          currentBalance = MoneyHelper.add(currentBalance, delta);
        }

        lineReports.push({
          lineId: line.id,
          journalId: line.journalEntryId,
          journalNo: line.journalEntry?.journalNo || '',
          journalDate: line.journalEntry?.journalDate || '',
          sourceType: line.journalEntry?.sourceType || '',
          description: line.description || line.journalEntry?.description || '',
          debit: line.debit,
          credit: line.credit,
          runningBalance: currentBalance,
          tripId: line.tripId,
          vehicleId: line.vehicleId,
        });
      }

      // Hanya tampilkan akun jika ada saldo awal atau ada transaksi pada periode ini
      const hasMovement =
        !MoneyHelper.isEqual(openingBalance, 0) ||
        !MoneyHelper.isEqual(accTotalDebit, 0) ||
        !MoneyHelper.isEqual(accTotalCredit, 0);

      if (hasMovement || filter.accountId || filter.accountCode) {
        resultAccounts.push({
          accountId: acc.id,
          accountCode: acc.code,
          accountName: acc.name,
          accountType: acc.type,
          normalBalance: acc.normalBalance,
          openingBalance,
          totalDebit: accTotalDebit,
          totalCredit: accTotalCredit,
          endingBalance: currentBalance,
          lines: lineReports,
        });

        grandTotalDebit = MoneyHelper.add(grandTotalDebit, accTotalDebit);
        grandTotalCredit = MoneyHelper.add(grandTotalCredit, accTotalCredit);
      }
    }

    return {
      periodInfo: {
        startDate,
        endDate,
        periodName,
      },
      accounts: resultAccounts,
      grandTotalDebit,
      grandTotalCredit,
    };
  }

  /**
   * 2. NERACA SALDO (Trial Balance)
   * Menyajikan Saldo Awal, Mutasi Periode, dan Saldo Akhir untuk seluruh akun COA.
   */
  async getTrialBalance(filter: TrialBalanceFilterDto): Promise<TrialBalanceResponse> {
    const { startDate, endDate, periodName } = await this.resolveDateRange(
      filter.startDate,
      filter.endDate,
      filter.periodId,
    );

    const accounts = await this.accountRepo.find({
      where: { isPostable: true },
      order: { code: 'ASC' },
    });

    const items: TrialBalanceItem[] = [];

    let totalOpeningDebit = '0.00';
    let totalOpeningCredit = '0.00';
    let totalPeriodDebit = '0.00';
    let totalPeriodCredit = '0.00';
    let totalEndingDebit = '0.00';
    let totalEndingCredit = '0.00';

    for (const acc of accounts) {
      // 1. Saldo Awal (< startDate)
      const openRaw = await this.lineRepo
        .createQueryBuilder('line')
        .innerJoin('line.journalEntry', 'j')
        .where('line.accountId = :accId', { accId: acc.id })
        .andWhere('j.status = :status', { status: JournalStatus.POSTED })
        .andWhere('j.journalDate < :startDate', { startDate })
        .select('SUM(CAST(line.debit AS numeric))', 'debit')
        .addSelect('SUM(CAST(line.credit AS numeric))', 'credit')
        .getRawOne();

      const oDeb = openRaw?.debit || '0.00';
      const oCred = openRaw?.credit || '0.00';

      let openingDebit = '0.00';
      let openingCredit = '0.00';

      if (MoneyHelper.isGreaterThan(oDeb, oCred)) {
        openingDebit = MoneyHelper.sub(oDeb, oCred);
      } else if (MoneyHelper.isGreaterThan(oCred, oDeb)) {
        openingCredit = MoneyHelper.sub(oCred, oDeb);
      }

      // 2. Mutasi Periode (>= startDate AND <= endDate)
      const periodRaw = await this.lineRepo
        .createQueryBuilder('line')
        .innerJoin('line.journalEntry', 'j')
        .where('line.accountId = :accId', { accId: acc.id })
        .andWhere('j.status = :status', { status: JournalStatus.POSTED })
        .andWhere('j.journalDate >= :startDate AND j.journalDate <= :endDate', {
          startDate,
          endDate,
        })
        .select('SUM(CAST(line.debit AS numeric))', 'debit')
        .addSelect('SUM(CAST(line.credit AS numeric))', 'credit')
        .getRawOne();

      const periodDebit = periodRaw?.debit || '0.00';
      const periodCredit = periodRaw?.credit || '0.00';

      // 3. Saldo Akhir (Opening + Period)
      // Net cumulative debit & credit
      const cumDebit = MoneyHelper.add(oDeb, periodDebit);
      const cumCredit = MoneyHelper.add(oCred, periodCredit);

      let endingDebit = '0.00';
      let endingCredit = '0.00';

      if (MoneyHelper.isGreaterThan(cumDebit, cumCredit)) {
        endingDebit = MoneyHelper.sub(cumDebit, cumCredit);
      } else if (MoneyHelper.isGreaterThan(cumCredit, cumDebit)) {
        endingCredit = MoneyHelper.sub(cumCredit, cumDebit);
      }

      const hasActivity =
        !MoneyHelper.isEqual(openingDebit, 0) ||
        !MoneyHelper.isEqual(openingCredit, 0) ||
        !MoneyHelper.isEqual(periodDebit, 0) ||
        !MoneyHelper.isEqual(periodCredit, 0) ||
        !MoneyHelper.isEqual(endingDebit, 0) ||
        !MoneyHelper.isEqual(endingCredit, 0);

      if (hasActivity) {
        items.push({
          accountId: acc.id,
          accountCode: acc.code,
          accountName: acc.name,
          accountType: acc.type,
          normalBalance: acc.normalBalance,
          openingDebit,
          openingCredit,
          periodDebit,
          periodCredit,
          endingDebit,
          endingCredit,
        });

        totalOpeningDebit = MoneyHelper.add(totalOpeningDebit, openingDebit);
        totalOpeningCredit = MoneyHelper.add(totalOpeningCredit, openingCredit);
        totalPeriodDebit = MoneyHelper.add(totalPeriodDebit, periodDebit);
        totalPeriodCredit = MoneyHelper.add(totalPeriodCredit, periodCredit);
        totalEndingDebit = MoneyHelper.add(totalEndingDebit, endingDebit);
        totalEndingCredit = MoneyHelper.add(totalEndingCredit, endingCredit);
      }
    }

    const isBalanced =
      MoneyHelper.isEqual(totalPeriodDebit, totalPeriodCredit) &&
      MoneyHelper.isEqual(totalEndingDebit, totalEndingCredit);

    return {
      periodInfo: {
        startDate,
        endDate,
        periodName,
      },
      items,
      totals: {
        openingDebit: totalOpeningDebit,
        openingCredit: totalOpeningCredit,
        periodDebit: totalPeriodDebit,
        periodCredit: totalPeriodCredit,
        endingDebit: totalEndingDebit,
        endingCredit: totalEndingCredit,
        isBalanced,
      },
    };
  }

  /**
   * 3. LAPORAN LABA RUGI (Income Statement / P&L)
   * Menghitung Pendapatan, Beban Langsung Armada, Beban Kru, Beban Operasional, dan Laba Bersih.
   */
  async getIncomeStatement(filter: IncomeStatementFilterDto): Promise<IncomeStatementResponse> {
    const { startDate, endDate, periodName } = await this.resolveDateRange(
      filter.startDate,
      filter.endDate,
      filter.periodId,
    );

    const query = `
      SELECT 
        a.code AS "accountCode",
        a.name AS "accountName",
        a.type AS "accountType",
        COALESCE(SUM(CAST(jl.credit AS numeric)) - SUM(CAST(jl.debit AS numeric)), 0) AS "netCredit",
        COALESCE(SUM(CAST(jl.debit AS numeric)) - SUM(CAST(jl.credit AS numeric)), 0) AS "netDebit"
      FROM accounts a
      INNER JOIN journal_lines jl ON jl.account_id = a.id
      INNER JOIN journal_entries j ON j.id = jl.journal_entry_id
      WHERE j.status = 'POSTED'
        AND j.journal_date >= $1 AND j.journal_date <= $2
        AND a.type IN ('REVENUE', 'EXPENSE')
      GROUP BY a.code, a.name, a.type
      ORDER BY a.code ASC
    `;

    const rows: Array<{
      accountCode: string;
      accountName: string;
      accountType: string;
      netCredit: string;
      netDebit: string;
    }> = await this.dataSource.query(query, [startDate, endDate]);

    // Grouping
    const revenueGroups: Record<string, PnLGroup> = {};
    const fleetGroups: Record<string, PnLGroup> = {};
    const crewGroups: Record<string, PnLGroup> = {};
    const agentGroups: Record<string, PnLGroup> = {};
    const mntGroups: Record<string, PnLGroup> = {};
    const generalGroups: Record<string, PnLGroup> = {};
    const otherGroups: Record<string, PnLGroup> = {};

    let totalRevenue = '0.00';
    let totalExpense = '0.00';
    let directCosts = '0.00';

    for (const r of rows) {
      const code = r.accountCode;
      const prefix2 = code.slice(0, 2);

      if (r.accountType === 'REVENUE') {
        const amt = MoneyHelper.toAmount(r.netCredit);
        totalRevenue = MoneyHelper.add(totalRevenue, amt);

        let groupKey = prefix2;
        let groupName = 'Pendapatan Lain-lain';
        if (prefix2 === '41') groupName = 'Pendapatan Tiket AKAP Reguler';
        else if (prefix2 === '42') groupName = 'Pendapatan Sewa Bus Pariwisata / Charter';
        else if (prefix2 === '43') groupName = 'Pendapatan Kargo & Paket Bagasi';
        else if (prefix2 === '44') groupName = 'Pendapatan Shuttle & Rental';
        else if (prefix2 === '81') groupName = 'Pendapatan Non-Operasional';

        if (!revenueGroups[groupKey]) {
          revenueGroups[groupKey] = {
            groupCode: groupKey,
            groupName,
            subtotal: '0.00',
            accounts: [],
          };
        }
        revenueGroups[groupKey].accounts.push({
          accountCode: r.accountCode,
          accountName: r.accountName,
          amount: amt,
        });
        revenueGroups[groupKey].subtotal = MoneyHelper.add(
          revenueGroups[groupKey].subtotal,
          amt,
        );
      } else {
        // EXPENSE
        const amt = MoneyHelper.toAmount(r.netDebit);
        totalExpense = MoneyHelper.add(totalExpense, amt);

        if (prefix2 === '51' || prefix2 === '52') {
          // Beban Langsung Armada & Tol
          directCosts = MoneyHelper.add(directCosts, amt);
          const groupKey = prefix2;
          const groupName =
            prefix2 === '51'
              ? 'Beban Bahan Bakar (BBM) & Servis Makan'
              : 'Beban Tol, Parkir & Penyeberangan';
          if (!fleetGroups[groupKey]) {
            fleetGroups[groupKey] = { groupCode: groupKey, groupName, subtotal: '0.00', accounts: [] };
          }
          fleetGroups[groupKey].accounts.push({
            accountCode: r.accountCode,
            accountName: r.accountName,
            amount: amt,
          });
          fleetGroups[groupKey].subtotal = MoneyHelper.add(fleetGroups[groupKey].subtotal, amt);
        } else if (prefix2 === '53') {
          // Beban Kru
          directCosts = MoneyHelper.add(directCosts, amt);
          const groupKey = prefix2;
          const groupName = 'Beban Kompensasi & Hak Kru Operasional';
          if (!crewGroups[groupKey]) {
            crewGroups[groupKey] = { groupCode: groupKey, groupName, subtotal: '0.00', accounts: [] };
          }
          crewGroups[groupKey].accounts.push({
            accountCode: r.accountCode,
            accountName: r.accountName,
            amount: amt,
          });
          crewGroups[groupKey].subtotal = MoneyHelper.add(crewGroups[groupKey].subtotal, amt);
        } else if (prefix2 === '54') {
          // Keagenan & Rekanan
          directCosts = MoneyHelper.add(directCosts, amt);
          const groupKey = prefix2;
          const groupName = 'Beban Komisi Agen & Korlap';
          if (!agentGroups[groupKey]) {
            agentGroups[groupKey] = { groupCode: groupKey, groupName, subtotal: '0.00', accounts: [] };
          }
          agentGroups[groupKey].accounts.push({
            accountCode: r.accountCode,
            accountName: r.accountName,
            amount: amt,
          });
          agentGroups[groupKey].subtotal = MoneyHelper.add(agentGroups[groupKey].subtotal, amt);
        } else if (prefix2 === '55') {
          // Bengkel & Perawatan
          const groupKey = prefix2;
          const groupName = 'Beban Pemeliharaan, Bengkel & Derek';
          if (!mntGroups[groupKey]) {
            mntGroups[groupKey] = { groupCode: groupKey, groupName, subtotal: '0.00', accounts: [] };
          }
          mntGroups[groupKey].accounts.push({
            accountCode: r.accountCode,
            accountName: r.accountName,
            amount: amt,
          });
          mntGroups[groupKey].subtotal = MoneyHelper.add(mntGroups[groupKey].subtotal, amt);
        } else if (prefix2 === '56' || prefix2 === '57') {
          // Penyusutan & Umum
          const groupKey = prefix2;
          const groupName =
            prefix2 === '56' ? 'Beban Penyusutan Aset Tetap' : 'Beban Umum, Operasional & Pool';
          if (!generalGroups[groupKey]) {
            generalGroups[groupKey] = { groupCode: groupKey, groupName, subtotal: '0.00', accounts: [] };
          }
          generalGroups[groupKey].accounts.push({
            accountCode: r.accountCode,
            accountName: r.accountName,
            amount: amt,
          });
          generalGroups[groupKey].subtotal = MoneyHelper.add(generalGroups[groupKey].subtotal, amt);
        } else {
          // Lain-lain & Bunga / Non-ops
          const groupKey = prefix2;
          const groupName =
            prefix2 === '58'
              ? 'Beban Selisih Kasir & Lain-lain'
              : prefix2 === '59'
                ? 'Beban Pembiayaan & Leasing'
                : 'Beban Non-Operasional';
          if (!otherGroups[groupKey]) {
            otherGroups[groupKey] = { groupCode: groupKey, groupName, subtotal: '0.00', accounts: [] };
          }
          otherGroups[groupKey].accounts.push({
            accountCode: r.accountCode,
            accountName: r.accountName,
            amount: amt,
          });
          otherGroups[groupKey].subtotal = MoneyHelper.add(otherGroups[groupKey].subtotal, amt);
        }
      }
    }

    const grossProfit = MoneyHelper.sub(totalRevenue, directCosts);
    const operatingExpenses = MoneyHelper.sub(totalExpense, directCosts);
    const operatingProfit = MoneyHelper.sub(grossProfit, operatingExpenses);
    const netIncome = MoneyHelper.sub(totalRevenue, totalExpense);

    return {
      periodInfo: {
        startDate,
        endDate,
        periodName,
      },
      revenues: {
        groups: Object.values(revenueGroups),
        totalRevenue,
      },
      expenses: {
        directFleetCosts: Object.values(fleetGroups),
        crewCosts: Object.values(crewGroups),
        agentPartnerCosts: Object.values(agentGroups),
        maintenanceCosts: Object.values(mntGroups),
        generalPoolCosts: Object.values(generalGroups),
        otherCosts: Object.values(otherGroups),
        totalExpense,
      },
      grossProfit,
      operatingProfit,
      netIncome,
    };
  }

  /**
   * 4. NERACA (Balance Sheet)
   * Menyajikan posisi Aset, Liabilitas, dan Ekuitas per tanggal tertentu.
   */
  async getBalanceSheet(filter: BalanceSheetFilterDto): Promise<BalanceSheetResponse> {
    const asOfDate = filter.asOfDate || new Date().toISOString().slice(0, 10);

    let periodName: string | undefined;
    if (filter.periodId) {
      const p = await this.periodRepo.findOne({ where: { id: filter.periodId } });
      periodName = p?.name;
    }

    const query = `
      SELECT 
        a.code AS "accountCode",
        a.name AS "accountName",
        a.type AS "accountType",
        a.normal_balance AS "normalBalance",
        COALESCE(SUM(CAST(jl.debit AS numeric)), 0) AS "totalDebit",
        COALESCE(SUM(CAST(jl.credit AS numeric)), 0) AS "totalCredit"
      FROM accounts a
      LEFT JOIN journal_lines jl ON jl.account_id = a.id
      LEFT JOIN journal_entries j ON j.id = jl.journal_entry_id AND j.status = 'POSTED' AND j.journal_date <= $1
      WHERE a.is_postable = true
      GROUP BY a.code, a.name, a.type, a.normal_balance
      ORDER BY a.code ASC
    `;

    const rows: Array<{
      accountCode: string;
      accountName: string;
      accountType: string;
      normalBalance: string;
      totalDebit: string;
      totalCredit: string;
    }> = await this.dataSource.query(query, [asOfDate]);

    const assetCategories: Record<string, BalanceSheetCategory> = {};
    const liabCategories: Record<string, BalanceSheetCategory> = {};
    const equityCategories: Record<string, BalanceSheetCategory> = {};

    let totalAssets = '0.00';
    let totalLiabilities = '0.00';
    let totalEquityRaw = '0.00';

    let totalCumulativeRevenue = '0.00';
    let totalCumulativeExpense = '0.00';

    for (const r of rows) {
      const code = r.accountCode;
      const prefix2 = code.slice(0, 2);

      if (r.accountType === 'REVENUE') {
        const netRev = MoneyHelper.sub(r.totalCredit, r.totalDebit);
        totalCumulativeRevenue = MoneyHelper.add(totalCumulativeRevenue, netRev);
        continue;
      }
      if (r.accountType === 'EXPENSE') {
        const netExp = MoneyHelper.sub(r.totalDebit, r.totalCredit);
        totalCumulativeExpense = MoneyHelper.add(totalCumulativeExpense, netExp);
        continue;
      }

      if (r.accountType === 'ASSET') {
        const netAsset =
          r.normalBalance === 'DEBIT'
            ? MoneyHelper.sub(r.totalDebit, r.totalCredit)
            : MoneyHelper.sub(r.totalCredit, r.totalDebit); // Akumulasi penyusutan

        if (!MoneyHelper.isEqual(netAsset, 0)) {
          totalAssets =
            r.normalBalance === 'DEBIT'
              ? MoneyHelper.add(totalAssets, netAsset)
              : MoneyHelper.sub(totalAssets, netAsset);

          let catName = 'Aset Lainnya';
          if (prefix2 === '11') catName = 'Kas dan Setara Kas';
          else if (prefix2 === '12') catName = 'Piutang Usaha (AR)';
          else if (prefix2 === '13') catName = 'Uang Muka Operasional Kru';
          else if (prefix2 === '14') catName = 'Persediaan Suku Cadang';
          else if (prefix2 === '15') catName = 'Aset Tetap (Armada & Peralatan)';
          else if (prefix2 === '16') catName = 'Akumulasi Penyusutan Aset Tetap';

          if (!assetCategories[prefix2]) {
            assetCategories[prefix2] = { categoryCode: prefix2, categoryName: catName, subtotal: '0.00', items: [] };
          }
          assetCategories[prefix2].items.push({
            accountCode: r.accountCode,
            accountName: r.accountName,
            amount: netAsset,
          });
          assetCategories[prefix2].subtotal =
            r.normalBalance === 'DEBIT'
              ? MoneyHelper.add(assetCategories[prefix2].subtotal, netAsset)
              : MoneyHelper.sub(assetCategories[prefix2].subtotal, netAsset);
        }
      } else if (r.accountType === 'LIABILITY') {
        const netLiab = MoneyHelper.sub(r.totalCredit, r.totalDebit);
        if (!MoneyHelper.isEqual(netLiab, 0)) {
          totalLiabilities = MoneyHelper.add(totalLiabilities, netLiab);

          let catName = 'Liabilitas Lainnya';
          if (prefix2 === '21') catName = 'Utang Usaha Vendor (AP)';
          else if (prefix2 === '22') catName = 'Utang Keagenan & Pihak Ketiga';
          else if (prefix2 === '23') catName = 'Utang Kompensasi Kru';
          else if (prefix2 === '24') catName = 'Pendapatan Diterima di Muka (DP Wisata)';
          else if (prefix2 === '25') catName = 'Utang Pajak';
          else if (prefix2 === '26') catName = 'Utang Pembiayaan Leasing Armada';

          if (!liabCategories[prefix2]) {
            liabCategories[prefix2] = { categoryCode: prefix2, categoryName: catName, subtotal: '0.00', items: [] };
          }
          liabCategories[prefix2].items.push({
            accountCode: r.accountCode,
            accountName: r.accountName,
            amount: netLiab,
          });
          liabCategories[prefix2].subtotal = MoneyHelper.add(liabCategories[prefix2].subtotal, netLiab);
        }
      } else if (r.accountType === 'EQUITY') {
        const netEquity = MoneyHelper.sub(r.totalCredit, r.totalDebit);
        if (!MoneyHelper.isEqual(netEquity, 0)) {
          totalEquityRaw = MoneyHelper.add(totalEquityRaw, netEquity);

          let catName = 'Modal & Ekuitas';
          if (prefix2 === '31') catName = 'Modal Disetor';
          else if (prefix2 === '32') catName = 'Saldo Laba Ditahan';

          if (!equityCategories[prefix2]) {
            equityCategories[prefix2] = { categoryCode: prefix2, categoryName: catName, subtotal: '0.00', items: [] };
          }
          equityCategories[prefix2].items.push({
            accountCode: r.accountCode,
            accountName: r.accountName,
            amount: netEquity,
          });
          equityCategories[prefix2].subtotal = MoneyHelper.add(equityCategories[prefix2].subtotal, netEquity);
        }
      }
    }

    // Hitung Laba/Rugi Berjalan dari inception s.d. asOfDate
    const currentPeriodNetIncome = MoneyHelper.sub(totalCumulativeRevenue, totalCumulativeExpense);
    const totalEquity = MoneyHelper.add(totalEquityRaw, currentPeriodNetIncome);

    const isBalanced = MoneyHelper.isEqual(
      totalAssets,
      MoneyHelper.add(totalLiabilities, totalEquity),
    );

    return {
      asOfDate,
      periodName,
      assets: {
        categories: Object.values(assetCategories),
        totalAssets,
      },
      liabilities: {
        categories: Object.values(liabCategories),
        totalLiabilities,
      },
      equity: {
        categories: Object.values(equityCategories),
        currentPeriodNetIncome,
        totalEquity,
      },
      isBalanced,
    };
  }
}
