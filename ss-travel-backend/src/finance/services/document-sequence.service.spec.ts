import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { DocumentSequenceService } from './document-sequence.service';
import { DocumentSequenceEntity } from '../../@models/finance/document-sequence.entity';

describe('DocumentSequenceService', () => {
  let service: DocumentSequenceService;
  let sequenceRepo: any;
  let dataSource: any;

  beforeEach(async () => {
    sequenceRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    dataSource = {
      transaction: jest.fn(),
      manager: {
        findOne: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentSequenceService,
        {
          provide: getRepositoryToken(DocumentSequenceEntity),
          useValue: sequenceRepo,
        },
        {
          provide: DataSource,
          useValue: dataSource,
        },
      ],
    }).compile();

    service = module.get<DocumentSequenceService>(DocumentSequenceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getNextDocumentNumber', () => {
    it('should create sequence starting with 1 when none exists', async () => {
      const mockManager = {
        findOne: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockImplementation((entity) => ({ ...entity, lastNumber: 1 })),
        save: jest.fn().mockImplementation(async (entity) => entity),
      };

      dataSource.transaction.mockImplementation(async (cb: any) => cb(mockManager));

      const docNo = await service.getNextDocumentNumber(
        'SPJ_AKP',
        '2610',
        'SPJ/AKP/2610',
        4,
      );

      expect(docNo).toBe('SPJ/AKP/2610/0001');
      expect(mockManager.findOne).toHaveBeenCalledWith(
        DocumentSequenceEntity,
        expect.objectContaining({
          lock: { mode: 'pessimistic_write' },
        }),
      );
      expect(mockManager.save).toHaveBeenCalled();
    });

    it('should increment sequence when existing sequence found', async () => {
      const existing = {
        id: 'seq-1',
        documentType: 'SPJ_AKP',
        periodKey: '2610',
        prefix: 'SPJ/AKP/2610',
        lastNumber: 1,
        padding: 4,
      };

      const mockManager = {
        findOne: jest.fn().mockResolvedValue(existing),
        save: jest.fn().mockImplementation(async (entity) => entity),
      };

      dataSource.transaction.mockImplementation(async (cb: any) => cb(mockManager));

      const docNo = await service.getNextDocumentNumber(
        'SPJ_AKP',
        '2610',
        'SPJ/AKP/2610',
        4,
      );

      expect(docNo).toBe('SPJ/AKP/2610/0002');
      expect(existing.lastNumber).toBe(2);
      expect(mockManager.save).toHaveBeenCalledWith(existing);
    });

    it('should execute inside provided entityManager without new transaction', async () => {
      const existing = {
        id: 'seq-1',
        documentType: 'BKM',
        periodKey: '2610',
        prefix: 'BKM/2610',
        lastNumber: 41,
        padding: 4,
      };

      const customManager: any = {
        findOne: jest.fn().mockResolvedValue(existing),
        save: jest.fn().mockImplementation(async (entity) => entity),
      };

      const docNo = await service.getNextDocumentNumber(
        'BKM',
        '2610',
        'BKM/2610',
        4,
        undefined,
        customManager,
      );

      expect(docNo).toBe('BKM/2610/0042');
      expect(dataSource.transaction).not.toHaveBeenCalled();
      expect(customManager.findOne).toHaveBeenCalled();
    });
  });

  describe('previewNextNumber', () => {
    it('should return 0001 if sequence does not exist yet', async () => {
      sequenceRepo.findOne.mockResolvedValue(null);

      const preview = await service.previewNextNumber('SPJ_WIS', '2610');

      expect(preview.nextNumber).toBe('SPJ_WIS/2610/0001');
      expect(preview.currentLastNumber).toBe(0);
    });

    it('should return next incremented preview without updating DB', async () => {
      sequenceRepo.findOne.mockResolvedValue({
        documentType: 'SPJ_WIS',
        periodKey: '2610',
        prefix: 'SPJ/WIS/2610',
        lastNumber: 5,
        padding: 4,
      });

      const preview = await service.previewNextNumber('SPJ_WIS', '2610');

      expect(preview.nextNumber).toBe('SPJ/WIS/2610/0006');
      expect(preview.currentLastNumber).toBe(5);
      expect(sequenceRepo.save).not.toHaveBeenCalled();
    });
  });
});
