import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  IsArray,
  ValidateNested,
  IsDateString,
  IsBoolean,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  FinancePaymentMethod,
} from '../../@models/finance/finance.enums';

export class ArAllocationInputDto {
  @ApiProperty({ example: 'uuid-ar-invoice' })
  @IsString()
  @IsNotEmpty()
  invoiceId!: string;

  @ApiProperty({ example: 12250000 })
  @IsNumber()
  @Min(0.01)
  @Type(() => Number)
  amount!: number;
}

export class CreateArReceiptDto {
  @ApiPropertyOptional({ example: 'uuid-customer' })
  @IsString()
  @IsOptional()
  customerId?: string;

  @ApiProperty({ example: 'PT Mitra Sejahtera Abadi' })
  @IsString()
  @IsNotEmpty()
  customerName!: string;

  @ApiProperty({ example: '2026-10-21' })
  @IsDateString()
  receiptDate!: string;

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

  @ApiProperty({ example: 12250000 })
  @IsNumber()
  @Min(0.01)
  @Type(() => Number)
  amount!: number;

  @ApiPropertyOptional({ example: 'TRF-BCA-20261021-0812' })
  @IsString()
  @IsOptional()
  reference?: string;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  isDownPayment?: boolean;

  @ApiPropertyOptional({ example: 'uuid-spj-wisata' })
  @IsString()
  @IsOptional()
  downPaymentTripId?: string;

  @ApiPropertyOptional({ example: 'Pelunasan piutang sewa wisata PT Mitra Sejahtera Abadi' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ type: [ArAllocationInputDto] })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ArAllocationInputDto)
  allocations?: ArAllocationInputDto[];
}

export class CreateDownPaymentReceiptDto {
  @ApiPropertyOptional({ example: 'uuid-customer' })
  @IsString()
  @IsOptional()
  customerId?: string;

  @ApiProperty({ example: 'PT Mitra Sejahtera Abadi' })
  @IsString()
  @IsNotEmpty()
  customerName!: string;

  @ApiProperty({ example: '2026-10-15' })
  @IsDateString()
  receiptDate!: string;

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

  @ApiProperty({ example: 5250000 })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  amount!: number;

  @ApiPropertyOptional({ example: 'uuid-spj-wisata' })
  @IsString()
  @IsOptional()
  downPaymentTripId?: string;

  @ApiPropertyOptional({ example: 'TRF-BCA-DP-001' })
  @IsString()
  @IsOptional()
  reference?: string;

  @ApiPropertyOptional({ example: 'DP 30% Sewa Bus Wisata SS-02 (5 Hari Solo-Yogya)' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class ArReceiptQueryDto {
  @ApiPropertyOptional({ example: 'uuid-customer' })
  @IsString()
  @IsOptional()
  customerId?: string;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  isDownPayment?: boolean;

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
