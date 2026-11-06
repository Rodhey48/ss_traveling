import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { FundTransfersService } from './fund-transfers.service';
import { FundTransferEntity } from '../../@models/finance/fund-transfer.entity';
import { BankAccountEntity } from '../../@models/finance/bank-account.entity';
import { CashAccountEntity } from '../../@models/finance/cash-account.entity';
import { FundTransferStatus, FundTransferType } from '../../@models/finance/finance.enums';
import { DocumentSequenceService } from './document-sequence.service';
import { AccountingPostingService } from './accounting-posting.service';

describe('FundTransfersService', () => {
  let service: FundTransfersService;
  let fundTransferRepo: any;
  let bankAccountRepo: any;
  let cashAccountRepo: any;
  let documentSeqService: any;
  let accountingPostingService: any;
  let dataSource: any;

  const mockUser = {
    id: 'user-manager-1',
    companyId: 'comp-1',
    name: 'Finance Manager',
  };

  const mockSourceBank: Partial<BankAccountEntity> = {
    id: 'bank-main-1',
    bankName: 'BCA Main',
    accountId: 'acc-gl-11111',
    isActive: true,
  };

  const mockTargetBank: Partial<BankAccountEntity> = {
    id: 'bank-ops-1',
    bankName: 'BCA Ops AKAP',
    accountId: 'acc-gl-11121',
    isActive: true,
  };

  const mockTargetCash: Partial<CashAccountEntity> = {
    id: 'cash-pool-1',
    name: 'Kas Pool Ciputat',
    accountId: 'acc-gl-11101',
    isActive: true,
  };

  beforeEach(async () => {
    fundTransferRepo = {
      create: jest.fn().mockImplementation((dto) => ({ id: 'trf-1', ...dto })),
      save: jest.fn().mockImplementation((entity) => Promise.resolve({ id: 'trf-1', ...entity })),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      }),
    };

    bankAccountRepo = {
      findOne: jest.fn().mockImplementation(({ where }: any) => {
        if (where.id === 'bank-main-1') return Promise.resolve(mockSourceBank);
        if (where.id === 'bank-ops-1') return Promise.resolve(mockTargetBank);
        return Promise.resolve(null);
      }),
    };

    cashAccountRepo = {
      findOne: jest.fn().mockImplementation(({ where }: any) => {
        if (where.id === 'cash-pool-1') return Promise.resolve(mockTargetCash);
        return Promise.resolve(null);
      }),
    };

    documentSeqService = {
      getNextDocumentNumber: jest.fn().mockResolvedValue('TRF/2610/0001'),
    };

    accountingPostingService = {
      postJournal: jest.fn().mockResolvedValue({ id: 'jv-1', journalNo: 'JV/2610/0001' }),
    };

    dataSource = {
      transaction: jest.fn().mockImplementation((cb) => {
        const mockEm = {
          findOne: jest.fn(),
          save: jest.fn().mockImplementation((_, entity) => Promise.resolve(entity)),
        };
        return cb(mockEm);
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FundTransfersService,
        { provide: getRepositoryToken(FundTransferEntity), useValue: fundTransferRepo },
        { provide: getRepositoryToken(BankAccountEntity), useValue: bankAccountRepo },
        { provide: getRepositoryToken(CashAccountEntity), useValue: cashAccountRepo },
        { provide: DocumentSequenceService, useValue: documentSeqService },
        { provide: AccountingPostingService, useValue: accountingPostingService },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get<FundTransfersService>(FundTransfersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should successfully create a pending transfer between banks', async () => {
      const dto = {
        transferType: FundTransferType.MAIN_TO_OPS,
        sourceBankAccountId: 'bank-main-1',
        targetBankAccountId: 'bank-ops-1',
        amount: '15000000.00',
        purpose: 'Dropping plafon operasional AKAP rute Jogja',
      };

      const result = await service.create(mockUser, dto);
      expect(result).toBeDefined();
      expect(fundTransferRepo.create).toHaveBeenCalled();
      expect(documentSeqService.getNextDocumentNumber).toHaveBeenCalledWith(
        'FUND_TRANSFER',
        expect.any(String),
        expect.stringContaining('TRF/'),
      );
      expect(fundTransferRepo.save).toHaveBeenCalled();
      expect(result.status).toBe(FundTransferStatus.PENDING_APPROVAL);
    });

    it('should throw NotFoundException if source bank is missing', async () => {
      const dto = {
        transferType: FundTransferType.MAIN_TO_OPS,
        sourceBankAccountId: 'invalid-bank',
        targetBankAccountId: 'bank-ops-1',
        amount: '5000000.00',
        purpose: 'Test',
      };

      await expect(service.create(mockUser, dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if amount is zero or negative', async () => {
      const dto = {
        transferType: FundTransferType.MAIN_TO_OPS,
        sourceBankAccountId: 'bank-main-1',
        targetBankAccountId: 'bank-ops-1',
        amount: '0',
        purpose: 'Test',
      };

      await expect(service.create(mockUser, dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return list of transfers with query filter', async () => {
      const qbMock: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([
          { id: 'trf-1', transferNo: 'TRF/2610/0001', amount: '10000000.00' },
        ]),
      };
      fundTransferRepo.createQueryBuilder.mockReturnValue(qbMock);

      const result = await service.findAll({
        status: FundTransferStatus.PENDING_APPROVAL,
        search: 'Dropping',
      });

      expect(result).toBeDefined();
      expect(result.length).toBe(1);
      expect(result[0].transferNo).toBe('TRF/2610/0001');
    });
  });

  describe('findOne', () => {
    it('should return a transfer by id', async () => {
      fundTransferRepo.findOne.mockResolvedValueOnce({
        id: 'trf-1',
        transferNo: 'TRF/2610/0001',
      });

      const res = await service.findOne('trf-1');
      expect(res).toBeDefined();
      expect(res.transferNo).toBe('TRF/2610/0001');
    });

    it('should throw NotFoundException if transfer does not exist', async () => {
      fundTransferRepo.findOne.mockResolvedValueOnce(null);
      await expect(service.findOne('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('approve', () => {
    it('should approve pending transfer and post GL journal', async () => {
      const mockPendingTransfer: any = {
        id: 'trf-1',
        transferNo: 'TRF/2610/0001',
        status: FundTransferStatus.PENDING_APPROVAL,
        amount: '10000000.00',
        purpose: 'Dropping plafon UJ',
        sourceBankAccount: mockSourceBank,
        targetBankAccount: mockTargetBank,
      };

      dataSource.transaction.mockImplementation(async (cb: any) => {
        const em = {
          findOne: jest.fn().mockResolvedValue(mockPendingTransfer),
          save: jest.fn().mockImplementation((_, entity) => Promise.resolve(entity)),
        };
        return cb(em);
      });

      const approved = await service.approve('trf-1', mockUser);
      expect(approved).toBeDefined();
      expect(approved.status).toBe(FundTransferStatus.APPROVED);
      expect(approved.approvedById).toBe(mockUser.id);
      expect(accountingPostingService.postJournal).toHaveBeenCalled();
    });

    it('should throw BadRequestException if transfer is already approved', async () => {
      const mockAlreadyApproved: any = {
        id: 'trf-1',
        status: FundTransferStatus.APPROVED,
      };

      dataSource.transaction.mockImplementation(async (cb: any) => {
        const em = {
          findOne: jest.fn().mockResolvedValue(mockAlreadyApproved),
        };
        return cb(em);
      });

      await expect(service.approve('trf-1', mockUser)).rejects.toThrow(BadRequestException);
    });
  });

  describe('reject', () => {
    it('should reject pending transfer with reason', async () => {
      fundTransferRepo.findOne.mockResolvedValueOnce({
        id: 'trf-1',
        transferNo: 'TRF/2610/0001',
        status: FundTransferStatus.PENDING_APPROVAL,
      });

      const rejected = await service.reject('trf-1', mockUser, {
        rejectionReason: 'Saldo rekening sumber tidak mencukupi',
      });

      expect(rejected).toBeDefined();
      expect(rejected.status).toBe(FundTransferStatus.REJECTED);
      expect(rejected.rejectionReason).toBe('Saldo rekening sumber tidak mencukupi');
      expect(fundTransferRepo.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException if transfer is not in pending status', async () => {
      fundTransferRepo.findOne.mockResolvedValueOnce({
        id: 'trf-1',
        status: FundTransferStatus.APPROVED,
      });

      await expect(
        service.reject('trf-1', mockUser, { rejectionReason: 'Test' }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
