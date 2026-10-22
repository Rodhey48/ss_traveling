import {
  Controller,
  Get,
  Post,
  Put,
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
import { ArService } from '../services/ar.service';
import {
  CreateArInvoiceDto,
  CreateCharterPelunasanInvoiceDto,
  ArInvoiceQueryDto,
} from '../../@dto/finance/ar-invoice.dto';
import {
  CreateArReceiptDto,
  CreateDownPaymentReceiptDto,
  ArReceiptQueryDto,
} from '../../@dto/finance/ar-receipt.dto';
import { RequestInterface, ResponseInterface } from '../../@interfaces';

@ApiTags('AR / Piutang Usaha & Uang Muka Sewa Wisata')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('ar')
export class ArController {
  constructor(private readonly arService: ArService) {}

  @Post('down-payment')
  @RequirePermissions('ArInvoices:create')
  @ApiOperation({
    summary: 'Penerimaan Uang Muka (DP) Sewa Wisata 30% via Bank/Kas (Skenario 2)',
  })
  async createDownPayment(
    @Body() dto: CreateDownPaymentReceiptDto,
    @Req() req: RequestInterface,
  ): Promise<ResponseInterface> {
    const data = await this.arService.createDownPaymentReceipt(dto, req.user?.id);
    return {
      status: true,
      message: 'Penerimaan DP sewa wisata berhasil dicatat dan jurnal liabilitas (24101) telah diposting',
      data,
    };
  }

  @Post('charter-pelunasan')
  @RequirePermissions('ArInvoices:create')
  @ApiOperation({
    summary: 'Penerbitan Invoice Pelunasan Sewa Wisata 70% (Skenario 2)',
  })
  async createCharterPelunasanInvoice(
    @Body() dto: CreateCharterPelunasanInvoiceDto,
    @Req() req: RequestInterface,
  ): Promise<ResponseInterface> {
    const data = await this.arService.createCharterPelunasanInvoice(dto, req.user?.id);
    return {
      status: true,
      message: 'Invoice pelunasan sewa wisata berhasil diterbitkan',
      data,
    };
  }

  @Post('invoices')
  @RequirePermissions('ArInvoices:create')
  @ApiOperation({ summary: 'Buat invoice AR umum' })
  async createInvoice(
    @Body() dto: CreateArInvoiceDto,
    @Req() req: RequestInterface,
  ): Promise<ResponseInterface> {
    const data = await this.arService.createArInvoice(dto, req.user?.id);
    return {
      status: true,
      message: 'Invoice AR berhasil dibuat (Draft)',
      data,
    };
  }

  @Get('invoices')
  @RequirePermissions('ArInvoices:read')
  @ApiOperation({ summary: 'Daftar invoice AR dengan filter dan paginasi' })
  async findAllInvoices(@Query() query: ArInvoiceQueryDto): Promise<ResponseInterface> {
    const result = await this.arService.findAllInvoices(query);
    return {
      status: true,
      message: 'Berhasil memuat daftar invoice AR',
      data: result,
    };
  }

  @Get('invoices/:id')
  @RequirePermissions('ArInvoices:read')
  @ApiOperation({ summary: 'Detail invoice AR beserta alokasi pelunasan' })
  async findInvoiceById(@Param('id') id: string): Promise<ResponseInterface> {
    const data = await this.arService.findInvoiceById(id);
    return {
      status: true,
      message: 'Berhasil memuat detail invoice AR',
      data,
    };
  }

  @Put('invoices/:id/approve')
  @RequirePermissions('ArInvoices:update')
  @ApiOperation({ summary: 'Persetujuan invoice AR' })
  async approveInvoice(
    @Param('id') id: string,
    @Req() req: RequestInterface,
  ): Promise<ResponseInterface> {
    const data = await this.arService.approveArInvoice(id, req.user?.id);
    return {
      status: true,
      message: 'Invoice AR berhasil disetujui',
      data,
    };
  }

  @Post('receipts')
  @RequirePermissions('ArInvoices:create')
  @ApiOperation({
    summary: 'Penerimaan pembayaran pelunasan piutang AR (Alokasi ke invoice)',
  })
  async createReceipt(
    @Body() dto: CreateArReceiptDto,
    @Req() req: RequestInterface,
  ): Promise<ResponseInterface> {
    const data = await this.arService.createReceipt(dto, req.user?.id);
    return {
      status: true,
      message: 'Penerimaan pembayaran piutang berhasil dicatat dan diposting ke jurnal',
      data,
    };
  }

  @Get('receipts')
  @RequirePermissions('ArInvoices:read')
  @ApiOperation({ summary: 'Riwayat penerimaan pembayaran piutang / DP' })
  async findAllReceipts(@Query() query: ArReceiptQueryDto): Promise<ResponseInterface> {
    const result = await this.arService.findAllReceipts(query);
    return {
      status: true,
      message: 'Berhasil memuat riwayat penerimaan piutang',
      data: result,
    };
  }

  @Get('charter-status/:tripId')
  @RequirePermissions('ArInvoices:read')
  @ApiOperation({
    summary: 'Status finansial kontrak sewa wisata (DP, Invoice Pelunasan, Saldo Piutang)',
  })
  async getCharterStatus(@Param('tripId') tripId: string): Promise<ResponseInterface> {
    const data = await this.arService.getCharterContractStatus(tripId);
    return {
      status: true,
      message: 'Berhasil memuat status finansial kontrak sewa wisata',
      data,
    };
  }
}
