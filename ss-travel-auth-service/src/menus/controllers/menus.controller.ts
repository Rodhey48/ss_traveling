import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MenusService } from './../../@services/menus/menus.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../@guards/roles/roles.guard';
import { Roles } from '../../@guards/roles/roles.decorator';
import { CreateMenuDto, UpdateMenuDto } from '../../@dto/menu/menu.dto';
import { ResponseInterface } from '@interfaces';

@ApiTags('Menus Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
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
  @ApiOperation({ summary: 'Create a new menu' })
  async create(@Body() dto: CreateMenuDto): Promise<ResponseInterface> {
    return this.menusService.create(dto);
  }

  @Put(':id')
  @Roles('SUPERADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Update a menu' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateMenuDto,
  ): Promise<ResponseInterface> {
    return this.menusService.update(id, dto);
  }

  @Delete(':id')
  @Roles('SUPERADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Delete a menu' })
  async remove(@Param('id') id: string): Promise<ResponseInterface> {
    return this.menusService.remove(id);
  }
}
