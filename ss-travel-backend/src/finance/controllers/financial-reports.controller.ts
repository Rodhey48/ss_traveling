import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../@guards/roles/roles.guard';
import { PermissionsGuard } from '../../@guards/permissions/permissions.guard';
import { RequirePermissions } from '../../@guards/permissions/permissions.decorator';
import { FinancialReportsService } from '../services/financial-reports.service';
import {
  GeneralLedgerFilterDto,
  TrialBalanceFilterDto,
  IncomeStatementFilterDto,
  BalanceSheetFilterDto,
} from '../../@dto/finance/reports.dto';
import { ResponseInterface } from '../../@interfaces';

@ApiTags('Financial Reports / Laporan Keuangan')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('reports')
export class FinancialReportsController {
  constructor(
    private readonly financialReportsService: FinancialReportsService,
  ) {}

  @Get('general-ledger')
  @RequirePermissions('GeneralLedger:read')
  @ApiOperation({ summary: 'Laporan Buku Besar (General Ledger) per Akun dan Periode' })
  async getGeneralLedger(
    @Query() filter: GeneralLedgerFilterDto,
  ): Promise<ResponseInterface> {
    const data = await this.financialReportsService.getGeneralLedger(filter);
    return {
      status: true,
      message: 'Laporan Buku Besar berhasil dimuat',
      data,
    };
  }

  @Get('trial-balance')
  @RequirePermissions('GeneralLedger:read')
  @ApiOperation({ summary: 'Laporan Neraca Saldo (Trial Balance) Periode Fiskal' })
  async getTrialBalance(
    @Query() filter: TrialBalanceFilterDto,
  ): Promise<ResponseInterface> {
    const data = await this.financialReportsService.getTrialBalance(filter);
    return {
      status: true,
      message: 'Neraca Saldo berhasil dimuat',
      data,
    };
  }

  @Get('income-statement')
  @RequirePermissions('GeneralLedger:read')
  @ApiOperation({ summary: 'Laporan Laba Rugi (Income Statement / P&L)' })
  async getIncomeStatement(
    @Query() filter: IncomeStatementFilterDto,
  ): Promise<ResponseInterface> {
    const data = await this.financialReportsService.getIncomeStatement(filter);
    return {
      status: true,
      message: 'Laporan Laba Rugi berhasil dimuat',
      data,
    };
  }

  @Get('balance-sheet')
  @RequirePermissions('GeneralLedger:read')
  @ApiOperation({ summary: 'Laporan Neraca Keuangan (Balance Sheet)' })
  async getBalanceSheet(
    @Query() filter: BalanceSheetFilterDto,
  ): Promise<ResponseInterface> {
    const data = await this.financialReportsService.getBalanceSheet(filter);
    return {
      status: true,
      message: 'Laporan Neraca berhasil dimuat',
      data,
    };
  }
}
