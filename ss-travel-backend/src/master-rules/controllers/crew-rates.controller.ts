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
import { CrewRatesService } from '../services/crew-rates.service';
import {
  CreateCrewRateRuleDto,
  UpdateCrewRateRuleDto,
  CrewRateQueryFilterDto,
  CrewRateSnapshotQueryDto,
} from '../../@dto/master-rules/crew-rate.dto';

@ApiTags('Master Crew Rates & Compensation')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('crew-rates')
export class CrewRatesController {
  constructor(private readonly crewRatesService: CrewRatesService) {}

  @Get('snapshot')
  @RequirePermissions('Fares:read')
  @ApiOperation({
    summary: 'Rate Snapshotting Standar Kompensasi Kru (Uang Makan & Premi Ritase/Harian)',
  })
  async getRateSnapshot(
    @Query() query: CrewRateSnapshotQueryDto,
  ): Promise<ResponseInterface> {
    const data = await this.crewRatesService.getRateSnapshot(query);
    return {
      status: true,
      message: 'Rate snapshot kompensasi kru berhasil dihitung.',
      data,
    };
  }

  @Get()
  @RequirePermissions('Fares:read')
  @ApiOperation({ summary: 'Mendapatkan daftar seluruh aturan tarif kru' })
  async findAll(@Query() query: CrewRateQueryFilterDto): Promise<ResponseInterface> {
    const data = await this.crewRatesService.findAll(query);
    return {
      status: true,
      message: 'Daftar aturan tarif kru berhasil diambil.',
      data,
    };
  }

  @Get(':id')
  @RequirePermissions('Fares:read')
  @ApiOperation({ summary: 'Mendapatkan detail aturan tarif kru' })
  async findOne(@Param('id') id: string): Promise<ResponseInterface> {
    const data = await this.crewRatesService.findOne(id);
    return {
      status: true,
      message: 'Detail aturan tarif kru berhasil diambil.',
      data,
    };
  }

  @Post()
  @RequirePermissions('Fares:create')
  @ApiOperation({ summary: 'Membuat aturan tarif kompensasi kru baru' })
  async create(@Body() dto: CreateCrewRateRuleDto): Promise<ResponseInterface> {
    const data = await this.crewRatesService.create(dto);
    return {
      status: true,
      message: 'Aturan tarif kompensasi kru berhasil dibuat.',
      data,
    };
  }

  @Put(':id')
  @RequirePermissions('Fares:update')
  @ApiOperation({ summary: 'Memperbarui aturan tarif kompensasi kru' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCrewRateRuleDto,
  ): Promise<ResponseInterface> {
    const data = await this.crewRatesService.update(id, dto);
    return {
      status: true,
      message: 'Aturan tarif kompensasi kru berhasil diperbarui.',
      data,
    };
  }

  @Delete(':id')
  @RequirePermissions('Fares:delete')
  @ApiOperation({ summary: 'Menghapus aturan tarif kompensasi kru' })
  async delete(@Param('id') id: string): Promise<ResponseInterface> {
    const result = await this.crewRatesService.delete(id);
    return {
      status: true,
      message: result.message,
    };
  }
}
