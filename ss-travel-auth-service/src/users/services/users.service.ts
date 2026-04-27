import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import {
  UsersEntity,
  UserRolesEntity,
  RolesEntity,
} from '@models';
import { CreateUserDto } from './../../@dto/user/create-user.dto';
import { UpdateUserDto } from './../../@dto/user/update-user.dto';
import { ResponseInterface } from '@interfaces';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UsersEntity)
    private usersRepository: Repository<UsersEntity>,
    @InjectRepository(UserRolesEntity)
    private userRolesRepository: Repository<UserRolesEntity>,
    @InjectRepository(RolesEntity)
    private rolesRepository: Repository<RolesEntity>,
  ) {}

  async findAll(
    page: number = 1,
    limit: number = 10,
    search: string = '',
  ): Promise<ResponseInterface> {
    const skip = (page - 1) * limit;
    const [users, total] = await this.usersRepository.findAndCount({
      where: search
        ? [{ name: Like(`%${search}%`) }, { email: Like(`%${search}%`) }]
        : {},
      relations: ['roles', 'roles.role'],
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      status: true,
      message: 'Users fetched successfully',
      data: {
        users,
        total,
        page,
        limit,
      },
    };
  }

  async findOne(id: string): Promise<ResponseInterface> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['roles', 'roles.role'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      status: true,
      message: 'User fetched successfully',
      data: user,
    };
  }

  async create(dto: CreateUserDto): Promise<ResponseInterface> {
    const existingUser = await this.usersRepository.findOne({
      where: [{ email: dto.email }, { nip: dto.nip }],
    });

    if (existingUser) {
      throw new ConflictException('Email or NIP already exists');
    }

    const user = new UsersEntity({
      name: dto.name,
      email: dto.email,
      password: dto.password,
      nip: dto.nip,
      phone: dto.phone,
      type: dto.type,
      isActive: true,
    });

    const savedUser = await this.usersRepository.save(user);

    if (dto.roleIds && dto.roleIds.length > 0) {
      for (const roleId of dto.roleIds) {
        const role = await this.rolesRepository.findOne({ where: { id: roleId } });
        if (role) {
          await this.userRolesRepository.save(
            new UserRolesEntity({ user: savedUser, role }),
          );
        }
      }
    }

    return {
      status: true,
      message: 'User created successfully',
      data: savedUser,
    };
  }

  async update(id: string, dto: UpdateUserDto): Promise<ResponseInterface> {
    const user = await this.usersRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (dto.password) {
      // hashPassword hook will handle it if we use save() on entity instance
      user.password = dto.password;
    }

    Object.assign(user, {
      name: dto.name ?? user.name,
      email: dto.email ?? user.email,
      nip: dto.nip ?? user.nip,
      phone: dto.phone ?? user.phone,
      type: dto.type ?? user.type,
      isActive: dto.isActive ?? user.isActive,
    });

    const updatedUser = await this.usersRepository.save(user);

    if (dto.roleIds) {
      // Sync roles: remove old, add new
      await this.userRolesRepository.delete({ user: { id } });
      for (const roleId of dto.roleIds) {
        const role = await this.rolesRepository.findOne({ where: { id: roleId } });
        if (role) {
          await this.userRolesRepository.save(
            new UserRolesEntity({ user: updatedUser, role }),
          );
        }
      }
    }

    return {
      status: true,
      message: 'User updated successfully',
      data: updatedUser,
    };
  }

  async remove(id: string): Promise<ResponseInterface> {
    const user = await this.usersRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.isActive = false;
    await this.usersRepository.save(user);

    return {
      status: true,
      message: 'User soft-deleted successfully',
    };
  }
}
