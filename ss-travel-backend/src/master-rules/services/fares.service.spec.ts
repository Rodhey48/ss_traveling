import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { FaresService } from './fares.service';
import { FareSeasonEntity } from '../../@models/master-rules/fare-season.entity';
import { FareMatrixEntity } from '../../@models/master-rules/fare-matrix.entity';
import { SeatClassEntity } from '../../@models/fleet/seat-class.entity';

describe('FaresService', () => {
  let service: FaresService;
  let seasonRepo: any;
  let matrixRepo: any;
  let seatClassRepo: any;

  beforeEach(async () => {
    seasonRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    matrixRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };

    seatClassRepo = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FaresService,
        {
          provide: getRepositoryToken(FareSeasonEntity),
          useValue: seasonRepo,
        },
        {
          provide: getRepositoryToken(FareMatrixEntity),
          useValue: matrixRepo,
        },
        {
          provide: getRepositoryToken(SeatClassEntity),
          useValue: seatClassRepo,
        },
      ],
    }).compile();

    service = module.get<FaresService>(FaresService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createSeason', () => {
    it('should throw ConflictException if code already exists', async () => {
      seasonRepo.findOne.mockResolvedValueOnce({ id: '1', code: 'LEBARAN_2026' });

      await expect(
        service.createSeason({
          code: 'LEBARAN_2026',
          name: 'Lebaran',
          startDate: '2026-03-15',
          endDate: '2026-03-31',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException if startDate > endDate', async () => {
      seasonRepo.findOne.mockResolvedValueOnce(null);

      await expect(
        service.createSeason({
          code: 'LEBARAN_2026',
          name: 'Lebaran',
          startDate: '2026-03-31',
          endDate: '2026-03-15',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should successfully create season', async () => {
      seasonRepo.findOne.mockResolvedValueOnce(null);
      const created = {
        code: 'LEBARAN_2026',
        name: 'Lebaran',
        startDate: '2026-03-15',
        endDate: '2026-03-31',
        isActive: true,
      };
      seasonRepo.create.mockReturnValueOnce(created);
      seasonRepo.save.mockResolvedValueOnce({ id: 's-1', ...created });

      const result = await service.createSeason({
        code: 'lebaran_2026',
        name: 'Lebaran',
        startDate: '2026-03-15',
        endDate: '2026-03-31',
      });

      expect(result.id).toEqual('s-1');
      expect(result.code).toEqual('LEBARAN_2026');
    });
  });

  describe('calculateFare', () => {
    const mockSeatClass = {
      id: 'sc-1',
      code: 'SLEEPER',
      name: 'Luxury Sleeper 1-1',
    };

    it('should throw NotFoundException if seat class does not exist', async () => {
      seatClassRepo.findOne.mockResolvedValueOnce(null);

      await expect(
        service.calculateFare({
          origin: 'TANGERANG',
          destination: 'YOGYAKARTA',
          seatClassId: 'invalid-sc',
          travelDate: '2026-03-20',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return seasonal fare when date falls in active season (Lebaran)', async () => {
      seatClassRepo.findOne.mockResolvedValueOnce(mockSeatClass);

      const mockQb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValueOnce([
          { id: 's-leb', code: 'LEBARAN_2026', name: 'Tuslah Lebaran' },
          { id: 's-reg', code: 'REGULER', name: 'Tarif Reguler Harian' },
        ]),
      };
      seasonRepo.createQueryBuilder.mockReturnValueOnce(mockQb);

      matrixRepo.findOne.mockResolvedValueOnce({
        id: 'm-leb-1',
        amount: 650000,
        seatClass: mockSeatClass,
      });

      const result = await service.calculateFare({
        origin: 'TANGERANG',
        destination: 'YOGYAKARTA',
        seatClassId: 'sc-1',
        travelDate: '2026-03-20',
      });

      expect(result.amount).toBe(650000);
      expect(result.seasonCode).toBe('LEBARAN_2026');
      expect(result.isSeasonal).toBe(true);
      expect(result.origin).toBe('TANGERANG');
      expect(result.destination).toBe('YOGYAKARTA');
    });

    it('should fallback to REGULER season if no seasonal matrix found', async () => {
      seatClassRepo.findOne.mockResolvedValueOnce(mockSeatClass);

      const mockQb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValueOnce([]), // no special season active
      };
      seasonRepo.createQueryBuilder.mockReturnValueOnce(mockQb);

      // Search REGULER season
      seasonRepo.findOne.mockResolvedValueOnce({
        id: 's-reg',
        code: 'REGULER',
        name: 'Tarif Reguler Harian',
      });

      matrixRepo.findOne.mockResolvedValueOnce({
        id: 'm-reg-1',
        amount: 420000,
        seatClass: mockSeatClass,
      });

      const result = await service.calculateFare({
        origin: 'JAKARTA',
        destination: 'YOGYAKARTA',
        seatClassId: 'sc-1',
        travelDate: '2026-01-20',
      });

      expect(result.amount).toBe(420000);
      expect(result.seasonCode).toBe('REGULER');
      expect(result.isSeasonal).toBe(false);
    });
  });
});
