import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ApService } from './ap.service';
import {
  ApInvoiceEntity,
  ApInvoiceLineEntity,
  ApPaymentEntity,
  ApAllocationEntity,
  AccountEntity,
  BankAccountEntity,
  CashAccountEntity,
  RestaurantEntity,
  SpjEntity,
  SpjLegEntity,
  ApVendorType,
  ApInvoiceStatus,
} from '../../@models';
import { DocumentSequenceService } from './document-sequence.service';
import { AccountingPostingService } from './accounting-posting.service';
import { JournalReversalService } from './journal-reversal.service';

describe('ApService', () => {
  let service: ApService;
  let invoiceRepo: any;
  let lineRepo: any;
  let paymentRepo: any;
  let allocationRepo: any;
  let accountRepo: any;
  let bankAccountRepo: any;
  let cashAccountRepo: any;
  let restaurantRepo: any;
  let spjRepo: any;
  let spjLegRepo: any;
  let documentSequenceService: any;
  let accountingPostingService: any;
  let journalReversalService: any;
  let dataSource: any;

  beforeEach(async () => {
    invoiceRepo = {
      findOne: jest.fn(),
      save: jest.fn((e) => Promise.resolve(e)),
      createQueryBuilder: jest.fn(),
    };
    lineRepo = {
      createQueryBuilder: jest.fn(),
      find: jest.fn(),
      save: jest.fn((e) => Promise.resolve(e)),
    };
    paymentRepo = {
      findOne: jest.fn(),
      save: jest.fn((e) => Promise.resolve(e)),
      createQueryBuilder: jest.fn(),
    };
    allocationRepo = {
      save: jest.fn((e) => Promise.resolve(e)),
    };
    accountRepo = {
      findOne: jest.fn(),
    };
    bankAccountRepo = {
      findOne: jest.fn(),
    };
    cashAccountRepo = {
      findOne: jest.fn(),
    };
    restaurantRepo = {
      findOne: jest.fn(),
    };
    spjRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
    spjLegRepo = {
      findOne: jest.fn(),
    };
    documentSequenceService = {
      getNextDocumentNumber: jest.fn().mockResolvedValue('BILL/2610/0001'),
    };
    accountingPostingService = {
      postJournal: jest.fn().mockResolvedValue({ id: 'mock-journal-uuid' }),
    };
    journalReversalService = {
      reverseJournal: jest.fn(),
    };
    dataSource = {
      transaction: jest.fn(async (cb) => {
        const mockManager = {
          create: jest.fn((entity, data) => ({ id: 'new-id', ...data })),
          save: jest.fn((entity, data) => Promise.resolve(data)),
          findOne: jest.fn(),
        };
        return cb(mockManager);
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApService,
        { provide: getRepositoryToken(ApInvoiceEntity), useValue: invoiceRepo },
        { provide: getRepositoryToken(ApInvoiceLineEntity), useValue: lineRepo },
        { provide: getRepositoryToken(ApPaymentEntity), useValue: paymentRepo },
        { provide: getRepositoryToken(ApAllocationEntity), useValue: allocationRepo },
        { provide: getRepositoryToken(AccountEntity), useValue: accountRepo },
        { provide: getRepositoryToken(BankAccountEntity), useValue: bankAccountRepo },
        { provide: getRepositoryToken(CashAccountEntity), useValue: cashAccountRepo },
        { provide: getRepositoryToken(RestaurantEntity), useValue: restaurantRepo },
        { provide: getRepositoryToken(SpjEntity), useValue: spjRepo },
        { provide: getRepositoryToken(SpjLegEntity), useValue: spjLegRepo },
        { provide: DocumentSequenceService, useValue: documentSequenceService },
        { provide: AccountingPostingService, useValue: accountingPostingService },
        { provide: JournalReversalService, useValue: journalReversalService },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get<ApService>(ApService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createRestaurantBill', () => {
    it('should prevent double billing if SPJ was already billed for the restaurant', async () => {
      restaurantRepo.findOne.mockResolvedValue({
        id: 'rm-1',
        name: 'RM Taman Selera',
        ratePerPax: 25000,
      });
      accountRepo.findOne.mockImplementation(({ where }: any) => {
        if (where.code === '21101') return Promise.resolve({ id: 'acc-21101', code: '21101' });
        if (where.code === '51102') return Promise.resolve({ id: 'acc-51102', code: '51102' });
        return Promise.resolve(null);
      });

      const mockQb = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([{ id: 'existing-line' }]),
      };
      lineRepo.createQueryBuilder.mockReturnValue(mockQb);

      await expect(
        service.createRestaurantBill({
          restaurantId: 'rm-1',
          vendorInvoiceNo: 'INV-001',
          invoiceDate: '2026-10-22',
          dueDate: '2026-10-29',
          spjItems: [{ tripId: 'trip-1', couponCount: 22 }],
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should create bill lines and subtotal correctly according to coupon count and rate', async () => {
      restaurantRepo.findOne.mockResolvedValue({
        id: 'rm-1',
        name: 'RM Taman Selera',
        ratePerPax: 25000,
        companyId: 'comp-1',
      });
      accountRepo.findOne.mockImplementation(({ where }: any) => {
        if (where.code === '21101') return Promise.resolve({ id: 'acc-21101', code: '21101' });
        if (where.code === '51102') return Promise.resolve({ id: 'acc-51102', code: '51102' });
        return Promise.resolve(null);
      });

      const mockQb = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      lineRepo.createQueryBuilder.mockReturnValue(mockQb);

      spjRepo.find.mockResolvedValue([
        {
          id: 'trip-1',
          spjNo: 'SPJ/AKP/2610/0001',
          legs: [{ id: 'leg-1', passengerCount: 24, mealPaxCount: 22 }],
        },
        {
          id: 'trip-2',
          spjNo: 'SPJ/AKP/2610/0002',
          legs: [{ id: 'leg-2', passengerCount: 24, mealPaxCount: 20 }],
        },
      ]);

      const result = await service.createRestaurantBill({
        restaurantId: 'rm-1',
        vendorInvoiceNo: 'INV-RMTS-2026/10/012',
        invoiceDate: '2026-10-22',
        dueDate: '2026-10-29',
        spjItems: [
          { tripId: 'trip-1', couponCount: 22 },
          { tripId: 'trip-2', couponCount: 20 },
        ],
      });

      expect(result).toBeDefined();
      expect(result.subtotal).toBe(1050000); // 22*25000 (550k) + 20*25000 (500k)
      expect(result.totalAmount).toBe(1050000);
      expect(result.status).toBe(ApInvoiceStatus.DRAFT);
      expect(result.lines?.length).toBe(2);
    });
  });

  describe('approveApInvoice', () => {
    it('should post journal with Debit 51102 and Credit 21101 upon approval', async () => {
      invoiceRepo.findOne.mockResolvedValue({
        id: 'inv-1',
        billNo: 'BILL/2610/0001',
        vendorName: 'RM Taman Selera',
        vendorInvoiceNo: 'INV-001',
        invoiceDate: new Date('2026-10-22'),
        status: ApInvoiceStatus.DRAFT,
        apAccountId: 'acc-21101',
        totalAmount: 1050000,
        lines: [
          {
            id: 'line-1',
            accountId: 'acc-51102',
            amount: 550000,
            description: 'Servis Makan RM - SS-01',
          },
          {
            id: 'line-2',
            accountId: 'acc-51102',
            amount: 500000,
            description: 'Servis Makan RM - SS-02',
          },
        ],
      });

      const approved = await service.approveApInvoice('inv-1', 'user-1');
      expect(approved.status).toBe(ApInvoiceStatus.APPROVED);
      expect(accountingPostingService.postJournal).toHaveBeenCalled();
      const callArgs = accountingPostingService.postJournal.mock.calls[0][0];
      expect(callArgs.lines.length).toBe(3); // 2 debits + 1 credit
      expect(callArgs.lines[2].credit).toBe(1050000);
    });
  });
});
