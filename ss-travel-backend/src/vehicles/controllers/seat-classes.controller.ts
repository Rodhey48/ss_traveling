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
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../@guards/roles/roles.guard';
import { PermissionsGuard } from '../../@guards/permissions/permissions.guard';
import { RequirePermissions } from '../../@guards/permissions/permissions.decorator';
import { VehiclesService } from '../services/vehicles.service';
import {
  CreateSeatClassDto,
  UpdateSeatClassDto,
} from '../../@dto/vehicle/vehicle.dto';
import { ResponseInterface } from '@interfaces';

@ApiTags('Seat Classes (Master)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('seat-classes')
export class SeatClassesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Get()
  @RequirePermissions('Vehicles:read')
  @ApiOperation({ summary: 'Get all master seat classes' })
  async findAll(): Promise<ResponseInterface> {
    return this.vehiclesService.findAllSeatClasses();
  }

  @Get(':id')
  @RequirePermissions('Vehicles:read')
  @ApiOperation({ summary: 'Get single master seat class details' })
  async findOne(@Param('id') id: string): Promise<ResponseInterface> {
    return this.vehiclesService.findOneSeatClass(id);
  }

  @Post()
  @RequirePermissions('Vehicles:create')
  @ApiOperation({ summary: 'Create new master seat class' })
  async create(@Body() dto: CreateSeatClassDto): Promise<ResponseInterface> {
    return this.vehiclesService.createSeatClass(dto);
  }

  @Put(':id')
  @RequirePermissions('Vehicles:update')
  @ApiOperation({ summary: 'Update master seat class' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateSeatClassDto,
  ): Promise<ResponseInterface> {
    return this.vehiclesService.updateSeatClass(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('Vehicles:delete')
  @ApiOperation({ summary: 'Delete master seat class' })
  async remove(@Param('id') id: string): Promise<ResponseInterface> {
    return this.vehiclesService.removeSeatClassMaster(id);
  }
}
