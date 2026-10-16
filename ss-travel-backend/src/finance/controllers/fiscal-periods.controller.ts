import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../@guards/roles/roles.guard';
import { PermissionsGuard } from '../../@guards/permissions/permissions.guard';
import { RequirePermissions } from '../../@guards/permissions/permissions.decorator';
import { FiscalPeriodsService } from '../services/fiscal-periods.service';
import {
  CreateFiscalYearDto,
  UpdateFiscalPeriodStatusDto,
  FiscalPeriodQueryFilterDto,
} from '../../@dto/finance/fiscal-period.dto';
import { ResponseInterface, RequestInterface } from '../../@interfaces';

@ApiTags('Fiscal Periods & Years')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('fiscal-periods')
export class FiscalPeriodsController {
  constructor(private readonly fiscalPeriodsService: FiscalPeriodsService) {}

  @Get('years')
  @RequirePermissions('FiscalPeriods:read')
  @ApiOperation({ summary: 'Daftar tahun fiskal akuntansi' })
  async findAllYears(): Promise<ResponseInterface> {
    const data = await this.fiscalPeriodsService.findAllFiscalYears();
    return {
      status: true,
      message: 'Berhasil memuat daftar tahun fiskal',
      data,
    };
  }

  @Get('years/:id')
  @RequirePermissions('FiscalPeriods:read')
  @ApiOperation({ summary: 'Detail tahun fiskal beserta 12 periode bulanan' })
  async findOneYear(@Param('id') id: string): Promise<ResponseInterface> {
    const data = await this.fiscalPeriodsService.findOneFiscalYear(id);
    return {
      status: true,
      message: 'Berhasil memuat detail tahun fiskal',
      data,
    };
  }

  @Post('years')
  @RequirePermissions('FiscalPeriods:create')
  @ApiOperation({ summary: 'Buka tahun fiskal baru (otomatis menghasilkan 12 periode bulanan)' })
  async createYear(@Body() dto: CreateFiscalYearDto): Promise<ResponseInterface> {
    const data = await this.fiscalPeriodsService.createFiscalYear(dto);
    return {
      status: true,
      message: `Tahun fiskal '${data.year}' berhasil dibuat dengan 12 periode bulanan.`,
      data,
    };
  }

  @Get()
  @RequirePermissions('FiscalPeriods:read')
  @ApiOperation({ summary: 'Daftar periode fiskal bulanan' })
  async findAllPeriods(@Query() filter: FiscalPeriodQueryFilterDto): Promise<ResponseInterface> {
    const data = await this.fiscalPeriodsService.findAllPeriods(filter);
    return {
      status: true,
      message: 'Berhasil memuat daftar periode fiskal bulanan',
      data,
    };
  }

  @Get(':id')
  @RequirePermissions('FiscalPeriods:read')
  @ApiOperation({ summary: 'Detail periode fiskal bulanan' })
  async findOnePeriod(@Param('id') id: string): Promise<ResponseInterface> {
    const data = await this.fiscalPeriodsService.findOnePeriod(id);
    return {
      status: true,
      message: 'Berhasil memuat detail periode fiskal',
      data,
    };
  }

  @Patch(':id/status')
  @RequirePermissions('FiscalPeriods:update')
  @ApiOperation({ summary: 'Ubah status periode fiskal (CLOSING, CLOSED, REOPENED)' })
  async updatePeriodStatus(
    @Param('id') id: string,
    @Body() dto: UpdateFiscalPeriodStatusDto,
    @Req() req: RequestInterface,
  ): Promise<ResponseInterface> {
    const userId = req.user?.id;
    const data = await this.fiscalPeriodsService.updatePeriodStatus(id, dto, userId);
    return {
      status: true,
      message: `Status periode '${data.name}' berhasil diubah menjadi ${data.status}.`,
      data,
    };
  }
}
