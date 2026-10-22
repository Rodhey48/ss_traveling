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
import { ApService } from '../services/ap.service';
import {
  CreateApInvoiceDto,
  CreateRestaurantBillDto,
  ApInvoiceQueryDto,
} from '../../@dto/finance/ap-invoice.dto';
import {
  CreateApPaymentDto,
  ApPaymentQueryDto,
} from '../../@dto/finance/ap-payment.dto';
import { RequestInterface, ResponseInterface } from '../../@interfaces';

@ApiTags('AP / Utang Usaha & Tagihan Vendor')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('ap')
export class ApController {
  constructor(private readonly apService: ApService) {}

  @Get('unbilled-spjs/:restaurantId')
  @RequirePermissions('ApInvoices:read')
  @ApiOperation({
    summary: 'Tarik daftar SPJ AKAP yang belum pernah ditagihkan oleh restoran mitra (Anti-Double Billing)',
  })
  async findUnbilledSpjs(
    @Param('restaurantId') restaurantId: string,
  ): Promise<ResponseInterface> {
    const data = await this.apService.findUnbilledSpjsForRestaurant(restaurantId);
    return {
      status: true,
      message: 'Berhasil memuat daftar SPJ belum ditagih untuk restoran mitra',
      data,
    };
  }

  @Post('restaurant-bill')
  @RequirePermissions('ApInvoices:create')
  @ApiOperation({
    summary: 'Buat tagihan berkala servis makan restoran mitra (Skenario 1)',
  })
  async createRestaurantBill(
    @Body() dto: CreateRestaurantBillDto,
    @Req() req: RequestInterface,
  ): Promise<ResponseInterface> {
    const data = await this.apService.createRestaurantBill(dto, req.user?.id);
    return {
      status: true,
      message: 'Tagihan servis makan restoran mitra berhasil dibuat (Draft)',
      data,
    };
  }

  @Post('invoices')
  @RequirePermissions('ApInvoices:create')
  @ApiOperation({ summary: 'Buat tagihan AP umum (Bengkel, Derek, Komisi Agen)' })
  async createInvoice(
    @Body() dto: CreateApInvoiceDto,
    @Req() req: RequestInterface,
  ): Promise<ResponseInterface> {
    const data = await this.apService.createApInvoice(dto, req.user?.id);
    return {
      status: true,
      message: 'Tagihan AP berhasil dibuat (Draft)',
      data,
    };
  }

  @Get('invoices')
  @RequirePermissions('ApInvoices:read')
  @ApiOperation({ summary: 'Daftar tagihan AP dengan filter dan paginasi' })
  async findAllInvoices(@Query() query: ApInvoiceQueryDto): Promise<ResponseInterface> {
    const result = await this.apService.findAllInvoices(query);
    return {
      status: true,
      message: 'Berhasil memuat daftar tagihan AP',
      data: result,
    };
  }

  @Get('invoices/:id')
  @RequirePermissions('ApInvoices:read')
  @ApiOperation({ summary: 'Detail tagihan AP beserta rincian dan alokasi pembayaran' })
  async findInvoiceById(@Param('id') id: string): Promise<ResponseInterface> {
    const data = await this.apService.findInvoiceById(id);
    return {
      status: true,
      message: 'Berhasil memuat detail tagihan AP',
      data,
    };
  }

  @Put('invoices/:id/approve')
  @RequirePermissions('ApInvoices:update')
  @ApiOperation({
    summary: 'Persetujuan Tagihan AP & Posting Jurnal Utang Usaha Atomik',
  })
  async approveInvoice(
    @Param('id') id: string,
    @Req() req: RequestInterface,
  ): Promise<ResponseInterface> {
    const data = await this.apService.approveApInvoice(id, req.user?.id);
    return {
      status: true,
      message: 'Tagihan AP berhasil disetujui dan jurnal utang telah diposting',
      data,
    };
  }

  @Put('invoices/:id/cancel')
  @RequirePermissions('ApInvoices:update')
  @ApiOperation({ summary: 'Pembatalan tagihan AP' })
  async cancelInvoice(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Req() req: RequestInterface,
  ): Promise<ResponseInterface> {
    const data = await this.apService.cancelApInvoice(id, reason, req.user?.id);
    return {
      status: true,
      message: 'Tagihan AP berhasil dibatalkan',
      data,
    };
  }

  @Post('payments')
  @RequirePermissions('ApInvoices:create')
  @ApiOperation({
    summary: 'Pembayaran tagihan AP via Bank/Kas dengan alokasi otomatis',
  })
  async createPayment(
    @Body() dto: CreateApPaymentDto,
    @Req() req: RequestInterface,
  ): Promise<ResponseInterface> {
    const data = await this.apService.createPayment(dto, req.user?.id);
    return {
      status: true,
      message: 'Pembayaran tagihan AP berhasil dicatat dan diposting ke jurnal',
      data,
    };
  }

  @Get('payments')
  @RequirePermissions('ApInvoices:read')
  @ApiOperation({ summary: 'Riwayat pembayaran tagihan AP' })
  async findAllPayments(@Query() query: ApPaymentQueryDto): Promise<ResponseInterface> {
    const result = await this.apService.findAllPayments(query);
    return {
      status: true,
      message: 'Berhasil memuat riwayat pembayaran AP',
      data: result,
    };
  }
}
