import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../@guards/roles/roles.guard';
import { PermissionsGuard } from '../../@guards/permissions/permissions.guard';
import { RequirePermissions } from '../../@guards/permissions/permissions.decorator';
import { ResponseInterface } from '../../@interfaces/response/response.interface';
import { PartnersService } from '../services/partners.service';
import {
  CreateRestaurantDto,
  UpdateRestaurantDto,
  CreateCoordinatorFeeRuleDto,
  UpdateCoordinatorFeeRuleDto,
  CalculateMealExpenseQueryDto,
  CoordinatorFeeQueryDto,
} from '../../@dto/master-rules/partner.dto';

@ApiTags('Master Partners (Restaurants & Coordinators)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('partners')
export class PartnersController {
  constructor(private readonly partnersService: PartnersService) {}

  // ==========================================
  // RESTAURANTS
  // ==========================================

  @Get('restaurants')
  @RequirePermissions('Partners:read')
  @ApiOperation({ summary: 'Mendapatkan seluruh daftar rumah makan mitra servis makan AKAP' })
  async findAllRestaurants(): Promise<ResponseInterface> {
    const data = await this.partnersService.findAllRestaurants();
    return {
      status: true,
      message: 'Daftar rumah makan mitra berhasil diambil.',
      data,
    };
  }

  @Get('restaurants/calculate-meal')
  @RequirePermissions('Partners:read')
  @ApiOperation({
    summary: 'Kalkulasi total biaya servis makan penumpang sesuai pax dan tipe settlement (AP vs UJ)',
  })
  async calculateMealExpense(
    @Query() query: CalculateMealExpenseQueryDto,
  ): Promise<ResponseInterface> {
    const data = await this.partnersService.calculateMealExpense(
      query.restaurantId,
      Number(query.paxCount),
    );
    return {
      status: true,
      message: 'Biaya servis makan berhasil dikalkulasi.',
      data,
    };
  }

  @Get('restaurants/:id')
  @RequirePermissions('Partners:read')
  @ApiOperation({ summary: 'Mendapatkan detail rumah makan mitra' })
  async findOneRestaurant(@Param('id') id: string): Promise<ResponseInterface> {
    const data = await this.partnersService.findOneRestaurant(id);
    return {
      status: true,
      message: 'Detail rumah makan berhasil diambil.',
      data,
    };
  }

  @Post('restaurants')
  @RequirePermissions('Partners:create')
  @ApiOperation({ summary: 'Mendaftarkan rumah makan mitra baru' })
  async createRestaurant(
    @Body() dto: CreateRestaurantDto,
  ): Promise<ResponseInterface> {
    const data = await this.partnersService.createRestaurant(dto);
    return {
      status: true,
      message: `Rumah makan '${data.name}' berhasil ditambahkan.`,
      data,
    };
  }

  @Put('restaurants/:id')
  @RequirePermissions('Partners:update')
  @ApiOperation({ summary: 'Memperbarui data rumah makan mitra' })
  async updateRestaurant(
    @Param('id') id: string,
    @Body() dto: UpdateRestaurantDto,
  ): Promise<ResponseInterface> {
    const data = await this.partnersService.updateRestaurant(id, dto);
    return {
      status: true,
      message: `Data rumah makan '${data.name}' berhasil diperbarui.`,
      data,
    };
  }

  @Delete('restaurants/:id')
  @RequirePermissions('Partners:delete')
  @ApiOperation({ summary: 'Menghapus rumah makan mitra' })
  async deleteRestaurant(@Param('id') id: string): Promise<ResponseInterface> {
    const result = await this.partnersService.deleteRestaurant(id);
    return {
      status: true,
      message: result.message,
    };
  }

  // ==========================================
  // FIELD COORDINATOR FEE RULES
  // ==========================================

  @Get('coordinator-fees')
  @RequirePermissions('Partners:read')
  @ApiOperation({ summary: 'Mendapatkan daftar aturan tarif jasa koordinator lapangan' })
  async findAllCoordinatorFeeRules(): Promise<ResponseInterface> {
    const data = await this.partnersService.findAllCoordinatorFeeRules();
    return {
      status: true,
      message: 'Daftar aturan fee korlap berhasil diambil.',
      data,
    };
  }

  @Get('coordinator-fees/by-route')
  @RequirePermissions('Partners:read')
  @ApiOperation({
    summary: 'Kalkulasi fee koordinator lapangan sesuai arah leg perjalanan dan jumlah pax',
  })
  async getFeeForRoute(
    @Query() query: CoordinatorFeeQueryDto,
  ): Promise<ResponseInterface> {
    const data = await this.partnersService.getFeeForRoute(
      query.legDirection,
      Number(query.paxCount),
    );
    return {
      status: true,
      message: 'Fee korlap berhasil dihitung.',
      data,
    };
  }

  @Get('coordinator-fees/:id')
  @RequirePermissions('Partners:read')
  @ApiOperation({ summary: 'Mendapatkan detail aturan fee korlap' })
  async findOneCoordinatorFeeRule(
    @Param('id') id: string,
  ): Promise<ResponseInterface> {
    const data = await this.partnersService.findOneCoordinatorFeeRule(id);
    return {
      status: true,
      message: 'Detail aturan fee korlap berhasil diambil.',
      data,
    };
  }

  @Post('coordinator-fees')
  @RequirePermissions('Partners:create')
  @ApiOperation({ summary: 'Menambahkan aturan tarif fee korlap' })
  async createCoordinatorFeeRule(
    @Body() dto: CreateCoordinatorFeeRuleDto,
  ): Promise<ResponseInterface> {
    const data = await this.partnersService.createCoordinatorFeeRule(dto);
    return {
      status: true,
      message: 'Aturan fee korlap berhasil dibuat.',
      data,
    };
  }

  @Put('coordinator-fees/:id')
  @RequirePermissions('Partners:update')
  @ApiOperation({ summary: 'Memperbarui aturan tarif fee korlap' })
  async updateCoordinatorFeeRule(
    @Param('id') id: string,
    @Body() dto: UpdateCoordinatorFeeRuleDto,
  ): Promise<ResponseInterface> {
    const data = await this.partnersService.updateCoordinatorFeeRule(id, dto);
    return {
      status: true,
      message: 'Aturan fee korlap berhasil diperbarui.',
      data,
    };
  }

  @Delete('coordinator-fees/:id')
  @RequirePermissions('Partners:delete')
  @ApiOperation({ summary: 'Menghapus aturan fee korlap' })
  async deleteCoordinatorFeeRule(
    @Param('id') id: string,
  ): Promise<ResponseInterface> {
    const result = await this.partnersService.deleteCoordinatorFeeRule(id);
    return {
      status: true,
      message: result.message,
    };
  }
}
