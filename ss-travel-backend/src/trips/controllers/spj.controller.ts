import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../@guards/roles/roles.guard';
import { PermissionsGuard } from '../../@guards/permissions/permissions.guard';
import { RequirePermissions } from '../../@guards/permissions/permissions.decorator';
import { SpjService } from '../services/spj.service';
import {
  CreateSpjDto,
  ReplaceCrewDto,
  EmergencyReplaceBusDto,
  SpjQueryFilterDto,
  UpdateSpjLegDto,
} from '../../@dto/trips/spj.dto';
import { ResponseInterface } from '@interfaces';

@ApiTags('SPJs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('spjs')
export class SpjController {
  constructor(private readonly spjService: SpjService) {}

  @Get()
  @RequirePermissions('SPJ:read')
  @ApiOperation({ summary: 'Daftar Surat Perintah Jalan (SPJ) dengan filter dan status' })
  async findAll(@Query() query: SpjQueryFilterDto): Promise<ResponseInterface> {
    const result = await this.spjService.findAll(query);
    return {
      status: true,
      message: 'Daftar SPJ berhasil diambil',
      data: result,
    };
  }

  @Get(':id')
  @RequirePermissions('SPJ:read')
  @ApiOperation({ summary: 'Detail dokumen SPJ lengkap dengan rute (legs) dan penugasan kru' })
  async findOne(@Param('id') id: string): Promise<ResponseInterface> {
    const data = await this.spjService.findOne(id);
    return {
      status: true,
      message: 'Detail SPJ berhasil diambil',
      data,
    };
  }

  @Post()
  @RequirePermissions('SPJ:create')
  @ApiOperation({ summary: 'Buat dokumen SPJ manual (DRAFT)' })
  async create(@Body() dto: CreateSpjDto): Promise<ResponseInterface> {
    const data = await this.spjService.create(dto);
    return {
      status: true,
      message: `Dokumen SPJ '${data.spjNo}' berhasil dibuat`,
      data,
    };
  }

  @Post(':id/issue')
  @RequirePermissions('SPJ:update')
  @ApiOperation({ summary: 'Terbitkan resmi SPJ operasional (DRAFT -> ISSUED)' })
  async issue(@Param('id') id: string): Promise<ResponseInterface> {
    const data = await this.spjService.issue(id);
    return {
      status: true,
      message: `SPJ '${data.spjNo}' resmi diterbitkan operasional`,
      data,
    };
  }

  @Post(':id/start')
  @RequirePermissions('SPJ:update')
  @ApiOperation({ summary: 'Berangkatkan armada bus (ISSUED -> IN_PROGRESS)' })
  async start(@Param('id') id: string): Promise<ResponseInterface> {
    const data = await this.spjService.start(id);
    return {
      status: true,
      message: `Armada bus '${data.vehicle?.code}' resmi diberangkatkan di rute`,
      data,
    };
  }

  @Post(':id/complete')
  @RequirePermissions('SPJ:update')
  @ApiOperation({ summary: 'Kepulangan armada di garasi / tuntas operasional (IN_PROGRESS -> COMPLETED)' })
  async complete(@Param('id') id: string): Promise<ResponseInterface> {
    const data = await this.spjService.complete(id);
    return {
      status: true,
      message: `Operasional SPJ '${data.spjNo}' selesai, siap direkonsiliasi kasir pool`,
      data,
    };
  }

  @Post(':id/cancel')
  @RequirePermissions('SPJ:update')
  @ApiOperation({ summary: 'Batalkan penugasan SPJ' })
  async cancel(
    @Param('id') id: string,
    @Body('reason') reason?: string,
  ): Promise<ResponseInterface> {
    const data = await this.spjService.cancel(id, reason);
    return {
      status: true,
      message: `Dokumen SPJ '${data.spjNo}' berhasil dibatalkan`,
      data,
    };
  }

  @Patch('legs/:legId')
  @RequirePermissions('SPJ:update')
  @ApiOperation({ summary: 'Update manifes/kupon makan leg perjalanan (Addendum v1.12)' })
  async updateLeg(
    @Param('legId') legId: string,
    @Body() dto: UpdateSpjLegDto,
  ): Promise<ResponseInterface> {
    const data = await this.spjService.updateLeg(legId, dto);
    return {
      status: true,
      message: 'Data leg perjalanan berhasil diperbarui',
      data,
    };
  }

  @Post(':id/replace-crew')
  @RequirePermissions('SPJ:update')
  @ApiOperation({ summary: 'Ganti kru sakit/berhalangan mid-trip (Skenario 1 Poin 7)' })
  async replaceCrew(
    @Param('id') id: string,
    @Body() dto: ReplaceCrewDto,
  ): Promise<ResponseInterface> {
    const data = await this.spjService.replaceCrew(id, dto);
    return {
      status: true,
      message: 'Pergantian kru mid-trip berhasil diproses dengan snapshot tarif baru',
      data,
    };
  }

  @Post(':id/emergency-replace-bus')
  @RequirePermissions('SPJ:update')
  @ApiOperation({ summary: 'Emergency Breakdown: Penggantian armada di tol via parent_spj_id (Skenario 3)' })
  async emergencyReplaceBus(
    @Param('id') id: string,
    @Body() dto: EmergencyReplaceBusDto,
  ): Promise<ResponseInterface> {
    const result = await this.spjService.emergencyReplaceBus(id, dto);
    return {
      status: true,
      message: `Armada pengganti '${result.newSpj.vehicle?.code}' berhasil diterbitkan dengan nomor '${result.newSpj.spjNo}'`,
      data: result,
    };
  }
}
