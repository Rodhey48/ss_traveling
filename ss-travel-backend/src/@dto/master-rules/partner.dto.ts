import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { RestaurantSettlementType } from '../../@models/master-rules/restaurant.entity';

export class CreateRestaurantDto {
  @ApiProperty({ example: 'RM-04', description: 'Kode unik rumah makan mitra' })
  @IsString()
  @IsNotEmpty()
  code!: string;

  @ApiProperty({ example: 'RM Taman Selera 2', description: 'Nama rumah makan mitra' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'SUBANG', description: 'Kota lokasi rumah makan' })
  @IsString()
  @IsNotEmpty()
  city!: string;

  @ApiPropertyOptional({ example: 'Rest Area Tol Cipali KM 102 B' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ example: '0260123456' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: 25000, description: 'Tarif kupon makan per penumpang (Rp)' })
  @IsNumber()
  @Min(0)
  ratePerPax!: number;

  @ApiProperty({ enum: RestaurantSettlementType, default: RestaurantSettlementType.INVOICED_MONTHLY_AP })
  @IsEnum(RestaurantSettlementType)
  settlementType!: RestaurantSettlementType;

  @ApiPropertyOptional({ example: 'Ibu Haryati' })
  @IsString()
  @IsOptional()
  contactPerson?: string;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateRestaurantDto {
  @ApiPropertyOptional({ example: 'RM Taman Selera Reborn' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'SUBANG' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 27500 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  ratePerPax?: number;

  @ApiPropertyOptional({ enum: RestaurantSettlementType })
  @IsEnum(RestaurantSettlementType)
  @IsOptional()
  settlementType?: RestaurantSettlementType;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  contactPerson?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class CreateCoordinatorFeeRuleDto {
  @ApiPropertyOptional({ example: 'uuid-route', description: 'ID Master Rute Trayek' })
  @IsUUID()
  @IsOptional()
  routeId?: string;

  @ApiPropertyOptional({ example: 'JAKARTA', description: 'Kota Asal Rute (default ALL)' })
  @IsString()
  @IsOptional()
  origin?: string;

  @ApiPropertyOptional({ example: 'SURABAYA', description: 'Kota Tujuan Rute (default ALL)' })
  @IsString()
  @IsOptional()
  destination?: string;

  @ApiPropertyOptional({ description: 'ID Pengguna Korlap Lapangan (users)' })
  @IsUUID()
  @IsOptional()
  coordinatorUserId?: string;

  @ApiProperty({ example: 10000, description: 'Tarif fee jasa korlap per penumpang (Rp)' })
  @IsNumber()
  @Min(0)
  feePerPax!: number;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  effectiveFrom?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  effectiveUntil?: string;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateCoordinatorFeeRuleDto {
  @ApiPropertyOptional({ description: 'ID Master Rute Trayek' })
  @IsUUID()
  @IsOptional()
  routeId?: string;

  @ApiPropertyOptional({ example: 'JAKARTA' })
  @IsString()
  @IsOptional()
  origin?: string;

  @ApiPropertyOptional({ example: 'YOGYAKARTA' })
  @IsString()
  @IsOptional()
  destination?: string;

  @ApiPropertyOptional({ description: 'ID Pengguna Korlap Lapangan' })
  @IsUUID()
  @IsOptional()
  coordinatorUserId?: string;

  @ApiPropertyOptional({ example: 12500 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  feePerPax?: number;

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

export class CalculateMealExpenseQueryDto {
  @ApiProperty({ description: 'ID Rumah Makan' })
  @IsUUID()
  @IsNotEmpty()
  restaurantId!: string;

  @ApiProperty({ example: 24, description: 'Jumlah Penumpang (Pax)' })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  paxCount!: number;
}

export class CoordinatorFeeQueryDto {
  @ApiProperty({ example: 'JAKARTA', description: 'Kota Asal Rute' })
  @IsString()
  @IsNotEmpty()
  origin!: string;

  @ApiProperty({ example: 'SURABAYA', description: 'Kota Tujuan Rute' })
  @IsString()
  @IsNotEmpty()
  destination!: string;

  @ApiProperty({ example: 24, description: 'Jumlah Penumpang (Pax)' })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  paxCount!: number;
}
