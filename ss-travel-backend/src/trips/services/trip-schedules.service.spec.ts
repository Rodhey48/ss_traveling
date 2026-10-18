import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { TripSchedulesService } from './trip-schedules.service';
import {
  TripScheduleEntity,
  TripServiceType,
  TripScheduleStatus,
} from '../../@models/trips';
import { VehicleEntity } from '../../@models/fleet/vehicle.entity';
import { CustomerEntity } from '../../@models/customer/customer.entity';
import { UsersEntity } from '../../@models/user/user.entity';
import { BusinessUnitEntity } from '../../@models/organization/business-unit.entity';
import { DocumentSequenceService } from '../../finance/services/document-sequence.service';

describe('TripSchedulesService', () => {
  let service: TripSchedulesService;
  let scheduleRepo: any;
  let vehicleRepo: any;
  let customerRepo: any;
  let userRepo: any;
  let businessUnitRepo: any;
  let sequenceService: any;

  const mockSchedule = {
    id: 'mock-sched-id',
    scheduleNo: 'SCH/AKP/2610/0001',
    status: TripScheduleStatus.DRAFT,
  };

  beforeEach(async () => {
    scheduleRepo = {
      findOne: jest.fn().mockImplementation((args: any) => {
        if (args?.where?.scheduleNo) return Promise.resolve(null);
        return Promise.resolve(mockSchedule);
      }),
      create: jest.fn((dto) => ({ id: 'mock-sched-id', ...dto })),
      save: jest.fn((entity) => Promise.resolve({ id: 'mock-sched-id', ...entity })),
      remove: jest.fn().mockResolvedValue(true),
      createQueryBuilder: jest.fn(),
    };

    vehicleRepo = {
      findOne: jest.fn().mockResolvedValue({ id: 'bus-1', code: 'SS-01', plateNumber: 'B 7123 SS' }),
    };

    customerRepo = {
      findOne: jest.fn().mockResolvedValue({ id: 'cust-1', institutionName: 'PT Mitra Sejahtera', totalTripsCount: 2 }),
      save: jest.fn().mockResolvedValue(true),
    };

    userRepo = {
      findOne: jest.fn().mockImplementation(({ where }) => {
        if (where.id === 'driver-1') return Promise.resolve({ id: 'driver-1', name: 'Pak Budi' });
        if (where.id === 'driver-2') return Promise.resolve({ id: 'driver-2', name: 'Pak Joko' });
        return Promise.resolve({ id: where.id, name: 'Kru Lapangan' });
      }),
    };

    businessUnitRepo = {
      findOne: jest.fn().mockResolvedValue({ id: 'bu-akap', code: 'AKAP' }),
    };

    sequenceService = {
      getNextDocumentNumber: jest.fn().mockResolvedValue('SCH/AKP/2610/0001'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TripSchedulesService,
        { provide: getRepositoryToken(TripScheduleEntity), useValue: scheduleRepo },
        { provide: getRepositoryToken(VehicleEntity), useValue: vehicleRepo },
        { provide: getRepositoryToken(CustomerEntity), useValue: customerRepo },
        { provide: getRepositoryToken(UsersEntity), useValue: userRepo },
        { provide: getRepositoryToken(BusinessUnitEntity), useValue: businessUnitRepo },
        { provide: DocumentSequenceService, useValue: sequenceService },
      ],
    }).compile();

    service = module.get<TripSchedulesService>(TripSchedulesService);
  });

  describe('checkConflictsAndBuffer', () => {
    it('harus melempar BadRequestException jika waktu keberangkatan >= kepulangan', async () => {
      await expect(
        service.checkConflictsAndBuffer({
          departureAt: '2026-10-20T10:00:00Z',
          returnAt: '2026-10-20T08:00:00Z',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('harus mendeteksi bentrok jadwal armada bus (overlap conflict)', async () => {
      const qbMock: any = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([
          { id: 'sched-overlap', scheduleNo: 'SCH/AKP/2610/0099' },
        ]),
        getOne: jest.fn().mockResolvedValue(null),
      };
      scheduleRepo.createQueryBuilder.mockReturnValue(qbMock);

      const result = await service.checkConflictsAndBuffer({
        vehicleId: 'bus-1',
        departureAt: '2026-10-20T08:00:00Z',
        returnAt: '2026-10-21T18:00:00Z',
      });

      expect(result.hasConflict).toBe(true);
      expect(result.conflictDetails[0]).toContain('SCH/AKP/2610/0099');
    });

    it('harus mengeluarkan alert warning jika jeda istirahat (buffer rest time) armada < 3 jam', async () => {
      const qbMock: any = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]), // tidak ada bentrok
        getOne: jest.fn().mockResolvedValue({
          id: 'prev-sched',
          scheduleNo: 'SCH/AKP/2610/0005',
          plannedReturnAt: new Date('2026-10-20T07:00:00Z'), // Selesai jam 07:00
        }),
      };
      scheduleRepo.createQueryBuilder.mockReturnValue(qbMock);

      // Jadwal baru jam 08:30 (jeda 90 menit < 180 menit)
      const result = await service.checkConflictsAndBuffer({
        vehicleId: 'bus-1',
        departureAt: '2026-10-20T08:30:00Z',
        returnAt: '2026-10-21T18:00:00Z',
      });

      expect(result.hasConflict).toBe(false);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0].type).toBe('VEHICLE');
      expect(result.warnings[0].message).toContain('90 menit');
    });
  });

  describe('create', () => {
    it('harus berhasil membuat rencana jadwal bus DRAFT dengan nomor unik', async () => {
      const qbMock: any = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
        getOne: jest.fn().mockResolvedValue(null),
      };
      scheduleRepo.createQueryBuilder.mockReturnValue(qbMock);

      scheduleRepo.findOne.mockResolvedValue({
        id: 'mock-sched-id',
        scheduleNo: 'SCH/AKP/2610/0001',
        status: TripScheduleStatus.DRAFT,
      });

      const res = await service.create({
        serviceType: TripServiceType.AKAP,
        vehicleId: 'bus-1',
        plannedDepartureAt: '2026-10-20T08:00:00Z',
        plannedReturnAt: '2026-10-21T18:00:00Z',
        origin: 'Pool Ciputat / Tangerang',
        destination: 'Terminal Giwangan Yogyakarta',
        plannedDriver1Id: 'driver-1',
      });

      expect(res.schedule).toBeDefined();
      expect(sequenceService.getNextDocumentNumber).toHaveBeenCalled();
      expect(scheduleRepo.save).toHaveBeenCalled();
    });

    it('harus menolak pembuatan jadwal jika terjadi bentrok operasional', async () => {
      const qbMock: any = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([
          { id: 'sched-bentrok', scheduleNo: 'SCH/AKP/2610/0010' },
        ]),
        getOne: jest.fn().mockResolvedValue(null),
      };
      scheduleRepo.createQueryBuilder.mockReturnValue(qbMock);

      await expect(
        service.create({
          serviceType: TripServiceType.AKAP,
          vehicleId: 'bus-1',
          plannedDepartureAt: '2026-10-20T08:00:00Z',
          plannedReturnAt: '2026-10-21T18:00:00Z',
          origin: 'Pool Ciputat',
          destination: 'Yogyakarta',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('confirm', () => {
    it('harus mengubah status DRAFT menjadi CONFIRMED dan memperbarui statistik pelanggan CRM', async () => {
      scheduleRepo.findOne.mockResolvedValue({
        id: 'sched-1',
        status: TripScheduleStatus.DRAFT,
        vehicleId: 'bus-1',
        customerId: 'cust-1',
        plannedDepartureAt: new Date('2026-10-20T08:00:00Z'),
      });

      const confirmed = await service.confirm('sched-1');

      expect(scheduleRepo.save).toHaveBeenCalled();
      expect(customerRepo.save).toHaveBeenCalled();
    });

    it('harus menolak konfirmasi jika jadwal belum memiliki armada bus', async () => {
      scheduleRepo.findOne.mockResolvedValue({
        id: 'sched-no-bus',
        status: TripScheduleStatus.DRAFT,
        vehicleId: null,
      });

      await expect(service.confirm('sched-no-bus')).rejects.toThrow(BadRequestException);
    });
  });

  describe('cancel', () => {
    it('harus membatalkan jadwal yang belum berjalan', async () => {
      scheduleRepo.findOne.mockResolvedValue({
        id: 'sched-1',
        status: TripScheduleStatus.CONFIRMED,
        notes: 'Sewa wisata',
      });

      await service.cancel('sched-1', 'Dibatalkan oleh pihak pemesan');
      expect(scheduleRepo.save).toHaveBeenCalled();
    });
  });
});
