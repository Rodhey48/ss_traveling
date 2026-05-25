import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  DefaultValuePipe,
  ParseIntPipe,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from '../services/users.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../@guards/roles/roles.guard';
import { Roles } from '../../@guards/roles/roles.decorator';
import { CreateUserDto } from './../../@dto/user/create-user.dto';
import { UpdateUserDto } from './../../@dto/user/update-user.dto';
import { ChangePasswordDto, UpdateProfileDto, ResetUserPasswordDto } from './../../@dto/user/profile.dto';
import { ResponseInterface, RequestInterface } from '@interfaces';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
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
  @ApiOperation({ summary: 'Reset a user password by Admin' })
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
  @ApiOperation({ summary: 'Toggle user active/inactive status' })
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
  @ApiOperation({ summary: 'Create a new user' })
  async create(@Body() createUserDto: CreateUserDto): Promise<ResponseInterface> {
    return this.usersService.create(createUserDto);
  }

  @Put(':id')
  @Roles('SUPERADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Update an existing user' })
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<ResponseInterface> {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @Roles('SUPERADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Soft delete a user' })
  async remove(@Param('id') id: string): Promise<ResponseInterface> {
    return this.usersService.remove(id);
  }
}
