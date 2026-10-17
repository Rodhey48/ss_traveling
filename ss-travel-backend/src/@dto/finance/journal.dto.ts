import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsUUID,
  IsEnum,
  IsArray,
  ValidateNested,
  ArrayMinSize,
  IsDateString,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  JournalSourceType,
  JournalStatus,
} from '../../@models/finance/journal-entry.entity';

export class JournalLineInputDto {
  @ApiProperty({ description: 'ID Akun COA', example: 'c1f7a012-...' })
  @IsUUID()
  @IsNotEmpty()
  accountId!: string;

  @ApiProperty({ description: 'Nominal Debit (Rp)', example: '1500000.00' })
  @IsNotEmpty()
  debit!: string | number;

  @ApiProperty({ description: 'Nominal Kredit (Rp)', example: '0.00' })
  @IsNotEmpty()
  credit!: string | number;

  @ApiPropertyOptional({ description: 'Deskripsi baris jurnal' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Dimensi Unit Bisnis' })
  @IsOptional()
  @IsUUID()
  businessUnitId?: string;

  @ApiPropertyOptional({ description: 'Dimensi Cost Center' })
  @IsOptional()
  @IsUUID()
  costCenterId?: string;

  @ApiPropertyOptional({ description: 'Dimensi Profit Center' })
  @IsOptional()
  @IsUUID()
  profitCenterId?: string;

  @ApiPropertyOptional({ description: 'Dimensi Perjalanan / SPJ ID' })
  @IsOptional()
  @IsUUID()
  tripId?: string;

  @ApiPropertyOptional({ description: 'Dimensi Leg Perjalanan SPJ' })
  @IsOptional()
  @IsUUID()
  tripLegId?: string;

  @ApiPropertyOptional({ description: 'Dimensi Armada Bus' })
  @IsOptional()
  @IsUUID()
  vehicleId?: string;

  @ApiPropertyOptional({ description: 'Tipe Pihak Terkait (CUSTOMER, VENDOR, AGENT, CREW)' })
  @IsOptional()
  @IsString()
  counterpartyType?: string;

  @ApiPropertyOptional({ description: 'ID Pihak Terkait' })
  @IsOptional()
  @IsUUID()
  counterpartyId?: string;
}

export class CreateManualJournalDto {
  @ApiProperty({ description: 'Tanggal Jurnal (YYYY-MM-DD)', example: '2026-10-18' })
  @IsDateString()
  @IsNotEmpty()
  journalDate!: string;

  @ApiProperty({ description: 'Keterangan transaksi jurnal', example: 'Jurnal Memorial Penyesuaian Saldo Awal' })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiPropertyOptional({
    description: 'Sumber dokumen transaksi',
    enum: JournalSourceType,
    default: JournalSourceType.MANUAL,
  })
  @IsOptional()
  @IsEnum(JournalSourceType)
  sourceType?: JournalSourceType;

  @ApiPropertyOptional({ description: 'ID Dokumen Sumber' })
  @IsOptional()
  @IsUUID()
  sourceId?: string;

  @ApiPropertyOptional({ description: 'Kunci Idempotensi unik anti duplikasi' })
  @IsOptional()
  @IsString()
  idempotencyKey?: string;

  @ApiPropertyOptional({ description: 'ID Perusahaan' })
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @ApiProperty({
    description: 'Daftar baris jurnal (minimal 2 baris seimbang)',
    type: [JournalLineInputDto],
  })
  @IsArray()
  @ArrayMinSize(2, { message: 'Jurnal minimal harus memiliki 2 baris (Debit & Kredit).' })
  @ValidateNested({ each: true })
  @Type(() => JournalLineInputDto)
  lines!: JournalLineInputDto[];
}

export class ReverseJournalDto {
  @ApiProperty({ description: 'Alasan pembatalan / pembalikan jurnal', example: 'Koreksi salah input akun beban' })
  @IsString()
  @IsNotEmpty({ message: 'Alasan reversal jurnal wajib diisi.' })
  reason!: string;

  @ApiPropertyOptional({
    description: 'Tanggal jurnal pembalik (YYYY-MM-DD). Default tanggal hari ini.',
    example: '2026-10-18',
  })
  @IsOptional()
  @IsDateString()
  reversalDate?: string;

  @ApiPropertyOptional({ description: 'Kunci Idempotensi unik' })
  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}

export class JournalFilterQueryDto {
  @ApiPropertyOptional({ description: 'Filter tanggal awal (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Filter tanggal akhir (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Status jurnal', enum: JournalStatus })
  @IsOptional()
  @IsEnum(JournalStatus)
  status?: JournalStatus;

  @ApiPropertyOptional({ description: 'Tipe sumber', enum: JournalSourceType })
  @IsOptional()
  @IsEnum(JournalSourceType)
  sourceType?: JournalSourceType;

  @ApiPropertyOptional({ description: 'Filter Akun COA ID' })
  @IsOptional()
  @IsUUID()
  accountId?: string;

  @ApiPropertyOptional({ description: 'Filter Unit Bisnis ID (AKAP / Wisata)' })
  @IsOptional()
  @IsUUID()
  businessUnitId?: string;

  @ApiPropertyOptional({ description: 'Filter Armada Bus ID' })
  @IsOptional()
  @IsUUID()
  vehicleId?: string;

  @ApiPropertyOptional({ description: 'Filter SPJ / Trip ID' })
  @IsOptional()
  @IsUUID()
  tripId?: string;

  @ApiPropertyOptional({ description: 'Pencarian nomor jurnal atau keterangan' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Halaman data', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Batas jumlah data per halaman', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Kolom pengurutan (journalDate / createdAt)',
    enum: ['journalDate', 'createdAt'],
    default: 'journalDate',
  })
  @IsOptional()
  @IsString()
  sortBy?: 'journalDate' | 'createdAt' = 'journalDate';

  @ApiPropertyOptional({
    description: 'Arah pengurutan (ASC / DESC)',
    enum: ['ASC', 'DESC'],
    default: 'DESC',
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
