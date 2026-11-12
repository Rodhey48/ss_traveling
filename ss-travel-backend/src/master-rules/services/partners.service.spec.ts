import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { PartnersService } from './partners.service';
import {
  RestaurantEntity,
  RestaurantSettlementType,
} from '../../@models/master-rules/restaurant.entity';
import {
  CoordinatorEntity,
  CoordinatorType,
} from '../../@models/master-rules/coordinator.entity';
import {
  CoordinatorFeeRuleEntity,
} from '../../@models/master-rules/coordinator-fee-rule.entity';
import { UsersEntity } from '../../@models/user/user.entity';

describe('PartnersService', () => {
  let service: PartnersService;
  let restaurantRepo: any;
  let coordinatorRepo: any;
  let coordinatorFeeRepo: any;
  let userRepo: any;

  beforeEach(async () => {
    restaurantRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };

    coordinatorRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn().mockImplementation((dto) => ({ id: 'kor-1', ...dto })),
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
      remove: jest.fn().mockResolvedValue({}),
      createQueryBuilder: jest.fn().mockReturnValue({
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([
          {
            id: 'kor-1',
            code: 'KOR-BRT-01',
            name: 'H. Ahmad Sodik',
            type: CoordinatorType.ORGANIZATION,
            bankName: 'BCA',
            bankAccountNumber: '8830192847',
            bankAccountHolder: 'Ahmad Sodik',
          },
        ]),
      }),
    };

    coordinatorFeeRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };

    userRepo = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PartnersService,
        {
          provide: getRepositoryToken(RestaurantEntity),
          useValue: restaurantRepo,
        },
        {
          provide: getRepositoryToken(CoordinatorEntity),
          useValue: coordinatorRepo,
        },
        {
          provide: getRepositoryToken(CoordinatorFeeRuleEntity),
          useValue: coordinatorFeeRepo,
        },
        {
          provide: getRepositoryToken(UsersEntity),
          useValue: userRepo,
        },
      ],
    }).compile();

    service = module.get<PartnersService>(PartnersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateMealExpense', () => {
    it('should calculate meal expense with AP invoice settlement', async () => {
      restaurantRepo.findOne.mockResolvedValueOnce({
        id: 'rm-1',
        code: 'RM-01',
        name: 'RM Taman Selera',
        city: 'SUBANG',
        ratePerPax: 25000,
        settlementType: RestaurantSettlementType.INVOICED_MONTHLY_AP,
      });

      const result = await service.calculateMealExpense('rm-1', 30);

      expect(result.ratePerPax).toBe(25000);
      expect(result.paxCount).toBe(30);
      expect(result.totalExpense).toBe(750000); // 25k * 30
      expect(result.requiresInvoiceAP).toBe(true);
      expect(result.requiresCashFromCrewUJ).toBe(false);
    });

    it('should calculate meal expense with Cash UJ settlement', async () => {
      restaurantRepo.findOne.mockResolvedValueOnce({
        id: 'rm-3',
        code: 'RM-03',
        name: 'RM Kendil Mas',
        city: 'BATANG',
        ratePerPax: 25000,
        settlementType: RestaurantSettlementType.PAID_BY_CREW_UJ,
      });

      const result = await service.calculateMealExpense('rm-3', 20);

      expect(result.totalExpense).toBe(500000);
      expect(result.requiresCashFromCrewUJ).toBe(true);
      expect(result.requiresInvoiceAP).toBe(false);
    });
  });

  describe('coordinators (master)', () => {
    it('should list coordinators with bank details', async () => {
      const list = await service.findAllCoordinators();
      expect(list.length).toBe(1);
      expect(list[0].bankName).toBe('BCA');
      expect(list[0].bankAccountNumber).toBe('8830192847');
    });

    it('should create new coordinator with bank details', async () => {
      coordinatorRepo.findOne.mockResolvedValueOnce(null);
      const created = await service.createCoordinator({
        code: 'KOR-TEST-01',
        name: 'Pak Koordinator Uji',
        type: CoordinatorType.INDIVIDUAL,
        phone: '08123456789',
        bankName: 'MANDIRI',
        bankAccountNumber: '1234567890',
        bankAccountHolder: 'Koordinator Uji',
        area: 'SURABAYA',
      });

      expect(created.code).toBe('KOR-TEST-01');
      expect(coordinatorRepo.create).toHaveBeenCalled();
      expect(coordinatorRepo.save).toHaveBeenCalled();
    });
  });

  describe('getFeeForRoute', () => {
    it('should calculate coordinator fee correctly with linked coordinator bank snapshot', async () => {
      coordinatorFeeRepo.findOne.mockResolvedValueOnce({
        id: 'fee-1',
        origin: 'JAKARTA',
        destination: 'YOGYAKARTA',
        feePerPax: 10000,
        coordinatorId: 'kor-1',
        coordinator: {
          id: 'kor-1',
          name: 'H. Ahmad Sodik',
          bankName: 'BCA',
          bankAccountNumber: '8830192847',
          bankAccountHolder: 'Ahmad Sodik',
          phone: '081298765432',
        },
      });

      const result = await service.getFeeForRoute('JAKARTA', 'YOGYAKARTA', 25);

      expect(result.feePerPax).toBe(10000);
      expect(result.paxCount).toBe(25);
      expect(result.totalFee).toBe(250000);
      expect(result.coordinatorName).toBe('H. Ahmad Sodik');
      expect(result.bankName).toBe('BCA');
      expect(result.bankAccountNumber).toBe('8830192847');
      expect(result.phone).toBe('081298765432');
    });

    it('should fallback to ALL-ALL rule when specific route is not found', async () => {
      coordinatorFeeRepo.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          id: 'fee-fallback',
          origin: 'ALL',
          destination: 'ALL',
          feePerPax: 10000,
          coordinator: {
            name: 'Koordinator Umum',
          },
        });

      const result = await service.getFeeForRoute('BANDUNG', 'SEMARANG', 10);

      expect(result.totalFee).toBe(100000);
      expect(result.coordinatorName).toBe('Koordinator Umum');
    });

    it('should throw NotFoundException if no rule exists at all', async () => {
      coordinatorFeeRepo.findOne.mockResolvedValue(null);

      await expect(
        service.getFeeForRoute('MEDAN', 'ACEH', 15),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
