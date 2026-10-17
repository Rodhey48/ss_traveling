import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateFareSeasonDto {
  @ApiProperty({ example: 'LEBARAN_2026', description: 'Kode unik musim tarif' })
  @IsString()
  @IsNotEmpty()
  code!: string;

  @ApiProperty({ example: 'Tuslah Lebaran H-7 s/d H+7', description: 'Nama musim tarif' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: '2026-03-15', description: 'Tanggal mulai (YYYY-MM-DD)' })
  @IsDateString()
  @IsNotEmpty()
  startDate!: string;

  @ApiProperty({ example: '2026-03-31', description: 'Tanggal selesai (YYYY-MM-DD)' })
  @IsDateString()
  @IsNotEmpty()
  endDate!: string;

  @ApiPropertyOptional({ description: 'Keterangan musim tarif' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateFareSeasonDto {
  @ApiPropertyOptional({ example: 'Tuslah Lebaran' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: '2026-03-15' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-03-31' })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class CreateFareMatrixDto {
  @ApiProperty({ description: 'ID Musim Tarif (fare_seasons)' })
  @IsUUID()
  @IsNotEmpty()
  fareSeasonId!: string;

  @ApiProperty({ example: 'TANGERANG', description: 'Kota Asal' })
  @IsString()
  @IsNotEmpty()
  origin!: string;

  @ApiProperty({ example: 'YOGYAKARTA', description: 'Kota Tujuan' })
  @IsString()
  @IsNotEmpty()
  destination!: string;

  @ApiProperty({ description: 'ID Master Kelas Kursi (seat_classes)' })
  @IsUUID()
  @IsNotEmpty()
  seatClassId!: string;

  @ApiProperty({ example: 420000, description: 'Tarif tiket dasar (Rp)' })
  @IsNumber()
  @Min(0)
  amount!: number;

  @ApiPropertyOptional({ description: 'Tanggal mulai berlaku' })
  @IsDateString()
  @IsOptional()
  effectiveFrom?: string;

  @ApiPropertyOptional({ description: 'Tanggal kadaluarsa tarif' })
  @IsDateString()
  @IsOptional()
  effectiveUntil?: string;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateFareMatrixDto {
  @ApiPropertyOptional({ example: 450000 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  amount?: number;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  effectiveFrom?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  effectiveUntil?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class FareCalculationQueryDto {
  @ApiProperty({ example: 'TANGERANG', description: 'Kota Asal' })
  @IsString()
  @IsNotEmpty()
  origin!: string;

  @ApiProperty({ example: 'YOGYAKARTA', description: 'Kota Tujuan' })
  @IsString()
  @IsNotEmpty()
  destination!: string;

  @ApiProperty({ description: 'ID Kelas Kursi' })
  @IsUUID()
  @IsNotEmpty()
  seatClassId!: string;

  @ApiPropertyOptional({ example: '2026-03-20', description: 'Tanggal Keberangkatan (default hari ini)' })
  @IsDateString()
  @IsOptional()
  travelDate?: string;
}
