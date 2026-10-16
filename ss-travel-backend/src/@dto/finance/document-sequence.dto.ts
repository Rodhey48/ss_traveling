import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GenerateSequenceDto {
  @ApiProperty({ description: 'Tipe dokumen', example: 'SPJ_AKP' })
  @IsNotEmpty()
  @IsString()
  documentType!: string;

  @ApiProperty({ description: 'Kunci periode (YYMM / YYYY)', example: '2610' })
  @IsNotEmpty()
  @IsString()
  periodKey!: string;

  @ApiProperty({ description: 'Prefix format nomor dokumen', example: 'SPJ/AKP/2610' })
  @IsNotEmpty()
  @IsString()
  prefix!: string;

  @ApiPropertyOptional({ description: 'Digit padding angka (default 4 -> 0001)', default: 4 })
  @IsOptional()
  @IsInt()
  @Min(1)
  padding?: number;

  @ApiPropertyOptional({ description: 'Company ID' })
  @IsOptional()
  @IsUUID()
  companyId?: string;
}
