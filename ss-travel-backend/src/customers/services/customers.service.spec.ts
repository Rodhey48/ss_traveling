import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { CustomersService } from './customers.service';
import {
  CustomerEntity,
  CompanyEntity,
  CustomerType,
  CustomerTier,
  LeadSource,
} from '@models';

describe('CustomersService', () => {
  let service: CustomersService;
  let customerRepo: any;
  let companyRepo: any;

  beforeEach(async () => {
    customerRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      count: jest.fn(),
      createQueryBuilder: jest.fn(),
      create: jest.fn().mockImplementation((dto) => ({ id: 'new-id', ...dto })),
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
      remove: jest.fn().mockResolvedValue(true),
    };

    companyRepo = {
      findOne: jest.fn().mockResolvedValue({ id: 'comp-uuid', code: 'SST' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomersService,
        {
          provide: getRepositoryToken(CustomerEntity),
          useValue: customerRepo,
        },
        {
          provide: getRepositoryToken(CompanyEntity),
          useValue: companyRepo,
        },
      ],
    }).compile();

    service = module.get<CustomersService>(CustomersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated list of customers', async () => {
      const mockQueryBuilder: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([
          [{ id: '1', code: 'CUST-0001', institutionName: 'PT Mitra Sejahtera' }],
          1,
        ]),
      };
      customerRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findAll({ page: 1, limit: 10 });
      expect(result.status).toBe(true);
      expect(result.data.data.length).toBe(1);
      expect(result.data.total).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should return customer details if found', async () => {
      const mockCust = { id: 'c1', code: 'CUST-0001', picName: 'Aris' };
      customerRepo.findOne.mockResolvedValue(mockCust);

      const result = await service.findOne('c1');
      expect(result.status).toBe(true);
      expect(result.data.code).toBe('CUST-0001');
    });

    it('should throw NotFoundException if customer not found', async () => {
      customerRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should auto-generate code CUST-XXXX when code is not provided', async () => {
      customerRepo.count.mockResolvedValue(5);
      customerRepo.findOne.mockResolvedValue(null);

      const result = await service.create({
        customerType: CustomerType.CORPORATE,
        institutionName: 'PT Baru',
        picName: 'Pak Budi',
        phone: '081234567890',
        leadSource: LeadSource.DIRECT,
        customerTier: CustomerTier.BRONZE,
      });

      expect(result.status).toBe(true);
      expect(result.data.code).toBe('CUST-0006');
    });

    it('should throw ConflictException if code already exists', async () => {
      customerRepo.findOne.mockResolvedValue({ id: 'existing', code: 'CUST-0001' });

      await expect(
        service.create({
          code: 'CUST-0001',
          customerType: CustomerType.CORPORATE,
          picName: 'Pak Budi',
          phone: '081234567890',
          leadSource: LeadSource.DIRECT,
          customerTier: CustomerTier.BRONZE,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('autocomplete', () => {
    it('should return list of matching active customers', async () => {
      const mockQueryBuilder: any = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([
          { id: '1', code: 'CUST-0001', institutionName: 'PT Mitra Sejahtera' },
        ]),
      };
      customerRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.autocomplete('Mitra');
      expect(result.status).toBe(true);
      expect(result.data.length).toBe(1);
      expect(result.data[0].institutionName).toBe('PT Mitra Sejahtera');
    });
  });
});
