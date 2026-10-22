import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CashierDiscrepancyService } from './cashier-discrepancy.service';
import {
  CrewCashDiscrepancyEntity,
  CrewCashSettlementEntity,
  CrewCashSettlementStatus,
  SettlementUjStatus,
  DiscrepancySourceType,
  DiscrepancyResolutionStatus,
  DiscrepancyResolutionDecision,
  SpjEntity,
  SpjFinancialStatus,
  SpjOperationalStatus,
  AccountEntity,
  CashAccountEntity,
} from '../../@models';
import { AccountingPostingService } from '../../finance/services/accounting-posting.service';
import { DocumentSequenceService } from '../../finance/services/document-sequence.service';

describe('CashierDiscrepancyService', () => {
  let service: CashierDiscrepancyService;
  let discrepancyRepo: any;
  let settlementRepo: any;
  let spjRepo: any;
  let accountRepo: any;
  let cashAccountRepo: any;
  let accountingPostingService: any;
  let documentSequenceService: any;
  let dataSource: any;

  beforeEach(async () => {
    discrepancyRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn((dto) => ({ id: 'mock-disc-id', ...dto })),
      save: jest.fn((e) => Promise.resolve({ id: e.id || 'mock-disc-id', ...e })),
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

    settlementRepo = {
      findOne: jest.fn(),
      save: jest.fn((e) => Promise.resolve(e)),
    };

    spjRepo = {
      findOne: jest.fn(),
      save: jest.fn((e) => Promise.resolve(e)),
    };

    accountRepo = {
      findOne: jest.fn(),
      find: jest.fn().mockResolvedValue([
        { id: 'acc-kas-id', code: '11101' },
        { id: 'acc-uj-id', code: '13101' },
        { id: 'acc-bbm-id', code: '51101' },
        { id: 'acc-dispensasi-id', code: '58101' },
        { id: 'acc-piutang-id', code: '12901' },
        { id: 'acc-tkt-id', code: '41101' },
      ]),
    };

    cashAccountRepo = {
      findOne: jest.fn(),
    };

    accountingPostingService = {
      postJournal: jest.fn().mockResolvedValue({ id: 'mock-journal-id' }),
    };

    documentSequenceService = {
      getNextDocumentNumber: jest.fn().mockResolvedValue('DISC/2610/0001'),
    };

    dataSource = {
      transaction: jest.fn((cb) => {
        const mockManager = {
          findOne: jest.fn(),
          create: jest.fn((_, dto) => ({ id: 'mock-disc-id', ...dto })),
          save: jest.fn((e) => Promise.resolve({ id: e.id || 'mock-disc-id', ...e })),
        };
        return cb(mockManager);
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CashierDiscrepancyService,
        { provide: getRepositoryToken(CrewCashDiscrepancyEntity), useValue: discrepancyRepo },
        { provide: getRepositoryToken(CrewCashSettlementEntity), useValue: settlementRepo },
        { provide: getRepositoryToken(SpjEntity), useValue: spjRepo },
        { provide: getRepositoryToken(AccountEntity), useValue: accountRepo },
        { provide: getRepositoryToken(CashAccountEntity), useValue: cashAccountRepo },
        { provide: AccountingPostingService, useValue: accountingPostingService },
        { provide: DocumentSequenceService, useValue: documentSequenceService },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get<CashierDiscrepancyService>(CashierDiscrepancyService);
  });

  describe('createDiscrepancy', () => {
    it('harus mencatat temuan selisih UJ dan mengubah status SPJ ke DISCREPANCY (Skenario 4 Kasir)', async () => {
      const mockSpj: any = {
        id: 'spj-03',
        spjNo: 'SPJ/AKP/2610/0099',
        financialStatus: SpjFinancialStatus.UNDER_REVIEW,
      };

      const mockSettlement: any = {
        id: 'settle-03',
        status: CrewCashSettlementStatus.SUBMITTED,
        ujStatus: SettlementUjStatus.PENDING,
      };

      dataSource.transaction.mockImplementation(async (cb: any) => {
        const mockManager = {
          findOne: jest.fn().mockImplementation((entityClass) => {
            if (entityClass === SpjEntity) return Promise.resolve(mockSpj);
            if (entityClass === CrewCashSettlementEntity) return Promise.resolve(mockSettlement);
            return Promise.resolve(null);
          }),
          create: jest.fn((_, dto) => ({ id: 'disc-01', ...dto })),
          save: jest.fn((e) => Promise.resolve({ id: e.id || 'disc-01', ...e })),
        };
        return cb(mockManager);
      });

      const result = await service.createDiscrepancy(
        {
          spjId: 'spj-03',
          settlementId: 'settle-03',
          sourceType: DiscrepancySourceType.UJ_EXPENSE_UNVERIFIED,
          expectedAmount: 3300000,
          actualAmount: 3000000,
          reason: 'Struk SPBU Palimanan hilang saat pengisian solar darurat 34 liter.',
        },
        'cashier-user-id',
      );

      expect(result).toBeDefined();
      expect(result.discrepancyNo).toBe('DISC/2610/0001');
      expect(result.differenceAmount).toBe(300000);
      expect(mockSpj.financialStatus).toBe(SpjFinancialStatus.DISCREPANCY);
      expect(mockSettlement.ujStatus).toBe(SettlementUjStatus.DISCREPANCY);
    });
  });

  describe('resolveDiscrepancy (Finance Manager Resolution)', () => {
    it('harus mengesahkan COMPANY_WAIVER dan memposting beban 58101 serta memvalidasi settlement (Skenario 4 Putusan A)', async () => {
      const mockSpj: any = {
        id: 'spj-03',
        spjNo: 'SPJ/AKP/2610/0099',
        vehicleId: 'veh-01',
        financialStatus: SpjFinancialStatus.DISCREPANCY,
        operationalStatus: SpjOperationalStatus.COMPLETED,
      };

      const mockSettlement: any = {
        id: 'settle-03',
        settlementNo: 'SETTLE/2610/0003',
        status: CrewCashSettlementStatus.SUBMITTED,
        ujStatus: SettlementUjStatus.DISCREPANCY,
        totalCashReceived: 1550000,
        totalCashPaid: 0,
        totalUjSpent: 3000000,
        totalUjDisbursed: 3500000,
        totalRevenueRemitted: 1350000,
      };

      const mockDiscrepancy: any = {
        id: 'disc-01',
        spjId: 'spj-03',
        settlementId: 'settle-03',
        sourceType: DiscrepancySourceType.UJ_EXPENSE_UNVERIFIED,
        differenceAmount: 300000,
        reason: 'Struk hilang',
        resolutionStatus: DiscrepancyResolutionStatus.PENDING_INVESTIGATION,
        spj: mockSpj,
        settlement: mockSettlement,
      };

      const mockAcc58101: any = {
        id: 'acc-58101-id',
        code: '58101',
        name: 'Beban Selisih Kasir Pool (Dispensasi Perusahaan)',
      };

      dataSource.transaction.mockImplementation(async (cb: any) => {
        const mockManager = {
          findOne: jest.fn().mockImplementation((entityClass, opts) => {
            if (entityClass === CrewCashDiscrepancyEntity) return Promise.resolve(mockDiscrepancy);
            if (entityClass === AccountEntity) {
              if (opts?.where?.code === '58101') return Promise.resolve(mockAcc58101);
            }
            if (entityClass === CrewCashSettlementEntity) return Promise.resolve(mockSettlement);
            return Promise.resolve(null);
          }),
          save: jest.fn((e) => Promise.resolve(e)),
        };
        return cb(mockManager);
      });

      const result = await service.resolveDiscrepancy(
        'disc-01',
        {
          decision: DiscrepancyResolutionDecision.COMPANY_WAIVER,
          resolutionNotes: 'GPS valid berhenti di SPBU Palimanan, disetujui dispensasi perusahaan.',
        },
        'finance-manager-id',
      );

      expect(result).toBeDefined();
      expect(result.resolutionStatus).toBe(DiscrepancyResolutionStatus.RESOLVED);
      expect(result.resolutionDecision).toBe(DiscrepancyResolutionDecision.COMPANY_WAIVER);
      expect(result.resolutionAccountId).toBe('acc-58101-id');
      expect(mockSettlement.status).toBe(CrewCashSettlementStatus.VERIFIED);
      expect(mockSettlement.ujStatus).toBe(SettlementUjStatus.BALANCED);
      expect(mockSpj.financialStatus).toBe(SpjFinancialStatus.SETTLED);

      expect(accountingPostingService.postJournal).toHaveBeenCalled();
      const journalCall = accountingPostingService.postJournal.mock.calls[0][0];
      expect(journalCall.lines.some((l: any) => l.accountId === 'acc-58101-id' && l.debit === 300000)).toBe(true);
    });

    it('harus mengesahkan CHARGE_TO_CREW dan memposting piutang klaim kru 12901 (Skenario 4 Putusan B)', async () => {
      const mockSpj: any = {
        id: 'spj-03',
        spjNo: 'SPJ/AKP/2610/0099',
        vehicleId: 'veh-01',
        financialStatus: SpjFinancialStatus.DISCREPANCY,
      };

      const mockSettlement: any = {
        id: 'settle-03',
        settlementNo: 'SETTLE/2610/0003',
        status: CrewCashSettlementStatus.SUBMITTED,
        ujStatus: SettlementUjStatus.DISCREPANCY,
        totalCashReceived: 1550000,
        totalCashPaid: 0,
        totalUjSpent: 3000000,
        totalUjDisbursed: 3500000,
        totalRevenueRemitted: 1350000,
      };

      const mockDiscrepancy: any = {
        id: 'disc-02',
        spjId: 'spj-03',
        settlementId: 'settle-03',
        sourceType: DiscrepancySourceType.UJ_EXPENSE_UNVERIFIED,
        differenceAmount: 300000,
        reason: 'Pengeluaran fiktif/kelalaian kru',
        resolutionStatus: DiscrepancyResolutionStatus.PENDING_INVESTIGATION,
        spj: mockSpj,
        settlement: mockSettlement,
      };

      const mockAcc12901: any = {
        id: 'acc-12901-id',
        code: '12901',
        name: 'Piutang Klaim Selisih Kas Kru',
      };

      dataSource.transaction.mockImplementation(async (cb: any) => {
        const mockManager = {
          findOne: jest.fn().mockImplementation((entityClass, opts) => {
            if (entityClass === CrewCashDiscrepancyEntity) return Promise.resolve(mockDiscrepancy);
            if (entityClass === AccountEntity) {
              if (opts?.where?.code === '12901') return Promise.resolve(mockAcc12901);
            }
            if (entityClass === CrewCashSettlementEntity) return Promise.resolve(mockSettlement);
            return Promise.resolve(null);
          }),
          save: jest.fn((e) => Promise.resolve(e)),
        };
        return cb(mockManager);
      });

      const result = await service.resolveDiscrepancy(
        'disc-02',
        {
          decision: DiscrepancyResolutionDecision.CHARGE_TO_CREW,
          resolutionNotes: 'Terbukti kelalaian kru, selisih dibebankan ke piutang kru.',
        },
        'finance-manager-id',
      );

      expect(result).toBeDefined();
      expect(result.resolutionStatus).toBe(DiscrepancyResolutionStatus.RESOLVED);
      expect(result.resolutionDecision).toBe(DiscrepancyResolutionDecision.CHARGE_TO_CREW);
      expect(result.resolutionAccountId).toBe('acc-12901-id');
      expect(mockSettlement.status).toBe(CrewCashSettlementStatus.VERIFIED);
      expect(mockSettlement.ujStatus).toBe(SettlementUjStatus.BALANCED);
      expect(mockSpj.financialStatus).toBe(SpjFinancialStatus.SETTLED);

      expect(accountingPostingService.postJournal).toHaveBeenCalled();
      const journalCall = accountingPostingService.postJournal.mock.calls[0][0];
      expect(journalCall.lines.some((l: any) => l.accountId === 'acc-12901-id' && l.debit === 300000)).toBe(true);
    });
  });
});
