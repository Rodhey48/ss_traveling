import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CashierSettlementService } from './cashier-settlement.service';
import {
  CrewCashSettlementEntity,
  CrewCashRemittanceEntity,
  CrewCashRemittanceAllocationEntity,
  CrewCashDiscrepancyEntity,
  CrewCashSettlementStatus,
  SettlementUjStatus,
  SettlementRevenueStatus,
  RemittancePaymentMethod,
  RemittanceStatus,
  SpjEntity,
  SpjFinancialStatus,
  SpjOperationalStatus,
  SpjExpenseType,
  SpjExpensePaymentSource,
  SpjRevenueDeclarationType,
  SpjRevenueDeclarationStatus,
  CrewMealPaymentStatus,
  CashAccountEntity,
  AccountEntity,
} from '../../@models';
import { AccountingPostingService } from '../../finance/services/accounting-posting.service';
import { DocumentSequenceService } from '../../finance/services/document-sequence.service';

describe('CashierSettlementService', () => {
  let service: CashierSettlementService;
  let settlementRepo: any;
  let remittanceRepo: any;
  let allocationRepo: any;
  let discrepancyRepo: any;
  let spjRepo: any;
  let cashAccountRepo: any;
  let accountRepo: any;
  let accountingPostingService: any;
  let documentSequenceService: any;
  let dataSource: any;

  beforeEach(async () => {
    settlementRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn((dto) => ({ id: 'mock-settle-id', ...dto })),
      save: jest.fn((e) => Promise.resolve({ id: e.id || 'mock-settle-id', ...e })),
      createQueryBuilder: jest.fn(() => ({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      })),
    };

    remittanceRepo = {
      find: jest.fn().mockResolvedValue([]),
      create: jest.fn((dto) => ({ id: 'mock-rem-id', ...dto })),
      save: jest.fn((e) => Promise.resolve({ id: e.id || 'mock-rem-id', ...e })),
    };

    allocationRepo = {
      create: jest.fn((dto) => ({ id: 'mock-alloc-id', ...dto })),
      save: jest.fn((e) => Promise.resolve(e)),
    };

    discrepancyRepo = {
      find: jest.fn().mockResolvedValue([]),
    };

    spjRepo = {
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(() => ({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      })),
    };

    cashAccountRepo = {
      findOne: jest.fn(),
    };

    accountRepo = {
      findOne: jest.fn().mockImplementation(({ where }: any) => {
        if (where?.id === 'acc-kas-id' || where?.code === '11101') {
          return Promise.resolve({ id: 'acc-kas-id', code: '11101' });
        }
        if (where?.id === 'acc-uj-id' || where?.code === '13101') {
          return Promise.resolve({ id: 'acc-uj-id', code: '13101' });
        }
        if (where?.code === '11999') {
          return Promise.resolve({ id: 'acc-11999-id', code: '11999' });
        }
        return Promise.resolve(null);
      }),
      find: jest.fn().mockResolvedValue([
        { id: 'acc-kas-id', code: '11101' },
        { id: 'acc-uj-id', code: '13101' },
        { id: 'acc-bbm-id', code: '51101' },
        { id: 'acc-tol-id', code: '52101' },
        { id: 'acc-tpr-id', code: '52103' },
        { id: 'acc-tkt-id', code: '41101' },
        { id: 'acc-krg-id', code: '43101' },
      ]),
    };

    accountingPostingService = {
      postJournal: jest.fn().mockResolvedValue({ id: 'mock-journal-id' }),
    };

    documentSequenceService = {
      getNextDocumentNumber: jest.fn().mockImplementation((type) => {
        if (type === 'SETTLEMENT') return Promise.resolve('SETTLE/2610/0001');
        if (type === 'REMITTANCE') return Promise.resolve('REM/2610/0001');
        if (type === 'BKM') return Promise.resolve('BKM/2610/0001');
        if (type === 'BKK') return Promise.resolve('BKK/2610/0001');
        return Promise.resolve('DOC/2610/0001');
      }),
    };

    dataSource = {
      transaction: jest.fn((cb) => {
        const mockManager = {
          findOne: jest.fn(),
          create: jest.fn((entityClass, dto) => ({ id: 'mock-id', ...dto })),
          save: jest.fn((entity) => Promise.resolve({ id: entity.id || 'mock-id', ...entity })),
          createQueryBuilder: jest.fn(() => ({
            update: jest.fn().mockReturnThis(),
            set: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            execute: jest.fn().mockResolvedValue({ affected: 1 }),
          })),
        };
        return cb(mockManager);
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CashierSettlementService,
        { provide: getRepositoryToken(CrewCashSettlementEntity), useValue: settlementRepo },
        { provide: getRepositoryToken(CrewCashRemittanceEntity), useValue: remittanceRepo },
        { provide: getRepositoryToken(CrewCashRemittanceAllocationEntity), useValue: allocationRepo },
        { provide: getRepositoryToken(CrewCashDiscrepancyEntity), useValue: discrepancyRepo },
        { provide: getRepositoryToken(SpjEntity), useValue: spjRepo },
        { provide: getRepositoryToken(CashAccountEntity), useValue: cashAccountRepo },
        { provide: getRepositoryToken(AccountEntity), useValue: accountRepo },
        { provide: AccountingPostingService, useValue: accountingPostingService },
        { provide: DocumentSequenceService, useValue: documentSequenceService },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get<CashierSettlementService>(CashierSettlementService);
  });

  describe('calculateSettlement (Two-Pocket Anti-Netting Logic)', () => {
    it('harus menghitung UJ seimbang dan penerimaan kas cocok pada Skenario 1 (Normal)', async () => {
      const mockSpj: Partial<SpjEntity> = {
        id: 'spj-01',
        spjNo: 'SPJ/AKP/2610/0001',
        ujs: [
          {
            id: 'uj-01',
            disbursements: [{ id: 'd-01', amount: 3500000 } as any],
            returns: [{ id: 'r-01', amount: 900000 } as any],
          } as any,
        ],
        expenses: [
          {
            id: 'exp-01',
            expenseType: SpjExpenseType.FUEL,
            amount: 2000000,
            paymentSource: SpjExpensePaymentSource.UJ,
          } as any,
          {
            id: 'exp-02',
            expenseType: SpjExpenseType.TOLL,
            amount: 500000,
            paymentSource: SpjExpensePaymentSource.UJ,
          } as any,
          {
            id: 'exp-03',
            expenseType: SpjExpenseType.PARKING,
            amount: 100000,
            paymentSource: SpjExpensePaymentSource.UJ,
          } as any,
        ],
        revenueDeclarations: [
          {
            id: 'decl-01',
            declarationType: SpjRevenueDeclarationType.TICKET_CASH,
            amount: '450000.00',
            status: SpjRevenueDeclarationStatus.VERIFIED,
          } as any,
          {
            id: 'decl-02',
            declarationType: SpjRevenueDeclarationType.CARGO_MOTORCYCLE,
            amount: '350000.00',
            crewCommissionAmount: '70000.00',
            status: SpjRevenueDeclarationStatus.VERIFIED,
          } as any,
        ],
        crewMealPayments: [
          {
            id: 'pay-01',
            amount: 100000,
            status: CrewMealPaymentStatus.PENDING,
          } as any,
          {
            id: 'pay-02',
            amount: 70000,
            status: CrewMealPaymentStatus.PENDING,
          } as any,
        ],
      };

      spjRepo.findOne.mockResolvedValue(mockSpj);
      remittanceRepo.find.mockResolvedValue([
        {
          id: 'rem-01',
          amount: 800000,
          status: RemittanceStatus.VERIFIED,
          allocations: [
            { revenueDeclarationId: 'decl-01', allocatedAmount: 450000 },
            { revenueDeclarationId: 'decl-02', allocatedAmount: 350000 },
          ],
        },
      ]);

      const result = await service.calculateSettlement('spj-01');

      // Kantong 1 UJ: 3.5jt - (2.0jt + 500rb + 100rb) - 900rb = 0
      expect(result.kantong1Uj.totalDisbursed).toBe(3500000);
      expect(result.kantong1Uj.totalSpent).toBe(2600000);
      expect(result.kantong1Uj.totalReturned).toBe(900000);
      expect(result.kantong1Uj.balance).toBe(0);
      expect(result.kantong1Uj.status).toBe(SettlementUjStatus.BALANCED);

      // Kantong 2 Revenue: Expected 800rb vs Remitted 800rb = 0
      expect(result.kantong2Revenue.totalExpected).toBe(800000);
      expect(result.kantong2Revenue.totalRemitted).toBe(800000);
      expect(result.kantong2Revenue.balance).toBe(0);
      expect(result.kantong2Revenue.status).toBe(SettlementRevenueStatus.MATCHED);

      // Posisi Kas Kasir Pool: Masuk (900rb + 800rb = 1.7jt), Bayar Kru (170rb), Net (1.53jt)
      expect(result.cashDesk.totalCashReceived).toBe(1700000);
      expect(result.cashDesk.totalCrewCompensationPayable).toBe(170000);
      expect(result.cashDesk.netCashPosition).toBe(1530000);
    });

    it('harus mendeteksi DISCREPANCY jika ada nota UJ yang hilang (Skenario 4)', async () => {
      const mockSpj: Partial<SpjEntity> = {
        id: 'spj-03',
        spjNo: 'SPJ/AKP/2610/0099',
        ujs: [
          {
            id: 'uj-03',
            disbursements: [{ id: 'd-03', amount: 3500000 } as any],
            returns: [{ id: 'r-03', amount: 200000 } as any],
          } as any,
        ],
        expenses: [
          {
            id: 'exp-05',
            expenseType: SpjExpenseType.FUEL,
            amount: 2000000,
            paymentSource: SpjExpensePaymentSource.UJ,
          } as any,
          {
            id: 'exp-06',
            expenseType: SpjExpenseType.TOLL,
            amount: 900000,
            paymentSource: SpjExpensePaymentSource.UJ,
          } as any,
          {
            id: 'exp-07',
            expenseType: SpjExpenseType.PARKING,
            amount: 100000,
            paymentSource: SpjExpensePaymentSource.UJ,
          } as any,
        ],
        revenueDeclarations: [],
      };

      spjRepo.findOne.mockResolvedValue(mockSpj);
      remittanceRepo.find.mockResolvedValue([]);

      const result = await service.calculateSettlement('spj-03');

      // Plafon 3.5jt - Nota sah 3.0jt - Sisa 200rb = Selisih 300rb
      expect(result.kantong1Uj.totalDisbursed).toBe(3500000);
      expect(result.kantong1Uj.totalSpent).toBe(3000000);
      expect(result.kantong1Uj.totalReturned).toBe(200000);
      expect(result.kantong1Uj.balance).toBe(300000);
      expect(result.kantong1Uj.status).toBe(SettlementUjStatus.DISCREPANCY);
    });
  });

  describe('processSettlement', () => {
    it('harus memvalidasi dan memposting jurnal otomatis ketika UJ BALANCED dan Revenue MATCHED', async () => {
      const mockSpj: any = {
        id: 'spj-01',
        companyId: 'comp-01',
        spjNo: 'SPJ/AKP/2610/0001',
        vehicleId: 'veh-01',
        financialStatus: SpjFinancialStatus.PENDING_SETTLEMENT,
        ujs: [
          {
            disbursements: [{ amount: 3500000 }],
            returns: [{ amount: 900000 }],
          },
        ],
        expenses: [
          { expenseType: SpjExpenseType.FUEL, amount: 2600000, paymentSource: SpjExpensePaymentSource.UJ },
        ],
        revenueDeclarations: [
          { id: 'decl-01', declarationType: SpjRevenueDeclarationType.TICKET_CASH, amount: '800000.00' },
        ],
        crewMealPayments: [
          { id: 'pay-01', amount: 100000, status: CrewMealPaymentStatus.PENDING },
        ],
      };

      const mockCashAccount: any = {
        id: 'cash-acc-id',
        code: 'CASH-POOL-CIPUTAT',
        accountId: 'acc-kas-id',
      };

      spjRepo.findOne.mockResolvedValue(mockSpj);
      remittanceRepo.find.mockResolvedValue([
        {
          amount: 800000,
          status: RemittanceStatus.VERIFIED,
          allocations: [{ revenueDeclarationId: 'decl-01', allocatedAmount: 800000 }],
        },
      ]);

      dataSource.transaction.mockImplementation(async (cb: any) => {
        const mockManager = {
          findOne: jest.fn().mockImplementation((entityClass) => {
            if (entityClass === SpjEntity) return Promise.resolve(mockSpj);
            if (entityClass === CashAccountEntity) return Promise.resolve(mockCashAccount);
            if (entityClass === CrewCashSettlementEntity) return Promise.resolve(null);
            return Promise.resolve(null);
          }),
          create: jest.fn((_, dto) => ({ id: 'mock-settle-id', ...dto })),
          save: jest.fn((e) => Promise.resolve({ id: e.id || 'mock-settle-id', ...e })),
          createQueryBuilder: jest.fn(() => ({
            update: jest.fn().mockReturnThis(),
            set: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            execute: jest.fn().mockResolvedValue({ affected: 1 }),
          })),
        };
        return cb(mockManager);
      });

      const result = await service.processSettlement(
        {
          spjId: 'spj-01',
          cashAccountId: 'cash-acc-id',
          cashPaidToCrew: true,
        },
        'cashier-user-id',
      );

      expect(result).toBeDefined();
      expect(result.status).toBe(CrewCashSettlementStatus.VERIFIED);
      expect(result.ujStatus).toBe(SettlementUjStatus.BALANCED);
      expect(result.revenueStatus).toBe(SettlementRevenueStatus.MATCHED);
      expect(result.bkmNo).toBe('BKM/2610/0001');
      expect(result.bkkNo).toBe('BKK/2610/0001');
      expect(accountingPostingService.postJournal).toHaveBeenCalled();
    });

    it('harus menolak jika SPJ sudah berstatus SETTLED', async () => {
      const mockSpj: any = {
        id: 'spj-01',
        spjNo: 'SPJ/AKP/2610/0001',
        financialStatus: SpjFinancialStatus.SETTLED,
      };

      dataSource.transaction.mockImplementation(async (cb: any) => {
        const mockManager = {
          findOne: jest.fn().mockResolvedValue(mockSpj),
        };
        return cb(mockManager);
      });

      await expect(
        service.processSettlement(
          { spjId: 'spj-01', cashAccountId: 'cash-acc-id' },
          'cashier-user-id',
        ),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('postUnblockedPendingSettlement (Period Closing Unblocked via 11999)', () => {
    it('harus memposting jurnal penampung akun 11999 untuk unblock tutup buku bulanan', async () => {
      const mockSettlement: any = {
        id: 'settle-03',
        settlementNo: 'SETTLE/2610/0003',
        status: CrewCashSettlementStatus.SUBMITTED,
        ujBalance: 300000,
        totalCashReceived: 1550000,
        spj: { spjNo: 'SPJ/AKP/2610/0099' },
      };

      accountRepo.findOne.mockImplementation(({ where }: any) => {
        if (where.code === '11999') return Promise.resolve({ id: 'acc-11999-id', code: '11999' });
        if (where.code === '11101') return Promise.resolve({ id: 'acc-11101-id', code: '11101' });
        return Promise.resolve(null);
      });

      dataSource.transaction.mockImplementation(async (cb: any) => {
        const mockManager = {
          findOne: jest.fn().mockResolvedValue(mockSettlement),
          save: jest.fn((e) => Promise.resolve(e)),
        };
        return cb(mockManager);
      });

      const result = await service.postUnblockedPendingSettlement('settle-03', 'accountant-id');

      expect(result).toBeDefined();
      expect(accountingPostingService.postJournal).toHaveBeenCalled();
      const callArg = accountingPostingService.postJournal.mock.calls[0][0];
      expect(callArg.lines.some((l: any) => l.accountId === 'acc-11999-id' && l.debit === 300000)).toBe(true);
    });
  });
});
