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
import { AccountsService } from '../services/accounts.service';
import {
  CreateAccountDto,
  UpdateAccountDto,
  AccountQueryFilterDto,
} from '../../@dto/finance/account.dto';
import { ResponseInterface } from '../../@interfaces';

@ApiTags('Accounts / COA')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get()
  @RequirePermissions('Accounts:read')
  @ApiOperation({ summary: 'Daftar bagan akun (COA) flat atau pohon hierarki' })
  async findAll(@Query() filter: AccountQueryFilterDto): Promise<ResponseInterface> {
    const data = await this.accountsService.findAll(filter);
    return {
      status: true,
      message: 'Berhasil memuat daftar bagan akun (COA)',
      data,
    };
  }

  @Get(':id')
  @RequirePermissions('Accounts:read')
  @ApiOperation({ summary: 'Detail akun COA berdasarkan ID' })
  async findOne(@Param('id') id: string): Promise<ResponseInterface> {
    const data = await this.accountsService.findOne(id);
    return {
      status: true,
      message: 'Berhasil memuat detail akun',
      data,
    };
  }

  @Post()
  @RequirePermissions('Accounts:create')
  @ApiOperation({ summary: 'Tambah akun baru pada bagan akun (COA)' })
  async create(@Body() dto: CreateAccountDto): Promise<ResponseInterface> {
    const data = await this.accountsService.create(dto);
    return {
      status: true,
      message: `Akun '${data.code} - ${data.name}' berhasil dibuat.`,
      data,
    };
  }

  @Put(':id')
  @RequirePermissions('Accounts:update')
  @ApiOperation({ summary: 'Perbarui akun COA' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateAccountDto,
  ): Promise<ResponseInterface> {
    const data = await this.accountsService.update(id, dto);
    return {
      status: true,
      message: `Akun '${data.code} - ${data.name}' berhasil diperbarui.`,
      data,
    };
  }

  @Delete(':id')
  @RequirePermissions('Accounts:delete')
  @ApiOperation({ summary: 'Nonaktifkan akun COA (Soft Delete)' })
  async delete(@Param('id') id: string): Promise<ResponseInterface> {
    const result = await this.accountsService.delete(id);
    return {
      status: true,
      message: result.message,
    };
  }
}
