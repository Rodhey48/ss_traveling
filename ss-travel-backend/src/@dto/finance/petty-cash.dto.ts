import {
  IsEnum,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
  IsUUID,
  IsBoolean,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  CashTransactionType,
  CashTransactionStatus,
  PettyCashCategory,
} from '../../@models/finance/finance.enums';

export class CreatePettyCashDisbursementDto {
  @ApiProperty({ description: 'ID Rekening Kas Kecil (cash_accounts)' })
  @IsUUID()
  @IsNotEmpty()
  cashAccountId!: string;

  @ApiProperty({ description: 'Tanggal Transaksi (YYYY-MM-DD)', example: '2026-10-25' })
  @IsDateString()
  @IsNotEmpty()
  transactionDate!: string;

  @ApiProperty({ description: 'Nominal Pengeluaran Kas Kecil', example: '150000.00' })
  @IsNumberString()
  @IsNotEmpty()
  amount!: string;

  @ApiProperty({ description: 'Penerima Uang (misal Driver Hendra, Toko Baut, Warung Bu Siti)' })
  @IsString()
  @IsNotEmpty()
  recipient!: string;

  @ApiProperty({ description: 'ID Akun Beban COA (misal 52104, 53105, 57102)' })
  @IsUUID()
  @IsNotEmpty()
  expenseAccountId!: string;

  @ApiProperty({
    enum: PettyCashCategory,
    description: 'Kategori Pengeluaran Kas Kecil',
    example: PettyCashCategory.STANDBY_CREW,
  })
  @IsEnum(PettyCashCategory)
  @IsNotEmpty()
  category!: PettyCashCategory;

  @ApiPropertyOptional({ description: 'ID Armada Bus (Wajib/Disarankan untuk insentif langsir / sparepart darurat)' })
  @IsUUID()
  @IsOptional()
  vehicleId?: string;

  @ApiPropertyOptional({ description: 'ID Cost Center (Pool / Bengkel)' })
  @IsUUID()
  @IsOptional()
  costCenterId?: string;

  @ApiProperty({ description: 'Keterangan Rinci Pengeluaran' })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiPropertyOptional({ description: 'Nomor Nota / Bon Fisik' })
  @IsString()
  @IsOptional()
  receiptNo?: string;

  @ApiPropertyOptional({ description: 'URL Foto Bukti Nota Fisik' })
  @IsString()
  @IsOptional()
  receiptImageUrl?: string;

  @ApiPropertyOptional({ description: 'Langsung verifikasi & posting ke GL (khusus Akuntan/FM)' })
  @IsBoolean()
  @IsOptional()
  autoVerify?: boolean;
}

export class CreatePettyCashReplenishmentDto {
  @ApiProperty({ description: 'ID Rekening Kas Kecil Tujuan (cash_accounts)' })
  @IsUUID()
  @IsNotEmpty()
  cashAccountId!: string;

  @ApiProperty({ description: 'Tanggal Transaksi (YYYY-MM-DD)', example: '2026-10-25' })
  @IsDateString()
  @IsNotEmpty()
  transactionDate!: string;

  @ApiProperty({ description: 'Nominal Pengisian Kembali Dana', example: '5000000.00' })
  @IsNumberString()
  @IsNotEmpty()
  amount!: string;

  @ApiProperty({ enum: ['BANK', 'CASH'], description: 'Sumber Dana Pengisian (Bank atau Kas Induk)' })
  @IsString()
  @IsNotEmpty()
  sourceType!: 'BANK' | 'CASH';

  @ApiPropertyOptional({ description: 'ID Rekening Bank Asal (jika sourceType BANK)' })
  @IsUUID()
  @IsOptional()
  sourceBankAccountId?: string;

  @ApiPropertyOptional({ description: 'ID Rekening Kas Asal (jika sourceType CASH)' })
  @IsUUID()
  @IsOptional()
  sourceCashAccountId?: string;

  @ApiPropertyOptional({ description: 'Pihak Sumber / Penyetor Dana' })
  @IsString()
  @IsOptional()
  recipient?: string;

  @ApiProperty({ description: 'Keterangan Pengisian Kas Kecil' })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiPropertyOptional({ description: 'Nomor Referensi Bukti Transfer / BKK Bank' })
  @IsString()
  @IsOptional()
  receiptNo?: string;
}

export class VerifyPettyCashDto {
  @ApiPropertyOptional({ description: 'Catatan verifikasi akuntan' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class RejectPettyCashDto {
  @ApiProperty({ description: 'Alasan penolakan pengeluaran kas kecil' })
  @IsString()
  @IsNotEmpty()
  reason!: string;
}

export class PettyCashFilterDto {
  @ApiPropertyOptional({ description: 'Tanggal Awal (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Tanggal Akhir (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ enum: CashTransactionType })
  @IsOptional()
  @IsEnum(CashTransactionType)
  type?: CashTransactionType;

  @ApiPropertyOptional({ enum: CashTransactionStatus })
  @IsOptional()
  @IsEnum(CashTransactionStatus)
  status?: CashTransactionStatus;

  @ApiPropertyOptional({ description: 'Filter per Rekening Kas' })
  @IsOptional()
  @IsUUID()
  cashAccountId?: string;

  @ApiPropertyOptional({ enum: PettyCashCategory })
  @IsOptional()
  @IsEnum(PettyCashCategory)
  category?: PettyCashCategory;

  @ApiPropertyOptional({ description: 'Filter per Armada Bus' })
  @IsOptional()
  @IsUUID()
  vehicleId?: string;

  @ApiPropertyOptional({ description: 'Pencarian no transaksi, keterangan, penerima, atau nomor nota' })
  @IsOptional()
  @IsString()
  search?: string;
}
