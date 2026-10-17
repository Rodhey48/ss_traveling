import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { JournalReversalService } from './journal-reversal.service';
import { FiscalPeriodsService } from './fiscal-periods.service';
import { DocumentSequenceService } from './document-sequence.service';
import {
  JournalEntryEntity,
  JournalStatus,
  JournalSourceType,
} from '../../@models/finance/journal-entry.entity';
import { JournalLineEntity } from '../../@models/finance/journal-line.entity';
import { AccountingEventEntity } from '../../@models/finance/accounting-event.entity';
import { FiscalPeriodEntity, FiscalPeriodStatus } from '../../@models/finance/fiscal-period.entity';
import { ReverseJournalDto } from '../../@dto/finance/journal.dto';

describe('JournalReversalService', () => {
  let service: JournalReversalService;
  let journalRepo: any;
  let lineRepo: any;
  let eventRepo: any;
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

  beforeEach(async () => {
    journalRepo = {
      findOne: jest.fn(),
    };
    lineRepo = {};
    eventRepo = {};

    fiscalPeriodsService = {
      findOpenPeriodForDate: jest.fn().mockResolvedValue(mockOpenPeriod),
    };

    documentSequenceService = {
      getNextDocumentNumber: jest.fn().mockResolvedValue('JV/2610/0002'),
    };

    dataSource = {
      transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JournalReversalService,
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

    service = module.get<JournalReversalService>(JournalReversalService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('reverseJournal', () => {
    it('should successfully reverse a POSTED journal with inverted lines', async () => {
      const originalJournal: JournalEntryEntity = {
        id: 'orig-j-1',
        journalNo: 'JV/2610/0001',
        journalDate: '2026-10-18',
        sourceType: JournalSourceType.MANUAL,
        status: JournalStatus.POSTED,
        totalDebit: '500000.00',
        totalCredit: '500000.00',
        description: 'Biaya Tol Asli',
        lines: [
          {
            id: 'line-1',
            lineNo: 1,
            accountId: 'acc-exp-1',
            debit: '500000.00',
            credit: '0.00',
            description: 'Beban Tol',
          },
          {
            id: 'line-2',
            lineNo: 2,
            accountId: 'acc-cash-1',
            debit: '0.00',
            credit: '500000.00',
            description: 'Kas Pool',
          },
        ],
      } as any;

      const dto: ReverseJournalDto = {
        reason: 'Salah input akun beban',
        reversalDate: '2026-10-18',
      };

      const mockManager = {
        findOne: jest
          .fn()
          .mockResolvedValueOnce(originalJournal) // 1. find original
          .mockResolvedValueOnce(null), // 2. check if already reversed
        create: jest.fn().mockImplementation((entityClass, data) => ({
          id: 'reversal-uuid-1',
          ...data,
        })),
        save: jest.fn().mockImplementation(async (entityClass, data) => data),
        findOneOrFail: jest.fn().mockResolvedValue({
          id: 'reversal-uuid-1',
          journalNo: 'JV/2610/0002',
          journalDate: '2026-10-18',
          status: JournalStatus.POSTED,
          reversalOfId: 'orig-j-1',
          totalDebit: '500000.00',
          totalCredit: '500000.00',
          lines: [
            { lineNo: 1, accountId: 'acc-exp-1', debit: '0.00', credit: '500000.00' },
            { lineNo: 2, accountId: 'acc-cash-1', debit: '500000.00', credit: '0.00' },
          ],
        }),
      };

      dataSource.transaction.mockImplementation(async (cb: any) => cb(mockManager));

      const result = await service.reverseJournal('orig-j-1', dto, 'actor-1');

      expect(result.journalNo).toBe('JV/2610/0002');
      expect(result.reversalOfId).toBe('orig-j-1');
      expect(originalJournal.status).toBe(JournalStatus.REVERSED);
    });

    it('should throw NotFoundException if original journal is not found', async () => {
      const mockManager = {
        findOne: jest.fn().mockResolvedValue(null),
      };

      dataSource.transaction.mockImplementation(async (cb: any) => cb(mockManager));

      await expect(
        service.reverseJournal('non-existent-id', { reason: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if original journal is not in POSTED status', async () => {
      const nonPostedJournal = {
        id: 'orig-j-1',
        status: JournalStatus.REVERSED,
      };

      const mockManager = {
        findOne: jest.fn().mockResolvedValue(nonPostedJournal),
      };

      dataSource.transaction.mockImplementation(async (cb: any) => cb(mockManager));

      await expect(
        service.reverseJournal('orig-j-1', { reason: 'Test' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if trying to reverse an operational journal (SPJ/Invoice) directly without operational flag', async () => {
      const operationalJournal = {
        id: 'orig-j-spj',
        journalNo: 'JV/2610/0001',
        sourceType: JournalSourceType.SPJ,
        status: JournalStatus.POSTED,
      };

      const mockManager = {
        findOne: jest.fn().mockResolvedValue(operationalJournal),
      };

      dataSource.transaction.mockImplementation(async (cb: any) => cb(mockManager));

      await expect(
        service.reverseJournal('orig-j-spj', { reason: 'Test' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException if original journal was already reversed', async () => {
      const originalJournal = {
        id: 'orig-j-1',
        journalNo: 'JV/2610/0001',
        sourceType: JournalSourceType.MANUAL,
        status: JournalStatus.POSTED,
      };

      const existingReversal = {
        id: 'rev-j-2',
        journalNo: 'JV/2610/0002',
      };

      const mockManager = {
        findOne: jest
          .fn()
          .mockResolvedValueOnce(originalJournal)
          .mockResolvedValueOnce(existingReversal),
      };

      dataSource.transaction.mockImplementation(async (cb: any) => cb(mockManager));

      await expect(
        service.reverseJournal('orig-j-1', { reason: 'Test' }),
      ).rejects.toThrow(ConflictException);
    });
  });
});
