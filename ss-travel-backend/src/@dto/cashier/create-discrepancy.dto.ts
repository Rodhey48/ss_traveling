import {
  IsUUID,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DiscrepancySourceType } from '../../@models/cashier/cashier.enums';

export class CreateDiscrepancyDto {
  @ApiProperty({ description: 'ID SPJ' })
  @IsNotEmpty()
  @IsUUID()
  spjId!: string;

  @ApiPropertyOptional({ description: 'ID Settlement jika sudah terbentuk' })
  @IsOptional()
  @IsUUID()
  settlementId?: string;

  @ApiProperty({
    enum: DiscrepancySourceType,
    description: 'Sumber/kategori selisih kas',
    example: DiscrepancySourceType.UJ_EXPENSE_UNVERIFIED,
  })
  @IsNotEmpty()
  @IsEnum(DiscrepancySourceType)
  sourceType!: DiscrepancySourceType;

  @ApiProperty({ description: 'Nominal yang seharusnya (Expected)', example: 3300000 })
  @IsNotEmpty()
  @IsNumber()
  expectedAmount!: number;

  @ApiProperty({ description: 'Nominal aktual fisik/nota sah', example: 3000000 })
  @IsNotEmpty()
  @IsNumber()
  actualAmount!: number;

  @ApiPropertyOptional({ description: 'Nominal selisih (otomatis dihitung jika kosong)', example: 300000 })
  @IsOptional()
  @IsNumber()
  differenceAmount?: number;

  @ApiPropertyOptional({ description: 'ID Kru Penanggung Jawab jika diketahui' })
  @IsOptional()
  @IsUUID()
  responsibleCrewId?: string;

  @ApiProperty({
    description: 'Alasan atau penjelasan temuan di lapangan',
    example: 'Struk SPBU Palimanan hilang saat pengisian solar darurat 34 liter.',
  })
  @IsNotEmpty()
  @IsString()
  reason!: string;

  @ApiPropertyOptional({ description: 'Catatan hasil awal investigasi/GPS' })
  @IsOptional()
  @IsString()
  investigationNotes?: string;
}
