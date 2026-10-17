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
import { FaresService } from '../services/fares.service';
import {
  CreateFareSeasonDto,
  UpdateFareSeasonDto,
  CreateFareMatrixDto,
  UpdateFareMatrixDto,
  FareCalculationQueryDto,
} from '../../@dto/master-rules/fare.dto';

@ApiTags('Master Fares & Dynamic Pricing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('fares')
export class FaresController {
  constructor(private readonly faresService: FaresService) {}

  // ==========================================
  // DYNAMIC PRICING SIMULATION / CALCULATION
  // ==========================================

  @Get('calculate')
  @RequirePermissions('Fares:read')
  @ApiOperation({ summary: 'Kalkulasi tarif tiket dinamis sesuai rute, tanggal, dan kelas kursi' })
  async calculateFare(
    @Query() query: FareCalculationQueryDto,
  ): Promise<ResponseInterface> {
    const data = await this.faresService.calculateFare(query);
    return {
      status: true,
      message: 'Tarif tiket berhasil dikalkulasi.',
      data,
    };
  }

  // ==========================================
  // SEASONS
  // ==========================================

  @Get('seasons')
  @RequirePermissions('Fares:read')
  @ApiOperation({ summary: 'Mendapatkan seluruh kalender musim tarif' })
  async findAllSeasons(): Promise<ResponseInterface> {
    const data = await this.faresService.findAllSeasons();
    return {
      status: true,
      message: 'Daftar musim tarif berhasil diambil.',
      data,
    };
  }

  @Get('seasons/:id')
  @RequirePermissions('Fares:read')
  @ApiOperation({ summary: 'Mendapatkan detail musim tarif' })
  async findOneSeason(@Param('id') id: string): Promise<ResponseInterface> {
    const data = await this.faresService.findOneSeason(id);
    return {
      status: true,
      message: 'Detail musim tarif berhasil diambil.',
      data,
    };
  }

  @Post('seasons')
  @RequirePermissions('Fares:create')
  @ApiOperation({ summary: 'Membuat musim tarif baru (misal Lebaran / Liburan)' })
  async createSeason(
    @Body() dto: CreateFareSeasonDto,
  ): Promise<ResponseInterface> {
    const data = await this.faresService.createSeason(dto);
    return {
      status: true,
      message: `Musim tarif '${data.name}' berhasil dibuat.`,
      data,
    };
  }

  @Put('seasons/:id')
  @RequirePermissions('Fares:update')
  @ApiOperation({ summary: 'Memperbarui kalender musim tarif' })
  async updateSeason(
    @Param('id') id: string,
    @Body() dto: UpdateFareSeasonDto,
  ): Promise<ResponseInterface> {
    const data = await this.faresService.updateSeason(id, dto);
    return {
      status: true,
      message: `Musim tarif '${data.name}' berhasil diperbarui.`,
      data,
    };
  }

  @Delete('seasons/:id')
  @RequirePermissions('Fares:delete')
  @ApiOperation({ summary: 'Menghapus musim tarif' })
  async deleteSeason(@Param('id') id: string): Promise<ResponseInterface> {
    const result = await this.faresService.deleteSeason(id);
    return {
      status: true,
      message: result.message,
    };
  }

  // ==========================================
  // FARE MATRIX
  // ==========================================

  @Get('matrix')
  @RequirePermissions('Fares:read')
  @ApiOperation({ summary: 'Mendapatkan daftar matriks harga tiket' })
  async findAllMatrix(
    @Query('seasonId') seasonId?: string,
  ): Promise<ResponseInterface> {
    const data = await this.faresService.findAllMatrix(seasonId);
    return {
      status: true,
      message: 'Matriks tarif tiket berhasil diambil.',
      data,
    };
  }

  @Get('matrix/:id')
  @RequirePermissions('Fares:read')
  @ApiOperation({ summary: 'Mendapatkan detail matriks tarif' })
  async findOneMatrix(@Param('id') id: string): Promise<ResponseInterface> {
    const data = await this.faresService.findOneMatrix(id);
    return {
      status: true,
      message: 'Detail matriks tarif berhasil diambil.',
      data,
    };
  }

  @Post('matrix')
  @RequirePermissions('Fares:create')
  @ApiOperation({ summary: 'Membuat matriks tarif baru per rute dan kelas' })
  async createMatrix(
    @Body() dto: CreateFareMatrixDto,
  ): Promise<ResponseInterface> {
    const data = await this.faresService.createMatrix(dto);
    return {
      status: true,
      message: 'Matriks tarif baru berhasil ditambahkan.',
      data,
    };
  }

  @Put('matrix/:id')
  @RequirePermissions('Fares:update')
  @ApiOperation({ summary: 'Memperbarui besaran tarif pada matriks' })
  async updateMatrix(
    @Param('id') id: string,
    @Body() dto: UpdateFareMatrixDto,
  ): Promise<ResponseInterface> {
    const data = await this.faresService.updateMatrix(id, dto);
    return {
      status: true,
      message: 'Matriks tarif berhasil diperbarui.',
      data,
    };
  }

  @Delete('matrix/:id')
  @RequirePermissions('Fares:delete')
  @ApiOperation({ summary: 'Menghapus entri matriks tarif' })
  async deleteMatrix(@Param('id') id: string): Promise<ResponseInterface> {
    const result = await this.faresService.deleteMatrix(id);
    return {
      status: true,
      message: result.message,
    };
  }
}
