import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { RoutesService } from './routes.service';
import { RouteEntity } from '../../@models/master-rules/route.entity';
import { TripServiceType } from '../../@models/trips/trip.enums';

describe('RoutesService', () => {
  let service: RoutesService;
  let routeRepo: any;

  beforeEach(async () => {
    routeRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn((dto) => dto),
      save: jest.fn((entity) => Promise.resolve({ id: 'mock-route-id', ...entity })),
      remove: jest.fn((entity) => Promise.resolve(entity)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoutesService,
        {
          provide: getRepositoryToken(RouteEntity),
          useValue: routeRepo,
        },
      ],
    }).compile();

    service = module.get<RoutesService>(RoutesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all routes', async () => {
      const mockRoutes = [
        { id: '1', code: 'RUT-JKT-YOG-MGL', name: 'Jakarta - Yogya (Via Magelang)' },
      ];
      routeRepo.find.mockResolvedValue(mockRoutes);

      const result = await service.findAll();
      expect(result).toEqual(mockRoutes);
      expect(routeRepo.find).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a route by id', async () => {
      const mockRoute = { id: '1', code: 'RUT-JKT-YOG-MGL', name: 'Jakarta - Yogya' };
      routeRepo.findOne.mockResolvedValue(mockRoute);

      const result = await service.findOne('1');
      expect(result).toEqual(mockRoute);
    });

    it('should throw NotFoundException if route not found', async () => {
      routeRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should create and return a route', async () => {
      routeRepo.findOne.mockResolvedValue(null);

      const dto = {
        code: 'RUT-JKT-YOG-MGL',
        name: 'Jakarta - Yogyakarta (Via Magelang)',
        origin: 'JAKARTA',
        destination: 'YOGYAKARTA',
        via: 'Bawen - Magelang',
        distanceKm: 540,
        estimatedHours: 9.5,
        serviceType: TripServiceType.AKAP,
      };

      const result = await service.create(dto);
      expect(result.code).toBe('RUT-JKT-YOG-MGL');
      expect(result.origin).toBe('JAKARTA');
    });

    it('should throw BadRequestException if code already exists', async () => {
      routeRepo.findOne.mockResolvedValue({ id: 'existing' });

      await expect(
        service.create({
          code: 'RUT-JKT-YOG-MGL',
          name: 'Duplicate',
          origin: 'JAKARTA',
          destination: 'YOGYAKARTA',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    it('should update and return a route', async () => {
      const existing = {
        id: '1',
        code: 'RUT-JKT-YOG-MGL',
        name: 'Old Name',
        origin: 'JAKARTA',
        destination: 'YOGYAKARTA',
      };
      routeRepo.findOne.mockResolvedValue(existing);

      const result = await service.update('1', { name: 'New Name', code: 'RUT-JKT-YOG-MGL' });
      expect(result.name).toBe('New Name');
    });

    it('should throw ConflictException if updated code already used by another route', async () => {
      const existing = {
        id: '1',
        code: 'RUT-JKT-YOG-MGL',
        name: 'Route 1',
      };
      routeRepo.findOne
        .mockResolvedValueOnce(existing)
        .mockResolvedValueOnce({ id: '2', code: 'RUT-TAKEN' });

      await expect(
        service.update('1', { code: 'RUT-TAKEN' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('delete', () => {
    it('should delete a route', async () => {
      const existing = {
        id: '1',
        code: 'RUT-JKT-YOG-MGL',
        name: 'Jakarta - Yogya',
      };
      routeRepo.findOne.mockResolvedValue(existing);

      const result = await service.delete('1');
      expect(result.success).toBe(true);
      expect(routeRepo.remove).toHaveBeenCalledWith(existing);
    });
  });
});
