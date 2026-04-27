import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RolesService } from '../services/roles.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../@guards/roles/roles.guard';
import { Roles } from '../../@guards/roles/roles.decorator';
import { CreateRoleDto, UpdateRoleDto } from '../../@dto/role/role.dto';
import { ResponseInterface } from '@interfaces';

@ApiTags('Roles & Permissions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
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
  @ApiOperation({ summary: 'Create a new role with permissions' })
  async create(@Body() dto: CreateRoleDto): Promise<ResponseInterface> {
    return this.rolesService.create(dto);
  }

  @Put(':id')
  @Roles('SUPERADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Update a role and its permissions' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateRoleDto,
  ): Promise<ResponseInterface> {
    return this.rolesService.update(id, dto);
  }
}
