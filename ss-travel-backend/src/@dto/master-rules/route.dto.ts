import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TripServiceType } from '../../@models/trips/trip.enums';

export class CreateRouteDto {
  @ApiProperty({ example: 'RUT-JKT-YOG-MGL', description: 'Kode unik rute trayek' })
  @IsString()
  @IsNotEmpty()
  code!: string;

  @ApiProperty({ example: 'Jakarta - Yogyakarta (Via Magelang)', description: 'Nama rute trayek perjalanan' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'JAKARTA', description: 'Titik awal / kota asal keberangkatan' })
  @IsString()
  @IsNotEmpty()
  origin!: string;

  @ApiProperty({ example: 'YOGYAKARTA', description: 'Titik akhir / kota tujuan kepulangan' })
  @IsString()
  @IsNotEmpty()
  destination!: string;

  @ApiPropertyOptional({ example: 'Bawen - Magelang - Jombor', description: 'Lintasan / checkpoint via' })
  @IsString()
  @IsOptional()
  via?: string;

  @ApiPropertyOptional({ example: 540.5, description: 'Estimasi jarak tempuh rute (kilometer)' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  distanceKm?: number;

  @ApiPropertyOptional({ example: 9.5, description: 'Estimasi waktu perjalanan (jam)' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  estimatedHours?: number;

  @ApiPropertyOptional({ enum: TripServiceType, default: TripServiceType.AKAP })
  @IsEnum(TripServiceType)
  @IsOptional()
  serviceType?: TripServiceType;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateRouteDto {
  @ApiPropertyOptional({ example: 'RUT-JKT-YOG-MGL', description: 'Kode unik rute trayek' })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiPropertyOptional({ example: 'Jakarta - Yogyakarta (Via Magelang)' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'JAKARTA' })
  @IsString()
  @IsOptional()
  origin?: string;

  @ApiPropertyOptional({ example: 'YOGYAKARTA' })
  @IsString()
  @IsOptional()
  destination?: string;

  @ApiPropertyOptional({ example: 'Bawen - Magelang - Jombor' })
  @IsString()
  @IsOptional()
  via?: string;

  @ApiPropertyOptional({ example: 540.5 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  distanceKm?: number;

  @ApiPropertyOptional({ example: 9.5 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  estimatedHours?: number;

  @ApiPropertyOptional({ enum: TripServiceType })
  @IsEnum(TripServiceType)
  @IsOptional()
  serviceType?: TripServiceType;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
