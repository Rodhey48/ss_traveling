import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { FiscalPeriodsService } from './fiscal-periods.service';
import {
  FiscalYearEntity,
  FiscalYearStatus,
} from '../../@models/finance/fiscal-year.entity';
import {
  FiscalPeriodEntity,
  FiscalPeriodStatus,
} from '../../@models/finance/fiscal-period.entity';

describe('FiscalPeriodsService', () => {
  let service: FiscalPeriodsService;
  let yearRepo: any;
  let periodRepo: any;

  beforeEach(async () => {
    yearRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn((dto) => dto),
      save: jest.fn((entity) => Promise.resolve({ id: 'fy-2027', ...entity })),
    };

    periodRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn((dto) => dto),
      save: jest.fn((entity) => Promise.resolve({ id: 'p-1', ...entity })),
      createQueryBuilder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FiscalPeriodsService,
        {
          provide: getRepositoryToken(FiscalYearEntity),
          useValue: yearRepo,
        },
        {
          provide: getRepositoryToken(FiscalPeriodEntity),
          useValue: periodRepo,
        },
      ],
    }).compile();

    service = module.get<FiscalPeriodsService>(FiscalPeriodsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createFiscalYear', () => {
    it('should create fiscal year and auto-generate 12 monthly periods', async () => {
      yearRepo.findOne.mockResolvedValueOnce(null); // check existing
      yearRepo.findOne.mockResolvedValueOnce({
        id: 'fy-2027',
        year: 2027,
        periods: [],
      }); // findOneFiscalYear

      const res = await service.createFiscalYear({
        year: 2027,
        startDate: '2027-01-01',
        endDate: '2027-12-31',
      });

      expect(yearRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          year: 2027,
          status: FiscalYearStatus.OPEN,
        }),
      );
      expect(periodRepo.save).toHaveBeenCalledTimes(12);
      expect(res.year).toBe(2027);
    });

    it('should throw ConflictException if fiscal year already exists', async () => {
      yearRepo.findOne.mockResolvedValueOnce({ id: 'fy-2026', year: 2026 });
      await expect(
        service.createFiscalYear({
          year: 2026,
          startDate: '2026-01-01',
          endDate: '2026-12-31',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findOneFiscalYear', () => {
    it('should return fiscal year with sorted periods', async () => {
      const mockYear = {
        id: 'fy-2026',
        year: 2026,
        periods: [
          { id: 'p-2', periodNo: 2 },
          { id: 'p-1', periodNo: 1 },
        ],
      };
      yearRepo.findOne.mockResolvedValue(mockYear);

      const res = await service.findOneFiscalYear('fy-2026');
      expect(res.periods[0].periodNo).toBe(1);
      expect(res.periods[1].periodNo).toBe(2);
    });

    it('should throw NotFoundException if fiscal year not found', async () => {
      yearRepo.findOne.mockResolvedValue(null);
      await expect(service.findOneFiscalYear('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updatePeriodStatus', () => {
    it('should set status to CLOSED and record closedAt and closeReason', async () => {
      const mockPeriod = {
        id: 'p-1',
        name: 'Januari 2026',
        status: FiscalPeriodStatus.OPEN,
      };
      periodRepo.findOne.mockResolvedValue(mockPeriod);

      const res = await service.updatePeriodStatus(
        'p-1',
        {
          status: FiscalPeriodStatus.CLOSED,
          reason: 'Tutup buku rutin bulanan',
        },
        'user-1',
      );

      expect(res.status).toBe(FiscalPeriodStatus.CLOSED);
      expect(res.closedBy).toBe('user-1');
      expect(res.closeReason).toBe('Tutup buku rutin bulanan');
    });

    it('should require reason when reopening a period', async () => {
      const mockPeriod = {
        id: 'p-1',
        name: 'Januari 2026',
        status: FiscalPeriodStatus.CLOSED,
      };
      periodRepo.findOne.mockResolvedValue(mockPeriod);

      await expect(
        service.updatePeriodStatus('p-1', {
          status: FiscalPeriodStatus.REOPENED,
          reason: '',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findOpenPeriodForDate', () => {
    it('should return open period for valid date', async () => {
      const qb: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue({
          id: 'p-1',
          name: 'Januari 2026',
          status: FiscalPeriodStatus.OPEN,
        }),
      };
      periodRepo.createQueryBuilder.mockReturnValue(qb);

      const res = await service.findOpenPeriodForDate('2026-01-15');
      expect(res.status).toBe(FiscalPeriodStatus.OPEN);
    });

    it('should throw BadRequestException if period is CLOSED', async () => {
      const qb: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue({
          id: 'p-1',
          name: 'Januari 2026',
          status: FiscalPeriodStatus.CLOSED,
        }),
      };
      periodRepo.createQueryBuilder.mockReturnValue(qb);

      await expect(service.findOpenPeriodForDate('2026-01-15')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException if date has no fiscal period configured', async () => {
      const qb: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };
      periodRepo.createQueryBuilder.mockReturnValue(qb);

      await expect(service.findOpenPeriodForDate('2099-01-15')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
