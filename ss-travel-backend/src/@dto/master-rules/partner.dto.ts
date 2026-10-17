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
import { CoordinatorZone } from '../../@models/master-rules/coordinator-fee-rule.entity';

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
  @ApiProperty({ enum: CoordinatorZone, example: CoordinatorZone.WEST })
  @IsEnum(CoordinatorZone)
  zone!: CoordinatorZone;

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
  @ApiProperty({
    example: 'DEPARTURE',
    description: 'Arah Leg (DEPARTURE = Berangkat/West, RETURN = Pulang/East)',
  })
  @IsString()
  @IsNotEmpty()
  legDirection!: string;

  @ApiProperty({ example: 24, description: 'Jumlah Penumpang (Pax)' })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  paxCount!: number;
}
