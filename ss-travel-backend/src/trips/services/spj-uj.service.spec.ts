import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SpjUjService } from './spj-uj.service';
import {
  SpjEntity,
  SpjUjEntity,
  SpjUjDisbursementEntity,
  SpjUjExpenseEntity,
  SpjUjReturnEntity,
  SpjUjAdditionalRequestEntity,
  SpjCrewAssignmentEntity,
  SpjUjStatus,
  SpjDisbursementType,
  SpjPaymentMethod,
  SpjAdditionalRequestStatus,
  CrewAssignmentRole,
} from '../../@models/trips';

describe('SpjUjService', () => {
  let service: SpjUjService;
  let spjRepo: any;
  let ujRepo: any;
  let disbRepo: any;
  let ujExpenseRepo: any;
  let returnRepo: any;
  let additionalReqRepo: any;
  let crewRepo: any;

  beforeEach(async () => {
    spjRepo = {
      findOne: jest.fn(),
    };

    ujRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn((dto) => ({ id: 'mock-uj-id', ...dto })),
      save: jest.fn((entity) => Promise.resolve({ id: entity.id || 'mock-uj-id', ...entity })),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
    };

    disbRepo = {
      create: jest.fn((dto) => ({ id: 'mock-disb-id', ...dto })),
      save: jest.fn((entity) => Promise.resolve({ id: 'mock-disb-id', ...entity })),
    };

    ujExpenseRepo = {
      create: jest.fn((dto) => ({ id: 'mock-uj-exp-id', ...dto })),
      save: jest.fn((entity) => Promise.resolve(entity)),
    };

    returnRepo = {
      create: jest.fn((dto) => ({ id: 'mock-return-id', ...dto })),
      save: jest.fn((entity) => Promise.resolve({ id: 'mock-return-id', ...entity })),
    };

    additionalReqRepo = {
      findOne: jest.fn(),
      create: jest.fn((dto) => ({ id: 'mock-req-id', ...dto })),
      save: jest.fn((entity) => Promise.resolve({ id: entity.id || 'mock-req-id', ...entity })),
    };

    crewRepo = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SpjUjService,
        { provide: getRepositoryToken(SpjEntity), useValue: spjRepo },
        { provide: getRepositoryToken(SpjUjEntity), useValue: ujRepo },
        { provide: getRepositoryToken(SpjUjDisbursementEntity), useValue: disbRepo },
        { provide: getRepositoryToken(SpjUjExpenseEntity), useValue: ujExpenseRepo },
        { provide: getRepositoryToken(SpjUjReturnEntity), useValue: returnRepo },
        {
          provide: getRepositoryToken(SpjUjAdditionalRequestEntity),
          useValue: additionalReqRepo,
        },
        {
          provide: getRepositoryToken(SpjCrewAssignmentEntity),
          useValue: crewRepo,
        },
      ],
    }).compile();

    service = module.get<SpjUjService>(SpjUjService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getOrCreateUj', () => {
    it('harus membuat amplop UJ baru jika belum tersedia', async () => {
      spjRepo.findOne.mockResolvedValue({
        id: 'spj-1',
        companyId: 'comp-1',
        crewAssignments: [
          { role: CrewAssignmentRole.DRIVER, crewId: 'driver-1-id' },
        ],
      });

      // Panggilan pertama findOne return null (belum ada), panggilan kedua setelah save return uj
      ujRepo.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          id: 'uj-1',
          spjId: 'spj-1',
          crewId: 'driver-1-id',
          totalDisbursed: '0.00',
        });

      const result = await service.getOrCreateUj('spj-1');
      expect(result).toBeDefined();
      expect(ujRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          spjId: 'spj-1',
          crewId: 'driver-1-id',
          status: SpjUjStatus.DRAFT,
        }),
      );
    });
  });

  describe('disburse', () => {
    it('harus mencairkan UJ awal dan mengupdate totalDisbursed serta balance', async () => {
      const mockUj: any = {
        id: 'uj-1',
        spjId: 'spj-1',
        totalDisbursed: '0.00',
        totalSpent: '0.00',
        totalReturned: '0.00',
        balance: '0.00',
        status: SpjUjStatus.DRAFT,
      };

      jest.spyOn(service, 'getOrCreateUj').mockResolvedValue(mockUj);

      await service.disburse(
        'spj-1',
        {
          amount: '3500000.00',
          paymentMethod: SpjPaymentMethod.CASH,
          disbursementType: SpjDisbursementType.INITIAL,
        },
        'cashier-id',
      );

      expect(disbRepo.save).toHaveBeenCalled();
      expect(mockUj.totalDisbursed).toBe('3500000.00');
      expect(mockUj.balance).toBe('3500000.00');
      expect(mockUj.status).toBe(SpjUjStatus.DISBURSED);
    });
  });

  describe('recordReturn', () => {
    it('harus mencatat pengembalian sisa UJ dan menandai BALANCED saat saldo 0', async () => {
      const mockUj: any = {
        id: 'uj-1',
        spjId: 'spj-1',
        totalDisbursed: '3500000.00',
        totalSpent: '2600000.00',
        totalReturned: '0.00',
        balance: '900000.00',
        status: SpjUjStatus.DISBURSED,
      };

      jest.spyOn(service, 'getOrCreateUj').mockResolvedValue(mockUj);

      await service.recordReturn(
        'spj-1',
        {
          amount: '900000.00',
          paymentMethod: SpjPaymentMethod.CASH,
        },
        'cashier-id',
      );

      expect(returnRepo.save).toHaveBeenCalled();
      expect(mockUj.totalReturned).toBe('900000.00');
      expect(mockUj.balance).toBe('0.00');
      expect(mockUj.status).toBe(SpjUjStatus.BALANCED);
    });
  });

  describe('rolloverUj (Skenario 3: Estafet UJ saat bus breakdown di tol)', () => {
    it('harus memindahkan saldo sisa UJ dari bus rusak ke bus pengganti', async () => {
      spjRepo.findOne.mockImplementation(({ where }: any) => {
        if (where.id === 'source-spj') return Promise.resolve({ id: 'source-spj', spjNo: 'SPJ/AKP/2610/0001' });
        if (where.id === 'target-spj') return Promise.resolve({ id: 'target-spj', spjNo: 'SPJ/AKP/2610/0002' });
        return Promise.resolve(null);
      });

      const sourceUj: any = {
        id: 'source-uj-id',
        spjId: 'source-spj',
        totalDisbursed: '3500000.00',
        totalSpent: '1500000.00',
        totalReturned: '0.00',
        balance: '2000000.00',
        status: SpjUjStatus.DISBURSED,
      };

      const targetUj: any = {
        id: 'target-uj-id',
        spjId: 'target-spj',
        totalDisbursed: '0.00',
        totalSpent: '0.00',
        totalReturned: '0.00',
        balance: '0.00',
        status: SpjUjStatus.DRAFT,
      };

      jest.spyOn(service, 'getOrCreateUj').mockImplementation(async (id: string) => {
        if (id === 'source-spj') return sourceUj;
        return targetUj;
      });

      await service.rolloverUj(
        'source-spj',
        {
          targetSpjId: 'target-spj',
          amount: '2000000.00',
          notes: 'Estafet UJ di KM 102 Tol Cipali',
        },
        'dispatcher-id',
      );

      // Verifikasi Source UJ
      expect(sourceUj.totalReturned).toBe('2000000.00');
      expect(sourceUj.balance).toBe('0.00');
      expect(sourceUj.status).toBe(SpjUjStatus.BALANCED);
      expect(sourceUj.rolloverToSpjId).toBe('target-spj');

      // Verifikasi Target UJ
      expect(targetUj.totalDisbursed).toBe('2000000.00');
      expect(targetUj.balance).toBe('2000000.00');
      expect(targetUj.status).toBe(SpjUjStatus.DISBURSED);
      expect(targetUj.rolloverFromSpjId).toBe('source-spj');
    });
  });
});
