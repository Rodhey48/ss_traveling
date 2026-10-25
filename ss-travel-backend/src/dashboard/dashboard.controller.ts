import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../@guards/roles/roles.guard';
import { DashboardService } from './dashboard.service';
import { ResponseInterface } from '../@interfaces';

@ApiTags('Dashboard - Ringkasan Eksekutif & Operasional')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Ringkasan KPI armada, perjalanan SPJ, likuiditas kas/bank, dan alert keuangan' })
  async getSummary(): Promise<ResponseInterface> {
    const data = await this.dashboardService.getSummary();
    return {
      status: true,
      message: 'Berhasil memuat ringkasan dashboard operasional & finansial',
      data,
    };
  }
}
