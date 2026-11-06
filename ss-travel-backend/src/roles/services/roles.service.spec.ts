import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RolesService } from './roles.service';
import { RolesEntity, RoleMenusEntity, MenusEntity } from '@models';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('RolesService', () => {
  let service: RolesService;
  let rolesRepo: any;
  let roleMenusRepo: any;
  let menusRepo: any;

  const mockRole: any = {
    id: 'role-uuid-1',
    name: 'FINANCE_AUDITOR',
    description: 'Auditor Keuangan & Penutupan Buku',
    menus: [
      {
        id: 'rm-1',
        isRead: true,
        isCreate: false,
        isUpdate: false,
        isDelete: false,
        actions: { approve: true },
        menu: { id: 'menu-1', name: 'Buku Jurnal Umum' },
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    rolesRepo = {
      find: jest.fn().mockResolvedValue([mockRole]),
      findOne: jest.fn().mockResolvedValue(mockRole),
      save: jest.fn().mockImplementation((role) => Promise.resolve({ ...role, id: role.id || 'role-new-uuid' })),
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
    };

    roleMenusRepo = {
      save: jest.fn().mockResolvedValue([]),
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
    };

    menusRepo = {
      find: jest.fn().mockResolvedValue([{ id: 'menu-1', name: 'Dashboard', sequence: 1 }]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesService,
        {
          provide: getRepositoryToken(RolesEntity),
          useValue: rolesRepo,
        },
        {
          provide: getRepositoryToken(RoleMenusEntity),
          useValue: roleMenusRepo,
        },
        {
          provide: getRepositoryToken(MenusEntity),
          useValue: menusRepo,
        },
      ],
    }).compile();

    service = module.get<RolesService>(RolesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return list of all roles with menus', async () => {
      const result = await service.findAll();
      expect(result.status).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('FINANCE_AUDITOR');
      expect(rolesRepo.find).toHaveBeenCalledWith({
        relations: ['menus', 'menus.menu'],
        order: { createdAt: 'ASC' },
      });
    });
  });

  describe('findOne', () => {
    it('should return role by ID', async () => {
      const result = await service.findOne('role-uuid-1');
      expect(result.status).toBe(true);
      expect(result.data.name).toBe('FINANCE_AUDITOR');
    });

    it('should throw NotFoundException if role not found', async () => {
      rolesRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne('invalid-uuid')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create new role and save permissions', async () => {
      const dto = {
        name: 'CUSTOM_ROLE',
        description: 'Peran Kustom Baru',
        permissions: [
          {
            menuId: 'menu-1',
            isRead: true,
            isCreate: true,
            isUpdate: false,
            isDelete: false,
            actions: {},
          },
        ],
      };

      const result = await service.create(dto);
      expect(result.status).toBe(true);
      expect(rolesRepo.save).toHaveBeenCalled();
      expect(roleMenusRepo.save).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update role and sync permissions', async () => {
      const dto = {
        name: 'FINANCE_AUDITOR_SENIOR',
        description: 'Peran Auditor Senior',
        permissions: [
          {
            menuId: 'menu-1',
            isRead: true,
            isCreate: true,
            isUpdate: true,
            isDelete: false,
            actions: {},
          },
        ],
      };

      const result = await service.update('role-uuid-1', dto);
      expect(result.status).toBe(true);
      expect(rolesRepo.save).toHaveBeenCalled();
      expect(roleMenusRepo.delete).toHaveBeenCalledWith({ role: { id: 'role-uuid-1' } });
      expect(roleMenusRepo.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if role to update does not exist', async () => {
      rolesRepo.findOne.mockResolvedValue(null);
      await expect(
        service.update('invalid-id', {
          name: 'Test',
          description: 'Desc',
          permissions: [],
        } as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a custom role', async () => {
      rolesRepo.findOne.mockResolvedValue({ id: 'role-uuid-custom', name: 'CUSTOM_TEMP_ROLE' });
      const result = await service.remove('role-uuid-custom');
      expect(result.status).toBe(true);
      expect(roleMenusRepo.delete).toHaveBeenCalledWith({ role: { id: 'role-uuid-custom' } });
      expect(rolesRepo.delete).toHaveBeenCalledWith('role-uuid-custom');
    });

    it('should throw BadRequestException when trying to delete protected roles', async () => {
      rolesRepo.findOne.mockResolvedValue({ id: 'role-uuid-super', name: 'SUPER_ADMIN' });
      await expect(service.remove('role-uuid-super')).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if role to delete does not exist', async () => {
      rolesRepo.findOne.mockResolvedValue(null);
      await expect(service.remove('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getMenus', () => {
    it('should return all available menus ordered by sequence', async () => {
      const result = await service.getMenus();
      expect(result.status).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(menusRepo.find).toHaveBeenCalledWith({ order: { sequence: 'ASC' } });
    });
  });
});
