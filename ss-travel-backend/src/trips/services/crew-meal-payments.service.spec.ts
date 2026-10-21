import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CrewMealPaymentsService } from './crew-meal-payments.service';
import {
  SpjEntity,
  CrewMealPaymentEntity,
  SpjCrewAssignmentEntity,
  CrewMealPaymentCategory,
  CrewMealPaymentStatus,
  CrewPayoutTiming,
  SpjPaymentMethod,
  CrewAssignmentRole,
} from '../../@models/trips';

describe('CrewMealPaymentsService', () => {
  let service: CrewMealPaymentsService;
  let spjRepo: any;
  let paymentRepo: any;
  let crewAssignmentRepo: any;

  beforeEach(async () => {
    spjRepo = {
      findOne: jest.fn(),
    };

    paymentRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn((dto) => ({ id: 'mock-pay-id', ...dto })),
      save: jest.fn((entity) => Promise.resolve({ id: entity.id || 'mock-pay-id', ...entity })),
    };

    crewAssignmentRepo = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CrewMealPaymentsService,
        { provide: getRepositoryToken(SpjEntity), useValue: spjRepo },
        { provide: getRepositoryToken(CrewMealPaymentEntity), useValue: paymentRepo },
        { provide: getRepositoryToken(SpjCrewAssignmentEntity), useValue: crewAssignmentRepo },
      ],
    }).compile();

    service = module.get<CrewMealPaymentsService>(CrewMealPaymentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('disburseEarly (Skenario 2: Early transfer premi di tengah tour wisata)', () => {
    it('harus mencatat transfer bank ke keluarga driver saat mid-trip dan status menjadi PAID', async () => {
      const mockPayment: any = {
        id: 'pay-1',
        amount: '800000.00',
        paymentCategory: CrewMealPaymentCategory.TRIP_INCENTIVE,
        status: CrewMealPaymentStatus.PENDING,
      };

      paymentRepo.findOne.mockResolvedValue(mockPayment);

      const result = await service.disburseEarly(
        'pay-1',
        {
          paymentMethod: SpjPaymentMethod.BANK_TRANSFER,
          bankAccountId: 'bank-bca-id',
          receiptRef: 'TRF-BCA-88772',
          notes: 'Transfer uang dapur keluarga Budi Santoso',
        },
        'finance-staff-id',
      );

      expect(paymentRepo.save).toHaveBeenCalled();
      expect(mockPayment.status).toBe(CrewMealPaymentStatus.PAID);
      expect(mockPayment.receiptRef).toBe('TRF-BCA-88772');
      expect(mockPayment.paymentMethod).toBe(SpjPaymentMethod.BANK_TRANSFER);
      expect(result).toBeDefined();
    });
  });

  describe('syncFromCrewAssignments', () => {
    it('harus membuat baris uang makan dan premi dari snapshot penugasan kru', async () => {
      spjRepo.findOne.mockResolvedValue({
        id: 'spj-1',
        companyId: 'comp-1',
        crewAssignments: [
          {
            id: 'assign-1',
            crewId: 'driver-1-id',
            role: CrewAssignmentRole.DRIVER,
            mealAllowanceSnapshot: '150000.00',
            incentiveSnapshot: '250000.00',
            notes: '[Payout: AT_SETTLEMENT]',
          },
        ],
      });

      paymentRepo.findOne.mockResolvedValue(null);
      paymentRepo.find.mockResolvedValue([
        { id: 'p1', amount: '150000.00' },
        { id: 'p2', amount: '250000.00' },
      ]);

      const result = await service.syncFromCrewAssignments('spj-1');
      expect(paymentRepo.create).toHaveBeenCalledTimes(2);
      expect(result.length).toBe(2);
    });
  });
});
