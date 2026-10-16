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
import { VehiclesService } from '../services/vehicles.service';
import {
  CreateVehicleDto,
  UpdateVehicleDto,
  VehicleQueryFilterDto,
  CreateVehicleSeatClassDto,
} from '../../@dto/vehicle/vehicle.dto';
import { ResponseInterface } from '@interfaces';

@ApiTags('Vehicles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Get()
  @RequirePermissions('vehicles:read')
  @ApiOperation({ summary: 'Get all vehicles with pagination and filters' })
  async findAll(
    @Query() query: VehicleQueryFilterDto,
  ): Promise<ResponseInterface> {
    return this.vehiclesService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions('vehicles:read')
  @ApiOperation({ summary: 'Get single vehicle details' })
  async findOne(@Param('id') id: string): Promise<ResponseInterface> {
    return this.vehiclesService.findOne(id);
  }

  @Post()
  @RequirePermissions('vehicles:create')
  @ApiOperation({ summary: 'Create new vehicle with seat classes' })
  async create(@Body() dto: CreateVehicleDto): Promise<ResponseInterface> {
    return this.vehiclesService.create(dto);
  }

  @Put(':id')
  @RequirePermissions('vehicles:update')
  @ApiOperation({ summary: 'Update vehicle details' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateVehicleDto,
  ): Promise<ResponseInterface> {
    return this.vehiclesService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('vehicles:delete')
  @ApiOperation({ summary: 'Delete vehicle' })
  async remove(@Param('id') id: string): Promise<ResponseInterface> {
    return this.vehiclesService.remove(id);
  }

  @Post(':id/seat-classes')
  @RequirePermissions('vehicles:update')
  @ApiOperation({ summary: 'Add seat class configuration to vehicle' })
  async addSeatClass(
    @Param('id') id: string,
    @Body() dto: CreateVehicleSeatClassDto,
  ): Promise<ResponseInterface> {
    return this.vehiclesService.addSeatClass(id, dto);
  }

  @Delete(':id/seat-classes/:seatClassId')
  @RequirePermissions('vehicles:update')
  @ApiOperation({ summary: 'Remove seat class from vehicle' })
  async removeSeatClass(
    @Param('id') id: string,
    @Param('seatClassId') seatClassId: string,
  ): Promise<ResponseInterface> {
    return this.vehiclesService.removeSeatClass(id, seatClassId);
  }

  @Post(':id/images')
  @RequirePermissions('vehicles:update')
  @ApiOperation({ summary: 'Add gallery photo to vehicle' })
  async addImage(
    @Param('id') id: string,
    @Body() dto: any,
  ): Promise<ResponseInterface> {
    return this.vehiclesService.addImage(id, dto);
  }

  @Delete(':id/images/:imageId')
  @RequirePermissions('vehicles:update')
  @ApiOperation({ summary: 'Remove photo from vehicle' })
  async removeImage(
    @Param('id') id: string,
    @Param('imageId') imageId: string,
  ): Promise<ResponseInterface> {
    return this.vehiclesService.removeImage(id, imageId);
  }
}
