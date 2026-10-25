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
  CreateBankAccountDto,
  UpdateBankAccountDto,
  BankAccountQueryFilterDto,
} from '../../@dto/finance/bank-account.dto';
import { ResponseInterface } from '../../@interfaces';

@ApiTags('Bank Accounts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('bank-accounts')
export class BankAccountsController {
  constructor(private readonly cashBankService: CashBankService) {}

  @Get()
  @RequirePermissions('CashBank:read')
  @ApiOperation({ summary: 'Daftar rekening bank korporat' })
  async findAll(@Query() filter: BankAccountQueryFilterDto): Promise<ResponseInterface> {
    const data = await this.cashBankService.findAllBankAccounts(filter);
    return {
      status: true,
      message: 'Berhasil memuat daftar rekening bank',
      data,
    };
  }

  @Get(':id')
  @RequirePermissions('CashBank:read')
  @ApiOperation({ summary: 'Detail rekening bank berdasarkan ID' })
  async findOne(@Param('id') id: string): Promise<ResponseInterface> {
    const data = await this.cashBankService.findOneBankAccount(id);
    return {
      status: true,
      message: 'Berhasil memuat detail rekening bank',
      data,
    };
  }

  @Get(':id/statement')
  @RequirePermissions('CashBank:read')
  @ApiOperation({ summary: 'Rekening koran digital rekening bank' })
  async getStatement(
    @Param('id') id: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<ResponseInterface> {
    const data = await this.cashBankService.getBankStatement(id, startDate, endDate);
    return {
      status: true,
      message: 'Berhasil memuat rekening koran bank',
      data,
    };
  }

  @Post()
  @RequirePermissions('CashBank:create')
  @ApiOperation({ summary: 'Tambah rekening bank baru' })
  async create(@Body() dto: CreateBankAccountDto): Promise<ResponseInterface> {
    const data = await this.cashBankService.createBankAccount(dto);
    return {
      status: true,
      message: `Rekening bank '${data.code} - ${data.bankName} (${data.accountNumberMasked})' berhasil dibuat.`,
      data,
    };
  }

  @Put(':id')
  @RequirePermissions('CashBank:update')
  @ApiOperation({ summary: 'Perbarui rekening bank' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateBankAccountDto,
  ): Promise<ResponseInterface> {
    const data = await this.cashBankService.updateBankAccount(id, dto);
    return {
      status: true,
      message: `Rekening bank '${data.code} - ${data.bankName}' berhasil diperbarui.`,
      data,
    };
  }

  @Delete(':id')
  @RequirePermissions('CashBank:delete')
  @ApiOperation({ summary: 'Nonaktifkan rekening bank (Soft Delete)' })
  async delete(@Param('id') id: string): Promise<ResponseInterface> {
    const result = await this.cashBankService.deleteBankAccount(id);
    return {
      status: true,
      message: result.message,
    };
  }
}
