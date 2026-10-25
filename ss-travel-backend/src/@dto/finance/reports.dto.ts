import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TripServiceType } from '../../@models/trips/trip.enums';

export enum TripProfitabilityViewMode {
  BY_BUS = 'BY_BUS',
  BY_JOURNEY_GROUP = 'BY_JOURNEY_GROUP',
}

export class GeneralLedgerFilterDto {
  @ApiPropertyOptional({ description: 'ID Akun spesifik (UUID)' })
  @IsOptional()
  @IsUUID()
  accountId?: string;

  @ApiPropertyOptional({ description: 'Kode Akun (misal: 11101)' })
  @IsOptional()
  @IsString()
  accountCode?: string;

  @ApiPropertyOptional({ description: 'Tanggal awal (YYYY-MM-DD)', example: '2026-10-01' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Format startDate harus YYYY-MM-DD' })
  startDate?: string;

  @ApiPropertyOptional({ description: 'Tanggal akhir (YYYY-MM-DD)', example: '2026-10-31' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Format endDate harus YYYY-MM-DD' })
  endDate?: string;

  @ApiPropertyOptional({ description: 'ID Periode Fiskal' })
  @IsOptional()
  @IsUUID()
  periodId?: string;

  @ApiPropertyOptional({ description: 'Filter Business Unit (Unit Usaha)' })
  @IsOptional()
  @IsUUID()
  businessUnitId?: string;

  @ApiPropertyOptional({ description: 'Filter Cost Center' })
  @IsOptional()
  @IsUUID()
  costCenterId?: string;
}

export class TrialBalanceFilterDto {
  @ApiPropertyOptional({ description: 'Tanggal awal (YYYY-MM-DD)', example: '2026-10-01' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Format startDate harus YYYY-MM-DD' })
  startDate?: string;

  @ApiPropertyOptional({ description: 'Tanggal akhir (YYYY-MM-DD)', example: '2026-10-31' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Format endDate harus YYYY-MM-DD' })
  endDate?: string;

  @ApiPropertyOptional({ description: 'ID Periode Fiskal' })
  @IsOptional()
  @IsUUID()
  periodId?: string;

  @ApiPropertyOptional({ description: 'Filter Business Unit' })
  @IsOptional()
  @IsUUID()
  businessUnitId?: string;
}

export class IncomeStatementFilterDto {
  @ApiPropertyOptional({ description: 'Tanggal awal (YYYY-MM-DD)', example: '2026-10-01' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Format startDate harus YYYY-MM-DD' })
  startDate?: string;

  @ApiPropertyOptional({ description: 'Tanggal akhir (YYYY-MM-DD)', example: '2026-10-31' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Format endDate harus YYYY-MM-DD' })
  endDate?: string;

  @ApiPropertyOptional({ description: 'ID Periode Fiskal' })
  @IsOptional()
  @IsUUID()
  periodId?: string;

  @ApiPropertyOptional({ description: 'Filter Business Unit' })
  @IsOptional()
  @IsUUID()
  businessUnitId?: string;
}

export class BalanceSheetFilterDto {
  @ApiPropertyOptional({ description: 'Posisi Per Tanggal (YYYY-MM-DD)', example: '2026-10-31' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Format asOfDate harus YYYY-MM-DD' })
  asOfDate?: string;

  @ApiPropertyOptional({ description: 'ID Periode Fiskal' })
  @IsOptional()
  @IsUUID()
  periodId?: string;

  @ApiPropertyOptional({ description: 'Filter Business Unit' })
  @IsOptional()
  @IsUUID()
  businessUnitId?: string;
}

export class TripProfitabilityFilterDto {
  @ApiPropertyOptional({ description: 'Tanggal awal perjalanan (YYYY-MM-DD)', example: '2026-10-01' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Format startDate harus YYYY-MM-DD' })
  startDate?: string;

  @ApiPropertyOptional({ description: 'Tanggal akhir perjalanan (YYYY-MM-DD)', example: '2026-10-31' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Format endDate harus YYYY-MM-DD' })
  endDate?: string;

  @ApiPropertyOptional({ enum: TripServiceType, description: 'Jenis Layanan (AKAP / PARIWISATA)' })
  @IsOptional()
  @IsEnum(TripServiceType)
  serviceType?: TripServiceType;

  @ApiPropertyOptional({ description: 'Filter ID Armada Bus' })
  @IsOptional()
  @IsUUID()
  vehicleId?: string;

  @ApiPropertyOptional({
    enum: TripProfitabilityViewMode,
    description: 'Sudut pandang: BY_BUS (per unit fisik) atau BY_JOURNEY_GROUP (kelompok perjalanan ekonomi utuh)',
    default: TripProfitabilityViewMode.BY_JOURNEY_GROUP,
  })
  @IsOptional()
  @IsEnum(TripProfitabilityViewMode)
  viewMode?: TripProfitabilityViewMode;

  @ApiPropertyOptional({ description: 'Pencarian no SPJ, plat armada, atau rute' })
  @IsOptional()
  @IsString()
  search?: string;
}
