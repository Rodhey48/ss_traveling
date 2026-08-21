import { RequirePermissions } from '@guards/permissions/permissions.decorator';
import { PermissionsGuard } from '@guards/permissions/permissions.guard';
import { ResponseInterface } from '@interfaces';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateMenuDto, UpdateMenuDto } from '../../@dto/menu/menu.dto';
import { Roles } from '../../@guards/roles/roles.decorator';
import { RolesGuard } from '../../@guards/roles/roles.guard';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { MenusService } from '../services/menus.service';

@ApiTags('Menus Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('menus')
export class MenusController {
  constructor(private readonly menusService: MenusService) {}

  @Get('tree')
  @Roles('SUPERADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Get full menu tree' })
  async getMenuTree(): Promise<ResponseInterface> {
    return this.menusService.getMenuTree();
  }

  @Post()
  @Roles('SUPERADMIN', 'ADMIN')
  @RequirePermissions('Menu:create') // Contoh permission spesifik untuk membuat menu
  @ApiOperation({
    summary: 'Create a new menu, needs permission "Menu:create"',
  })
  async create(@Body() dto: CreateMenuDto): Promise<ResponseInterface> {
    return this.menusService.create(dto);
  }

  @Put(':id')
  @Roles('SUPERADMIN', 'ADMIN')
  @RequirePermissions('Menu:update') // Contoh permission spesifik untuk mengupdate menu
  @ApiOperation({
    summary: 'Update a menu, needs permission "Menu:update"',
  })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateMenuDto,
  ): Promise<ResponseInterface> {
    return this.menusService.update(id, dto);
  }

  @Delete(':id')
  @Roles('SUPERADMIN', 'ADMIN')
  @RequirePermissions('Menu:delete') // Contoh permission spesifik untuk menghapus menu
  @ApiOperation({
    summary: 'Delete a menu, needs permission "Menu:delete"',
  })
  async remove(@Param('id') id: string): Promise<ResponseInterface> {
    return this.menusService.remove(id);
  }
}
