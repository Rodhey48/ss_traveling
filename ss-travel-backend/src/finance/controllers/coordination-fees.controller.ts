import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../@guards/roles/roles.guard';
import { PermissionsGuard } from '../../@guards/permissions/permissions.guard';
import { RequirePermissions } from '../../@guards/permissions/permissions.decorator';
import { RequestInterface } from '../../@interfaces';
import { CoordinationFeesService } from '../services/coordination-fees.service';
import {
  CreateCoordinationFeeBatchDto,
  CoordinationFeeFilterDto,
  UpdateCoordinatorFeeRuleDto,
} from '../../@dto/finance/coordination-fee.dto';

@ApiTags('Finance - Coordination Fees (Uang Koordinasi Lapangan)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('finance/coordination-fees')
export class CoordinationFeesController {
  constructor(
    private readonly coordinationFeesService: CoordinationFeesService,
  ) {}

  @Get('pending')
  @RequirePermissions('Finance:read')
  @ApiOperation({ summary: 'Daftar kewajiban koordinasi SPJ siap bayar gelondongan' })
  async getPendingFees(@Query() query: CoordinationFeeFilterDto) {
    const data = await this.coordinationFeesService.getPendingCoordinationFees(query);
    return {
      status: true,
      message: 'Daftar kewajiban koordinasi SPJ berhasil diambil',
      data,
    };
  }

  @Post('batches')
  @RequirePermissions('Finance:create')
  @ApiOperation({ summary: 'Bayar uang koordinasi beberapa SPJ secara GELONDONGAN (Bulk Transfer Bank)' })
  async createBatch(
    @Body() dto: CreateCoordinationFeeBatchDto,
    @Req() req: RequestInterface,
  ) {
    const data = await this.coordinationFeesService.createBatchSettlement(
      dto,
      req.user.id,
    );
    return {
      status: true,
      message: 'Pembayaran gelondongan uang koordinasi berhasil dieksekusi',
      data,
    };
  }

  @Get('batches')
  @RequirePermissions('Finance:read')
  @ApiOperation({ summary: 'Riwayat batch pembayaran gelondongan koordinasi lapangan' })
  async getBatches() {
    const data = await this.coordinationFeesService.getBatches();
    return {
      status: true,
      message: 'Riwayat batch koordinasi berhasil diambil',
      data,
    };
  }

  @Get('batches/:id')
  @RequirePermissions('Finance:read')
  @ApiOperation({ summary: 'Rincian batch pembayaran gelondongan & teks WhatsApp remitan' })
  async getBatchDetail(@Param('id') id: string) {
    const data = await this.coordinationFeesService.getBatchDetail(id);
    return {
      status: true,
      message: 'Rincian batch koordinasi berhasil diambil',
      data,
    };
  }

  @Get('rules')
  @RequirePermissions('Finance:read')
  @ApiOperation({ summary: 'Daftar aturan tarif koordinasi per zona' })
  async getRules() {
    const data = await this.coordinationFeesService.getRules();
    return {
      status: true,
      message: 'Daftar aturan tarif koordinasi berhasil diambil',
      data,
    };
  }

  @Put('rules/:id')
  @RequirePermissions('Finance:update')
  @ApiOperation({ summary: 'Perbarui tarif koordinasi per pax per zona' })
  async updateRule(
    @Param('id') id: string,
    @Body() dto: UpdateCoordinatorFeeRuleDto,
  ) {
    const data = await this.coordinationFeesService.updateRule(id, dto);
    return {
      status: true,
      message: 'Tarif koordinasi berhasil diperbarui',
      data,
    };
  }

  @Delete(':id')
  @RequirePermissions('Finance:delete')
  @ApiOperation({ summary: 'Hapus kewajiban koordinasi SPJ dan batalkan jurnal akrualnya' })
  async deleteFee(@Param('id') id: string, @Req() req: RequestInterface) {
    await this.coordinationFeesService.deleteCoordinationFee(id, req.user.id);
    return {
      status: true,
      message: 'Kewajiban uang koordinasi dan jurnal akrual berhasil dibatalkan',
    };
  }

  @Post('spj/:spjId/sync')
  @RequirePermissions('Finance:create')
  @ApiOperation({ summary: 'Sinkronkan kalkulasi & akrual beban koordinasi SPJ' })
  async syncSpjFee(
    @Param('spjId') spjId: string,
    @Req() req: RequestInterface,
  ) {
    const data = await this.coordinationFeesService.syncSpjCoordinationFees(
      spjId,
      req.user.id,
    );
    return {
      status: true,
      message: 'Kalkulasi uang koordinasi SPJ berhasil disinkronkan',
      data,
    };
  }

  @Get('spj/:spjId')
  @RequirePermissions('Finance:read')
  @ApiOperation({ summary: 'Rincian uang koordinasi pada 1 SPJ' })
  async getSpjFees(@Param('spjId') spjId: string) {
    const data = await this.coordinationFeesService.getSpjCoordinationFees(spjId);
    return {
      status: true,
      message: 'Data uang koordinasi SPJ berhasil diambil',
      data,
    };
  }
}
