import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SpjExpensesService } from './spj-expenses.service';
import { SpjUjService } from './spj-uj.service';
import {
  SpjEntity,
  SpjExpenseEntity,
  SpjUjEntity,
  SpjUjExpenseEntity,
  SpjExpenseType,
  SpjExpensePaymentSource,
  SpjExpenseStatus,
} from '../../@models/trips';

describe('SpjExpensesService', () => {
  let service: SpjExpensesService;
  let spjRepo: any;
  let expenseRepo: any;
  let ujRepo: any;
  let ujExpenseRepo: any;
  let ujService: any;

  beforeEach(async () => {
    spjRepo = {
      findOne: jest.fn(),
    };

    expenseRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn((dto) => ({ id: 'mock-expense-id', ...dto })),
      save: jest.fn((entity) => Promise.resolve({ id: entity.id || 'mock-expense-id', ...entity })),
      remove: jest.fn(),
    };

    ujRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
    };

    ujExpenseRepo = {
      create: jest.fn((dto) => ({ id: 'mock-uj-exp-id', ...dto })),
      save: jest.fn(),
      delete: jest.fn(),
    };

    ujService = {
      getOrCreateUj: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SpjExpensesService,
        { provide: getRepositoryToken(SpjEntity), useValue: spjRepo },
        { provide: getRepositoryToken(SpjExpenseEntity), useValue: expenseRepo },
        { provide: getRepositoryToken(SpjUjEntity), useValue: ujRepo },
        { provide: getRepositoryToken(SpjUjExpenseEntity), useValue: ujExpenseRepo },
        { provide: SpjUjService, useValue: ujService },
      ],
    }).compile();

    service = module.get<SpjExpensesService>(SpjExpensesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('harus mencatat nota BBM solar dengan liter dan odometer serta memotong saldo UJ', async () => {
      spjRepo.findOne.mockResolvedValue({
        id: 'spj-1',
        vehicleId: 'bus-1',
        companyId: 'comp-1',
      });

      const mockUj: any = {
        id: 'uj-1',
        spjId: 'spj-1',
        totalDisbursed: '3500000.00',
        totalSpent: '0.00',
        totalReturned: '0.00',
        balance: '3500000.00',
      };
      ujService.getOrCreateUj.mockResolvedValue(mockUj);

      const result = await service.create(
        'spj-1',
        {
          expenseType: SpjExpenseType.FUEL,
          amount: '1800000.00',
          fuelLiters: '264.70',
          odometerKm: 125430,
          fuelStation: 'SPBU Rest Area KM 207A Tol Palikanci',
          receiptNumber: 'BBM-207-001',
          paymentSource: SpjExpensePaymentSource.UJ,
        },
        'driver-1-id',
      );

      expect(expenseRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          expenseType: SpjExpenseType.FUEL,
          amount: '1800000.00',
          fuelLiters: '264.70',
          odometerKm: 125430,
          fuelStation: 'SPBU Rest Area KM 207A Tol Palikanci',
        }),
      );
      expect(expenseRepo.save).toHaveBeenCalled();
      expect(ujExpenseRepo.save).toHaveBeenCalled();
      expect(mockUj.totalSpent).toBe('1800000.00');
      expect(mockUj.balance).toBe('1700000.00');
      expect(result).toBeDefined();
    });
  });

  describe('verify', () => {
    it('harus memvalidasi status nota pengeluaran', async () => {
      const mockExpense = {
        id: 'exp-1',
        status: SpjExpenseStatus.PENDING,
        notes: 'Nota BBM',
      };
      expenseRepo.findOne.mockResolvedValue(mockExpense);

      await service.verify(
        'exp-1',
        { status: SpjExpenseStatus.APPROVED, notes: 'Struk valid' },
        'cashier-id',
      );

      expect(mockExpense.status).toBe(SpjExpenseStatus.APPROVED);
      expect(expenseRepo.save).toHaveBeenCalled();
    });
  });
});
