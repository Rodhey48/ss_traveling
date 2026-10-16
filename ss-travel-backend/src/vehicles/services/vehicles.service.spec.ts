import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { VehiclesService } from './vehicles.service';
import {
  VehicleEntity,
  VehicleSeatClassEntity,
  SeatClassEntity,
  VehicleImageEntity,
  CompanyEntity,
  VehicleType,
  OwnershipStatus,
} from '@models';
import { SeatClassName } from '../../@models/fleet/vehicle-seat-class.entity';

describe('VehiclesService', () => {
  let service: VehiclesService;
  let vehicleRepo: any;
  let seatClassRepo: any;
  let seatClassMasterRepo: any;
  let vehicleImageRepo: any;
  let companyRepo: any;
  let dataSource: any;

  beforeEach(async () => {
    vehicleRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      createQueryBuilder: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };

    seatClassRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };

    seatClassMasterRepo = {
      findOne: jest.fn(),
      find: jest.fn().mockResolvedValue([
        { id: 'sc-sleeper', code: 'SLEEPER', name: 'Sleeper Class' },
        { id: 'sc-luxury', code: 'LUXURY_2_1', name: 'Luxury Seat 2-1' },
      ]),
      create: jest.fn().mockImplementation((dto) => ({ id: 'new-sc', ...dto })),
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
      remove: jest.fn().mockResolvedValue(true),
    };

    vehicleImageRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn().mockImplementation((dto) => ({ id: 'new-img', ...dto })),
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
      update: jest.fn().mockResolvedValue(true),
      remove: jest.fn().mockResolvedValue(true),
    };

    companyRepo = {
      findOne: jest.fn().mockResolvedValue({ id: 'comp-uuid', code: 'SST' }),
    };

    dataSource = {
      transaction: jest.fn().mockImplementation(async (callback) => {
        const mockManager = {
          create: jest.fn().mockImplementation((entity, data) => ({
            id: 'generated-uuid',
            ...data,
          })),
          save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
          delete: jest.fn().mockResolvedValue(true),
        };
        return callback(mockManager);
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VehiclesService,
        {
          provide: getRepositoryToken(VehicleEntity),
          useValue: vehicleRepo,
        },
        {
          provide: getRepositoryToken(VehicleSeatClassEntity),
          useValue: seatClassRepo,
        },
        {
          provide: getRepositoryToken(SeatClassEntity),
          useValue: seatClassMasterRepo,
        },
        {
          provide: getRepositoryToken(VehicleImageEntity),
          useValue: vehicleImageRepo,
        },
        {
          provide: getRepositoryToken(CompanyEntity),
          useValue: companyRepo,
        },
        {
          provide: DataSource,
          useValue: dataSource,
        },
      ],
    }).compile();

    service = module.get<VehiclesService>(VehiclesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated list of vehicles', async () => {
      const mockQueryBuilder: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([
          [{ id: '1', code: 'SS-01', plateNumber: 'B 7123 SS' }],
          1,
        ]),
      };
      vehicleRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findAll({ page: 1, limit: 10 });
      expect(result.status).toBe(true);
      expect(result.data.data.length).toBe(1);
      expect(result.data.total).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should return vehicle details if found', async () => {
      const mockVehicle = { id: 'v1', code: 'SS-01', plateNumber: 'B 7123 SS' };
      vehicleRepo.findOne.mockResolvedValue(mockVehicle);

      const result = await service.findOne('v1');
      expect(result.status).toBe(true);
      expect(result.data.code).toBe('SS-01');
    });

    it('should throw NotFoundException if vehicle not found', async () => {
      vehicleRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should throw ConflictException if vehicle code already exists', async () => {
      vehicleRepo.findOne.mockResolvedValueOnce({ id: 'existing', code: 'SS-01' });

      await expect(
        service.create({
          code: 'SS-01',
          plateNumber: 'B 9999 SS',
          vehicleType: VehicleType.BIG_BUS,
          ownershipStatus: OwnershipStatus.OWNED_PAID_OFF,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException if plateNumber already exists', async () => {
      vehicleRepo.findOne
        .mockResolvedValueOnce(null) // code check passed
        .mockResolvedValueOnce({ id: 'existing', plateNumber: 'B 7123 SS' }); // plate check failed

      await expect(
        service.create({
          code: 'SS-99',
          plateNumber: 'B 7123 SS',
          vehicleType: VehicleType.BIG_BUS,
          ownershipStatus: OwnershipStatus.OWNED_PAID_OFF,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should calculate total capacity from seat classes automatically', async () => {
      vehicleRepo.findOne.mockResolvedValue(null);

      const result = await service.create({
        code: 'SS-01',
        plateNumber: 'B 7123 SS',
        vehicleType: VehicleType.BIG_BUS,
        ownershipStatus: OwnershipStatus.OWNED_PAID_OFF,
        seatClasses: [
          { className: SeatClassName.SLEEPER, seatCapacity: 4 },
          { className: SeatClassName.LUXURY_2_1, seatCapacity: 20 },
        ],
      });

      expect(result.status).toBe(true);
      expect(result.data.capacity).toBe(24);
    });
  });

  describe('addSeatClass', () => {
    it('should add seat class and update vehicle capacity', async () => {
      const mockVehicle = { id: 'v1', code: 'SS-01', capacity: 20 };
      vehicleRepo.findOne.mockResolvedValue(mockVehicle);
      seatClassRepo.create.mockReturnValue({
        className: SeatClassName.SLEEPER,
        seatCapacity: 4,
      });
      seatClassRepo.save.mockResolvedValue({
        id: 'sc-1',
        className: SeatClassName.SLEEPER,
        seatCapacity: 4,
      });
      seatClassRepo.find.mockResolvedValue([
        { seatCapacity: 20 },
        { seatCapacity: 4 },
      ]);
      vehicleRepo.save.mockResolvedValue(mockVehicle);

      const result = await service.addSeatClass('v1', {
        className: SeatClassName.SLEEPER,
        seatCapacity: 4,
      });

      expect(result.status).toBe(true);
      expect(mockVehicle.capacity).toBe(24);
      expect(vehicleRepo.save).toHaveBeenCalledWith(mockVehicle);
    });
  });

  describe('Master Seat Classes', () => {
    it('should return all master seat classes', async () => {
      const result = await service.findAllSeatClasses();
      expect(result.status).toBe(true);
      expect(result.data.length).toBe(2);
    });

    it('should create master seat class', async () => {
      seatClassMasterRepo.findOne.mockResolvedValue(null);
      const result = await service.createSeatClass({
        code: 'SUITES',
        name: 'Suites Class',
      });
      expect(result.status).toBe(true);
      expect(result.data.code).toBe('SUITES');
    });
  });
});
