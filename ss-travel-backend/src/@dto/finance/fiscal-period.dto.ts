import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FiscalPeriodStatus } from '../../@models/finance/fiscal-period.entity';
import { FiscalYearStatus } from '../../@models/finance/fiscal-year.entity';

export class CreateFiscalYearDto {
  @ApiProperty({ description: 'Tahun fiskal', example: 2026 })
  @IsNotEmpty()
  @IsInt()
  @Min(2020)
  @Max(2100)
  year!: number;

  @ApiProperty({ description: 'Tanggal mulai tahun fiskal (YYYY-MM-DD)', example: '2026-01-01' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Format tanggal harus YYYY-MM-DD' })
  startDate!: string;

  @ApiProperty({ description: 'Tanggal akhir tahun fiskal (YYYY-MM-DD)', example: '2026-12-31' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Format tanggal harus YYYY-MM-DD' })
  endDate!: string;

  @ApiPropertyOptional({ description: 'Company ID' })
  @IsOptional()
  @IsUUID()
  companyId?: string;
}

export class UpdateFiscalPeriodStatusDto {
  @ApiProperty({ enum: FiscalPeriodStatus, example: FiscalPeriodStatus.CLOSED })
  @IsNotEmpty()
  @IsEnum(FiscalPeriodStatus)
  status!: FiscalPeriodStatus;

  @ApiPropertyOptional({ description: 'Alasan penutupan atau pembukaan kembali periode' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class FiscalPeriodQueryFilterDto {
  @ApiPropertyOptional({ description: 'Filter tahun fiskal', example: 2026 })
  @IsOptional()
  year?: number | string;

  @ApiPropertyOptional({ enum: FiscalPeriodStatus })
  @IsOptional()
  @IsEnum(FiscalPeriodStatus)
  status?: FiscalPeriodStatus;
}
