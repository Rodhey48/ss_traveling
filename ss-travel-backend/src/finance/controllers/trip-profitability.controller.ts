import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../@guards/roles/roles.guard';
import { PermissionsGuard } from '../../@guards/permissions/permissions.guard';
import { RequirePermissions } from '../../@guards/permissions/permissions.decorator';
import { TripProfitabilityService } from '../services/trip-profitability.service';
import {
  TripProfitabilityFilterDto,
  TripProfitabilityViewMode,
} from '../../@dto/finance/reports.dto';
import { ResponseInterface } from '../../@interfaces';

@ApiTags('Trip Profitability / Margin Kontribusi Perjalanan')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('reports/trip-profitability')
export class TripProfitabilityController {
  constructor(
    private readonly tripProfitabilityService: TripProfitabilityService,
  ) {}

  @Get()
  @RequirePermissions('TripProfitability:read')
  @ApiOperation({
    summary: 'Laporan Profitabilitas & Margin Kontribusi SPJ (Per Bus & Per Kelompok Perjalanan)',
  })
  async getTripProfitability(
    @Query() filter: TripProfitabilityFilterDto,
  ): Promise<ResponseInterface> {
    const data = await this.tripProfitabilityService.getTripProfitability(filter);
    return {
      status: true,
      message: 'Laporan Profitabilitas Perjalanan berhasil dimuat',
      data,
    };
  }

  @Get(':id')
  @RequirePermissions('TripProfitability:read')
  @ApiOperation({
    summary: 'Detail Audit Finansial Perjalanan Bus / Kelompok Perjalanan Konsolidasi',
  })
  async getTripProfitabilityDetail(
    @Param('id') id: string,
    @Query('mode') mode?: TripProfitabilityViewMode,
  ): Promise<ResponseInterface> {
    const data = await this.tripProfitabilityService.getTripProfitabilityDetail(
      id,
      mode,
    );
    return {
      status: true,
      message: 'Detail Profitabilitas Perjalanan berhasil dimuat',
      data,
    };
  }
}
