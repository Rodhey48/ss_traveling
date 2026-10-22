import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
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
import { CashierDiscrepancyService } from '../services/cashier-discrepancy.service';
import {
  CreateDiscrepancyDto,
  ResolveDiscrepancyDto,
  DiscrepancyFilterQueryDto,
} from '../../@dto/cashier';

@ApiTags('Cashier Discrepancy & FM Resolution')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('cashier/discrepancies')
export class CashierDiscrepancyController {
  constructor(private readonly discrepancyService: CashierDiscrepancyService) {}

  @Get()
  @RequirePermissions('Cashier:read')
  @ApiOperation({ summary: 'Daftar temuan selisih kas kasir yang menunggu/sudah diinvestigasi' })
  async getDiscrepancies(
    @Query() query: DiscrepancyFilterQueryDto,
  ): Promise<ResponseInterface> {
    const data = await this.discrepancyService.getDiscrepancies(query);
    return {
      status: true,
      message: 'Daftar temuan selisih kas berhasil diambil',
      data,
    };
  }

  @Get(':id')
  @RequirePermissions('Cashier:read')
  @ApiOperation({ summary: 'Detail satu temuan selisih kas kasir' })
  async getDiscrepancyById(@Param('id') id: string): Promise<ResponseInterface> {
    const data = await this.discrepancyService.getDiscrepancyById(id);
    return {
      status: true,
      message: 'Detail selisih kas berhasil diambil',
      data,
    };
  }

  @Post()
  @RequirePermissions('Cashier:create')
  @ApiOperation({ summary: 'Catat temuan selisih kas operasional (Lapis 2 Jalur Sistemik Kasir)' })
  async createDiscrepancy(
    @Body() dto: CreateDiscrepancyDto,
    @Req() req: RequestInterface,
  ): Promise<ResponseInterface> {
    const data = await this.discrepancyService.createDiscrepancy(dto, req.user.id);
    return {
      status: true,
      message: 'Temuan selisih kas kasir berhasil dicatat untuk investigasi',
      data,
    };
  }

  @Put(':id/resolve')
  @RequirePermissions('Cashier:update')
  @ApiOperation({ summary: 'Otorisasi Keputusan Finance Manager (Dispensasi Perusahaan vs Klaim Kru)' })
  async resolveDiscrepancy(
    @Param('id') id: string,
    @Body() dto: ResolveDiscrepancyDto,
    @Req() req: RequestInterface,
  ): Promise<ResponseInterface> {
    const data = await this.discrepancyService.resolveDiscrepancy(id, dto, req.user.id);
    return {
      status: true,
      message: 'Resolusi selisih kas berhasil disahkan oleh Manajer Keuangan',
      data,
    };
  }
}
