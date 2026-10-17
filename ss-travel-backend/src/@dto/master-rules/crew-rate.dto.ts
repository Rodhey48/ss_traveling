import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  CrewRole,
  CrewServiceType,
  CrewRateType,
} from '../../@models/master-rules/crew-rate-rule.entity';

export class CreateCrewRateRuleDto {
  @ApiProperty({ enum: CrewRole, example: CrewRole.DRIVER })
  @IsEnum(CrewRole)
  role!: CrewRole;

  @ApiProperty({ enum: CrewServiceType, default: CrewServiceType.AKAP })
  @IsEnum(CrewServiceType)
  serviceType!: CrewServiceType;

  @ApiProperty({ example: 'ALL', default: 'ALL' })
  @IsString()
  @IsNotEmpty()
  origin!: string;

  @ApiProperty({ example: 'ALL', default: 'ALL' })
  @IsString()
  @IsNotEmpty()
  destination!: string;

  @ApiProperty({ enum: CrewRateType, default: CrewRateType.PER_TRIP })
  @IsEnum(CrewRateType)
  rateType!: CrewRateType;

  @ApiProperty({ example: 150000, description: 'Uang makan standar (Rp)' })
  @IsNumber()
  @Min(0)
  mealAllowance!: number;

  @ApiProperty({ example: 250000, description: 'Premi ritase standar (Rp)' })
  @IsNumber()
  @Min(0)
  tripIncentive!: number;

  @ApiPropertyOptional({ example: 50000, description: 'Bonus full-seat 100% (Rp)' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  fullSeatBonus?: number;

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

export class UpdateCrewRateRuleDto {
  @ApiPropertyOptional({ example: 175000 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  mealAllowance?: number;

  @ApiPropertyOptional({ example: 275000 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  tripIncentive?: number;

  @ApiPropertyOptional({ example: 60000 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  fullSeatBonus?: number;

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

export class CrewRateQueryFilterDto {
  @ApiPropertyOptional({ enum: CrewRole })
  @IsEnum(CrewRole)
  @IsOptional()
  role?: CrewRole;

  @ApiPropertyOptional({ enum: CrewServiceType })
  @IsEnum(CrewServiceType)
  @IsOptional()
  serviceType?: CrewServiceType;

  @ApiPropertyOptional({ enum: CrewRateType })
  @IsEnum(CrewRateType)
  @IsOptional()
  rateType?: CrewRateType;
}

export class CrewRateSnapshotQueryDto {
  @ApiProperty({ enum: CrewRole })
  @IsEnum(CrewRole)
  role!: CrewRole;

  @ApiProperty({ enum: CrewServiceType })
  @IsEnum(CrewServiceType)
  serviceType!: CrewServiceType;

  @ApiPropertyOptional({ example: 'TANGERANG' })
  @IsString()
  @IsOptional()
  origin?: string;

  @ApiPropertyOptional({ example: 'YOGYAKARTA' })
  @IsString()
  @IsOptional()
  destination?: string;

  @ApiPropertyOptional({ example: '2026-03-20' })
  @IsDateString()
  @IsOptional()
  travelDate?: string;

  @ApiPropertyOptional({ example: 5, description: 'Jumlah hari (khusus Pariwisata)' })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  durationDays?: number;
}
