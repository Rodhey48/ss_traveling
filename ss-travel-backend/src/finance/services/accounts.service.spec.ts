import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { AccountEntity, AccountType, NormalBalance } from '../../@models/finance/account.entity';

describe('AccountsService', () => {
  let service: AccountsService;
  let accountRepo: any;

  beforeEach(async () => {
    accountRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      count: jest.fn(),
      createQueryBuilder: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountsService,
        {
          provide: getRepositoryToken(AccountEntity),
          useValue: accountRepo,
        },
      ],
    }).compile();

    service = module.get<AccountsService>(AccountsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create an account successfully', async () => {
      accountRepo.findOne.mockResolvedValue(null);
      accountRepo.create.mockImplementation((dto: any) => ({
        id: 'acc-1',
        ...dto,
      }));
      accountRepo.save.mockImplementation(async (acc: any) => acc);

      const result = await service.create({
        code: '11101',
        name: 'Kas Operasional Pool Ciputat',
        type: AccountType.ASSET,
        normalBalance: NormalBalance.DEBIT,
        isPostable: true,
      });

      expect(result.code).toBe('11101');
      expect(result.name).toBe('Kas Operasional Pool Ciputat');
      expect(accountRepo.save).toHaveBeenCalled();
    });

    it('should throw ConflictException if code already exists', async () => {
      accountRepo.findOne.mockResolvedValue({ id: 'existing', code: '11101' });

      await expect(
        service.create({
          code: '11101',
          name: 'Kas Duplicate',
          type: AccountType.ASSET,
          normalBalance: NormalBalance.DEBIT,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException if parentId does not exist', async () => {
      accountRepo.findOne
        .mockResolvedValueOnce(null) // code check
        .mockResolvedValueOnce(null); // parent check

      await expect(
        service.create({
          code: '11101',
          name: 'Kas Sub',
          type: AccountType.ASSET,
          normalBalance: NormalBalance.DEBIT,
          parentId: 'non-existent-parent',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return hierarchical tree when tree=true', async () => {
      const mockAccounts = [
        {
          id: 'acc-1',
          code: '1',
          name: 'ASET',
          type: AccountType.ASSET,
          normalBalance: NormalBalance.DEBIT,
          parentId: null,
          isPostable: false,
          isActive: true,
        },
        {
          id: 'acc-11',
          code: '11',
          name: 'Kas dan Bank',
          type: AccountType.ASSET,
          normalBalance: NormalBalance.DEBIT,
          parentId: 'acc-1',
          isPostable: false,
          isActive: true,
        },
        {
          id: 'acc-11101',
          code: '11101',
          name: 'Kas Pool Ciputat',
          type: AccountType.ASSET,
          normalBalance: NormalBalance.DEBIT,
          parentId: 'acc-11',
          isPostable: true,
          isActive: true,
        },
      ];

      const qb: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockAccounts),
      };
      accountRepo.createQueryBuilder.mockReturnValue(qb);

      const tree = (await service.findAll({ tree: true })) as any[];

      expect(tree).toHaveLength(1);
      expect(tree[0].code).toBe('1');
      expect(tree[0].children).toHaveLength(1);
      expect(tree[0].children[0].code).toBe('11');
      expect(tree[0].children[0].children).toHaveLength(1);
      expect(tree[0].children[0].children[0].code).toBe('11101');
    });
  });

  describe('update', () => {
    it('should reject circular parent reference', async () => {
      const accRoot = { id: 'root', code: '1', parentId: null };
      const accChild = { id: 'child', code: '11', parentId: 'root' };

      accountRepo.findOne
        .mockResolvedValueOnce(accRoot) // findOne('root')
        .mockResolvedValueOnce(accChild); // checkIsDescendant step

      await expect(
        service.update('root', {
          parentId: 'child',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject setting parentId to itself', async () => {
      accountRepo.findOne.mockResolvedValueOnce({ id: 'acc-1', code: '1' });

      await expect(
        service.update('acc-1', {
          parentId: 'acc-1',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('delete', () => {
    it('should reject deleting account if it still has sub-accounts', async () => {
      accountRepo.findOne.mockResolvedValue({ id: 'parent-id', code: '11' });
      accountRepo.count.mockResolvedValue(3); // 3 children

      await expect(service.delete('parent-id')).rejects.toThrow(BadRequestException);
    });

    it('should soft delete account if it has no children', async () => {
      const acc = { id: 'leaf-id', code: '11101', name: 'Kas Ciputat', isActive: true };
      accountRepo.findOne.mockResolvedValue(acc);
      accountRepo.count.mockResolvedValue(0);
      accountRepo.save.mockImplementation(async (a: any) => a);

      const result = await service.delete('leaf-id');

      expect(result.success).toBe(true);
      expect(acc.isActive).toBe(false);
    });
  });
});
