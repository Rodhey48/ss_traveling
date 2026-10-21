import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SpjRevenueService } from './spj-revenue.service';
import {
  SpjEntity,
  SpjRevenueDeclarationEntity,
  CrewMealPaymentEntity,
  SpjCrewAssignmentEntity,
  SpjRevenueDeclarationType,
  CrewMealPaymentCategory,
  CrewAssignmentRole,
} from '../../@models/trips';

describe('SpjRevenueService', () => {
  let service: SpjRevenueService;
  let spjRepo: any;
  let revRepo: any;
  let mealPaymentRepo: any;
  let crewRepo: any;

  beforeEach(async () => {
    spjRepo = {
      findOne: jest.fn(),
    };

    revRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn((dto) => ({ id: 'mock-rev-id', ...dto })),
      save: jest.fn((entity) => Promise.resolve({ id: entity.id || 'mock-rev-id', ...entity })),
      remove: jest.fn(),
    };

    mealPaymentRepo = {
      create: jest.fn((dto) => ({ id: 'mock-meal-pay-id', ...dto })),
      save: jest.fn((entity) => Promise.resolve({ id: 'mock-meal-pay-id', ...entity })),
    };

    crewRepo = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SpjRevenueService,
        { provide: getRepositoryToken(SpjEntity), useValue: spjRepo },
        { provide: getRepositoryToken(SpjRevenueDeclarationEntity), useValue: revRepo },
        { provide: getRepositoryToken(CrewMealPaymentEntity), useValue: mealPaymentRepo },
        { provide: getRepositoryToken(SpjCrewAssignmentEntity), useValue: crewRepo },
      ],
    }).compile();

    service = module.get<SpjRevenueService>(SpjRevenueService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('harus mencatat kargo motor dengan komisi dinamis kru 20% dan mendaftarkan hak komisi kru', async () => {
      spjRepo.findOne.mockResolvedValue({
        id: 'spj-1',
        companyId: 'comp-1',
        crewAssignments: [
          { id: 'assign-1', role: CrewAssignmentRole.DRIVER, crewId: 'driver-1-id' },
        ],
      });

      const result = await service.create(
        'spj-1',
        {
          declarationType: SpjRevenueDeclarationType.CARGO_MOTORCYCLE,
          amount: '350000.00',
          sourceReference: 'RESI-MTR-001',
          crewCommissionPercentage: '20.00',
          cargoSenderName: 'Pak Andi',
          cargoReceiverName: 'Bu Siti',
        },
        'conductor-1-id',
      );

      expect(revRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          declarationType: SpjRevenueDeclarationType.CARGO_MOTORCYCLE,
          amount: '350000.00',
          crewCommissionPercentage: '20.00',
          crewCommissionAmount: '70000.00', // 20% x 350.000 = 70.000
        }),
      );
      expect(revRepo.save).toHaveBeenCalled();

      // Otomasi pendaftaran hak komisi kru
      expect(mealPaymentRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          crewId: 'driver-1-id',
          paymentCategory: CrewMealPaymentCategory.CARGO_COMMISSION,
          amount: '70000.00',
        }),
      );
      expect(mealPaymentRepo.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });
});
