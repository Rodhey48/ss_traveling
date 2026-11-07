import {
  Controller,
  Get,
  Post,
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
import { RestaurantSettlementsService } from '../services/restaurant-settlements.service';
import {
  RecordSpjMealDto,
  CreateRestaurantSettlementBatchDto,
  RestaurantSettlementFilterDto,
} from '../../@dto/finance/restaurant-settlement.dto';

@ApiTags('Finance - Restaurant Settlements (Tagihan Restoran Mitra)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('finance/restaurant-settlements')
export class RestaurantSettlementsController {
  constructor(
    private readonly restaurantSettlementsService: RestaurantSettlementsService,
  ) {}

  @Get('pending')
  @RequirePermissions('Finance:read')
  @ApiOperation({ summary: 'Daftar kupon makan SPJ siap bayar gelondongan ke restoran' })
  async getPendingRecords(@Query() query: RestaurantSettlementFilterDto) {
    const data = await this.restaurantSettlementsService.getPendingMealRecords(query);
    return {
      status: true,
      message: 'Daftar kupon makan restoran berhasil diambil',
      data,
    };
  }

  @Post('batches')
  @RequirePermissions('Finance:create')
  @ApiOperation({ summary: 'Bayar kupon makan beberapa SPJ secara GELONDONGAN (Bulk Transfer Bank)' })
  async createBatch(
    @Body() dto: CreateRestaurantSettlementBatchDto,
    @Req() req: RequestInterface,
  ) {
    const data = await this.restaurantSettlementsService.createBatchSettlement(
      dto,
      req.user.id,
    );
    return {
      status: true,
      message: 'Pembayaran gelondongan kupon restoran berhasil dieksekusi',
      data,
    };
  }

  @Get('batches')
  @RequirePermissions('Finance:read')
  @ApiOperation({ summary: 'Riwayat batch pembayaran gelondongan restoran' })
  async getBatches() {
    const data = await this.restaurantSettlementsService.getBatches();
    return {
      status: true,
      message: 'Riwayat batch pembayaran restoran berhasil diambil',
      data,
    };
  }

  @Get('batches/:id')
  @RequirePermissions('Finance:read')
  @ApiOperation({ summary: 'Rincian batch pembayaran restoran & teks WhatsApp remitan' })
  async getBatchDetail(@Param('id') id: string) {
    const data = await this.restaurantSettlementsService.getBatchDetail(id);
    return {
      status: true,
      message: 'Rincian batch pembayaran restoran berhasil diambil',
      data,
    };
  }

  @Get('restaurants')
  @RequirePermissions('Finance:read')
  @ApiOperation({ summary: 'Daftar restoran mitra aktif' })
  async getRestaurants() {
    const data = await this.restaurantSettlementsService.getRestaurants();
    return {
      status: true,
      message: 'Daftar restoran mitra berhasil diambil',
      data,
    };
  }

  @Post('spj/:spjId/record')
  @RequirePermissions('Finance:create')
  @ApiOperation({ summary: 'Catat / update servis makan SPJ (akrual Beban 51102 vs Utang 21101)' })
  async recordSpjMeal(
    @Param('spjId') spjId: string,
    @Body() dto: RecordSpjMealDto,
    @Req() req: RequestInterface,
  ) {
    const data = await this.restaurantSettlementsService.recordSpjMeal(
      spjId,
      dto,
      req.user.id,
    );
    return {
      status: true,
      message: 'Catatan kupon makan SPJ berhasil disimpan dan diakrualkan',
      data,
    };
  }

  @Get('spj/:spjId')
  @RequirePermissions('Finance:read')
  @ApiOperation({ summary: 'Data kupon makan pada 1 SPJ' })
  async getSpjMealRecords(@Param('spjId') spjId: string) {
    const data = await this.restaurantSettlementsService.getSpjMealRecords(spjId);
    return {
      status: true,
      message: 'Data kupon makan SPJ berhasil diambil',
      data,
    };
  }

  @Delete(':id')
  @RequirePermissions('Finance:delete')
  @ApiOperation({ summary: 'Hapus catatan kupon makan SPJ dan batalkan jurnal akrualnya' })
  async deleteRecord(@Param('id') id: string, @Req() req: RequestInterface) {
    await this.restaurantSettlementsService.deleteSpjMealRecord(id, req.user.id);
    return {
      status: true,
      message: 'Catatan kupon makan dan jurnal akrual berhasil dibatalkan',
    };
  }
}
