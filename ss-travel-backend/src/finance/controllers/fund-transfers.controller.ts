import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../@guards/roles/roles.guard';
import { PermissionsGuard } from '../../@guards/permissions/permissions.guard';
import { RequirePermissions } from '../../@guards/permissions/permissions.decorator';
import { FundTransfersService } from '../services/fund-transfers.service';
import {
  CreateFundTransferDto,
  RejectFundTransferDto,
  FundTransferQueryFilterDto,
} from '../../@dto/finance/fund-transfer.dto';
import { ResponseInterface } from '../../@interfaces';

@ApiTags('Fund Transfers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('fund-transfers')
export class FundTransfersController {
  constructor(private readonly fundTransfersService: FundTransfersService) {}

  @Get()
  @RequirePermissions('CashBank:read')
  @ApiOperation({ summary: 'Daftar pemindahan dana' })
  async findAll(@Query() filter: FundTransferQueryFilterDto): Promise<ResponseInterface> {
    const data = await this.fundTransfersService.findAll(filter);
    return { status: true, message: 'Daftar pemindahan dana', data };
  }

  @Get(':id')
  @RequirePermissions('CashBank:read')
  @ApiOperation({ summary: 'Detail pemindahan dana' })
  async findOne(@Param('id') id: string): Promise<ResponseInterface> {
    const data = await this.fundTransfersService.findOne(id);
    return { status: true, message: 'Detail pemindahan dana', data };
  }

  @Post()
  @RequirePermissions('CashBank:create')
  @ApiOperation({ summary: 'Ajukan pemindahan dana baru' })
  async create(@Request() req, @Body() dto: CreateFundTransferDto): Promise<ResponseInterface> {
    const data = await this.fundTransfersService.create(req.user, dto);
    return { status: true, message: 'Pengajuan pemindahan dana berhasil dibuat', data };
  }

  @Put(':id/approve')
  @RequirePermissions('CashBank:approve')
  @ApiOperation({ summary: 'Setujui pemindahan dana' })
  async approve(@Param('id') id: string, @Request() req): Promise<ResponseInterface> {
    const data = await this.fundTransfersService.approve(id, req.user);
    return { status: true, message: 'Pemindahan dana berhasil disetujui & diposting', data };
  }

  @Put(':id/reject')
  @RequirePermissions('CashBank:approve')
  @ApiOperation({ summary: 'Tolak pemindahan dana' })
  async reject(@Param('id') id: string, @Request() req, @Body() dto: RejectFundTransferDto): Promise<ResponseInterface> {
    const data = await this.fundTransfersService.reject(id, req.user, dto);
    return { status: true, message: 'Pemindahan dana ditolak', data };
  }
}
