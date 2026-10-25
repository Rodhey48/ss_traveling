import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
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
import { PettyCashService } from '../services/petty-cash.service';
import {
  CreatePettyCashDisbursementDto,
  CreatePettyCashReplenishmentDto,
  VerifyPettyCashDto,
  RejectPettyCashDto,
  PettyCashFilterDto,
} from '../../@dto/finance/petty-cash.dto';
import { ResponseInterface } from '../../@interfaces';

@ApiTags('Finance - Kas Kecil Pool (Petty Cash)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('petty-cash')
export class PettyCashController {
  constructor(private readonly pettyCashService: PettyCashService) {}

  @Get('summary')
  @RequirePermissions('PettyCash:read')
  @ApiOperation({ summary: 'Ringkasan saldo & aktivitas kas kecil pool garasi' })
  async getSummary(
    @Query('cashAccountId') cashAccountId?: string,
  ): Promise<ResponseInterface> {
    const data = await this.pettyCashService.getSummary(cashAccountId);
    return {
      status: true,
      message: 'Berhasil memuat ringkasan kas kecil pool',
      data,
    };
  }

  @Get('expense-accounts')
  @RequirePermissions('PettyCash:read')
  @ApiOperation({ summary: 'Daftar akun beban COA rekomendasi untuk pengeluaran kas kecil' })
  async getExpenseAccounts(): Promise<ResponseInterface> {
    const data = await this.pettyCashService.getExpenseAccounts();
    return {
      status: true,
      message: 'Berhasil memuat akun beban COA kas kecil',
      data,
    };
  }

  @Get()
  @RequirePermissions('PettyCash:read')
  @ApiOperation({ summary: 'Daftar transaksi kas kecil pool dengan filter' })
  async getTransactions(
    @Query() filter: PettyCashFilterDto,
  ): Promise<ResponseInterface> {
    const data = await this.pettyCashService.getTransactions(filter);
    return {
      status: true,
      message: 'Berhasil memuat transaksi kas kecil',
      data,
    };
  }

  @Get(':id')
  @RequirePermissions('PettyCash:read')
  @ApiOperation({ summary: 'Detail transaksi kas kecil beserta baris jurnal GL' })
  async getTransactionDetail(@Param('id') id: string): Promise<ResponseInterface> {
    const data = await this.pettyCashService.getTransactionDetail(id);
    return {
      status: true,
      message: 'Berhasil memuat detail transaksi kas kecil',
      data,
    };
  }

  @Post('disbursement')
  @RequirePermissions('PettyCash:create')
  @ApiOperation({ summary: 'Input pengeluaran kas kecil pool (BKK)' })
  async createDisbursement(
    @Body() dto: CreatePettyCashDisbursementDto,
    @Req() req: any,
  ): Promise<ResponseInterface> {
    const data = await this.pettyCashService.createDisbursement(dto, req.user?.id);
    return {
      status: true,
      message: `Bukti Kas Keluar '${data.transactionNo}' berhasil dicatat.`,
      data,
    };
  }

  @Post('replenishment')
  @RequirePermissions('PettyCash:create')
  @ApiOperation({ summary: 'Input pengisian kembali kas kecil (Replenishment / BKM)' })
  async createReplenishment(
    @Body() dto: CreatePettyCashReplenishmentDto,
    @Req() req: any,
  ): Promise<ResponseInterface> {
    const data = await this.pettyCashService.createReplenishment(dto, req.user?.id);
    return {
      status: true,
      message: `Bukti Kas Masuk Replenishment '${data.transactionNo}' berhasil dicatat & terposting ke GL.`,
      data,
    };
  }

  @Put(':id/verify')
  @RequirePermissions('PettyCash:update')
  @ApiOperation({ summary: 'Verifikasi & approval pengeluaran kas kecil oleh Akuntan (Posting Jurnal GL)' })
  async verifyTransaction(
    @Param('id') id: string,
    @Body() dto: VerifyPettyCashDto,
    @Req() req: any,
  ): Promise<ResponseInterface> {
    const data = await this.pettyCashService.verifyTransaction(id, dto, req.user?.id);
    return {
      status: true,
      message: `Transaksi kas kecil '${data.transactionNo}' berhasil diverifikasi & terposting ke Jurnal GL.`,
      data,
    };
  }

  @Put(':id/reject')
  @RequirePermissions('PettyCash:update')
  @ApiOperation({ summary: 'Tolak pengeluaran kas kecil' })
  async rejectTransaction(
    @Param('id') id: string,
    @Body() dto: RejectPettyCashDto,
    @Req() req: any,
  ): Promise<ResponseInterface> {
    const data = await this.pettyCashService.rejectTransaction(id, dto, req.user?.id);
    return {
      status: true,
      message: `Transaksi kas kecil '${data.transactionNo}' telah ditolak.`,
      data,
    };
  }

  @Delete(':id')
  @RequirePermissions('PettyCash:delete')
  @ApiOperation({ summary: 'Hapus transaksi kas kecil (Hanya jika belum diverifikasi)' })
  async deleteTransaction(@Param('id') id: string): Promise<ResponseInterface> {
    const data = await this.pettyCashService.deleteTransaction(id);
    return {
      status: true,
      message: data.message,
      data,
    };
  }
}
