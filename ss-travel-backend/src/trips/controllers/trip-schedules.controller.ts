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
import { TripSchedulesService } from '../services/trip-schedules.service';
import { SpjService } from '../services/spj.service';
import {
  CreateTripScheduleDto,
  UpdateTripScheduleDto,
  TripScheduleQueryFilterDto,
  ConflictCheckDto,
  GenerateSpjFromScheduleDto,
} from '../../@dto/trips/trip-schedule.dto';
import { ResponseInterface } from '@interfaces';

@ApiTags('Trip Schedules')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('trip-schedules')
export class TripSchedulesController {
  constructor(
    private readonly schedulesService: TripSchedulesService,
    private readonly spjService: SpjService,
  ) {}

  @Get()
  @RequirePermissions('TripSchedules:read')
  @ApiOperation({ summary: 'Daftar jadwal bus dengan filter dan paginasi' })
  async findAll(@Query() query: TripScheduleQueryFilterDto): Promise<ResponseInterface> {
    const result = await this.schedulesService.findAll(query);
    return {
      status: true,
      message: 'Daftar jadwal bus berhasil diambil',
      data: result,
    };
  }

  @Get('calendar')
  @RequirePermissions('TripSchedules:read')
  @ApiOperation({ summary: 'Ambil jadwal untuk visualisasi Gantt Chart kalender armada' })
  async findCalendar(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<ResponseInterface> {
    const data = await this.schedulesService.findCalendar(
      startDate || new Date(Date.now() - 7 * 86400000).toISOString(),
      endDate || new Date(Date.now() + 30 * 86400000).toISOString(),
    );
    return {
      status: true,
      message: 'Data kalender jadwal armada berhasil diambil',
      data,
    };
  }

  @Post('check-conflict')
  @RequirePermissions('TripSchedules:read')
  @ApiOperation({ summary: 'Cek bentrok jadwal armada & kru serta alert buffer time 3 jam' })
  async checkConflict(@Body() dto: ConflictCheckDto): Promise<ResponseInterface> {
    const result = await this.schedulesService.checkConflictsAndBuffer(dto);
    return {
      status: true,
      message: result.hasConflict
        ? 'Ditemukan bentrok operasional pada jadwal'
        : 'Jadwal aman (tidak ada bentrok)',
      data: result,
    };
  }

  @Get(':id')
  @RequirePermissions('TripSchedules:read')
  @ApiOperation({ summary: 'Detail jadwal bus' })
  async findOne(@Param('id') id: string): Promise<ResponseInterface> {
    const data = await this.schedulesService.findOne(id);
    return {
      status: true,
      message: 'Detail jadwal berhasil diambil',
      data,
    };
  }

  @Post()
  @RequirePermissions('TripSchedules:create')
  @ApiOperation({ summary: 'Buat rencana jadwal dinas bus baru (DRAFT)' })
  async create(@Body() dto: CreateTripScheduleDto): Promise<ResponseInterface> {
    const result = await this.schedulesService.create(dto);
    return {
      status: true,
      message: 'Rencana jadwal bus berhasil dibuat',
      data: {
        schedule: result.schedule,
        warnings: result.warnings,
      },
    };
  }

  @Put(':id')
  @RequirePermissions('TripSchedules:update')
  @ApiOperation({ summary: 'Perbarui rencana jadwal bus' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTripScheduleDto,
  ): Promise<ResponseInterface> {
    const result = await this.schedulesService.update(id, dto);
    return {
      status: true,
      message: 'Jadwal bus berhasil diperbarui',
      data: {
        schedule: result.schedule,
        warnings: result.warnings,
      },
    };
  }

  @Post(':id/confirm')
  @RequirePermissions('TripSchedules:update')
  @ApiOperation({ summary: 'Konfirmasi jadwal dinas bus (DRAFT -> CONFIRMED)' })
  async confirm(@Param('id') id: string): Promise<ResponseInterface> {
    const data = await this.schedulesService.confirm(id);
    return {
      status: true,
      message: 'Jadwal bus berhasil dikonfirmasi',
      data,
    };
  }

  @Post(':id/cancel')
  @RequirePermissions('TripSchedules:update')
  @ApiOperation({ summary: 'Batalkan jadwal dinas bus' })
  async cancel(
    @Param('id') id: string,
    @Body('reason') reason?: string,
  ): Promise<ResponseInterface> {
    const data = await this.schedulesService.cancel(id, reason);
    return {
      status: true,
      message: 'Jadwal bus berhasil dibatalkan',
      data,
    };
  }

  @Post(':id/generate-spj')
  @RequirePermissions('SPJ:create')
  @ApiOperation({ summary: 'Aksi 1-Klik: Terbitkan SPJ resmi dari jadwal terkonfirmasi' })
  async generateSpj(
    @Param('id') id: string,
    @Body() dto?: GenerateSpjFromScheduleDto,
  ): Promise<ResponseInterface> {
    const spj = await this.spjService.generateFromSchedule(id, dto);
    return {
      status: true,
      message: `Dokumen SPJ '${spj.spjNo}' berhasil diterbitkan dari jadwal`,
      data: spj,
    };
  }

  @Delete(':id')
  @RequirePermissions('TripSchedules:delete')
  @ApiOperation({ summary: 'Hapus draft jadwal bus' })
  async delete(@Param('id') id: string): Promise<ResponseInterface> {
    const result = await this.schedulesService.delete(id);
    return {
      status: true,
      message: result.message,
    };
  }
}
