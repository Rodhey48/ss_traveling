import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersEntity, UserRolesEntity, RolesEntity } from '@models';
import { NotFoundException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('UsersService', () => {
  let service: UsersService;
  let usersRepo: any;
  let userRolesRepo: any;
  let rolesRepo: any;

  const mockUser: any = {
    id: 'user-uuid-1',
    name: 'Budi Supir',
    email: 'budi@sstravel.com',
    nip: 'SST-001',
    phone: '08123456789',
    type: 'employee',
    isActive: true,
    isPasswordChanged: true,
    password: '$2b$10$hashedpassword',
    roles: [
      {
        id: 'ur-1',
        role: { id: 'role-uuid-1', name: 'CREW_DRIVER' },
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const createMockQueryBuilder = (result: any = [[mockUser], 1]) => ({
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue(result),
    getCount: jest.fn().mockResolvedValue(result[1] || 1),
  });

  beforeEach(async () => {
    usersRepo = {
      createQueryBuilder: jest.fn().mockReturnValue(createMockQueryBuilder()),
      findAndCount: jest.fn().mockResolvedValue([[mockUser], 1]),
      findOne: jest.fn().mockResolvedValue(mockUser),
      count: jest.fn().mockResolvedValue(1),
      save: jest.fn().mockImplementation((user) => Promise.resolve({ ...user, id: user.id || 'new-uuid' })),
    };

    userRolesRepo = {
      save: jest.fn().mockResolvedValue({ id: 'ur-new' }),
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
    };

    rolesRepo = {
      findOne: jest.fn().mockResolvedValue({ id: 'role-uuid-1', name: 'CREW_DRIVER' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(UsersEntity),
          useValue: usersRepo,
        },
        {
          provide: getRepositoryToken(UserRolesEntity),
          useValue: userRolesRepo,
        },
        {
          provide: getRepositoryToken(RolesEntity),
          useValue: rolesRepo,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated users with defaults', async () => {
      const result = await service.findAll(1, 10, '');
      expect(result.status).toBe(true);
      expect(result.data.data).toHaveLength(1);
      expect(result.data.total).toBe(1);
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(10);
    });

    it('should apply filters for search, type, isActive, and roleId', async () => {
      const qb = createMockQueryBuilder([[mockUser], 1]);
      usersRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findAll(2, 20, 'Budi', 'employee', 'true', 'role-uuid-1');
      expect(result.status).toBe(true);
      expect(qb.andWhere).toHaveBeenCalledWith(
        '(user.name ILIKE :s OR user.email ILIKE :s OR user.nip ILIKE :s OR user.phone ILIKE :s)',
        { s: '%Budi%' },
      );
      expect(qb.andWhere).toHaveBeenCalledWith('user.type = :type', { type: 'employee' });
      expect(qb.andWhere).toHaveBeenCalledWith('user.isActive = :isActive', { isActive: true });
      expect(qb.andWhere).toHaveBeenCalledWith('role.id = :roleId', { roleId: 'role-uuid-1' });
    });
  });

  describe('getStats', () => {
    it('should return correct user counts and crew count', async () => {
      usersRepo.count
        .mockResolvedValueOnce(14) // total
        .mockResolvedValueOnce(12) // active
        .mockResolvedValueOnce(2);  // inactive

      const qb = createMockQueryBuilder([[mockUser], 5]);
      usersRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.getStats();
      expect(result.status).toBe(true);
      expect(result.data.total).toBe(14);
      expect(result.data.active).toBe(12);
      expect(result.data.inactive).toBe(2);
      expect(result.data.crew).toBe(5);
    });
  });

  describe('findOne', () => {
    it('should return user details by id', async () => {
      const result = await service.findOne('user-uuid-1');
      expect(result.status).toBe(true);
      expect(result.data.name).toBe('Budi Supir');
    });

    it('should throw NotFoundException if user not found', async () => {
      usersRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create user and assign roles', async () => {
      usersRepo.findOne.mockResolvedValue(null);

      const result = await service.create({
        name: 'Joko Kondektur',
        email: 'joko@sstravel.com',
        nip: 'SST-002',
        roleIds: ['role-uuid-1'],
        type: 'employee',
      } as any);

      expect(result.status).toBe(true);
      expect(usersRepo.save).toHaveBeenCalled();
      expect(userRolesRepo.save).toHaveBeenCalled();
    });

    it('should throw ConflictException if email or NIP already exists', async () => {
      usersRepo.findOne.mockResolvedValue(mockUser);

      await expect(
        service.create({
          name: 'Duplikat User',
          email: 'budi@sstravel.com',
          nip: 'SST-001',
        } as any),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    it('should update user and sync roles', async () => {
      usersRepo.findOne.mockResolvedValue({ ...mockUser });

      const result = await service.update('user-uuid-1', {
        name: 'Budi Supir Senior',
        roleIds: ['role-uuid-1'],
      } as any);

      expect(result.status).toBe(true);
      expect(userRolesRepo.delete).toHaveBeenCalledWith({ user: { id: 'user-uuid-1' } });
      expect(userRolesRepo.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if user to update does not exist', async () => {
      usersRepo.findOne.mockResolvedValue(null);
      await expect(service.update('invalid-id', { name: 'Test' } as any)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove & toggleStatus', () => {
    it('remove should deactivate user', async () => {
      usersRepo.findOne.mockResolvedValue({ ...mockUser });
      const result = await service.remove('user-uuid-1');
      expect(result.status).toBe(true);
      expect(usersRepo.save).toHaveBeenCalledWith(expect.objectContaining({ isActive: false }));
    });

    it('toggleStatus should flip isActive status', async () => {
      usersRepo.findOne.mockResolvedValue({ ...mockUser, isActive: true });
      const result = await service.toggleStatus('user-uuid-1');
      expect(result.status).toBe(true);
      expect(result.data.isActive).toBe(false);
    });
  });
});
