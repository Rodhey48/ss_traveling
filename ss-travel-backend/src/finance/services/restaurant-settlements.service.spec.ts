import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RestaurantSettlementsService } from './restaurant-settlements.service';
import {
  SpjEntity,
  SpjLegEntity,
  AccountEntity,
  CashAccountEntity,
  RestaurantEntity,
} from '../../@models';
import {
  SpjMealRecordEntity,
  SpjMealRecordStatus,
} from '../../@models/trips/spj-meal-record.entity';
import { RestaurantSettlementBatchEntity } from '../../@models/finance/restaurant-settlement-batch.entity';
import { AccountingPostingService } from './accounting-posting.service';
import { JournalReversalService } from './journal-reversal.service';

describe('RestaurantSettlementsService', () => {
  let service: RestaurantSettlementsService;
  let spjRepo: any;
  let legRepo: any;
  let restRepo: any;
  let mealRepo: any;
  let batchRepo: any;
  let accountRepo: any;
  let cashAccountRepo: any;
  let accountingPostingService: any;
  let journalReversalService: any;

  beforeEach(async () => {
    spjRepo = {
      findOne: jest.fn(),
    };
    legRepo = {
      findOne: jest.fn(),
      save: jest.fn().mockImplementation((e) => Promise.resolve(e)),
    };
    restRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
    };
    mealRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn().mockImplementation((dto) => ({ id: 'meal-1', ...dto })),
      save: jest.fn().mockImplementation((e) => Promise.resolve(e)),
      remove: jest.fn().mockResolvedValue({}),
      createQueryBuilder: jest.fn(),
    };
    batchRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn().mockImplementation((dto) => ({ id: 'batch-1', ...dto })),
      save: jest.fn().mockImplementation((e) => Promise.resolve(e)),
    };
    accountRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
    };
    cashAccountRepo = {
      findOne: jest.fn(),
    };
    accountingPostingService = {
      postJournal: jest.fn().mockResolvedValue({ id: 'jv-1', journalNo: 'JV-MEAL-001' }),
    };
    journalReversalService = {
      reverseJournal: jest.fn().mockResolvedValue({ id: 'jv-rev-1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RestaurantSettlementsService,
        { provide: getRepositoryToken(SpjEntity), useValue: spjRepo },
        { provide: getRepositoryToken(SpjLegEntity), useValue: legRepo },
        { provide: getRepositoryToken(RestaurantEntity), useValue: restRepo },
        { provide: getRepositoryToken(SpjMealRecordEntity), useValue: mealRepo },
        { provide: getRepositoryToken(RestaurantSettlementBatchEntity), useValue: batchRepo },
        { provide: getRepositoryToken(AccountEntity), useValue: accountRepo },
        { provide: getRepositoryToken(CashAccountEntity), useValue: cashAccountRepo },
        { provide: AccountingPostingService, useValue: accountingPostingService },
        { provide: JournalReversalService, useValue: journalReversalService },
      ],
    }).compile();

    service = module.get<RestaurantSettlementsService>(RestaurantSettlementsService);
  });

  describe('recordSpjMeal', () => {
    it('harus mencatat kupon makan riil pada leg SPJ dan memposting akrual (51102 vs 21101)', async () => {
      spjRepo.findOne.mockResolvedValue({
        id: 'spj-1',
        spjNo: 'SPJ-001',
        companyId: 'comp-1',
        legs: [{ id: 'leg-1', passengerCount: 25 }],
      });

      restRepo.findOne.mockResolvedValue({
        id: 'rm-1',
        name: 'RM Taman Selera Subang',
        ratePerPax: 25000,
      });

      legRepo.findOne.mockResolvedValue({ id: 'leg-1', passengerCount: 25 });
      mealRepo.findOne.mockResolvedValue(null);

      accountRepo.find.mockResolvedValue([
        { id: 'acc-51102', code: '51102', name: 'Beban Servis Makan' },
        { id: 'acc-21101', code: '21101', name: 'Utang Restoran Mitra' },
      ]);

      const result = await service.recordSpjMeal(
        'spj-1',
        {
          restaurantId: 'rm-1',
          spjLegId: 'leg-1',
          actualPax: 22,
          discrepancyNotes: '3 orang puasa / tidur',
        },
        'user-1',
      );

      expect(mealRepo.create).toHaveBeenCalled();
      expect(accountingPostingService.postJournal).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('createBatchSettlement', () => {
    it('harus memproses pembayaran transfer bank gelondongan atas beberapa SPJ ke restoran', async () => {
      mealRepo.find.mockResolvedValue([
        { id: 'm-1', spjId: 'spj-1', totalAmount: 550000, actualPax: 22, status: SpjMealRecordStatus.UNPAID },
        { id: 'm-2', spjId: 'spj-2', totalAmount: 600000, actualPax: 24, status: SpjMealRecordStatus.UNPAID },
      ]);

      restRepo.findOne.mockResolvedValue({
        id: 'rm-1',
        name: 'RM Raos Eco Gringsing',
      });

      cashAccountRepo.findOne.mockResolvedValue({
        id: 'bank-bca',
        name: 'Bank BCA Operasional',
        accountId: 'gl-bank-bca',
      });

      accountRepo.findOne.mockResolvedValue({
        id: 'gl-21101',
        code: '21101',
        name: 'Utang Restoran',
      });

      batchRepo.findOne.mockResolvedValue({
        id: 'batch-1',
        batchNo: 'BATCH-RM-202611-0001',
        restaurantName: 'RM Raos Eco Gringsing',
        totalSpjs: 2,
        totalCoupons: 46,
        totalAmount: 1150000,
        paymentDate: '2026-11-07',
        items: [],
      });

      const result = await service.createBatchSettlement(
        {
          restaurantId: 'rm-1',
          spjMealRecordIds: ['m-1', 'm-2'],
          paymentDate: '2026-11-07',
          bankAccountId: 'bank-bca',
          referenceNumber: 'TRF-BCA-RM-91',
        },
        'user-1',
      );

      expect(accountingPostingService.postJournal).toHaveBeenCalled();
      expect(batchRepo.create).toHaveBeenCalled();
      expect(batchRepo.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('getBatchDetail', () => {
    it('harus mengembalikan teks WhatsApp remitan rincian kupon makan ke restoran', async () => {
      batchRepo.findOne.mockResolvedValue({
        id: 'batch-1',
        batchNo: 'BATCH-RM-202611-0001',
        restaurantName: 'RM Raos Eco Gringsing',
        paymentDate: '2026-11-07',
        totalSpjs: 1,
        totalCoupons: 22,
        totalAmount: 550000,
        bankAccount: { name: 'Bank BCA Operasional' },
        items: [
          {
            spj: { spjNo: 'SPJ-001', vehicle: { plateNumber: 'B 7701 SS' } },
            spjLeg: { origin: 'Ciputat', destination: 'Yogyakarta' },
            actualPax: 22,
            ratePerPax: 25000,
            totalAmount: 550000,
          },
        ],
      });

      const result = await service.getBatchDetail('batch-1');
      expect(result.whatsappRemittanceText).toContain('REKAPITULASI PEMBAYARAN KUPON SERVIS MAKAN PENUMPANG');
      expect(result.whatsappRemittanceText).toContain('RM Raos Eco Gringsing');
      expect(result.whatsappRemittanceText).toContain('Rp 550.000');
    });
  });

  describe('deleteSpjMealRecord', () => {
    it('harus membatalkan jurnal akrual dan menghapus kupon makan', async () => {
      mealRepo.findOne.mockResolvedValue({
        id: 'm-1',
        status: SpjMealRecordStatus.UNPAID,
        journalId: 'jv-1',
        spj: { spjNo: 'SPJ-001' },
      });

      const result = await service.deleteSpjMealRecord('m-1', 'user-1');
      expect(journalReversalService.reverseJournal).toHaveBeenCalled();
      expect(mealRepo.remove).toHaveBeenCalled();
      expect(result).toBe(true);
    });
  });
});
