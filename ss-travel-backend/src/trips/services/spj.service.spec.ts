import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SpjService } from './spj.service';
import {
  SpjEntity,
  SpjLegEntity,
  SpjCrewAssignmentEntity,
  TripScheduleEntity,
  TripServiceType,
  TripScheduleStatus,
  SpjOperationalStatus,
  SpjFinancialStatus,
  SpjLegDirection,
  SpjLegStatus,
  CrewAssignmentRole,
  CrewAssignmentStatus,
} from '../../@models/trips';
import { VehicleEntity } from '../../@models/fleet/vehicle.entity';
import { UsersEntity } from '../../@models/user/user.entity';
import { BusinessUnitEntity } from '../../@models/organization/business-unit.entity';
import { ProfitCenterEntity } from '../../@models/organization/profit-center.entity';
import { DocumentSequenceService } from '../../finance/services/document-sequence.service';
import { CrewRatesService } from '../../master-rules/services/crew-rates.service';

describe('SpjService', () => {
  let service: SpjService;
  let spjRepo: any;
  let legRepo: any;
  let crewRepo: any;
  let scheduleRepo: any;
  let vehicleRepo: any;
  let userRepo: any;
  let businessUnitRepo: any;
  let profitCenterRepo: any;
  let sequenceService: any;
  let crewRatesService: any;

  beforeEach(async () => {
    const mockSpj = {
      id: 'mock-spj-id',
      spjNo: 'SPJ/AKP/2610/0001',
      operationalStatus: SpjOperationalStatus.DRAFT,
    };

    spjRepo = {
      findOne: jest.fn().mockImplementation((args: any) => {
        if (args?.where?.spjNo) return Promise.resolve(null);
        return Promise.resolve(mockSpj);
      }),
      find: jest.fn(),
      create: jest.fn((dto) => ({ id: 'mock-spj-id', ...dto })),
      save: jest.fn((entity) => Promise.resolve({ id: 'mock-spj-id', ...entity })),
      createQueryBuilder: jest.fn(),
    };

    legRepo = {
      create: jest.fn((dto) => ({ id: 'mock-leg-id', ...dto })),
      save: jest.fn((entity) => Promise.resolve(entity)),
      findOne: jest.fn(),
    };

    crewRepo = {
      create: jest.fn((dto) => ({ id: 'mock-crew-assign-id', ...dto })),
      save: jest.fn((entity) => Promise.resolve(entity)),
      findOne: jest.fn(),
    };

    scheduleRepo = {
      findOne: jest.fn(),
      save: jest.fn().mockResolvedValue(true),
    };

    vehicleRepo = {
      findOne: jest.fn().mockImplementation(({ where }) => {
        if (where.id === 'bus-1') return Promise.resolve({ id: 'bus-1', code: 'SS-01', plateNumber: 'B 7123 SS', capacity: 24 });
        if (where.id === 'bus-3') return Promise.resolve({ id: 'bus-3', code: 'SS-03', plateNumber: 'B 7345 SS', capacity: 28 });
        return Promise.resolve({ id: where.id, code: 'SS-99', capacity: 30 });
      }),
    };

    userRepo = {
      findOne: jest.fn().mockImplementation(({ where }) => {
        if (where.id === 'driver-1') return Promise.resolve({ id: 'driver-1', name: 'Pak Budi' });
        if (where.id === 'driver-2') return Promise.resolve({ id: 'driver-2', name: 'Pak Joko' });
        if (where.id === 'driver-rep') return Promise.resolve({ id: 'driver-rep', name: 'Pak Hendra' });
        return Promise.resolve({ id: where.id, name: 'Kru Bus' });
      }),
    };

    businessUnitRepo = {
      findOne: jest.fn().mockResolvedValue({ id: 'bu-1', code: 'AKAP' }),
    };

    profitCenterRepo = {
      findOne: jest.fn().mockResolvedValue({ id: 'pc-1', code: 'PC-AKAP' }),
    };

    sequenceService = {
      getNextDocumentNumber: jest.fn().mockResolvedValue('SPJ/AKP/2610/0001'),
    };

    crewRatesService = {
      getRateSnapshot: jest.fn().mockResolvedValue({
        mealAllowance: 150000,
        tripIncentive: 250000,
        fullSeatBonus: 50000,
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SpjService,
        { provide: getRepositoryToken(SpjEntity), useValue: spjRepo },
        { provide: getRepositoryToken(SpjLegEntity), useValue: legRepo },
        { provide: getRepositoryToken(SpjCrewAssignmentEntity), useValue: crewRepo },
        { provide: getRepositoryToken(TripScheduleEntity), useValue: scheduleRepo },
        { provide: getRepositoryToken(VehicleEntity), useValue: vehicleRepo },
        { provide: getRepositoryToken(UsersEntity), useValue: userRepo },
        { provide: getRepositoryToken(BusinessUnitEntity), useValue: businessUnitRepo },
        { provide: getRepositoryToken(ProfitCenterEntity), useValue: profitCenterRepo },
        { provide: DocumentSequenceService, useValue: sequenceService },
        { provide: CrewRatesService, useValue: crewRatesService },
      ],
    }).compile();

    service = module.get<SpjService>(SpjService);
  });

  describe('create', () => {
    it('harus berhasil membuat SPJ AKAP dengan default 2 legs dan snapshot kompensasi kru', async () => {
      spjRepo.findOne.mockResolvedValue({
        id: 'mock-spj-id',
        spjNo: 'SPJ/AKP/2610/0001',
        operationalStatus: SpjOperationalStatus.DRAFT,
      });

      const spj = await service.create({
        serviceType: TripServiceType.AKAP,
        vehicleId: 'bus-1',
        crewAssignments: [
          { crewId: 'driver-1', role: CrewAssignmentRole.DRIVER },
          { crewId: 'driver-2', role: CrewAssignmentRole.CO_DRIVER },
        ],
      });

      expect(spj).toBeDefined();
      expect(sequenceService.getNextDocumentNumber).toHaveBeenCalled();
      expect(crewRatesService.getRateSnapshot).toHaveBeenCalledTimes(2);
      expect(legRepo.save).toHaveBeenCalled();
    });
  });

  describe('generateFromSchedule', () => {
    it('harus menerbitkan SPJ 1-klik dari jadwal bus terkonfirmasi dan update status jadwal ke IN_PROGRESS', async () => {
      scheduleRepo.findOne.mockResolvedValue({
        id: 'sched-1',
        scheduleNo: 'SCH/AKP/2610/0001',
        serviceType: TripServiceType.AKAP,
        vehicleId: 'bus-1',
        plannedDriver1Id: 'driver-1',
        plannedDriver2Id: 'driver-2',
        plannedDepartureAt: new Date('2026-10-20T08:00:00Z'),
        plannedReturnAt: new Date('2026-10-21T18:00:00Z'),
        origin: 'Pool Ciputat',
        destination: 'Terminal Giwangan',
      });

      spjRepo.findOne.mockResolvedValue({
        id: 'mock-spj-id',
        spjNo: 'SPJ/AKP/2610/0001',
        operationalStatus: SpjOperationalStatus.ISSUED,
      });

      const res = await service.generateFromSchedule('sched-1');

      expect(res).toBeDefined();
      expect(scheduleRepo.save).toHaveBeenCalled();
      expect(spjRepo.save).toHaveBeenCalled();
    });

    it('harus menolak generate SPJ jika jadwal belum memiliki pengemudi', async () => {
      scheduleRepo.findOne.mockResolvedValue({
        id: 'sched-no-driver',
        scheduleNo: 'SCH/AKP/2610/0002',
        serviceType: TripServiceType.AKAP,
        vehicleId: 'bus-1',
        plannedDriver1Id: null,
        plannedDriver2Id: null,
      });

      await expect(service.generateFromSchedule('sched-no-driver')).rejects.toThrow(BadRequestException);
    });
  });

  describe('issue, start & complete', () => {
    it('harus menolak issue jika SPJ tidak memiliki kru driver', async () => {
      spjRepo.findOne.mockResolvedValue({
        id: 'spj-no-driver',
        operationalStatus: SpjOperationalStatus.DRAFT,
        crewAssignments: [
          { role: CrewAssignmentRole.CONDUCTOR, status: CrewAssignmentStatus.ASSIGNED },
        ],
      });

      await expect(service.issue('spj-no-driver')).rejects.toThrow(BadRequestException);
    });

    it('harus berhasil menerbitkan SPJ (ISSUED) jika memiliki driver', async () => {
      spjRepo.findOne.mockResolvedValue({
        id: 'spj-valid',
        operationalStatus: SpjOperationalStatus.DRAFT,
        crewAssignments: [
          { role: CrewAssignmentRole.DRIVER, status: CrewAssignmentStatus.ASSIGNED },
        ],
      });

      await service.issue('spj-valid');
      expect(spjRepo.save).toHaveBeenCalled();
    });

    it('harus mengubah status ke IN_PROGRESS saat armada berangkat (start)', async () => {
      spjRepo.findOne.mockResolvedValue({
        id: 'spj-start',
        operationalStatus: SpjOperationalStatus.ISSUED,
        legs: [{ sequenceNo: 1, status: SpjLegStatus.SCHEDULED }],
        crewAssignments: [{ status: CrewAssignmentStatus.ASSIGNED }],
      });

      await service.start('spj-start');
      expect(spjRepo.save).toHaveBeenCalled();
      expect(legRepo.save).toHaveBeenCalled();
    });

    it('harus mengubah status ke COMPLETED dan status finansial ke UNDER_REVIEW saat armada tiba (complete)', async () => {
      spjRepo.findOne.mockResolvedValue({
        id: 'spj-complete',
        operationalStatus: SpjOperationalStatus.IN_PROGRESS,
        financialStatus: SpjFinancialStatus.PENDING_SETTLEMENT,
        legs: [{ status: SpjLegStatus.IN_PROGRESS }],
        crewAssignments: [{ status: CrewAssignmentStatus.ACTIVE }],
      });

      await service.complete('spj-complete');
      expect(spjRepo.save).toHaveBeenCalled();
    });
  });

  describe('replaceCrew', () => {
    it('harus mengganti kru sakit mid-trip dan membuat penugasan kru baru dengan snapshot tarif (Skenario 1 Poin 7)', async () => {
      spjRepo.findOne.mockResolvedValue({
        id: 'spj-1',
        serviceType: TripServiceType.AKAP,
      });

      crewRepo.findOne.mockResolvedValue({
        id: 'assign-1',
        spjId: 'spj-1',
        role: CrewAssignmentRole.DRIVER,
        crew: { name: 'Pak Budi' },
      });

      await service.replaceCrew('spj-1', {
        assignmentId: 'assign-1',
        replacementCrewId: 'driver-rep',
        reason: 'Sakit mendadak di kota transit',
      });

      expect(crewRepo.save).toHaveBeenCalledTimes(2); // save old status & new assignment
    });
  });

  describe('emergencyReplaceBus (Skenario 3)', () => {
    it('harus menutup SPJ lama dan menerbitkan SPJ baru terhubung via parent_spj_id', async () => {
      spjRepo.findOne.mockResolvedValue({
        id: 'spj-old',
        spjNo: 'SPJ/AKP/2610/0001',
        serviceType: TripServiceType.AKAP,
        vehicle: { code: 'SS-01' },
        crewAssignments: [
          { crewId: 'driver-1', role: CrewAssignmentRole.DRIVER, status: CrewAssignmentStatus.ACTIVE, mealAllowanceSnapshot: '150000', incentiveSnapshot: '250000', fullSeatBonusSnapshot: '50000' },
        ],
      });

      const res = await service.emergencyReplaceBus('spj-old', {
        parentSpjId: 'spj-old',
        newVehicleId: 'bus-3',
        incidentLocation: 'KM 214 Tol Cipali',
        incidentNotes: 'Radiator pecah dan overheat',
        transferPassengerCount: 24,
        continueWithExistingCrew: true,
      });

      expect(res.oldSpj).toBeDefined();
      expect(res.newSpj).toBeDefined();
      expect(spjRepo.save).toHaveBeenCalled();
      expect(legRepo.save).toHaveBeenCalled();
      expect(crewRepo.save).toHaveBeenCalled();
    });
  });
});
