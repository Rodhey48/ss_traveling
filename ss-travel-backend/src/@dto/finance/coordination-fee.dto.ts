import {
  IsUUID,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
  IsDateString,
  IsNumberString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCoordinationFeeBatchDto {
  @ApiProperty({
    type: String,
    description: 'Rute titik awal / terminal keberangkatan (Origin)',
    example: 'JAKARTA',
  })
  @IsNotEmpty()
  @IsString()
  origin!: string;

  @ApiProperty({
    type: String,
    description: 'Rute titik tujuan / terminal akhir (Destination)',
    example: 'SURABAYA',
  })
  @IsNotEmpty()
  @IsString()
  destination!: string;

  @ApiPropertyOptional({
    description: 'ID Master Koordinator Lapangan penerima transfer',
  })
  @IsOptional()
  @IsUUID()
  coordinatorId?: string;

  @ApiProperty({
    type: [String],
    description: 'Daftar ID kewajiban koordinasi SPJ yang akan dibayar gelondongan',
    example: ['uuid-fee-1', 'uuid-fee-2'],
  })
  @IsNotEmpty()
  @IsArray()
  spjCoordinationFeeIds!: string[];

  @ApiProperty({
    description: 'Tanggal pembayaran transfer bank',
    example: '2026-11-07',
  })
  @IsNotEmpty()
  @IsDateString()
  paymentDate!: string;

  @ApiProperty({
    description: 'ID akun kas/bank kantor yang dipakai transfer (misal Bank BCA)',
    example: 'uuid-cash-account-bca',
  })
  @IsNotEmpty()
  @IsUUID()
  bankAccountId!: string;

  @ApiPropertyOptional({
    description: 'Nomor referensi mutasi transfer bank (No. Ref / Bukti Transfer)',
    example: 'TRF-BCA-20261107-0091',
  })
  @IsOptional()
  @IsString()
  referenceNumber?: string;

  @ApiPropertyOptional({
    description: 'URL file foto/PDF bukti transfer bank',
  })
  @IsOptional()
  @IsString()
  receiptUrl?: string;

  @ApiPropertyOptional({
    description: 'Catatan tambahan transfer gelondongan',
    example: 'Transfer uang koordinasi wilayah Barat minggu ke-1 November 2026',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CoordinationFeeFilterDto {
  @ApiPropertyOptional({
    description: 'Filter berdasarkan ID Master Rute',
  })
  @IsOptional()
  @IsUUID()
  routeId?: string;

  @ApiPropertyOptional({
    description: 'Filter berdasarkan ID Master Koordinator Lapangan',
  })
  @IsOptional()
  @IsUUID()
  coordinatorId?: string;

  @ApiPropertyOptional({
    description: 'Filter berdasarkan origin / rute asal',
  })
  @IsOptional()
  @IsString()
  origin?: string;

  @ApiPropertyOptional({
    description: 'Filter berdasarkan destination / rute tujuan',
  })
  @IsOptional()
  @IsString()
  destination?: string;

  @ApiPropertyOptional({
    description: 'Pencarian nomor SPJ, rute, atau nama koordinator',
  })
  @IsOptional()
  @IsString()
  search?: string;
}

export class UpdateCoordinatorFeeRuleDto {
  @ApiProperty({
    description: 'Tarif koordinasi per lembar tiket penumpang',
    example: '10000.00',
  })
  @IsNotEmpty()
  @IsNumberString()
  feePerPax!: string;

  @ApiPropertyOptional({
    description: 'ID Master Koordinator Lapangan Eksternal',
  })
  @IsOptional()
  @IsUUID()
  coordinatorId?: string;

  @ApiPropertyOptional({
    description: 'ID pengguna penanggung jawab koordinator wilayah - Deprecated',
  })
  @IsOptional()
  @IsUUID()
  coordinatorUserId?: string;
}
