import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import {
  CompanyEntity,
  BusinessUnitEntity,
  CostCenterEntity,
  ProfitCenterEntity,
} from '@models';

describe('OrganizationService', () => {
  let service: OrganizationService;
  let companyRepo: any;
  let buRepo: any;
  let ccRepo: any;
  let pcRepo: any;

  beforeEach(async () => {
    companyRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
    };
    buRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn((dto) => dto),
      save: jest.fn((entity) => Promise.resolve({ id: 'bu-1', ...entity })),
      remove: jest.fn(),
    };
    ccRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn((dto) => dto),
      save: jest.fn((entity) => Promise.resolve({ id: 'cc-1', ...entity })),
      remove: jest.fn(),
    };
    pcRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn((dto) => dto),
      save: jest.fn((entity) => Promise.resolve({ id: 'pc-1', ...entity })),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationService,
        {
          provide: getRepositoryToken(CompanyEntity),
          useValue: companyRepo,
        },
        {
          provide: getRepositoryToken(BusinessUnitEntity),
          useValue: buRepo,
        },
        {
          provide: getRepositoryToken(CostCenterEntity),
          useValue: ccRepo,
        },
        {
          provide: getRepositoryToken(ProfitCenterEntity),
          useValue: pcRepo,
        },
      ],
    }).compile();

    service = module.get<OrganizationService>(OrganizationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Company Profile', () => {
    it('should return company profile if exists', async () => {
      const mockComp = { id: 'c-1', code: 'SST', name: 'PT SS Travelink Official' };
      companyRepo.findOne.mockResolvedValue(mockComp);

      const result = await service.getCompanyProfile();
      expect(result.status).toBe(true);
      expect(result.data).toEqual(mockComp);
    });

    it('should throw NotFoundException if company not found', async () => {
      companyRepo.findOne.mockResolvedValue(null);
      await expect(service.getCompanyProfile()).rejects.toThrow(NotFoundException);
    });

    it('should update company profile', async () => {
      const mockComp = { id: 'c-1', code: 'SST', name: 'PT SS Travelink Official' };
      companyRepo.findOne.mockResolvedValue(mockComp);
      companyRepo.save.mockResolvedValue({ ...mockComp, phone: '08123456789' });

      const result = await service.updateCompanyProfile('c-1', { phone: '08123456789' });
      expect(result.status).toBe(true);
      expect(result.data.phone).toBe('08123456789');
    });
  });

  describe('Business Units', () => {
    it('should return all business units', async () => {
      buRepo.find.mockResolvedValue([{ id: 'bu-1', code: 'AKAP', name: 'AKAP' }]);
      const res = await service.findAllBusinessUnits();
      expect(res.status).toBe(true);
      expect(res.data).toHaveLength(1);
    });

    it('should create business unit if code is unique', async () => {
      buRepo.findOne.mockResolvedValue(null);
      companyRepo.findOne.mockResolvedValue({ id: 'c-1', code: 'SST' });

      const res = await service.createBusinessUnit({
        code: 'WISATA',
        name: 'Pariwisata',
      });
      expect(res.status).toBe(true);
      expect(res.data.code).toBe('WISATA');
    });

    it('should throw ConflictException if BU code already exists', async () => {
      buRepo.findOne.mockResolvedValue({ id: 'bu-1', code: 'AKAP' });
      await expect(
        service.createBusinessUnit({ code: 'AKAP', name: 'AKAP Duplicate' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should remove business unit if exists', async () => {
      const mockBu = { id: 'bu-1', code: 'AKAP' };
      buRepo.findOne.mockResolvedValue(mockBu);
      buRepo.remove.mockResolvedValue(mockBu);

      const res = await service.removeBusinessUnit('bu-1');
      expect(res.status).toBe(true);
      expect(buRepo.remove).toHaveBeenCalledWith(mockBu);
    });
  });

  describe('Cost Centers', () => {
    it('should return all cost centers', async () => {
      ccRepo.find.mockResolvedValue([{ id: 'cc-1', code: 'CC-OPS-POOL', name: 'Pool' }]);
      const res = await service.findAllCostCenters();
      expect(res.status).toBe(true);
      expect(res.data).toHaveLength(1);
    });

    it('should create cost center if code is unique', async () => {
      ccRepo.findOne.mockResolvedValue(null);
      companyRepo.findOne.mockResolvedValue({ id: 'c-1', code: 'SST' });

      const res = await service.createCostCenter({
        code: 'CC-OPS-AKAP',
        name: 'Operasional AKAP',
      });
      expect(res.status).toBe(true);
      expect(res.data.code).toBe('CC-OPS-AKAP');
    });

    it('should remove cost center if exists', async () => {
      const mockCc = { id: 'cc-1', code: 'CC-OPS-POOL' };
      ccRepo.findOne.mockResolvedValue(mockCc);
      ccRepo.remove.mockResolvedValue(mockCc);

      const res = await service.removeCostCenter('cc-1');
      expect(res.status).toBe(true);
      expect(ccRepo.remove).toHaveBeenCalledWith(mockCc);
    });
  });

  describe('Profit Centers', () => {
    it('should return all profit centers', async () => {
      pcRepo.find.mockResolvedValue([{ id: 'pc-1', code: 'PC-AKAP', name: 'PC AKAP' }]);
      const res = await service.findAllProfitCenters();
      expect(res.status).toBe(true);
      expect(res.data).toHaveLength(1);
    });

    it('should create profit center if code is unique', async () => {
      pcRepo.findOne.mockResolvedValue(null);
      companyRepo.findOne.mockResolvedValue({ id: 'c-1', code: 'SST' });

      const res = await service.createProfitCenter({
        code: 'PC-WISATA',
        name: 'Profit Center Wisata',
      });
      expect(res.status).toBe(true);
      expect(res.data.code).toBe('PC-WISATA');
    });

    it('should remove profit center if exists', async () => {
      const mockPc = { id: 'pc-1', code: 'PC-AKAP' };
      pcRepo.findOne.mockResolvedValue(mockPc);
      pcRepo.remove.mockResolvedValue(mockPc);

      const res = await service.removeProfitCenter('pc-1');
      expect(res.status).toBe(true);
      expect(pcRepo.remove).toHaveBeenCalledWith(mockPc);
    });
  });
});
