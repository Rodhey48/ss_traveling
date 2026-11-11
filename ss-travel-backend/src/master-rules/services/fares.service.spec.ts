import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { FaresService } from './fares.service';
import { FareSeasonEntity } from '../../@models/master-rules/fare-season.entity';
import { FareMatrixEntity } from '../../@models/master-rules/fare-matrix.entity';
import { SeatClassEntity } from '../../@models/fleet/seat-class.entity';
import { RouteEntity } from '../../@models/master-rules/route.entity';

describe('FaresService', () => {
  let service: FaresService;
  let seasonRepo: any;
  let matrixRepo: any;
  let seatClassRepo: any;
  let routeRepo: any;

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

    routeRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
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
        {
          provide: getRepositoryToken(RouteEntity),
          useValue: routeRepo,
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
          code: 'TEST',
          name: 'Test Season',
          startDate: '2026-04-01',
          endDate: '2026-03-01',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create and save season', async () => {
      seasonRepo.findOne.mockResolvedValueOnce(null);
      seasonRepo.create.mockImplementation((dto: any) => dto);
      seasonRepo.save.mockImplementation((dto: any) => Promise.resolve({ id: 's-1', ...dto }));

      const result = await service.createSeason({
        code: 'LIBUR_SEKOLAH',
        name: 'Libur Sekolah',
        startDate: '2026-06-15',
        endDate: '2026-07-15',
      });

      expect(result.code).toBe('LIBUR_SEKOLAH');
      expect(result.name).toBe('Libur Sekolah');
    });
  });

  describe('calculateFare', () => {
    const mockSeatClass = { id: 'sc-1', code: 'EXECUTIVE', name: 'Executive 30 Seat' };
    const mockSpecialSeason = {
      id: 's-leb',
      code: 'LEBARAN_2026',
      name: 'Tuslah Lebaran H-7',
      startDate: '2026-03-15',
      endDate: '2026-03-31',
    };

    it('should calculate fare based on seasonal priority', async () => {
      seatClassRepo.findOne.mockResolvedValueOnce(mockSeatClass);

      const mockQb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValueOnce([mockSpecialSeason]),
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

    it('should calculate fare prioritizing specific routeId', async () => {
      const mockRoute = {
        id: 'r-1',
        code: 'RUT-JKT-YOG-MGL',
        name: 'Jakarta - Yogya (Via Magelang)',
        origin: 'JAKARTA',
        destination: 'YOGYAKARTA',
      };
      routeRepo.findOne.mockResolvedValueOnce(mockRoute);
      seatClassRepo.findOne.mockResolvedValueOnce(mockSeatClass);

      const mockQb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValueOnce([mockSpecialSeason]),
      };
      seasonRepo.createQueryBuilder.mockReturnValueOnce(mockQb);

      matrixRepo.findOne.mockResolvedValueOnce({
        id: 'm-route-1',
        routeId: 'r-1',
        route: mockRoute,
        amount: 460000,
        seatClass: mockSeatClass,
      });

      const result = await service.calculateFare({
        routeId: 'r-1',
        seatClassId: 'sc-1',
        travelDate: '2026-03-20',
      });

      expect(result.amount).toBe(460000);
      expect(result.routeId).toBe('r-1');
      expect(result.routeName).toBe('Jakarta - Yogya (Via Magelang)');
      expect(result.origin).toBe('JAKARTA');
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
