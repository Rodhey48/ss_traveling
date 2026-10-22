import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ArService } from './ar.service';
import {
  ArInvoiceEntity,
  ArInvoiceLineEntity,
  ArReceiptEntity,
  ArAllocationEntity,
  AccountEntity,
  BankAccountEntity,
  CashAccountEntity,
  CustomerEntity,
  SpjEntity,
  ArInvoiceStatus,
  FinancePaymentMethod,
} from '../../@models';
import { DocumentSequenceService } from './document-sequence.service';
import { AccountingPostingService } from './accounting-posting.service';
import { JournalReversalService } from './journal-reversal.service';

describe('ArService', () => {
  let service: ArService;
  let invoiceRepo: any;
  let lineRepo: any;
  let receiptRepo: any;
  let allocationRepo: any;
  let accountRepo: any;
  let bankAccountRepo: any;
  let cashAccountRepo: any;
  let customerRepo: any;
  let spjRepo: any;
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
      save: jest.fn((e) => Promise.resolve(e)),
    };
    receiptRepo = {
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
    customerRepo = {
      findOne: jest.fn(),
    };
    spjRepo = {
      findOne: jest.fn(),
    };
    documentSequenceService = {
      getNextDocumentNumber: jest.fn().mockResolvedValue('RCT/AR/2610/0001'),
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
        ArService,
        { provide: getRepositoryToken(ArInvoiceEntity), useValue: invoiceRepo },
        { provide: getRepositoryToken(ArInvoiceLineEntity), useValue: lineRepo },
        { provide: getRepositoryToken(ArReceiptEntity), useValue: receiptRepo },
        { provide: getRepositoryToken(ArAllocationEntity), useValue: allocationRepo },
        { provide: getRepositoryToken(AccountEntity), useValue: accountRepo },
        { provide: getRepositoryToken(BankAccountEntity), useValue: bankAccountRepo },
        { provide: getRepositoryToken(CashAccountEntity), useValue: cashAccountRepo },
        { provide: getRepositoryToken(CustomerEntity), useValue: customerRepo },
        { provide: getRepositoryToken(SpjEntity), useValue: spjRepo },
        { provide: DocumentSequenceService, useValue: documentSequenceService },
        { provide: AccountingPostingService, useValue: accountingPostingService },
        { provide: JournalReversalService, useValue: journalReversalService },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get<ArService>(ArService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createDownPaymentReceipt (Skenario 2 DP 30%)', () => {
    it('should create DP receipt and post journal with Debit 11104 Bank and Credit 24101 DP Sewa Wisata', async () => {
      accountRepo.findOne.mockResolvedValue({ id: 'acc-24101', code: '24101' });
      bankAccountRepo.findOne.mockResolvedValue({
        id: 'bank-1',
        accountId: 'acc-11104',
        bankName: 'BCA',
        accountNumberMasked: '**** 1234',
      });

      const result = await service.createDownPaymentReceipt({
        customerName: 'PT Mitra Sejahtera Abadi',
        receiptDate: '2026-10-15',
        paymentMethod: FinancePaymentMethod.BANK_TRANSFER,
        bankAccountId: 'bank-1',
        amount: 5250000,
        downPaymentTripId: 'trip-spj-002',
        reference: 'TRF-BCA-DP-001',
      });

      expect(result).toBeDefined();
      expect(result.isDownPayment).toBe(true);
      expect(accountingPostingService.postJournal).toHaveBeenCalled();
      const journalArgs = accountingPostingService.postJournal.mock.calls[0][0];
      expect(journalArgs.lines.length).toBe(2);
      expect(journalArgs.lines[0].debit).toBe(5250000);
      expect(journalArgs.lines[1].credit).toBe(5250000);
    });
  });

  describe('createCharterPelunasanInvoice (Skenario 2 Pelunasan 70%)', () => {
    it('should create pelunasan invoice with 12101 Piutang Sewa Charter Bus Wisata', async () => {
      spjRepo.findOne.mockResolvedValue({
        id: 'trip-spj-002',
        spjNo: 'SPJ/WIS/2610/0001',
        vehicleId: 'bus-ss-02',
        companyId: 'comp-1',
      });
      accountRepo.findOne.mockResolvedValue({ id: 'acc-12101', code: '12101' });
      documentSequenceService.getNextDocumentNumber.mockResolvedValue('INV/WIS/2610/0001');

      const invoice = await service.createCharterPelunasanInvoice({
        tripId: 'trip-spj-002',
        customerName: 'PT Mitra Sejahtera Abadi',
        invoiceDate: '2026-10-21',
        dueDate: '2026-10-24',
        remainingAmount: 12250000,
      });

      expect(invoice).toBeDefined();
      expect(invoice.totalAmount).toBe(12250000);
      expect(invoice.status).toBe(ArInvoiceStatus.APPROVED);
      expect(invoice.lines?.length).toBe(1);
      expect(invoice.lines?.[0].amount).toBe(12250000);
    });
  });
});
