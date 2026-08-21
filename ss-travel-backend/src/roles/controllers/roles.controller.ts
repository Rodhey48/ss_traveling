import { RequirePermissions } from '@guards/permissions/permissions.decorator';
import { PermissionsGuard } from '@guards/permissions/permissions.guard';
import { ResponseInterface } from '@interfaces';
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateRoleDto, UpdateRoleDto } from '../../@dto/role/role.dto';
import { Roles } from '../../@guards/roles/roles.decorator';
import { RolesGuard } from '../../@guards/roles/roles.guard';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesService } from '../services/roles.service';

@ApiTags('Roles & Permissions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @Roles('SUPERADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Get all roles' })
  async findAll(): Promise<ResponseInterface> {
    return this.rolesService.findAll();
  }

  @Get('menus')
  @Roles('SUPERADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Get all available menus for permission setting' })
  async getMenus(): Promise<ResponseInterface> {
    return this.rolesService.getMenus();
  }

  @Get(':id')
  @Roles('SUPERADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Get a role by ID' })
  async findOne(@Param('id') id: string): Promise<ResponseInterface> {
    return this.rolesService.findOne(id);
  }

  @Post()
  @Roles('SUPERADMIN', 'ADMIN')
  @RequirePermissions('Role:create') // Contoh permission spesifik untuk membuat role
  @ApiOperation({
    summary:
      'Create a new role with permissions, needs permission "Role:create"',
  })
  async create(@Body() dto: CreateRoleDto): Promise<ResponseInterface> {
    return this.rolesService.create(dto);
  }

  @Put(':id')
  @Roles('SUPERADMIN', 'ADMIN')
  @RequirePermissions('Role:update') // Contoh permission spesifik untuk mengupdate role
  @ApiOperation({
    summary:
      'Update a role and its permissions, needs permission "Role:update"',
  })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateRoleDto,
  ): Promise<ResponseInterface> {
    return this.rolesService.update(id, dto);
  }
}
