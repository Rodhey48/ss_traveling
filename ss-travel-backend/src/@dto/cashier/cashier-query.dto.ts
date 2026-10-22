import { IsOptional, IsEnum, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  CrewCashSettlementStatus,
  DiscrepancyResolutionStatus,
} from '../../@models/cashier/cashier.enums';

export class CashierFilterQueryDto {
  @ApiPropertyOptional({
    enum: CrewCashSettlementStatus,
    description: 'Filter status settlement',
  })
  @IsOptional()
  @IsEnum(CrewCashSettlementStatus)
  status?: CrewCashSettlementStatus;

  @ApiPropertyOptional({ description: 'Pencarian kata kunci nomor SPJ atau nomor settlement' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Tanggal mulai (ISO string)' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Tanggal akhir (ISO string)' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}

export class DiscrepancyFilterQueryDto {
  @ApiPropertyOptional({
    enum: DiscrepancyResolutionStatus,
    description: 'Filter status resolusi selisih',
  })
  @IsOptional()
  @IsEnum(DiscrepancyResolutionStatus)
  resolutionStatus?: DiscrepancyResolutionStatus;

  @ApiPropertyOptional({ description: 'Pencarian kata kunci nomor SPJ atau nomor selisih' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}
