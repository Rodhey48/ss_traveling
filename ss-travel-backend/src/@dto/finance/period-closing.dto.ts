import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FiscalPeriodStatus } from '../../@models/finance/fiscal-period.entity';

export class ClosePeriodDto {
  @ApiPropertyOptional({ description: 'Catatan penutupan buku periode fiskal', example: 'Semua rekonsiliasi telah diverifikasi.' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ReopenPeriodDto {
  @ApiProperty({ description: 'Alasan wajib pembukaan kembali periode fiskal tertutup', example: 'Penyesuaian audit tagihan vendor tertinggal.' })
  @IsNotEmpty({ message: 'Alasan pembukaan kembali periode wajib disertakan.' })
  @IsString()
  reason!: string;
}

export class PeriodClosingFilterDto {
  @ApiPropertyOptional({ description: 'Tahun fiskal', example: 2026 })
  @IsOptional()
  @IsInt()
  @Min(2020)
  @Max(2100)
  year?: number;

  @ApiPropertyOptional({ enum: FiscalPeriodStatus, description: 'Status Periode Fiskal' })
  @IsOptional()
  @IsEnum(FiscalPeriodStatus)
  status?: FiscalPeriodStatus;
}
