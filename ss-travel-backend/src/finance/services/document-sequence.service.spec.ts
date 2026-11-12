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
        query: jest.fn().mockResolvedValue([
          { last_number: 1, prefix: 'SPJ/AKP/2610', padding: 4 },
        ]),
      };

      dataSource.transaction.mockImplementation(async (cb: any) => cb(mockManager));

      const docNo = await service.getNextDocumentNumber(
        'SPJ_AKP',
        '2610',
        'SPJ/AKP/2610',
        4,
      );

      expect(docNo).toBe('SPJ/AKP/2610/0001');
      expect(mockManager.query).toHaveBeenCalled();
    });

    it('should increment sequence when existing sequence found', async () => {
      const mockManager = {
        query: jest.fn().mockResolvedValue([
          { last_number: 2, prefix: 'SPJ/AKP/2610', padding: 4 },
        ]),
      };

      dataSource.transaction.mockImplementation(async (cb: any) => cb(mockManager));

      const docNo = await service.getNextDocumentNumber(
        'SPJ_AKP',
        '2610',
        'SPJ/AKP/2610',
        4,
      );

      expect(docNo).toBe('SPJ/AKP/2610/0002');
      expect(mockManager.query).toHaveBeenCalled();
    });

    it('should execute inside provided entityManager without new transaction', async () => {
      const customManager: any = {
        query: jest.fn().mockResolvedValue([
          { last_number: 42, prefix: 'BKM/2610', padding: 4 },
        ]),
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
      expect(customManager.query).toHaveBeenCalled();
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
