import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
  Logger,
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
import { ChangePasswordDto, UpdateProfileDto, ResetUserPasswordDto } from './../../@dto/user/profile.dto';
import { ResponseInterface } from '@interfaces';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  constructor(
    @InjectRepository(UsersEntity)
    private usersRepository: Repository<UsersEntity>,
    @InjectRepository(UserRolesEntity)
    private userRolesRepository: Repository<UserRolesEntity>,
    @InjectRepository(RolesEntity)
    private rolesRepository: Repository<RolesEntity>,
  ) {}

  async findAll(
    page: any = 1,
    limit: any = 10,
    search: string = '',
  ): Promise<ResponseInterface> {
    try {
      const p = Number(page) || 1;
      const l = Number(limit) || 10;
      const skip = (p - 1) * l;
      const [users, total] = await this.usersRepository.findAndCount({
        where: search
          ? [
              { name: Like(`%${search}%`) },
              { email: Like(`%${search}%`) },
              { nip: Like(`%${search}%`) },
            ]
          : {},
        relations: ['roles', 'roles.role'],
        skip,
        take: l,
        order: { createdAt: 'DESC' },
      });

      return {
        status: true,
        message: 'Users fetched successfully',
        data: {
          data: users,
          total,
          page: p,
          limit: l,
        },
      };

    } catch (error) {
      this.logger.error(`Error fetching users: ${error.message}`, error.stack);
      throw error;
    }
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
      password: dto.password || '123456', // Default password
      nip: dto.nip,
      phone: dto.phone,
      type: dto.type as any,
      isActive: dto.isActive ?? true,
      isPasswordChanged: dto.isPasswordChanged ?? false,
      avatar: dto.avatar,
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
      user.password = dto.password;
    }

    Object.assign(user, {
      name: dto.name ?? user.name,
      email: dto.email ?? user.email,
      nip: dto.nip ?? user.nip,
      phone: dto.phone ?? user.phone,
      type: dto.type ?? user.type,
      isActive: dto.isActive !== undefined ? dto.isActive : user.isActive,
      isPasswordChanged: dto.isPasswordChanged !== undefined ? dto.isPasswordChanged : user.isPasswordChanged,
      avatar: dto.avatar ?? user.avatar,
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

    // Toggle active status or just set false? User requested "active/inactive" feature.
    // Usually remove is soft-delete, but let's stick to setting inactive.
    user.isActive = false;
    await this.usersRepository.save(user);

    return {
      status: true,
      message: 'User deactivated successfully',
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<ResponseInterface> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    Object.assign(user, dto);
    const updated = await this.usersRepository.save(user);

    return {
      status: true,
      message: 'Profile updated successfully',
      data: updated,
    };
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<ResponseInterface> {
    const user = await this.usersRepository.findOne({ 
      where: { id: userId },
      select: ['id', 'password'] 
    });
    if (!user) throw new NotFoundException('User not found');

    if (dto.oldPassword) {
      const isMatch = await bcrypt.compare(dto.oldPassword, user.password);
      if (!isMatch) throw new BadRequestException('Password lama tidak sesuai');
    }

    user.password = dto.newPassword;
    user.isPasswordChanged = true;
    await this.usersRepository.save(user);

    return {
      status: true,
      message: 'Password changed successfully',
    };
  }

  async resetUserPassword(adminId: string, targetUserId: string, dto: ResetUserPasswordDto): Promise<ResponseInterface> {
    // 1. Verify Admin Password
    const admin = await this.usersRepository.findOne({ 
      where: { id: adminId },
      select: ['id', 'password'] 
    });
    if (!admin) throw new NotFoundException('Admin not found');

    const isAdminMatch = await bcrypt.compare(dto.adminPassword, admin.password);
    if (!isAdminMatch) throw new ForbiddenException('Password Admin tidak valid');

    // 2. Find Target User
    const targetUser = await this.usersRepository.findOne({ where: { id: targetUserId } });
    if (!targetUser) throw new NotFoundException('User tidak ditemukan');

    // 3. Reset Password and Force Change
    targetUser.password = dto.newPassword;
    targetUser.isPasswordChanged = false; // Force change on next login
    await this.usersRepository.save(targetUser);

    return {
      status: true,
      message: 'User password has been reset successfully',
    };
  }

  async toggleStatus(id: string): Promise<ResponseInterface> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    user.isActive = !user.isActive;
    await this.usersRepository.save(user);

    return {
      status: true,
      message: `User is now ${user.isActive ? 'Active' : 'Inactive'}`,
      data: { isActive: user.isActive }
    };
  }
}
