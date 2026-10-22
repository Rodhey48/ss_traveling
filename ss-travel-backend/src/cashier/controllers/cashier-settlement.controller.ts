import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../@guards/roles/roles.guard';
import { PermissionsGuard } from '../../@guards/permissions/permissions.guard';
import { RequirePermissions } from '../../@guards/permissions/permissions.decorator';
import { RequestInterface, ResponseInterface } from '@interfaces';
import { CashierSettlementService } from '../services/cashier-settlement.service';
import { CreateSettlementDto, CashierFilterQueryDto } from '../../@dto/cashier';

@ApiTags('Cashier Pool Desk & Settlement')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('cashier')
export class CashierSettlementController {
  constructor(private readonly settlementService: CashierSettlementService) {}

  @Get('pending-spjs')
  @RequirePermissions('Cashier:read')
  @ApiOperation({ summary: 'Daftar SPJ kepulangan yang siap direkonsiliasi di kasir pool' })
  async getPendingSpjs(@Query() query: CashierFilterQueryDto): Promise<ResponseInterface> {
    const data = await this.settlementService.getPendingSpjs(query);
    return {
      status: true,
      message: 'Daftar SPJ siap settlement berhasil diambil',
      data,
    };
  }

  @Get('settlements')
  @RequirePermissions('Cashier:read')
  @ApiOperation({ summary: 'Riwayat seluruh rekonsiliasi kas kasir' })
  async getSettlements(@Query() query: CashierFilterQueryDto): Promise<ResponseInterface> {
    const data = await this.settlementService.getSettlements(query);
    return {
      status: true,
      message: 'Riwayat settlement kasir berhasil diambil',
      data,
    };
  }

  @Get('spjs/:spjId/summary')
  @RequirePermissions('Cashier:read')
  @ApiOperation({ summary: 'Kalkulasi Dua Kantong Kas Kru (Anti-Netting) untuk satu SPJ' })
  async getSettlementSummary(@Param('spjId') spjId: string): Promise<ResponseInterface> {
    const data = await this.settlementService.calculateSettlement(spjId);
    return {
      status: true,
      message: 'Ringkasan dua kantong kas kru berhasil dihitung',
      data,
    };
  }

  @Post('settlements')
  @RequirePermissions('Cashier:create')
  @ApiOperation({ summary: 'Proses settlement rekonsiliasi kas kasir pool (Anti-Netting)' })
  async processSettlement(
    @Body() dto: CreateSettlementDto,
    @Req() req: RequestInterface,
  ): Promise<ResponseInterface> {
    const data = await this.settlementService.processSettlement(dto, req.user.id);
    return {
      status: true,
      message: 'Settlement kasir berhasil diproses',
      data,
    };
  }

  @Post('settlements/:id/unblock-period-closing')
  @RequirePermissions('Cashier:update')
  @ApiOperation({ summary: 'Posting penampung akun 11999 agar tutup buku bulanan tidak terblokir' })
  async unblockPeriodClosing(
    @Param('id') id: string,
    @Req() req: RequestInterface,
  ): Promise<ResponseInterface> {
    const data = await this.settlementService.postUnblockedPendingSettlement(id, req.user.id);
    return {
      status: true,
      message: 'Selisih kas berhasil dialokasikan ke akun penampung 11999 untuk unblock tutup buku',
      data,
    };
  }
}
