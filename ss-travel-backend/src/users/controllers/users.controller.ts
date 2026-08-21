import { RequirePermissions } from '@guards/permissions/permissions.decorator';
import { PermissionsGuard } from '@guards/permissions/permissions.guard';
import { RequestInterface, ResponseInterface } from '@interfaces';
import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../@guards/roles/roles.decorator';
import { RolesGuard } from '../../@guards/roles/roles.guard';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { UsersService } from '../services/users.service';
import { CreateUserDto } from './../../@dto/user/create-user.dto';
import {
  ChangePasswordDto,
  ResetUserPasswordDto,
  UpdateProfileDto,
} from './../../@dto/user/profile.dto';
import { UpdateUserDto } from './../../@dto/user/update-user.dto';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles('SUPERADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Get all users with pagination and search' })
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('search') search: string,
  ): Promise<ResponseInterface> {
    return this.usersService.findAll(page, limit, search);
  }

  // Self Profile Update
  @Put('profile')
  @ApiOperation({ summary: 'Update logged in user profile' })
  async updateProfile(
    @Req() req: RequestInterface,
    @Body() dto: UpdateProfileDto,
  ): Promise<ResponseInterface> {
    return this.usersService.updateProfile(req.user.id, dto);
  }

  // Self Password Change
  @Put('change-password')
  @ApiOperation({ summary: 'Change logged in user password' })
  async changePassword(
    @Req() req: RequestInterface,
    @Body() dto: ChangePasswordDto,
  ): Promise<ResponseInterface> {
    return this.usersService.changePassword(req.user.id, dto);
  }

  // Admin Reset User Password
  @Put(':id/reset-password')
  @Roles('SUPERADMIN', 'ADMIN')
  @RequirePermissions('User:PermissionUser.reset') // Contoh permission spesifik untuk reset password
  @ApiOperation({
    summary:
      'Reset a user password by Admin, needs permission "User:PermissionUser.reset"',
  })
  async resetUserPassword(
    @Req() req: RequestInterface,
    @Param('id') targetUserId: string,
    @Body() dto: ResetUserPasswordDto,
  ): Promise<ResponseInterface> {
    return this.usersService.resetUserPassword(req.user.id, targetUserId, dto);
  }

  // Admin Toggle User Status (Active/Inactive)
  @Put(':id/toggle-status')
  @Roles('SUPERADMIN', 'ADMIN')
  @RequirePermissions('User:PermissionUser.status') // Contoh permission spesifik untuk toggle status
  @ApiOperation({
    summary:
      'Toggle user active/inactive status, needs permission "User:PermissionUser.status"',
  })
  async toggleStatus(@Param('id') id: string): Promise<ResponseInterface> {
    return this.usersService.toggleStatus(id);
  }

  @Get(':id')
  @Roles('SUPERADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Get a user by ID' })
  async findOne(@Param('id') id: string): Promise<ResponseInterface> {
    return this.usersService.findOne(id);
  }

  @Post()
  @Roles('SUPERADMIN', 'ADMIN')
  @RequirePermissions('User:create') // Contoh permission spesifik untuk membuat user
  @ApiOperation({
    summary: 'Create a new user, needs permission "User:create"',
  })
  async create(
    @Body() createUserDto: CreateUserDto,
  ): Promise<ResponseInterface> {
    return this.usersService.create(createUserDto);
  }

  @Put(':id')
  @Roles('SUPERADMIN', 'ADMIN')
  @RequirePermissions('User:update') // Contoh permission spesifik untuk mengupdate user
  @ApiOperation({
    summary: 'Update an existing user, needs permission "User:update"',
  })
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<ResponseInterface> {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @Roles('SUPERADMIN', 'ADMIN')
  @RequirePermissions('User:delete') // Contoh permission spesifik untuk menghapus user
  @ApiOperation({
    summary: 'Soft delete a user, needs permission "User:delete"',
  })
  async remove(@Param('id') id: string): Promise<ResponseInterface> {
    return this.usersService.remove(id);
  }
}
