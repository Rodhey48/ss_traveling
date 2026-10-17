import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { AccountingPostingService } from './accounting-posting.service';
import { FiscalPeriodsService } from './fiscal-periods.service';
import { DocumentSequenceService } from './document-sequence.service';
import {
  JournalEntryEntity,
  JournalStatus,
  JournalSourceType,
} from '../../@models/finance/journal-entry.entity';
import { JournalLineEntity } from '../../@models/finance/journal-line.entity';
import { AccountingEventEntity } from '../../@models/finance/accounting-event.entity';
import { AccountEntity, AccountType, NormalBalance } from '../../@models/finance/account.entity';
import { FiscalPeriodEntity, FiscalPeriodStatus } from '../../@models/finance/fiscal-period.entity';
import { CreateManualJournalDto } from '../../@dto/finance/journal.dto';

describe('AccountingPostingService', () => {
  let service: AccountingPostingService;
  let journalRepo: any;
  let lineRepo: any;
  let eventRepo: any;
  let accountRepo: any;
  let fiscalPeriodsService: any;
  let documentSequenceService: any;
  let dataSource: any;

  const mockOpenPeriod: FiscalPeriodEntity = {
    id: 'period-uuid-1',
    fiscalYearId: 'year-uuid-1',
    periodNo: 10,
    name: 'Oktober 2026',
    startDate: '2026-10-01',
    endDate: '2026-10-31',
    status: FiscalPeriodStatus.OPEN,
    isActive: true,
  } as any;

  const mockAccountCash: AccountEntity = {
    id: 'acc-cash-1',
    code: '11101',
    name: 'Kas Operasional Pool',
    type: AccountType.ASSET,
    normalBalance: NormalBalance.DEBIT,
    isPostable: true,
    isActive: true,
  } as any;

  const mockAccountExpense: AccountEntity = {
    id: 'acc-exp-1',
    code: '52101',
    name: 'Beban Tol Perjalanan',
    type: AccountType.EXPENSE,
    normalBalance: NormalBalance.DEBIT,
    isPostable: true,
    isActive: true,
  } as any;

  const mockAccountHeader: AccountEntity = {
    id: 'acc-head-1',
    code: '52000',
    name: 'Beban Fasilitas Perjalanan (Header)',
    type: AccountType.EXPENSE,
    normalBalance: NormalBalance.DEBIT,
    isPostable: false,
    isActive: true,
  } as any;

  const mockAccountInactive: AccountEntity = {
    id: 'acc-inact-1',
    code: '99999',
    name: 'Akun Nonaktif',
    type: AccountType.EXPENSE,
    normalBalance: NormalBalance.DEBIT,
    isPostable: true,
    isActive: false,
  } as any;

  beforeEach(async () => {
    journalRepo = {
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
    lineRepo = {};
    eventRepo = {};
    accountRepo = {};

    fiscalPeriodsService = {
      findOpenPeriodForDate: jest.fn().mockResolvedValue(mockOpenPeriod),
    };

    documentSequenceService = {
      getNextDocumentNumber: jest.fn().mockResolvedValue('JV/2610/0001'),
    };

    dataSource = {
      transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountingPostingService,
        {
          provide: getRepositoryToken(JournalEntryEntity),
          useValue: journalRepo,
        },
        {
          provide: getRepositoryToken(JournalLineEntity),
          useValue: lineRepo,
        },
        {
          provide: getRepositoryToken(AccountingEventEntity),
          useValue: eventRepo,
        },
        {
          provide: getRepositoryToken(AccountEntity),
          useValue: accountRepo,
        },
        {
          provide: FiscalPeriodsService,
          useValue: fiscalPeriodsService,
        },
        {
          provide: DocumentSequenceService,
          useValue: documentSequenceService,
        },
        {
          provide: DataSource,
          useValue: dataSource,
        },
      ],
    }).compile();

    service = module.get<AccountingPostingService>(AccountingPostingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('postJournal', () => {
    it('should successfully post a balanced manual journal', async () => {
      const dto: CreateManualJournalDto = {
        journalDate: '2026-10-18',
        description: 'Biaya tol operasional',
        sourceType: JournalSourceType.MANUAL,
        lines: [
          {
            accountId: 'acc-exp-1',
            debit: '500000.00',
            credit: '0.00',
            description: 'Beban Tol',
          },
          {
            accountId: 'acc-cash-1',
            debit: '0.00',
            credit: '500000.00',
            description: 'Kas Keluar',
          },
        ],
      };

      const mockManager = {
        findOne: jest.fn().mockResolvedValue(null), // no idempotency event
        findBy: jest.fn().mockResolvedValue([mockAccountExpense, mockAccountCash]),
        create: jest.fn().mockImplementation((entityClass, data) => ({
          id: 'generated-uuid-1',
          ...data,
        })),
        save: jest.fn().mockImplementation(async (entityClass, data) => data),
        findOneOrFail: jest.fn().mockResolvedValue({
          id: 'generated-uuid-1',
          journalNo: 'JV/2610/0001',
          journalDate: '2026-10-18',
          status: JournalStatus.POSTED,
          totalDebit: '500000.00',
          totalCredit: '500000.00',
          lines: [
            { lineNo: 1, accountId: 'acc-exp-1', debit: '500000.00', credit: '0.00' },
            { lineNo: 2, accountId: 'acc-cash-1', debit: '0.00', credit: '500000.00' },
          ],
        }),
      };

      dataSource.transaction.mockImplementation(async (cb: any) => cb(mockManager));

      const result = await service.postJournal(dto, 'user-actor-1');

      expect(fiscalPeriodsService.findOpenPeriodForDate).toHaveBeenCalledWith('2026-10-18');
      expect(documentSequenceService.getNextDocumentNumber).toHaveBeenCalled();
      expect(result.journalNo).toBe('JV/2610/0001');
      expect(result.status).toBe(JournalStatus.POSTED);
      expect(result.totalDebit).toBe('500000.00');
    });

    it('should throw ConflictException if idempotency key already exists', async () => {
      const dto: CreateManualJournalDto = {
        journalDate: '2026-10-18',
        description: 'Jurnal duplikat',
        idempotencyKey: 'IDEM_KEY_123',
        lines: [
          { accountId: 'acc-exp-1', debit: '100000', credit: '0' },
          { accountId: 'acc-cash-1', debit: '0', credit: '100000' },
        ],
      };

      const mockManager = {
        findOne: jest.fn().mockResolvedValue({ id: 'event-uuid-1', idempotencyKey: 'IDEM_KEY_123' }),
      };

      dataSource.transaction.mockImplementation(async (cb: any) => cb(mockManager));

      await expect(service.postJournal(dto)).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException if fewer than 2 lines provided', async () => {
      const dto: CreateManualJournalDto = {
        journalDate: '2026-10-18',
        description: 'Jurnal 1 baris',
        lines: [{ accountId: 'acc-exp-1', debit: '100000', credit: '0' }],
      };

      const mockManager = {
        findOne: jest.fn().mockResolvedValue(null),
      };

      dataSource.transaction.mockImplementation(async (cb: any) => cb(mockManager));

      await expect(service.postJournal(dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if debit or credit is negative', async () => {
      const dto: CreateManualJournalDto = {
        journalDate: '2026-10-18',
        description: 'Jurnal negatif',
        lines: [
          { accountId: 'acc-exp-1', debit: '-100000', credit: '0' },
          { accountId: 'acc-cash-1', debit: '0', credit: '100000' },
        ],
      };

      const mockManager = {
        findOne: jest.fn().mockResolvedValue(null),
      };

      dataSource.transaction.mockImplementation(async (cb: any) => cb(mockManager));

      await expect(service.postJournal(dto)).rejects.toThrow(
        /Nilai debit atau kredit tidak boleh bernilai negatif/,
      );
    });

    it('should throw BadRequestException if same line has both debit and credit > 0', async () => {
      const dto: CreateManualJournalDto = {
        journalDate: '2026-10-18',
        description: 'Debit dan kredit sekaligus',
        lines: [
          { accountId: 'acc-exp-1', debit: '100000', credit: '50000' },
          { accountId: 'acc-cash-1', debit: '0', credit: '50000' },
        ],
      };

      const mockManager = {
        findOne: jest.fn().mockResolvedValue(null),
      };

      dataSource.transaction.mockImplementation(async (cb: any) => cb(mockManager));

      await expect(service.postJournal(dto)).rejects.toThrow(
        /tidak boleh terisi nominal debit dan kredit sekaligus/,
      );
    });

    it('should throw BadRequestException if an account does not exist', async () => {
      const dto: CreateManualJournalDto = {
        journalDate: '2026-10-18',
        description: 'Akun gaib',
        lines: [
          { accountId: 'acc-exp-1', debit: '100000', credit: '0' },
          { accountId: 'non-existent-acc', debit: '0', credit: '100000' },
        ],
      };

      const mockManager = {
        findOne: jest.fn().mockResolvedValue(null),
        findBy: jest.fn().mockResolvedValue([mockAccountExpense]), // only 1 found
      };

      dataSource.transaction.mockImplementation(async (cb: any) => cb(mockManager));

      await expect(service.postJournal(dto)).rejects.toThrow(
        /Satu atau lebih akun COA pada baris jurnal tidak ditemukan/,
      );
    });

    it('should throw BadRequestException if an account is a non-postable header', async () => {
      const dto: CreateManualJournalDto = {
        journalDate: '2026-10-18',
        description: 'Posting ke header akun',
        lines: [
          { accountId: 'acc-head-1', debit: '100000', credit: '0' },
          { accountId: 'acc-cash-1', debit: '0', credit: '100000' },
        ],
      };

      const mockManager = {
        findOne: jest.fn().mockResolvedValue(null),
        findBy: jest.fn().mockResolvedValue([mockAccountHeader, mockAccountCash]),
      };

      dataSource.transaction.mockImplementation(async (cb: any) => cb(mockManager));

      await expect(service.postJournal(dto)).rejects.toThrow(
        /adalah akun induk\/header \(non-postable\)/,
      );
    });

    it('should throw BadRequestException if an account is inactive', async () => {
      const dto: CreateManualJournalDto = {
        journalDate: '2026-10-18',
        description: 'Posting ke akun nonaktif',
        lines: [
          { accountId: 'acc-inact-1', debit: '100000', credit: '0' },
          { accountId: 'acc-cash-1', debit: '0', credit: '100000' },
        ],
      };

      const mockManager = {
        findOne: jest.fn().mockResolvedValue(null),
        findBy: jest.fn().mockResolvedValue([mockAccountInactive, mockAccountCash]),
      };

      dataSource.transaction.mockImplementation(async (cb: any) => cb(mockManager));

      await expect(service.postJournal(dto)).rejects.toThrow(/tidak aktif. Jurnal ditolak/);
    });

    it('should throw BadRequestException if total debit does not equal total credit (unbalanced)', async () => {
      const dto: CreateManualJournalDto = {
        journalDate: '2026-10-18',
        description: 'Jurnal tidak seimbang',
        lines: [
          { accountId: 'acc-exp-1', debit: '1500000.00', credit: '0.00' },
          { accountId: 'acc-cash-1', debit: '0.00', credit: '1000000.00' }, // selisih 500rb
        ],
      };

      const mockManager = {
        findOne: jest.fn().mockResolvedValue(null),
        findBy: jest.fn().mockResolvedValue([mockAccountExpense, mockAccountCash]),
      };

      dataSource.transaction.mockImplementation(async (cb: any) => cb(mockManager));

      await expect(service.postJournal(dto)).rejects.toThrow(/Jurnal tidak seimbang!/);
    });

    it('should throw if fiscal period is closed', async () => {
      fiscalPeriodsService.findOpenPeriodForDate.mockRejectedValueOnce(
        new BadRequestException('Periode fiskal telah DITUTUP (CLOSED).'),
      );

      const dto: CreateManualJournalDto = {
        journalDate: '2025-01-15',
        description: 'Periode lampau',
        lines: [
          { accountId: 'acc-exp-1', debit: '100000', credit: '0' },
          { accountId: 'acc-cash-1', debit: '0', credit: '100000' },
        ],
      };

      const mockManager = {
        findOne: jest.fn().mockResolvedValue(null),
      };

      dataSource.transaction.mockImplementation(async (cb: any) => cb(mockManager));

      await expect(service.postJournal(dto)).rejects.toThrow(
        /Periode fiskal telah DITUTUP/,
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated journals', async () => {
      const mockQb = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([
          [
            {
              id: 'j-1',
              journalNo: 'JV/2610/0001',
              lines: [{ lineNo: 2 }, { lineNo: 1 }],
            },
          ],
          1,
        ],
      )};

      journalRepo.createQueryBuilder.mockReturnValue(mockQb);

      const result = await service.findAll({ page: 1, limit: 10 });
      expect(result.total).toBe(1);
      expect(result.journals.length).toBe(1);
      // verified lines are sorted
      expect(result.journals[0].lines[0].lineNo).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should return detailed journal by id', async () => {
      journalRepo.findOne.mockResolvedValue({
        id: 'j-1',
        journalNo: 'JV/2610/0001',
        lines: [{ lineNo: 1 }, { lineNo: 2 }],
      });

      const result = await service.findOne('j-1');
      expect(result.id).toBe('j-1');
      expect(result.journalNo).toBe('JV/2610/0001');
    });

    it('should throw NotFoundException if journal does not exist', async () => {
      journalRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });
  });
});
