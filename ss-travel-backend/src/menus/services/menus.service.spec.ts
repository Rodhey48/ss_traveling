import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MenusEntity, ModulesEntity, RoleMenusEntity } from '@models';
import { MenusService } from './menus.service';

describe('MenusService', () => {
  let service: MenusService;
  let menuRepo: any;
  let roleMenuRepo: any;
  let moduleRepo: any;

  beforeEach(async () => {
    menuRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };

    roleMenuRepo = {
      createQueryBuilder: jest.fn(),
    };

    moduleRepo = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MenusService,
        { provide: getRepositoryToken(MenusEntity), useValue: menuRepo },
        { provide: getRepositoryToken(RoleMenusEntity), useValue: roleMenuRepo },
        { provide: getRepositoryToken(ModulesEntity), useValue: moduleRepo },
      ],
    }).compile();

    service = module.get<MenusService>(MenusService);
  });

  describe('getMenuTree', () => {
    it('should build hierarchical menu tree correctly', async () => {
      const parentMenu: any = {
        id: 'p1',
        name: 'Dashboard Parent',
        sequence: 1,
        parent: null,
      };
      const childMenu: any = {
        id: 'c1',
        name: 'Analytics Submenu',
        sequence: 2,
        parent: { id: 'p1' },
      };

      menuRepo.find.mockResolvedValue([parentMenu, childMenu]);

      const res = await service.getMenuTree();
      expect(res.status).toBe(true);
      expect(res.data).toHaveLength(1);
      expect(res.data[0].id).toBe('p1');
      expect(res.data[0].children).toHaveLength(1);
      expect(res.data[0].children[0].id).toBe('c1');
    });

    it('should return empty tree when no menus exist', async () => {
      menuRepo.find.mockResolvedValue([]);
      const res = await service.getMenuTree();
      expect(res.status).toBe(true);
      expect(res.data).toEqual([]);
    });
  });

  describe('findMenusByRole', () => {
    it('should return empty array if roleIds is empty or null', async () => {
      const res1 = await service.findMenusByRole([]);
      const res2 = await service.findMenusByRole(null as any);
      expect(res1).toEqual([]);
      expect(res2).toEqual([]);
    });

    it('should return accessible menus and their parents with merged permissions', async () => {
      const qb: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([
          {
            menu: { id: 'c1' },
            isRead: true,
            isCreate: true,
            isUpdate: false,
            isDelete: false,
            actions: { approve: true },
          },
        ]),
      };
      roleMenuRepo.createQueryBuilder.mockReturnValue(qb);

      const parentMenu: any = { id: 'p1', name: 'Parent', parent: null };
      const childMenu: any = { id: 'c1', name: 'Child', parent: { id: 'p1' } };
      menuRepo.find.mockResolvedValue([parentMenu, childMenu]);

      const result = await service.findMenusByRole(['role-1']);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('p1');
      expect(result[0].children).toHaveLength(1);
      expect(result[0].children[0].id).toBe('c1');
      expect(result[0].children[0].isRead).toBe(true);
      expect(result[0].children[0].isCreate).toBe(true);
      expect(result[0].children[0].actions).toEqual({ approve: true });
    });
  });

  describe('create', () => {
    it('should create root menu successfully with all metadata', async () => {
      const dto = {
        name: 'Master Data',
        url: '/master-data',
        icon: 'Database',
        sequence: 1,
        title: true,
        availableActions: ['export', 'print'],
        aclName: 'MasterData',
        isActive: true,
        isWeb: true,
        isMobile: false,
      };

      menuRepo.save.mockImplementation(async (entity: any) => ({
        ...entity,
        id: 'new-id',
      }));

      const res = await service.create(dto);
      expect(res.status).toBe(true);
      expect(res.data.name).toBe('Master Data');
      expect(res.data.title).toBe(true);
      expect(res.data.availableActions).toEqual(['export', 'print']);
      expect(res.data.aclName).toBe('MasterData');
    });

    it('should link parent menu and module when parentId and moduleId are provided', async () => {
      const parentMenu: any = { id: 'p-1', name: 'Parent' };
      const moduleEntity: any = { id: 'mod-1', name: 'Finance' };

      menuRepo.findOne.mockResolvedValue(parentMenu);
      moduleRepo.findOne.mockResolvedValue(moduleEntity);
      menuRepo.save.mockImplementation(async (entity: any) => ({
        ...entity,
        id: 'child-id',
      }));

      const res = await service.create({
        name: 'Child Menu',
        parentId: 'p-1',
        moduleId: 'mod-1',
      });

      expect(res.status).toBe(true);
      expect(res.data.parent).toEqual(parentMenu);
      expect(res.data.module).toEqual(moduleEntity);
    });
  });

  describe('update', () => {
    it('should throw NotFoundException if menu not found', async () => {
      menuRepo.findOne.mockResolvedValue(null);
      await expect(
        service.update('non-existent', { name: 'Updated' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if menu is set as its own parent', async () => {
      const menu: any = { id: 'm-1', name: 'Self Menu' };
      menuRepo.findOne.mockResolvedValue(menu);

      await expect(
        service.update('m-1', { name: 'Self Menu', parentId: 'm-1' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should update menu and parent relation successfully', async () => {
      const menu: any = {
        id: 'm-1',
        name: 'Old Name',
        sequence: 1,
        title: false,
        parent: null,
      };
      const parentMenu: any = { id: 'p-1', name: 'Parent' };

      menuRepo.findOne
        .mockResolvedValueOnce(menu) // find existing menu
        .mockResolvedValueOnce(parentMenu); // find parent menu

      menuRepo.save.mockImplementation(async (entity: any) => entity);

      const res = await service.update('m-1', {
        name: 'New Name',
        title: true,
        parentId: 'p-1',
        availableActions: ['export'],
        aclName: 'UpdatedAcl',
      });

      expect(res.status).toBe(true);
      expect(res.data.name).toBe('New Name');
      expect(res.data.title).toBe(true);
      expect(res.data.parent).toEqual(parentMenu);
      expect(res.data.aclName).toBe('UpdatedAcl');
    });

    it('should clear parent relation if parentId is not provided', async () => {
      const menu: any = {
        id: 'm-1',
        name: 'Child',
        parent: { id: 'p-1' },
      };

      menuRepo.findOne.mockResolvedValueOnce(menu);
      menuRepo.save.mockImplementation(async (entity: any) => entity);

      const res = await service.update('m-1', {
        name: 'Child Now Root',
        parentId: undefined,
      });

      expect(res.status).toBe(true);
      expect(res.data.parent).toBeNull();
    });
  });

  describe('remove', () => {
    it('should throw NotFoundException if menu not found', async () => {
      menuRepo.findOne.mockResolvedValue(null);
      await expect(service.remove('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should remove menu successfully', async () => {
      const menu: any = { id: 'm-1', name: 'To Delete' };
      menuRepo.findOne.mockResolvedValue(menu);
      menuRepo.remove.mockResolvedValue(menu);

      const res = await service.remove('m-1');
      expect(res.status).toBe(true);
      expect(menuRepo.remove).toHaveBeenCalledWith(menu);
    });
  });

  describe('getPermissionsByRoles', () => {
    it('should return empty array if roleIds is empty or null', async () => {
      expect(await service.getPermissionsByRoles([])).toEqual([]);
      expect(await service.getPermissionsByRoles(null as any)).toEqual([]);
    });

    it('should build permission set using aclName and custom actions', async () => {
      const qb: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([
          {
            menu: { aclName: 'Journal', name: 'Jurnal Umum' },
            isRead: true,
            isCreate: true,
            isUpdate: false,
            isDelete: false,
            actions: { post: true, reverse: false },
          },
        ]),
      };
      roleMenuRepo.createQueryBuilder.mockReturnValue(qb);

      const permissions = await service.getPermissionsByRoles(['role-1']);
      expect(permissions).toContain('Journal:read');
      expect(permissions).toContain('journal:read');
      expect(permissions).toContain('Journal:create');
      expect(permissions).toContain('Journal:post');
      expect(permissions).not.toContain('Journal:delete');
      expect(permissions).not.toContain('Journal:reverse');
    });
  });
});
