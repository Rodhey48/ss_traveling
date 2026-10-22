import {
  IsUUID,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsEnum,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RemittancePaymentMethod } from '../../@models/cashier/cashier.enums';

export class RemittanceAllocationItemDto {
  @ApiProperty({ description: 'ID Deklarasi Penerimaan SPJ' })
  @IsNotEmpty()
  @IsUUID()
  revenueDeclarationId!: string;

  @ApiProperty({ description: 'Nominal alokasi', example: 450000 })
  @IsNotEmpty()
  @IsNumber()
  allocatedAmount!: number;

  @ApiPropertyOptional({ description: 'Catatan alokasi' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateRemittanceDto {
  @ApiProperty({ description: 'ID SPJ' })
  @IsNotEmpty()
  @IsUUID()
  spjId!: string;

  @ApiProperty({ description: 'ID Kru Penyetor (Driver/Kondektur)' })
  @IsNotEmpty()
  @IsUUID()
  depositorCrewId!: string;

  @ApiProperty({ description: 'Nominal setoran fisik aktual kru', example: 1350000 })
  @IsNotEmpty()
  @IsNumber()
  amount!: number;

  @ApiPropertyOptional({ description: 'ID Kas Akun Pool Kasir' })
  @IsOptional()
  @IsUUID()
  cashAccountId?: string;

  @ApiPropertyOptional({
    enum: RemittancePaymentMethod,
    default: RemittancePaymentMethod.CASH,
  })
  @IsOptional()
  @IsEnum(RemittancePaymentMethod)
  paymentMethod?: RemittancePaymentMethod;

  @ApiPropertyOptional({ description: 'Catatan setoran kas' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    type: [RemittanceAllocationItemDto],
    description: 'Daftar alokasi setoran ke deklarasi tiket/kargo',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RemittanceAllocationItemDto)
  allocations?: RemittanceAllocationItemDto[];
}
