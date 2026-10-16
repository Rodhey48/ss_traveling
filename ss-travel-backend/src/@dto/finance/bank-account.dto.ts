import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsBoolean,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateBankAccountDto {
  @ApiProperty({ description: 'Kode unik rekening', example: 'BANK-BCA-OPS' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(30)
  code!: string;

  @ApiProperty({ description: 'Nama bank', example: 'BCA' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  bankName!: string;

  @ApiProperty({ description: 'Nama pemilik rekening', example: 'PT SS Traveling Official' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  accountName!: string;

  @ApiProperty({ description: 'Nomor rekening', example: '8229994370' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  accountNumber!: string;

  @ApiProperty({ description: 'ID Akun GL Buku Besar (11104)', example: 'uuid-gl-account' })
  @IsNotEmpty()
  @IsUUID()
  accountId!: string;

  @ApiPropertyOptional({ description: 'Mata uang', default: 'IDR' })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @ApiPropertyOptional({ description: 'Deskripsi rekening' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Company ID' })
  @IsOptional()
  @IsUUID()
  companyId?: string;
}

export class UpdateBankAccountDto extends PartialType(CreateBankAccountDto) {
  @ApiPropertyOptional({ description: 'Status aktif' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class BankAccountQueryFilterDto {
  @ApiPropertyOptional({ description: 'Kata kunci pencarian' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter nama bank' })
  @IsOptional()
  @IsString()
  bankName?: string;

  @ApiPropertyOptional({ description: 'Sertakan yang non-aktif' })
  @IsOptional()
  includeInactive?: boolean | string;
}
