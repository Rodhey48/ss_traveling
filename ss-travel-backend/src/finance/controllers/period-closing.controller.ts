import {
  Controller,
  Get,
  Post,
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
import { PeriodClosingService } from '../services/period-closing.service';
import {
  ClosePeriodDto,
  ReopenPeriodDto,
  PeriodClosingFilterDto,
} from '../../@dto/finance/period-closing.dto';
import { RequestInterface, ResponseInterface } from '../../@interfaces';

@ApiTags('Period Closing / Tutup Buku Bulanan')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('period-closing')
export class PeriodClosingController {
  constructor(
    private readonly periodClosingService: PeriodClosingService,
  ) {}

  @Get('periods')
  @RequirePermissions('PeriodClosing:read')
  @ApiOperation({ summary: 'Daftar periode fiskal dan status penutupan buku' })
  async getPeriods(
    @Query() filter: PeriodClosingFilterDto,
  ): Promise<ResponseInterface> {
    const data = await this.periodClosingService.getPeriods(filter);
    return {
      status: true,
      message: 'Daftar periode fiskal berhasil dimuat',
      data,
    };
  }

  @Get(':periodId/checklist')
  @RequirePermissions('PeriodClosing:read')
  @ApiOperation({ summary: 'Mendapatkan audit checklist tutup buku bulanan (6-point check)' })
  async getChecklist(
    @Param('periodId') periodId: string,
    @Req() req: RequestInterface,
  ): Promise<ResponseInterface> {
    const data = await this.periodClosingService.runChecklist(periodId, req.user?.id);
    return {
      status: true,
      message: 'Checklist tutup buku berhasil dijalankan',
      data,
    };
  }

  @Post(':periodId/run-checklist')
  @RequirePermissions('PeriodClosing:read')
  @ApiOperation({ summary: 'Trigger eksekusi ulang audit checklist' })
  async runChecklist(
    @Param('periodId') periodId: string,
    @Req() req: RequestInterface,
  ): Promise<ResponseInterface> {
    const data = await this.periodClosingService.runChecklist(periodId, req.user?.id);
    return {
      status: true,
      message: 'Audit checklist tutup buku berhasil dieksekusi',
      data,
    };
  }

  @Post(':periodId/close')
  @RequirePermissions('PeriodClosing:update')
  @ApiOperation({ summary: 'Eksekusi penutupan buku periode fiskal (Kunci Periode)' })
  async closePeriod(
    @Param('periodId') periodId: string,
    @Body() dto: ClosePeriodDto,
    @Req() req: RequestInterface,
  ): Promise<ResponseInterface> {
    const data = await this.periodClosingService.closePeriod(
      periodId,
      dto,
      req.user?.id,
    );
    return {
      status: true,
      message: `Periode fiskal '${data.name}' berhasil DITUTUP (CLOSED)`,
      data,
    };
  }

  @Post(':periodId/reopen')
  @RequirePermissions('PeriodClosing:update')
  @ApiOperation({ summary: 'Otorisasi pembukaan kembali periode fiskal tertutup (Reopen)' })
  async reopenPeriod(
    @Param('periodId') periodId: string,
    @Body() dto: ReopenPeriodDto,
    @Req() req: RequestInterface,
  ): Promise<ResponseInterface> {
    const data = await this.periodClosingService.reopenPeriod(
      periodId,
      dto,
      req.user?.id,
    );
    return {
      status: true,
      message: `Periode fiskal '${data.name}' berhasil DIBUKA KEMBALI (REOPENED)`,
      data,
    };
  }
}
