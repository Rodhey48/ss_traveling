import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RolesEntity, RoleMenusEntity, MenusEntity } from '@models';
import { CreateRoleDto, UpdateRoleDto } from './../../@dto/role/role.dto';
import { ResponseInterface } from '@interfaces';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(RolesEntity)
    private rolesRepository: Repository<RolesEntity>,
    @InjectRepository(RoleMenusEntity)
    private roleMenusRepository: Repository<RoleMenusEntity>,
    @InjectRepository(MenusEntity)
    private menusRepository: Repository<MenusEntity>,
  ) {}

  async findAll(): Promise<ResponseInterface> {
    const roles = await this.rolesRepository.find({
      relations: ['menus', 'menus.menu'],
    });

    return {
      status: true,
      message: 'Roles fetched successfully',
      data: roles,
    };
  }

  async findOne(id: string): Promise<ResponseInterface> {
    const role = await this.rolesRepository.findOne({
      where: { id },
      relations: ['menus', 'menus.menu'],
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return {
      status: true,
      message: 'Role fetched successfully',
      data: role,
    };
  }

  async create(dto: CreateRoleDto): Promise<ResponseInterface> {
    const role = new RolesEntity({
      name: dto.name,
      description: dto.description,
    });

    const savedRole = await this.rolesRepository.save(role);

    if (dto.permissions && dto.permissions.length > 0) {
      for (const perm of dto.permissions) {
        const menu = await this.menusRepository.findOne({ where: { id: perm.menuId } });
        if (menu) {
          await this.roleMenusRepository.save(
            new RoleMenusEntity({
              role: savedRole,
              menu,
              isRead: perm.isRead,
              isCreate: perm.isCreate,
              isUpdate: perm.isUpdate,
              isDelete: perm.isDelete,
            }),
          );
        }
      }
    }

    return {
      status: true,
      message: 'Role created successfully',
      data: savedRole,
    };
  }

  async update(id: string, dto: UpdateRoleDto): Promise<ResponseInterface> {
    const role = await this.rolesRepository.findOne({ where: { id } });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    role.name = dto.name;
    role.description = dto.description;
    const updatedRole = await this.rolesRepository.save(role);

    if (dto.permissions) {
      // Clear old permissions and sync new ones
      await this.roleMenusRepository.delete({ role: { id } });
      for (const perm of dto.permissions) {
        const menu = await this.menusRepository.findOne({ where: { id: perm.menuId } });
        if (menu) {
          await this.roleMenusRepository.save(
            new RoleMenusEntity({
              role: updatedRole,
              menu,
              isRead: perm.isRead,
              isCreate: perm.isCreate,
              isUpdate: perm.isUpdate,
              isDelete: perm.isDelete,
            }),
          );
        }
      }
    }

    return {
      status: true,
      message: 'Role updated successfully',
      data: updatedRole,
    };
  }

  async getMenus(): Promise<ResponseInterface> {
    const menus = await this.menusRepository.find({
      order: { sequence: 'ASC' },
    });

    return {
      status: true,
      message: 'Menus fetched successfully',
      data: menus,
    };
  }
}
