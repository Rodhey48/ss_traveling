import {
  IsUUID,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsBoolean,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateRemittanceDto } from './create-remittance.dto';

export class CreateSettlementDto {
  @ApiProperty({ description: 'ID SPJ yang diselesaikan' })
  @IsNotEmpty()
  @IsUUID()
  spjId!: string;

  @ApiProperty({ description: 'ID Akun Kas Pool Kasir penerima fisik kas' })
  @IsNotEmpty()
  @IsUUID()
  cashAccountId!: string;

  @ApiPropertyOptional({ description: 'Catatan proses penyelesaian kas' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Apakah hak kas kru (Uang makan / komisi kargo) dibayarkan tunai oleh kasir saat ini?',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  cashPaidToCrew?: boolean;

  @ApiPropertyOptional({
    type: [CreateRemittanceDto],
    description: 'Setoran kas aktual kru (jika diinput bersamaan)',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRemittanceDto)
  remittances?: CreateRemittanceDto[];
}
