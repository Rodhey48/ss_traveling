import {
  IsUUID,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumberString,
  IsInt,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  SpjExpenseType,
  SpjExpensePaymentSource,
  SpjExpenseStatus,
} from '../../@models/trips/trip.enums';

export class CreateSpjExpenseDto {
  @ApiPropertyOptional({ description: 'ID Leg SPJ jika spesifik leg tertentu' })
  @IsOptional()
  @IsUUID()
  spjLegId?: string;

  @ApiPropertyOptional({ description: 'ID Armada bus jika berbeda (misal bus rusak)' })
  @IsOptional()
  @IsUUID()
  vehicleId?: string;

  @ApiProperty({ enum: SpjExpenseType, description: 'Jenis pengeluaran operasional' })
  @IsNotEmpty()
  @IsEnum(SpjExpenseType)
  expenseType!: SpjExpenseType;

  @ApiProperty({ description: 'Nominal biaya', example: '1800000.00' })
  @IsNotEmpty()
  @IsNumberString()
  amount!: string;

  @ApiPropertyOptional({ description: 'Tanggal pengeluaran riil' })
  @IsOptional()
  @IsDateString()
  expenseDate?: string;

  @ApiPropertyOptional({
    enum: SpjExpensePaymentSource,
    default: SpjExpensePaymentSource.UJ,
  })
  @IsOptional()
  @IsEnum(SpjExpensePaymentSource)
  paymentSource?: SpjExpensePaymentSource;

  // BBM metadata
  @ApiPropertyOptional({ description: 'Jumlah liter solar jika BBM', example: '264.70' })
  @IsOptional()
  @IsNumberString()
  fuelLiters?: string;

  @ApiPropertyOptional({ description: 'Odometer KM saat pengisian solar', example: 125430 })
  @IsOptional()
  @IsInt()
  odometerKm?: number;

  @ApiPropertyOptional({ description: 'Nama SPBU / Rest Area pengisian solar' })
  @IsOptional()
  @IsString()
  fuelStation?: string;

  // Struk / Nota
  @ApiPropertyOptional({ description: 'Nomor struk / nota fisik' })
  @IsOptional()
  @IsString()
  receiptNumber?: string;

  @ApiPropertyOptional({ description: 'URL foto struk nota' })
  @IsOptional()
  @IsString()
  receiptUrl?: string;

  @ApiPropertyOptional({ description: 'Keterangan pengeluaran' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class VerifySpjExpenseDto {
  @ApiProperty({ enum: [SpjExpenseStatus.APPROVED, SpjExpenseStatus.REJECTED] })
  @IsNotEmpty()
  @IsEnum(SpjExpenseStatus)
  status!: SpjExpenseStatus;

  @ApiPropertyOptional({ description: 'Catatan verifikasi' })
  @IsOptional()
  @IsString()
  notes?: string;
}
