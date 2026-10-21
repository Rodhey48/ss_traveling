import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../@guards/roles/roles.guard';
import { PermissionsGuard } from '../../@guards/permissions/permissions.guard';
import { RequirePermissions } from '../../@guards/permissions/permissions.decorator';
import { RequestInterface, ResponseInterface } from '@interfaces';
import { SpjUjService } from '../services/spj-uj.service';
import { SpjExpensesService } from '../services/spj-expenses.service';
import { SpjRevenueService } from '../services/spj-revenue.service';
import { CrewMealPaymentsService } from '../services/crew-meal-payments.service';
import {
  CreateSpjUjDisbursementDto,
  CreateSpjUjReturnDto,
  CreateSpjUjAdditionalRequestDto,
  ProcessAdditionalRequestDto,
  UjRolloverDto,
} from '../../@dto/trips/spj-uj.dto';
import {
  CreateSpjExpenseDto,
  VerifySpjExpenseDto,
} from '../../@dto/trips/spj-expense.dto';
import {
  CreateSpjRevenueDeclarationDto,
  VerifySpjRevenueDeclarationDto,
} from '../../@dto/trips/spj-revenue.dto';
import {
  CreateCrewMealPaymentDto,
  DisburseEarlyMealPaymentDto,
} from '../../@dto/trips/crew-meal-payment.dto';

@ApiTags('SPJ Finance (UJ, Expenses, Revenues, Crew Payments)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('spjs')
export class SpjFinanceController {
  constructor(
    private readonly ujService: SpjUjService,
    private readonly expensesService: SpjExpensesService,
    private readonly revenueService: SpjRevenueService,
    private readonly crewMealPaymentsService: CrewMealPaymentsService,
  ) {}

  // -------------------------------------------------------------
  // 1. UANG JALAN (UJ)
  // -------------------------------------------------------------

  @Get(':id/uj')
  @RequirePermissions('SPJ:read')
  @ApiOperation({ summary: 'Ambil data amplop UJ (pencairan, pengeluaran, pengembalian, saldo)' })
  async getUj(@Param('id') id: string): Promise<ResponseInterface> {
    const data = await this.ujService.getOrCreateUj(id);
    return {
      status: true,
      message: 'Data Uang Jalan (UJ) berhasil diambil',
      data,
    };
  }

  @Post(':id/uj/disburse')
  @RequirePermissions('SPJ:update')
  @ApiOperation({ summary: 'Cairkan dana UJ (Initial pool atau Tambahan bank di jalan)' })
  async disburseUj(
    @Param('id') id: string,
    @Body() dto: CreateSpjUjDisbursementDto,
    @Req() req: RequestInterface,
  ): Promise<ResponseInterface> {
    const data = await this.ujService.disburse(id, dto, req.user.id);
    return {
      status: true,
      message: 'Pencairan dana UJ berhasil dicatat',
      data,
    };
  }

  @Post(':id/uj/return')
  @RequirePermissions('SPJ:update')
  @ApiOperation({ summary: 'Catat pengembalian sisa UJ dari kru ke kasir pool' })
  async returnUj(
    @Param('id') id: string,
    @Body() dto: CreateSpjUjReturnDto,
    @Req() req: RequestInterface,
  ): Promise<ResponseInterface> {
    const data = await this.ujService.recordReturn(id, dto, req.user.id);
    return {
      status: true,
      message: 'Pengembalian sisa UJ berhasil dicatat',
      data,
    };
  }

  @Post(':id/uj/additional-request')
  @RequirePermissions('SPJ:update')
  @ApiOperation({ summary: 'Ajukan permintaan tambahan UJ di tengah perjalanan' })
  async requestAdditionalUj(
    @Param('id') id: string,
    @Body() dto: CreateSpjUjAdditionalRequestDto,
    @Req() req: RequestInterface,
  ): Promise<ResponseInterface> {
    const data = await this.ujService.requestAdditionalUj(id, dto, req.user.id);
    return {
      status: true,
      message: 'Pengajuan tambahan UJ berhasil diajukan',
      data,
    };
  }

  @Put('uj/additional-requests/:requestId/process')
  @RequirePermissions('SPJ:update')
  @ApiOperation({ summary: 'Proses persetujuan / penolakan tambahan UJ' })
  async processAdditionalRequest(
    @Param('requestId') requestId: string,
    @Body() dto: ProcessAdditionalRequestDto,
    @Req() req: RequestInterface,
  ): Promise<ResponseInterface> {
    const data = await this.ujService.processAdditionalRequest(
      requestId,
      dto,
      req.user.id,
    );
    return {
      status: true,
      message: `Pengajuan tambahan UJ berhasil di-${dto.status.toLowerCase()}`,
      data,
    };
  }

  @Post(':id/uj/rollover')
  @RequirePermissions('SPJ:update')
  @ApiOperation({ summary: 'Skenario 3: Estafet Rollover UJ saat breakdown bus di tol' })
  async rolloverUj(
    @Param('id') id: string,
    @Body() dto: UjRolloverDto,
    @Req() req: RequestInterface,
  ): Promise<ResponseInterface> {
    const data = await this.ujService.rolloverUj(id, dto, req.user.id);
    return {
      status: true,
      message: 'Estafet sisa UJ ke SPJ pengganti berhasil diproses',
      data,
    };
  }

  // -------------------------------------------------------------
  // 2. PENGELUARAN OPERASIONAL SPJ (EXPENSES)
  // -------------------------------------------------------------

  @Get(':id/expenses')
  @RequirePermissions('SPJ:read')
  @ApiOperation({ summary: 'Daftar pengeluaran operasional SPJ (BBM, Tol, Parkir, dll.)' })
  async getExpenses(@Param('id') id: string): Promise<ResponseInterface> {
    const data = await this.expensesService.findBySpjId(id);
    return {
      status: true,
      message: 'Daftar pengeluaran SPJ berhasil diambil',
      data,
    };
  }

  @Post(':id/expenses')
  @RequirePermissions('SPJ:update')
  @ApiOperation({ summary: 'Input nota pengeluaran operasional SPJ' })
  async createExpense(
    @Param('id') id: string,
    @Body() dto: CreateSpjExpenseDto,
    @Req() req: RequestInterface,
  ): Promise<ResponseInterface> {
    const data = await this.expensesService.create(id, dto, req.user.id);
    return {
      status: true,
      message: 'Pengeluaran SPJ berhasil dicatat',
      data,
    };
  }

  @Put('expenses/:expenseId/verify')
  @RequirePermissions('SPJ:update')
  @ApiOperation({ summary: 'Verifikasi nota pengeluaran oleh kasir pool / akuntan' })
  async verifyExpense(
    @Param('expenseId') expenseId: string,
    @Body() dto: VerifySpjExpenseDto,
    @Req() req: RequestInterface,
  ): Promise<ResponseInterface> {
    const data = await this.expensesService.verify(expenseId, dto, req.user.id);
    return {
      status: true,
      message: 'Verifikasi nota pengeluaran berhasil diperbarui',
      data,
    };
  }

  @Delete('expenses/:expenseId')
  @RequirePermissions('SPJ:update')
  @ApiOperation({ summary: 'Hapus / batalkan baris pengeluaran SPJ' })
  async deleteExpense(
    @Param('expenseId') expenseId: string,
    @Req() req: RequestInterface,
  ): Promise<ResponseInterface> {
    await this.expensesService.delete(expenseId, req.user.id);
    return {
      status: true,
      message: 'Pengeluaran SPJ berhasil dihapus',
    };
  }

  // -------------------------------------------------------------
  // 3. DEKLARASI PENERIMAAN OPERASIONAL (REVENUE DECLARATIONS)
  // -------------------------------------------------------------

  @Get(':id/revenues')
  @RequirePermissions('SPJ:read')
  @ApiOperation({ summary: 'Daftar deklarasi penerimaan tiket fisik, titipan agen, dan kargo' })
  async getRevenues(@Param('id') id: string): Promise<ResponseInterface> {
    const data = await this.revenueService.findBySpjId(id);
    return {
      status: true,
      message: 'Daftar deklarasi penerimaan kas berhasil diambil',
      data,
    };
  }

  @Post(':id/revenues')
  @RequirePermissions('SPJ:update')
  @ApiOperation({ summary: 'Kru deklarasi kas tiket langsung & resi kargo (Anti-Netting)' })
  async createRevenue(
    @Param('id') id: string,
    @Body() dto: CreateSpjRevenueDeclarationDto,
    @Req() req: RequestInterface,
  ): Promise<ResponseInterface> {
    const data = await this.revenueService.create(id, dto, req.user.id);
    return {
      status: true,
      message: 'Deklarasi penerimaan berhasil dicatat',
      data,
    };
  }

  @Put('revenues/:revenueId/verify')
  @RequirePermissions('SPJ:update')
  @ApiOperation({ summary: 'Verifikasi kesesuaian fisik setoran kas penerimaan oleh kasir pool' })
  async verifyRevenue(
    @Param('revenueId') revenueId: string,
    @Body() dto: VerifySpjRevenueDeclarationDto,
    @Req() req: RequestInterface,
  ): Promise<ResponseInterface> {
    const data = await this.revenueService.verify(revenueId, dto, req.user.id);
    return {
      status: true,
      message: 'Status verifikasi deklarasi penerimaan berhasil diperbarui',
      data,
    };
  }

  @Delete('revenues/:revenueId')
  @RequirePermissions('SPJ:update')
  @ApiOperation({ summary: 'Hapus / batalkan deklarasi penerimaan' })
  async deleteRevenue(
    @Param('revenueId') revenueId: string,
    @Req() req: RequestInterface,
  ): Promise<ResponseInterface> {
    await this.revenueService.delete(revenueId, req.user.id);
    return {
      status: true,
      message: 'Deklarasi penerimaan berhasil dihapus',
    };
  }

  // -------------------------------------------------------------
  // 4. HAK KOMPENSASI KRU (CREW MEAL PAYMENTS & EARLY PAYOUT)
  // -------------------------------------------------------------

  @Get(':id/crew-payments')
  @RequirePermissions('SPJ:read')
  @ApiOperation({ summary: 'Daftar hak kompensasi kru (Uang Makan, Premi Ritase, Bonus Full Seat, Komisi Kargo)' })
  async getCrewPayments(@Param('id') id: string): Promise<ResponseInterface> {
    const data = await this.crewMealPaymentsService.findBySpjId(id);
    return {
      status: true,
      message: 'Daftar hak kompensasi kru SPJ berhasil diambil',
      data,
    };
  }

  @Post(':id/crew-payments')
  @RequirePermissions('SPJ:update')
  @ApiOperation({ summary: 'Tambah baris kompensasi kru secara manual' })
  async createCrewPayment(
    @Param('id') id: string,
    @Body() dto: CreateCrewMealPaymentDto,
    @Req() req: RequestInterface,
  ): Promise<ResponseInterface> {
    const data = await this.crewMealPaymentsService.create(
      id,
      dto,
      req.user.id,
    );
    return {
      status: true,
      message: 'Baris hak kompensasi kru berhasil ditambahkan',
      data,
    };
  }

  @Post(':id/crew-payments/sync')
  @RequirePermissions('SPJ:update')
  @ApiOperation({ summary: 'Sinkronisasi hak kompensasi dari snapshot penugasan kru' })
  async syncCrewPayments(@Param('id') id: string): Promise<ResponseInterface> {
    const data = await this.crewMealPaymentsService.syncFromCrewAssignments(id);
    return {
      status: true,
      message: 'Hak kompensasi kru berhasil disinkronkan dari data penugasan',
      data,
    };
  }

  @Post('crew-payments/:paymentId/early-disburse')
  @RequirePermissions('SPJ:update')
  @ApiOperation({ summary: 'Skenario 2: Pencairan uang premi/makan di muka via bank transfer' })
  async disburseEarly(
    @Param('paymentId') paymentId: string,
    @Body() dto: DisburseEarlyMealPaymentDto,
    @Req() req: RequestInterface,
  ): Promise<ResponseInterface> {
    const data = await this.crewMealPaymentsService.disburseEarly(
      paymentId,
      dto,
      req.user.id,
    );
    return {
      status: true,
      message: 'Pencairan kompensasi di muka berhasil dicatat',
      data,
    };
  }
}
