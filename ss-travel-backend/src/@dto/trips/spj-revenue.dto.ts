import {
  IsUUID,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumberString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  SpjRevenueDeclarationType,
  SpjRevenueDeclarationStatus,
} from '../../@models/trips/trip.enums';

export class CreateSpjRevenueDeclarationDto {
  @ApiPropertyOptional({ description: 'ID Leg SPJ jika spesifik leg tertentu' })
  @IsOptional()
  @IsUUID()
  spjLegId?: string;

  @ApiProperty({
    enum: SpjRevenueDeclarationType,
    description: 'Jenis penerimaan kas operasional kru',
  })
  @IsNotEmpty()
  @IsEnum(SpjRevenueDeclarationType)
  declarationType!: SpjRevenueDeclarationType;

  @ApiProperty({ description: 'Nominal bruto penerimaan', example: '350000.00' })
  @IsNotEmpty()
  @IsNumberString()
  amount!: string;

  @ApiPropertyOptional({ description: 'Nomor manifest atau resi surat jalan kargo' })
  @IsOptional()
  @IsString()
  sourceReference?: string;

  // Komisi kargo dinamis kru (Addendum v1.9 & Skenario 1)
  @ApiPropertyOptional({
    description: 'Persentase hak komisi kru atas kargo (misal 20%)',
    example: '20.00',
  })
  @IsOptional()
  @IsNumberString()
  crewCommissionPercentage?: string;

  // Metadata kargo
  @ApiPropertyOptional({ description: 'Nama pengirim paket' })
  @IsOptional()
  @IsString()
  cargoSenderName?: string;

  @ApiPropertyOptional({ description: 'No HP pengirim paket' })
  @IsOptional()
  @IsString()
  cargoSenderPhone?: string;

  @ApiPropertyOptional({ description: 'Nama penerima paket' })
  @IsOptional()
  @IsString()
  cargoReceiverName?: string;

  @ApiPropertyOptional({ description: 'No HP penerima paket' })
  @IsOptional()
  @IsString()
  cargoReceiverPhone?: string;

  @ApiPropertyOptional({ description: 'Keterangan isi barang paket' })
  @IsOptional()
  @IsString()
  cargoItemDescription?: string;

  @ApiPropertyOptional({ description: 'Catatan tambahan penerimaan' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class VerifySpjRevenueDeclarationDto {
  @ApiProperty({
    enum: [
      SpjRevenueDeclarationStatus.VERIFIED,
      SpjRevenueDeclarationStatus.DISCREPANCY,
    ],
  })
  @IsNotEmpty()
  @IsEnum(SpjRevenueDeclarationStatus)
  status!: SpjRevenueDeclarationStatus;

  @ApiPropertyOptional({ description: 'Catatan verifikasi kasir' })
  @IsOptional()
  @IsString()
  notes?: string;
}
