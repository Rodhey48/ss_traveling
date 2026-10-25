import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { PettyCashService } from './petty-cash.service';
import { CashTransactionEntity } from '../../@models/finance/cash-transaction.entity';
import { CashAccountEntity } from '../../@models/finance/cash-account.entity';
import { BankAccountEntity } from '../../@models/finance/bank-account.entity';
import { AccountEntity } from '../../@models/finance/account.entity';
import { JournalEntryEntity } from '../../@models/finance/journal-entry.entity';
import { DocumentSequenceService } from './document-sequence.service';
import { AccountingPostingService } from './accounting-posting.service';
import {
  CashTransactionType,
  CashTransactionStatus,
  PettyCashCategory,
} from '../../@models/finance/finance.enums';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('PettyCashService', () => {
  let service: PettyCashService;
  let transactionRepo: any;
  let cashAccountRepo: any;
  let bankAccountRepo: any;
  let accountRepo: any;
  let journalRepo: any;
  let docSeqService: any;
  let postingService: any;
  let dataSource: any;

  const mockCashAccount: Partial<CashAccountEntity> = {
    id: 'cash-petty-1',
    code: 'CASH-PETTY-GARASI',
    name: 'Kas Kecil (Petty Cash Garasi)',
    accountId: 'acc-11103',
    costCenterId: 'cc-pool-1',
    isActive: true,
  };

  const mockExpenseAccount: Partial<AccountEntity> = {
    id: 'acc-53105',
    code: '53105',
    name: 'Beban Uang Makan Standby Kru (Non-SPJ Garasi)',
    isPostable: true,
    isActive: true,
  };

  const mockBankAccount: Partial<BankAccountEntity> = {
    id: 'bank-bca-1',
    bankName: 'BCA',
    accountNumber: '8830192831',
    accountId: 'acc-11104',
    isActive: true,
  };

  beforeEach(async () => {
    transactionRepo = {
      create: jest.fn().mockImplementation((dto) => ({ id: 'trans-1', ...dto })),
      save: jest.fn().mockImplementation((entity) => Promise.resolve({ id: 'trans-1', ...entity })),
      findOne: jest.fn(),
      count: jest.fn().mockResolvedValue(2),
      createQueryBuilder: jest.fn().mockReturnValue({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      }),
    };

    cashAccountRepo = {
      findOne: jest.fn().mockResolvedValue(mockCashAccount),
    };

    bankAccountRepo = {
      findOne: jest.fn().mockResolvedValue(mockBankAccount),
    };

    accountRepo = {
      findOne: jest.fn().mockResolvedValue(mockExpenseAccount),
      createQueryBuilder: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockExpenseAccount]),
      }),
    };

    journalRepo = {
      findOne: jest.fn(),
    };

    docSeqService = {
      getNextDocumentNumber: jest.fn().mockImplementation((type, period, prefix) => `${prefix}/0001`),
    };

    postingService = {
      postJournal: jest.fn().mockResolvedValue({ id: 'journal-1', journalNo: 'JV/2610/0001' }),
    };

    dataSource = {
      query: jest.fn().mockResolvedValue([{ balance: '8500000.00', totalExpenses: '1500000.00' }]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PettyCashService,
        { provide: getRepositoryToken(CashTransactionEntity), useValue: transactionRepo },
        { provide: getRepositoryToken(CashAccountEntity), useValue: cashAccountRepo },
        { provide: getRepositoryToken(BankAccountEntity), useValue: bankAccountRepo },
        { provide: getRepositoryToken(AccountEntity), useValue: accountRepo },
        { provide: getRepositoryToken(JournalEntryEntity), useValue: journalRepo },
        { provide: DocumentSequenceService, useValue: docSeqService },
        { provide: AccountingPostingService, useValue: postingService },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get<PettyCashService>(PettyCashService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getSummary', () => {
    it('should calculate current balance and monthly expense', async () => {
      const summary = await service.getSummary('cash-petty-1');
      expect(summary).toBeDefined();
      expect(summary.cashAccount.code).toBe('CASH-PETTY-GARASI');
      expect(summary.currentBalance).toBe('8500000.00');
      expect(summary.thisMonthExpenses).toBe('1500000.00');
      expect(summary.pendingVerificationCount).toBe(2);
    });
  });

  describe('createDisbursement', () => {
    it('should create submitted disbursement with BKK document number', async () => {
      transactionRepo.findOne.mockResolvedValueOnce({
        id: 'trans-1',
        transactionNo: 'BKK-KAS/2610/0001',
        type: CashTransactionType.DISBURSEMENT,
        status: CashTransactionStatus.SUBMITTED,
      });

      const res = await service.createDisbursement(
        {
          cashAccountId: 'cash-petty-1',
          transactionDate: '2026-10-25',
          amount: '150000.00',
          recipient: 'Driver Hendra',
          expenseAccountId: 'acc-53105',
          category: PettyCashCategory.STANDBY_CREW,
          description: 'Uang makan standby driver',
        },
        'user-kasir-1',
      );

      expect(res).toBeDefined();
      expect(transactionRepo.create).toHaveBeenCalled();
      expect(docSeqService.getNextDocumentNumber).toHaveBeenCalledWith(
        'BKK_PETTY',
        expect.any(String),
        expect.stringContaining('BKK-KAS'),
        4,
      );
    });

    it('should throw NotFoundException if cash account is not found', async () => {
      cashAccountRepo.findOne.mockResolvedValueOnce(null);

      await expect(
        service.createDisbursement({
          cashAccountId: 'invalid',
          transactionDate: '2026-10-25',
          amount: '100000',
          recipient: 'Test',
          expenseAccountId: 'acc-53105',
          category: PettyCashCategory.OTHER,
          description: 'Test',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('createReplenishment', () => {
    it('should create verified replenishment from bank and post GL journal', async () => {
      transactionRepo.findOne.mockResolvedValueOnce({
        id: 'trans-rep-1',
        transactionNo: 'BKM-KAS/2610/0001',
        type: CashTransactionType.REPLENISHMENT,
        status: CashTransactionStatus.VERIFIED,
      });

      const res = await service.createReplenishment(
        {
          cashAccountId: 'cash-petty-1',
          transactionDate: '2026-10-25',
          amount: '5000000.00',
          sourceType: 'BANK',
          sourceBankAccountId: 'bank-bca-1',
          description: 'Pengisian kembali kas kecil garasi',
        },
        'user-acct-1',
      );

      expect(res).toBeDefined();
      expect(docSeqService.getNextDocumentNumber).toHaveBeenCalledWith(
        'BKM_PETTY',
        expect.any(String),
        expect.stringContaining('BKM-KAS'),
        4,
      );
      expect(postingService.postJournal).toHaveBeenCalled();
    });
  });

  describe('verifyTransaction', () => {
    it('should verify submitted transaction and post GL journal', async () => {
      const mockTrans = {
        id: 'trans-1',
        transactionNo: 'BKK-KAS/2610/0001',
        transactionDate: '2026-10-25',
        amount: '150000.00',
        description: 'Uang makan standby driver',
        status: CashTransactionStatus.SUBMITTED,
        cashAccount: mockCashAccount,
        expenseAccount: mockExpenseAccount,
      };

      transactionRepo.findOne
        .mockResolvedValueOnce(mockTrans) // for verifyTransaction
        .mockResolvedValueOnce({ ...mockTrans, status: CashTransactionStatus.VERIFIED }); // for getTransactionDetail

      const verified = await service.verifyTransaction(
        'trans-1',
        { notes: 'Sesuai daftar absen piket' },
        'user-acct-1',
      );

      expect(verified).toBeDefined();
      expect(postingService.postJournal).toHaveBeenCalled();
      expect(transactionRepo.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException if transaction is already verified', async () => {
      transactionRepo.findOne.mockResolvedValueOnce({
        id: 'trans-1',
        status: CashTransactionStatus.VERIFIED,
        cashAccount: mockCashAccount,
        expenseAccount: mockExpenseAccount,
      });

      await expect(
        service.verifyTransaction('trans-1', {}, 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('rejectTransaction', () => {
    it('should mark submitted transaction as REJECTED', async () => {
      const mockTrans = {
        id: 'trans-1',
        transactionNo: 'BKK-KAS/2610/0001',
        status: CashTransactionStatus.SUBMITTED,
      };

      transactionRepo.findOne
        .mockResolvedValueOnce(mockTrans)
        .mockResolvedValueOnce({ ...mockTrans, status: CashTransactionStatus.REJECTED });

      const rejected = await service.rejectTransaction(
        'trans-1',
        { reason: 'Nota bon tidak jelas' },
        'user-acct-1',
      );

      expect(rejected).toBeDefined();
      expect(transactionRepo.save).toHaveBeenCalled();
    });
  });
});
