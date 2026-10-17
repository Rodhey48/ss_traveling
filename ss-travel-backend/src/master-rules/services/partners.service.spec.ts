import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { PartnersService } from './partners.service';
import {
  RestaurantEntity,
  RestaurantSettlementType,
} from '../../@models/master-rules/restaurant.entity';
import {
  CoordinatorFeeRuleEntity,
  CoordinatorZone,
} from '../../@models/master-rules/coordinator-fee-rule.entity';
import { UsersEntity } from '../../@models/user/user.entity';

describe('PartnersService', () => {
  let service: PartnersService;
  let restaurantRepo: any;
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

  describe('getFeeForRoute', () => {
    it('should calculate fee for DEPARTURE (Zone WEST)', async () => {
      coordinatorFeeRepo.findOne.mockResolvedValueOnce({
        id: 'cfr-1',
        zone: CoordinatorZone.WEST,
        feePerPax: 10000,
        coordinatorUserId: 'u-1',
        coordinatorUser: { id: 'u-1', name: 'Pak Korlap Barat' },
      });

      const result = await service.getFeeForRoute('DEPARTURE', 30);

      expect(result.zone).toBe(CoordinatorZone.WEST);
      expect(result.feePerPax).toBe(10000);
      expect(result.paxCount).toBe(30);
      expect(result.totalFee).toBe(300000);
      expect(result.coordinatorName).toBe('Pak Korlap Barat');
    });

    it('should calculate fee for RETURN (Zone EAST)', async () => {
      coordinatorFeeRepo.findOne.mockResolvedValueOnce({
        id: 'cfr-2',
        zone: CoordinatorZone.EAST,
        feePerPax: 10000,
        coordinatorUserId: null,
      });

      const result = await service.getFeeForRoute('RETURN', 24);

      expect(result.zone).toBe(CoordinatorZone.EAST);
      expect(result.feePerPax).toBe(10000);
      expect(result.paxCount).toBe(24);
      expect(result.totalFee).toBe(240000);
    });
  });
});
