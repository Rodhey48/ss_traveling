import { ResponseInterface } from '@interfaces';
import { MenusEntity, ModulesEntity, RoleMenusEntity } from '@models';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateMenuDto, UpdateMenuDto } from '../../@dto/menu/menu.dto';

@Injectable()
export class MenusService {
  private logger = new Logger(MenusService.name);
  constructor(
    @InjectRepository(MenusEntity)
    private readonly menuRepo: Repository<MenusEntity>,
    @InjectRepository(RoleMenusEntity)
    private readonly roleMenuRepo: Repository<RoleMenusEntity>,
    @InjectRepository(ModulesEntity)
    private readonly moduleRepo: Repository<ModulesEntity>,
  ) {}

  async findMenusByRole(roleIds: string[]): Promise<any[]> {
    if (!roleIds || roleIds.length === 0) {
      return [];
    }

    // Ambil semua role-menu yang aktif untuk role tersebut
    const roleMenus = await this.roleMenuRepo
      .createQueryBuilder('roleMenu')
      .leftJoinAndSelect('roleMenu.menu', 'menu')
      .where('roleMenu.role IN (:...roleIds) AND roleMenu.isActive = true', {
        roleIds,
      })
      .getMany();

    // Agregasi permission per menuId
    const permissionsMap = new Map<string, any>();
    roleMenus.forEach((rm) => {
      const menuId = rm.menu.id;
      const existing = permissionsMap.get(menuId) || {
        isRead: false,
        isCreate: false,
        isUpdate: false,
        isDelete: false,
        actions: {},
      };

      const newActions = { ...existing.actions };
      if (rm.actions) {
        Object.keys(rm.actions).forEach((key) => {
          newActions[key] = newActions[key] || rm.actions[key];
        });
      }

      permissionsMap.set(menuId, {
        isRead: existing.isRead || rm.isRead,
        isCreate: existing.isCreate || rm.isCreate,
        isUpdate: existing.isUpdate || rm.isUpdate,
        isDelete: existing.isDelete || rm.isDelete,
        actions: newActions,
      });
    });

    const accessibleMenuIds = Array.from(permissionsMap.keys());

    // Ambil semua menu yang aktif
    const allMenus = await this.menuRepo.find({
      where: { isActive: true },
      relations: ['parent'],
      order: { sequence: 'ASC' },
    });

    // Bangun tree yang hanya menyertakan menu yang bisa diakses (dan parent-nya)
    return this.buildMenuTree(allMenus, accessibleMenuIds, permissionsMap);
  }

  private buildMenuTree(
    allMenus: MenusEntity[],
    accessibleMenuIds: string[],
    permissionsMap: Map<string, any>,
    parentId: string | null = null,
  ): any[] {
    const tree = [];
    const children = allMenus.filter((m) =>
      parentId ? m.parent?.id === parentId : !m.parent,
    );

    for (const menu of children) {
      const nodeChildren = this.buildMenuTree(
        allMenus,
        accessibleMenuIds,
        permissionsMap,
        menu.id,
      );

      const perms = permissionsMap.get(menu.id) || {
        isRead: false,
        isCreate: false,
        isUpdate: false,
        isDelete: false,
      };

      // Menu dimasukkan ke tree jika:
      // 1. Menu itu sendiri punya akses langsung, ATAU
      // 2. Salah satu keturunannya (children) punya akses (agar parent tetap muncul)
      if (accessibleMenuIds.includes(menu.id) || nodeChildren.length > 0) {
        tree.push({
          ...menu,
          ...perms,
          children: nodeChildren.length > 0 ? nodeChildren : undefined,
        });
      }
    }

    return tree;
  }

  async getMenuTree(): Promise<ResponseInterface> {
    const allMenus = await this.menuRepo.find({
      relations: ['parent', 'module'],
      order: { sequence: 'ASC' },
    });

    const buildFullTree = (parentId: string | null = null) => {
      const tree = [];
      const children = allMenus.filter((m) =>
        parentId ? m.parent?.id === parentId : !m.parent,
      );

      for (const menu of children) {
        const nodeChildren = buildFullTree(menu.id);
        tree.push({
          ...menu,
          children: nodeChildren.length > 0 ? nodeChildren : undefined,
        });
      }
      return tree;
    };

    return {
      status: true,
      message: 'Menu tree fetched successfully',
      data: buildFullTree(),
    };
  }

  async create(dto: CreateMenuDto): Promise<ResponseInterface> {
    const menu = new MenusEntity({
      name: dto.name,
      url: dto.url,
      icon: dto.icon,
      sequence: dto.sequence || 0,
      isActive: dto.isActive ?? true,
      isWeb: dto.isWeb ?? true,
      isMobile: dto.isMobile ?? false,
    });

    if (dto.parentId) {
      const parent = await this.menuRepo.findOne({
        where: { id: dto.parentId },
      });
      if (parent) menu.parent = parent;
    }

    if (dto.moduleId) {
      const module = await this.moduleRepo.findOne({
        where: { id: dto.moduleId },
      });
      if (module) menu.module = module;
    }

    const saved = await this.menuRepo.save(menu);
    return {
      status: true,
      message: 'Menu created successfully',
      data: saved,
    };
  }

  async update(id: string, dto: UpdateMenuDto): Promise<ResponseInterface> {
    const menu = await this.menuRepo.findOne({ where: { id } });
    if (!menu) throw new NotFoundException('Menu not found');

    Object.assign(menu, {
      name: dto.name,
      url: dto.url,
      icon: dto.icon,
      sequence: dto.sequence,
      isActive: dto.isActive,
      isWeb: dto.isWeb,
      isMobile: dto.isMobile,
      availableActions: dto.availableActions,
    });

    if (dto.parentId) {
      const parent = await this.menuRepo.findOne({
        where: { id: dto.parentId },
      });
      if (parent) menu.parent = parent;
    } else {
      menu.parent = null;
    }

    if (dto.moduleId) {
      const module = await this.moduleRepo.findOne({
        where: { id: dto.moduleId },
      });
      if (module) menu.module = module;
    }

    const updated = await this.menuRepo.save(menu);
    return {
      status: true,
      message: 'Menu updated successfully',
      data: updated,
    };
  }

  async remove(id: string): Promise<ResponseInterface> {
    const menu = await this.menuRepo.findOne({ where: { id } });
    if (!menu) throw new NotFoundException('Menu not found');

    await this.menuRepo.remove(menu);
    return {
      status: true,
      message: 'Menu deleted successfully',
    };
  }

  async getPermissionsByRoles(roleIds: string[]): Promise<string[]> {
    if (!roleIds || roleIds.length === 0) {
      return [];
    }

    const roleMenus = await this.roleMenuRepo
      .createQueryBuilder('roleMenu')
      .leftJoinAndSelect('roleMenu.menu', 'menu')
      .where('roleMenu.role IN (:...roleIds) AND roleMenu.isActive = true', {
        roleIds,
      })
      .getMany();

    const permissionsSet = new Set<string>();

    roleMenus.forEach((rm) => {
      // Gunakan aclName sebagai identifier utama, fallback ke name
      const baseName = rm.menu.aclName || rm.menu.name;

      if (rm.isRead) permissionsSet.add(baseName + ':read');
      if (rm.isCreate) permissionsSet.add(baseName + ':create');
      if (rm.isUpdate) permissionsSet.add(baseName + ':update');
      if (rm.isDelete) permissionsSet.add(baseName + ':delete');

      if (rm.actions) {
        Object.keys(rm.actions).forEach((action) => {
          if (rm.actions[action]) {
            // Gunakan nama action asli dari database
            permissionsSet.add(baseName + ':' + action);
          }
        });
      }
    });

    return Array.from(permissionsSet);
  }
}
