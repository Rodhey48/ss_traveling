import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { FinancialReportsService } from './financial-reports.service';
import { AccountEntity, AccountType, NormalBalance } from '../../@models/finance/account.entity';
import { JournalEntryEntity, JournalStatus } from '../../@models/finance/journal-entry.entity';
import { JournalLineEntity } from '../../@models/finance/journal-line.entity';
import { FiscalPeriodEntity } from '../../@models/finance/fiscal-period.entity';

describe('FinancialReportsService', () => {
  let service: FinancialReportsService;
  let accountRepo: any;
  let journalRepo: any;
  let lineRepo: any;
  let periodRepo: any;
  let dataSource: any;

  beforeEach(async () => {
    accountRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
    journalRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
    };
    lineRepo = {
      createQueryBuilder: jest.fn(),
    };
    periodRepo = {
      findOne: jest.fn(),
    };
    dataSource = {
      query: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FinancialReportsService,
        { provide: getRepositoryToken(AccountEntity), useValue: accountRepo },
        { provide: getRepositoryToken(JournalEntryEntity), useValue: journalRepo },
        { provide: getRepositoryToken(JournalLineEntity), useValue: lineRepo },
        { provide: getRepositoryToken(FiscalPeriodEntity), useValue: periodRepo },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get<FinancialReportsService>(FinancialReportsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getGeneralLedger', () => {
    it('should calculate opening balance, line mutations, and running balance', async () => {
      const mockAccount = {
        id: 'acc-cash',
        code: '11101',
        name: 'Kas Pool Ciputat',
        type: AccountType.ASSET,
        normalBalance: NormalBalance.DEBIT,
        isPostable: true,
      };

      const accountQb: any = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockAccount]),
      };
      accountRepo.createQueryBuilder.mockReturnValue(accountQb);

      // Opening balance query builder mock
      const openingQb: any = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ totalDebit: '5000000.00', totalCredit: '2000000.00' }),
      };

      // Period lines query builder mock
      const mockLine1 = {
        id: 'line-1',
        journalEntryId: 'j-1',
        debit: '1000000.00',
        credit: '0.00',
        description: 'Setoran Kasir SPJ 001',
        journalEntry: {
          journalNo: 'JRN/2610/0001',
          journalDate: '2026-10-15',
          sourceType: 'SETTLEMENT',
          description: 'Setoran',
        },
      };

      const linesQb: any = {
        innerJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockLine1]),
      };

      lineRepo.createQueryBuilder
        .mockReturnValueOnce(openingQb)
        .mockReturnValueOnce(linesQb);

      const result = await service.getGeneralLedger({
        accountCode: '11101',
        startDate: '2026-10-01',
        endDate: '2026-10-31',
      });

      expect(result.accounts).toHaveLength(1);
      const accReport = result.accounts[0];
      expect(accReport.accountCode).toBe('11101');
      expect(accReport.openingBalance).toBe('3000000.00'); // 5M - 2M
      expect(accReport.totalDebit).toBe('1000000.00');
      expect(accReport.totalCredit).toBe('0.00');
      expect(accReport.endingBalance).toBe('4000000.00'); // 3M + 1M
      expect(accReport.lines).toHaveLength(1);
      expect(accReport.lines[0].runningBalance).toBe('4000000.00');
    });
  });

  describe('getTrialBalance', () => {
    it('should return balanced trial balance across accounts', async () => {
      const mockAccounts = [
        {
          id: 'acc-1',
          code: '11101',
          name: 'Kas',
          type: AccountType.ASSET,
          normalBalance: NormalBalance.DEBIT,
          isPostable: true,
        },
        {
          id: 'acc-2',
          code: '41101',
          name: 'Pendapatan Tiket',
          type: AccountType.REVENUE,
          normalBalance: NormalBalance.CREDIT,
          isPostable: true,
        },
      ];
      accountRepo.find.mockResolvedValue(mockAccounts);

      // Account 1: Opening 0, Period Debit 2.000.000, Credit 0
      const openQb1: any = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ debit: '0.00', credit: '0.00' }),
      };
      const periodQb1: any = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ debit: '2000000.00', credit: '0.00' }),
      };

      // Account 2: Opening 0, Period Debit 0, Credit 2.000.000
      const openQb2: any = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ debit: '0.00', credit: '0.00' }),
      };
      const periodQb2: any = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ debit: '0.00', credit: '2000000.00' }),
      };

      lineRepo.createQueryBuilder
        .mockReturnValueOnce(openQb1)
        .mockReturnValueOnce(periodQb1)
        .mockReturnValueOnce(openQb2)
        .mockReturnValueOnce(periodQb2);

      const result = await service.getTrialBalance({
        startDate: '2026-10-01',
        endDate: '2026-10-31',
      });

      expect(result.items).toHaveLength(2);
      expect(result.totals.periodDebit).toBe('2000000.00');
      expect(result.totals.periodCredit).toBe('2000000.00');
      expect(result.totals.endingDebit).toBe('2000000.00');
      expect(result.totals.endingCredit).toBe('2000000.00');
      expect(result.totals.isBalanced).toBe(true);
    });
  });

  describe('getIncomeStatement', () => {
    it('should calculate revenues, direct costs, expenses and net income', async () => {
      dataSource.query.mockResolvedValue([
        {
          accountCode: '41101',
          accountName: 'Pendapatan Tiket AKAP Reguler',
          accountType: 'REVENUE',
          netCredit: '6000000.00',
          netDebit: '0.00',
        },
        {
          accountCode: '43101',
          accountName: 'Pendapatan Kargo & Paket',
          accountType: 'REVENUE',
          netCredit: '350000.00',
          netDebit: '0.00',
        },
        {
          accountCode: '51101',
          accountName: 'Beban BBM Solar Armada',
          accountType: 'EXPENSE',
          netCredit: '0.00',
          netDebit: '1200000.00',
        },
        {
          accountCode: '52101',
          accountName: 'Beban Tol Trans Jawa',
          accountType: 'EXPENSE',
          netCredit: '0.00',
          netDebit: '800000.00',
        },
        {
          accountCode: '53101',
          accountName: 'Beban Uang Makan Kru',
          accountType: 'EXPENSE',
          netCredit: '0.00',
          netDebit: '600000.00',
        },
      ]);

      const result = await service.getIncomeStatement({
        startDate: '2026-10-01',
        endDate: '2026-10-31',
      });

      expect(result.revenues.totalRevenue).toBe('6350000.00'); // 6jt + 350rb
      expect(result.expenses.totalExpense).toBe('2600000.00'); // 1.2jt + 800rb + 600rb
      expect(result.netIncome).toBe('3750000.00'); // 6.35jt - 2.6jt
    });
  });

  describe('getBalanceSheet', () => {
    it('should balance Assets against Liabilities + Equity', async () => {
      dataSource.query.mockResolvedValue([
        {
          accountCode: '11101',
          accountName: 'Kas Pool',
          accountType: 'ASSET',
          normalBalance: 'DEBIT',
          totalDebit: '10000000.00',
          totalCredit: '0.00',
        },
        {
          accountCode: '21101',
          accountName: 'Utang Usaha',
          accountType: 'LIABILITY',
          normalBalance: 'CREDIT',
          totalDebit: '0.00',
          totalCredit: '4000000.00',
        },
        {
          accountCode: '31101',
          accountName: 'Modal Disetor',
          accountType: 'EQUITY',
          normalBalance: 'CREDIT',
          totalDebit: '0.00',
          totalCredit: '6000000.00',
        },
      ]);

      const result = await service.getBalanceSheet({
        asOfDate: '2026-10-31',
      });

      expect(result.assets.totalAssets).toBe('10000000.00');
      expect(result.liabilities.totalLiabilities).toBe('4000000.00');
      expect(result.equity.totalEquity).toBe('6000000.00');
      expect(result.isBalanced).toBe(true);
    });
  });
});
