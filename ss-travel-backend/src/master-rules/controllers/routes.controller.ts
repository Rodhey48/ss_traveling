import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../@guards/roles/roles.guard';
import { PermissionsGuard } from '../../@guards/permissions/permissions.guard';
import { RequirePermissions } from '../../@guards/permissions/permissions.decorator';
import { ResponseInterface } from '../../@interfaces/response/response.interface';
import { RoutesService } from '../services/routes.service';
import {
  CreateRouteDto,
  UpdateRouteDto,
} from '../../@dto/master-rules/route.dto';
import { TripServiceType } from '../../@models/trips/trip.enums';

@ApiTags('Master Routes & Trayek')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('routes')
export class RoutesController {
  constructor(private readonly routesService: RoutesService) {}

  @Get()
  @RequirePermissions('Routes:read', 'TripSchedules:read', 'Fares:read')
  @ApiOperation({ summary: 'Mendapatkan seluruh master rute trayek operasional' })
  async findAll(
    @Query('serviceType') serviceType?: TripServiceType,
  ): Promise<ResponseInterface> {
    const data = await this.routesService.findAll(serviceType);
    return {
      status: true,
      message: 'Daftar master rute berhasil diambil.',
      data,
    };
  }

  @Get(':id')
  @RequirePermissions('Routes:read', 'TripSchedules:read', 'Fares:read')
  @ApiOperation({ summary: 'Mendapatkan rincian master rute berdasarkan ID' })
  async findOne(@Param('id') id: string): Promise<ResponseInterface> {
    const data = await this.routesService.findOne(id);
    return {
      status: true,
      message: 'Rincian master rute berhasil diambil.',
      data,
    };
  }

  @Post()
  @RequirePermissions('Routes:create', 'TripSchedules:create', 'Fares:create')
  @ApiOperation({ summary: 'Mendaftarkan master rute trayek baru' })
  async create(@Body() dto: CreateRouteDto): Promise<ResponseInterface> {
    const data = await this.routesService.create(dto);
    return {
      status: true,
      message: 'Master rute berhasil dibuat.',
      data,
    };
  }

  @Put(':id')
  @RequirePermissions('Routes:update', 'TripSchedules:update', 'Fares:update')
  @ApiOperation({ summary: 'Memperbarui master rute trayek' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateRouteDto,
  ): Promise<ResponseInterface> {
    const data = await this.routesService.update(id, dto);
    return {
      status: true,
      message: 'Master rute berhasil diperbarui.',
      data,
    };
  }

  @Delete(':id')
  @RequirePermissions('Routes:delete', 'TripSchedules:delete', 'Fares:delete')
  @ApiOperation({ summary: 'Menghapus master rute trayek' })
  async delete(@Param('id') id: string): Promise<ResponseInterface> {
    const result = await this.routesService.delete(id);
    return {
      status: true,
      message: result.message,
      data: null,
    };
  }
}
