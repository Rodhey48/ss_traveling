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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../@guards/roles/roles.guard';
import { PermissionsGuard } from '../../@guards/permissions/permissions.guard';
import { RequirePermissions } from '../../@guards/permissions/permissions.decorator';
import { CashBankService } from '../services/cash-bank.service';
import {
  CreateCashAccountDto,
  UpdateCashAccountDto,
  CashAccountQueryFilterDto,
} from '../../@dto/finance/cash-account.dto';
import { ResponseInterface } from '../../@interfaces';

@ApiTags('Cash Accounts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('cash-accounts')
export class CashAccountsController {
  constructor(private readonly cashBankService: CashBankService) {}

  @Get()
  @RequirePermissions('CashBank:read')
  @ApiOperation({ summary: 'Daftar rekening kas operasional pool & kas kecil' })
  async findAll(@Query() filter: CashAccountQueryFilterDto): Promise<ResponseInterface> {
    const data = await this.cashBankService.findAllCashAccounts(filter);
    return {
      status: true,
      message: 'Berhasil memuat daftar rekening kas',
      data,
    };
  }

  @Get(':id')
  @RequirePermissions('CashBank:read')
  @ApiOperation({ summary: 'Detail rekening kas berdasarkan ID' })
  async findOne(@Param('id') id: string): Promise<ResponseInterface> {
    const data = await this.cashBankService.findOneCashAccount(id);
    return {
      status: true,
      message: 'Berhasil memuat detail rekening kas',
      data,
    };
  }

  @Get(':id/statement')
  @RequirePermissions('CashBank:read')
  @ApiOperation({ summary: 'Buku kas harian digital rekening kas' })
  async getStatement(
    @Param('id') id: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<ResponseInterface> {
    const data = await this.cashBankService.getCashStatement(id, startDate, endDate);
    return {
      status: true,
      message: 'Berhasil memuat buku kas harian',
      data,
    };
  }

  @Post()
  @RequirePermissions('CashBank:create')
  @ApiOperation({ summary: 'Tambah rekening kas operasional baru' })
  async create(@Body() dto: CreateCashAccountDto): Promise<ResponseInterface> {
    const data = await this.cashBankService.createCashAccount(dto);
    return {
      status: true,
      message: `Rekening kas '${data.code} - ${data.name}' berhasil dibuat.`,
      data,
    };
  }

  @Put(':id')
  @RequirePermissions('CashBank:update')
  @ApiOperation({ summary: 'Perbarui rekening kas operasional' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCashAccountDto,
  ): Promise<ResponseInterface> {
    const data = await this.cashBankService.updateCashAccount(id, dto);
    return {
      status: true,
      message: `Rekening kas '${data.code} - ${data.name}' berhasil diperbarui.`,
      data,
    };
  }

  @Delete(':id')
  @RequirePermissions('CashBank:delete')
  @ApiOperation({ summary: 'Nonaktifkan rekening kas (Soft Delete)' })
  async delete(@Param('id') id: string): Promise<ResponseInterface> {
    const result = await this.cashBankService.deleteCashAccount(id);
    return {
      status: true,
      message: result.message,
    };
  }
}
