import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { CrewRatesService } from './crew-rates.service';
import {
  CrewRateRuleEntity,
  CrewRateType,
  CrewRole,
  CrewServiceType,
} from '../../@models/master-rules/crew-rate-rule.entity';

describe('CrewRatesService', () => {
  let service: CrewRatesService;
  let ruleRepo: any;

  beforeEach(async () => {
    ruleRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CrewRatesService,
        {
          provide: getRepositoryToken(CrewRateRuleEntity),
          useValue: ruleRepo,
        },
      ],
    }).compile();

    service = module.get<CrewRatesService>(CrewRatesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getRateSnapshot', () => {
    it('should calculate AKAP PER_TRIP snapshot correctly with fullSeatBonus', async () => {
      const mockRule = {
        id: 'cr-1',
        role: CrewRole.DRIVER,
        serviceType: CrewServiceType.AKAP,
        rateType: CrewRateType.PER_TRIP,
        mealAllowance: 150000,
        tripIncentive: 250000,
        fullSeatBonus: 50000,
      };

      const mockQb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValueOnce(mockRule),
      };
      ruleRepo.createQueryBuilder.mockReturnValueOnce(mockQb);

      const result = await service.getRateSnapshot({
        role: CrewRole.DRIVER,
        serviceType: CrewServiceType.AKAP,
        origin: 'TANGERANG',
        destination: 'YOGYAKARTA',
      });

      expect(result.mealAllowance).toBe(150000);
      expect(result.tripIncentive).toBe(250000);
      expect(result.fullSeatBonus).toBe(50000);
      expect(result.totalStandardCompensation).toBe(400000);
      expect(result.durationDays).toBe(1);
      expect(result.rateType).toBe(CrewRateType.PER_TRIP);
    });

    it('should calculate TOURISM PER_DAY snapshot multiplied by durationDays', async () => {
      const mockRule = {
        id: 'cr-2',
        role: CrewRole.DRIVER,
        serviceType: CrewServiceType.TOURISM,
        rateType: CrewRateType.PER_DAY,
        mealAllowance: 100000,
        tripIncentive: 150000,
        fullSeatBonus: 0,
      };

      const mockQb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValueOnce(mockRule),
      };
      ruleRepo.createQueryBuilder.mockReturnValueOnce(mockQb);

      const result = await service.getRateSnapshot({
        role: CrewRole.DRIVER,
        serviceType: CrewServiceType.TOURISM,
        durationDays: 4, // 4 hari charter wisata
      });

      expect(result.dailyMealAllowance).toBe(100000);
      expect(result.dailyTripIncentive).toBe(150000);
      expect(result.mealAllowance).toBe(400000); // 100k * 4
      expect(result.tripIncentive).toBe(600000); // 150k * 4
      expect(result.fullSeatBonus).toBe(0); // Wisata bonus = 0
      expect(result.totalStandardCompensation).toBe(1000000);
      expect(result.durationDays).toBe(4);
      expect(result.rateType).toBe(CrewRateType.PER_DAY);
    });

    it('should throw NotFoundException if rule does not exist', async () => {
      const mockQb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };
      ruleRepo.createQueryBuilder.mockReturnValue(mockQb);

      await expect(
        service.getRateSnapshot({
          role: CrewRole.CONDUCTOR,
          serviceType: CrewServiceType.AKAP,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
