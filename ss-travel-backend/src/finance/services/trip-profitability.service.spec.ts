import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { TripProfitabilityService } from './trip-profitability.service';
import { SpjEntity } from '../../@models/trips/spj.entity';
import { VehicleEntity } from '../../@models/fleet/vehicle.entity';
import { JournalLineEntity } from '../../@models/finance/journal-line.entity';
import {
  TripServiceType,
  SpjFinancialStatus,
  CrewAssignmentRole,
} from '../../@models/trips/trip.enums';
import { TripProfitabilityViewMode } from '../../@dto/finance/reports.dto';

describe('TripProfitabilityService', () => {
  let service: TripProfitabilityService;
  let spjRepo: any;
  let vehicleRepo: any;
  let lineRepo: any;
  let dataSource: any;

  beforeEach(async () => {
    spjRepo = {
      createQueryBuilder: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
    };
    vehicleRepo = {
      find: jest.fn(),
    };
    lineRepo = {
      createQueryBuilder: jest.fn(),
    };
    dataSource = {
      query: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TripProfitabilityService,
        { provide: getRepositoryToken(SpjEntity), useValue: spjRepo },
        { provide: getRepositoryToken(VehicleEntity), useValue: vehicleRepo },
        { provide: getRepositoryToken(JournalLineEntity), useValue: lineRepo },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get<TripProfitabilityService>(TripProfitabilityService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getTripProfitability (Skenario 3: Breakdown & Penggantian Armada)', () => {
    const parentSpj = {
      id: 'spj-parent',
      spjNo: 'SPJ/AKP/2610/0001',
      serviceType: TripServiceType.AKAP,
      vehicleId: 'veh-ss-01',
      vehicle: { code: 'SS-01', plateNumber: 'B 7001 SS' },
      financialStatus: SpjFinancialStatus.SETTLED,
      issuedAt: new Date('2026-10-18T07:00:00Z'),
      parentSpjId: null,
      crewAssignments: [{ role: CrewAssignmentRole.DRIVER, crew: { name: 'Bambang' } }],
      legs: [{ origin: 'Jakarta', destination: 'Yogyakarta', passengerCount: 22 }],
      revenueDeclarations: [],
    };

    const childSpj = {
      id: 'spj-child',
      spjNo: 'SPJ/AKP/2610/0002',
      serviceType: TripServiceType.AKAP,
      vehicleId: 'veh-ss-03',
      vehicle: { code: 'SS-03', plateNumber: 'B 7003 SS' },
      financialStatus: SpjFinancialStatus.SETTLED,
      issuedAt: new Date('2026-10-18T14:00:00Z'),
      parentSpjId: 'spj-parent',
      crewAssignments: [{ role: CrewAssignmentRole.DRIVER, crew: { name: 'Joko' } }],
      legs: [{ origin: 'Jakarta', destination: 'Yogyakarta', passengerCount: 22 }],
      revenueDeclarations: [],
    };

    it('should consolidate into 1 journey group under BY_JOURNEY_GROUP mode', async () => {
      const spjQb: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([parentSpj, childSpj]),
      };
      spjRepo.createQueryBuilder.mockReturnValue(spjQb);

      // Baris finansial:
      // Parent: Beban Derek SS-01 Rp 1.500.000
      // Child: Omzet Tiket Rp 6.000.000, Omzet Kargo Rp 350.000, Solar Rp 1.200.000, Tol Rp 800.000, Uang Makan Kru Rp 600.000
      dataSource.query.mockResolvedValue([
        {
          tripId: 'spj-parent',
          vehicleId: 'veh-ss-01',
          accountCode: '55101',
          accountName: 'Beban Derek Bengkel',
          accountType: 'EXPENSE',
          debit: '1500000.00',
          credit: '0.00',
          description: 'Derek SS-01',
        },
        {
          tripId: 'spj-child',
          vehicleId: 'veh-ss-03',
          accountCode: '41101',
          accountName: 'Pendapatan Tiket',
          accountType: 'REVENUE',
          debit: '0.00',
          credit: '6000000.00',
          description: 'Tiket AKP',
        },
        {
          tripId: 'spj-child',
          vehicleId: 'veh-ss-03',
          accountCode: '43101',
          accountName: 'Pendapatan Kargo',
          accountType: 'REVENUE',
          debit: '0.00',
          credit: '350000.00',
          description: 'Paket',
        },
        {
          tripId: 'spj-child',
          vehicleId: 'veh-ss-03',
          accountCode: '51101',
          accountName: 'Beban BBM Solar',
          accountType: 'EXPENSE',
          debit: '1200000.00',
          credit: '0.00',
          description: 'BBM',
        },
        {
          tripId: 'spj-child',
          vehicleId: 'veh-ss-03',
          accountCode: '52101',
          accountName: 'Beban Tol Trans Jawa',
          accountType: 'EXPENSE',
          debit: '800000.00',
          credit: '0.00',
          description: 'Tol',
        },
        {
          tripId: 'spj-child',
          vehicleId: 'veh-ss-03',
          accountCode: '53101',
          accountName: 'Uang Makan Kru',
          accountType: 'EXPENSE',
          debit: '600000.00',
          credit: '0.00',
          description: 'Makan Kru',
        },
      ]);

      const result = await service.getTripProfitability({
        viewMode: TripProfitabilityViewMode.BY_JOURNEY_GROUP,
      });

      expect(result.items).toHaveLength(1); // Konsolidasi jadi 1 perjalanan ekonomi
      const groupItem = result.items[0];
      expect(groupItem.journeyGroupId).toBe('spj-parent');
      expect(groupItem.vehicleCode).toContain('SS-01');
      expect(groupItem.vehicleCode).toContain('SS-03');
      expect(groupItem.hasReplacement).toBe(true);

      // Bruto: 6.000.000 + 350.000 = 6.350.000
      expect(groupItem.grossRevenue).toBe('6350000.00');
      // Direct Costs: 1.5M (derek) + 1.2M (solar) + 800rb (tol) + 600rb (kru) = 4.100.000
      expect(groupItem.totalDirectCost).toBe('4100000.00');
      // Margin: 6.350.000 - 4.100.000 = 2.250.000
      expect(groupItem.contributionMargin).toBe('2250000.00');
      expect(groupItem.contributionMarginRatio).toBeGreaterThan(0);
    });

    it('should isolate bus assets individually under BY_BUS mode', async () => {
      const spjQb: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([parentSpj, childSpj]),
      };
      spjRepo.createQueryBuilder.mockReturnValue(spjQb);

      dataSource.query.mockResolvedValue([
        {
          tripId: 'spj-parent',
          vehicleId: 'veh-ss-01',
          accountCode: '55101',
          accountName: 'Beban Derek',
          accountType: 'EXPENSE',
          debit: '1500000.00',
          credit: '0.00',
          description: 'Derek',
        },
        {
          tripId: 'spj-child',
          vehicleId: 'veh-ss-03',
          accountCode: '41101',
          accountName: 'Pendapatan Tiket',
          accountType: 'REVENUE',
          debit: '0.00',
          credit: '6000000.00',
          description: 'Tiket',
        },
      ]);

      const result = await service.getTripProfitability({
        viewMode: TripProfitabilityViewMode.BY_BUS,
      });

      expect(result.items).toHaveLength(2); // Dua baris terpisah untuk SS-01 dan SS-03

      const ss01 = result.items.find((i) => i.vehicleCode === 'SS-01');
      const ss03 = result.items.find((i) => i.vehicleCode === 'SS-03');

      expect(ss01).toBeDefined();
      expect(ss01?.contributionMargin).toBe('-1500000.00'); // Defisit karena menanggung beban derek

      expect(ss03).toBeDefined();
      expect(ss03?.grossRevenue).toBe('6000000.00');
      expect(ss03?.contributionMargin).toBe('6000000.00');
    });
  });
});
