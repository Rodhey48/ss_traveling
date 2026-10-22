import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  IsArray,
  ValidateNested,
  IsDateString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ApVendorType,
  FinancePaymentMethod,
} from '../../@models/finance/finance.enums';

export class ApAllocationInputDto {
  @ApiProperty({ example: 'uuid-ap-invoice' })
  @IsString()
  @IsNotEmpty()
  invoiceId!: string;

  @ApiProperty({ example: 1050000 })
  @IsNumber()
  @Min(0.01)
  @Type(() => Number)
  amount!: number;
}

export class CreateApPaymentDto {
  @ApiProperty({ enum: ApVendorType, example: ApVendorType.RESTAURANT })
  @IsEnum(ApVendorType)
  vendorType!: ApVendorType;

  @ApiPropertyOptional({ example: 'uuid-vendor' })
  @IsString()
  @IsOptional()
  vendorId?: string;

  @ApiProperty({ example: 'RM Taman Selera Subang' })
  @IsString()
  @IsNotEmpty()
  vendorName!: string;

  @ApiProperty({ example: '2026-10-23' })
  @IsDateString()
  paymentDate!: string;

  @ApiProperty({
    enum: FinancePaymentMethod,
    default: FinancePaymentMethod.BANK_TRANSFER,
  })
  @IsEnum(FinancePaymentMethod)
  paymentMethod!: FinancePaymentMethod;

  @ApiPropertyOptional({ example: 'uuid-bank-bca-11104' })
  @IsString()
  @IsOptional()
  bankAccountId?: string;

  @ApiPropertyOptional({ example: 'uuid-kas-pool-11101' })
  @IsString()
  @IsOptional()
  cashAccountId?: string;

  @ApiProperty({ example: 1050000 })
  @IsNumber()
  @Min(0.01)
  @Type(() => Number)
  amount!: number;

  @ApiPropertyOptional({ example: 'TRF-BCA-20261023-0091' })
  @IsString()
  @IsOptional()
  reference?: string;

  @ApiPropertyOptional({ example: 'Pelunasan tagihan servis makan RM Taman Selera' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ type: [ApAllocationInputDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ApAllocationInputDto)
  allocations!: ApAllocationInputDto[];
}

export class ApPaymentQueryDto {
  @ApiPropertyOptional({ enum: ApVendorType })
  @IsEnum(ApVendorType)
  @IsOptional()
  vendorType?: ApVendorType;

  @ApiPropertyOptional({ enum: FinancePaymentMethod })
  @IsEnum(FinancePaymentMethod)
  @IsOptional()
  paymentMethod?: FinancePaymentMethod;

  @ApiPropertyOptional({ example: '2026-10-01' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-10-31' })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  limit?: number;
}
