import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CoordinationFeesService } from './coordination-fees.service';
import {
  SpjEntity,
  SpjLegEntity,
  AccountEntity,
  CashAccountEntity,
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

describe('CoordinationFeesService', () => {
  let service: CoordinationFeesService;
  let spjRepo: any;
  let legRepo: any;
  let ruleRepo: any;
  let spjFeeRepo: any;
  let batchRepo: any;
  let accountRepo: any;
  let cashAccountRepo: any;
  let accountingPostingService: any;
  let sequenceService: any;
  let journalReversalService: any;

  beforeEach(async () => {
    spjRepo = {
      findOne: jest.fn(),
    };
    legRepo = {
      find: jest.fn(),
    };
    ruleRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
    };
    spjFeeRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn().mockImplementation((dto) => ({ id: 'fee-1', ...dto })),
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
      createQueryBuilder: jest.fn().mockReturnValue({
        delete: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({}),
      }),
      remove: jest.fn().mockResolvedValue({}),
    };
    batchRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn().mockImplementation((dto) => ({ id: 'batch-1', ...dto })),
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
    };
    accountRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
    };
    cashAccountRepo = {
      findOne: jest.fn(),
    };
    accountingPostingService = {
      postJournal: jest.fn().mockResolvedValue({ id: 'jv-1', journalNo: 'JV-202611-0001' }),
    };
    sequenceService = {
      nextNumber: jest.fn().mockResolvedValue('BATCH-KOR-202611-0001'),
    };
    journalReversalService = {
      reverseJournal: jest.fn().mockResolvedValue({ id: 'jv-rev-1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoordinationFeesService,
        { provide: getRepositoryToken(SpjEntity), useValue: spjRepo },
        { provide: getRepositoryToken(SpjLegEntity), useValue: legRepo },
        { provide: getRepositoryToken(CoordinatorFeeRuleEntity), useValue: ruleRepo },
        { provide: getRepositoryToken(SpjCoordinationFeeEntity), useValue: spjFeeRepo },
        { provide: getRepositoryToken(CoordinationFeeBatchEntity), useValue: batchRepo },
        { provide: getRepositoryToken(AccountEntity), useValue: accountRepo },
        { provide: getRepositoryToken(CashAccountEntity), useValue: cashAccountRepo },
        { provide: AccountingPostingService, useValue: accountingPostingService },
        { provide: DocumentSequenceService, useValue: sequenceService },
        { provide: JournalReversalService, useValue: journalReversalService },
      ],
    }).compile();

    service = module.get<CoordinationFeesService>(CoordinationFeesService);
  });

  describe('syncSpjCoordinationFees', () => {
    it('harus menghitung uang koordinasi berdasarkan tiket per leg dan memposting jurnal akrual (52105 vs 22102)', async () => {
      spjRepo.findOne.mockResolvedValue({
        id: 'spj-1',
        spjNo: 'SPJ-202611-001',
        companyId: 'comp-1',
        legs: [
          {
            id: 'leg-1',
            origin: 'JAKARTA',
            destination: 'YOGYAKARTA',
            passengerCount: 20,
          },
        ],
        revenueDeclarations: [
          { spjLegId: 'leg-1', ticketCount: 20 },
        ],
      });

      ruleRepo.find.mockResolvedValue([
        { origin: 'JAKARTA', destination: 'YOGYAKARTA', feePerPax: 10000, isActive: true },
      ]);

      accountRepo.find.mockResolvedValue([
        { id: 'acc-exp', code: '52105', name: 'Beban Koordinasi' },
        { id: 'acc-pay', code: '22102', name: 'Utang Koordinasi' },
      ]);

      spjFeeRepo.findOne.mockResolvedValue(null);
      spjFeeRepo.find.mockResolvedValue([
        {
          id: 'fee-1',
          spjId: 'spj-1',
          origin: 'JAKARTA',
          destination: 'YOGYAKARTA',
          ticketCount: 20,
          feePerPax: 10000,
          totalFee: 200000,
          status: SpjCoordinationFeeStatus.UNPAID,
        },
      ]);

      const result = await service.syncSpjCoordinationFees('spj-1', 'user-1');

      expect(spjFeeRepo.create).toHaveBeenCalled();
      expect(accountingPostingService.postJournal).toHaveBeenCalled();
      expect(result.length).toBe(1);
      expect(result[0].totalFee).toBe(200000);
    });
  });

  describe('createBatchSettlement', () => {
    it('harus memproses pembayaran transfer bank gelondongan atas beberapa SPJ', async () => {
      spjFeeRepo.find.mockResolvedValue([
        {
          id: 'fee-1',
          spjId: 'spj-1',
          totalFee: 200000,
          ticketCount: 20,
          status: SpjCoordinationFeeStatus.UNPAID,
        },
        {
          id: 'fee-2',
          spjId: 'spj-2',
          totalFee: 150000,
          ticketCount: 15,
          status: SpjCoordinationFeeStatus.UNPAID,
        },
      ]);

      cashAccountRepo.findOne.mockResolvedValue({
        id: 'bank-bca',
        name: 'Bank BCA Operasional',
        accountId: 'gl-bank-bca',
      });

      accountRepo.findOne.mockResolvedValue({
        id: 'gl-payable',
        code: '22102',
        name: 'Utang Koordinasi',
      });

      batchRepo.findOne.mockResolvedValue({
        id: 'batch-1',
        batchNo: 'BATCH-KOR-202611-0001',
        origin: 'JAKARTA',
        destination: 'YOGYAKARTA',
        totalSpjs: 2,
        totalTickets: 35,
        totalAmount: 350000,
        paymentDate: '2026-11-07',
        status: CoordinationFeeBatchStatus.COMPLETED,
        items: [],
      });

      const result = await service.createBatchSettlement(
        {
          origin: 'JAKARTA',
          destination: 'YOGYAKARTA',
          spjCoordinationFeeIds: ['fee-1', 'fee-2'],
          paymentDate: '2026-11-07',
          bankAccountId: 'bank-bca',
          referenceNumber: 'TRF-BCA-991',
        } as any,
        'user-1',
      );

      expect(accountingPostingService.postJournal).toHaveBeenCalled();
      expect(batchRepo.create).toHaveBeenCalled();
      expect(batchRepo.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('getBatchDetail', () => {
    it('harus mengembalikan rincian batch dengan teks format WhatsApp yang siap kirim', async () => {
      batchRepo.findOne.mockResolvedValue({
        id: 'batch-1',
        batchNo: 'BATCH-KOR-202611-0001',
        origin: 'JAKARTA',
        destination: 'YOGYAKARTA',
        coordinatorName: 'Pak Koordinator Barat',
        paymentDate: '2026-11-07',
        totalSpjs: 1,
        totalTickets: 20,
        totalAmount: 200000,
        bankAccount: { name: 'Bank BCA Operasional' },
        items: [
          {
            spj: { spjNo: 'SPJ-001', vehicle: { plateNumber: 'B 7701 SS' } },
            spjLeg: { origin: 'JAKARTA', destination: 'YOGYAKARTA' },
            ticketCount: 20,
            feePerPax: 10000,
            totalFee: 200000,
          },
        ],
      });

      const result = await service.getBatchDetail('batch-1');
      expect(result.whatsappRemittanceText).toContain('REKAPITULASI PEMBAYARAN UANG KOORDINASI LAPANGAN');
      expect(result.whatsappRemittanceText).toContain('SPJ-001 (B 7701 SS)');
      expect(result.whatsappRemittanceText).toContain('Rp 200.000');
    });
  });
});
