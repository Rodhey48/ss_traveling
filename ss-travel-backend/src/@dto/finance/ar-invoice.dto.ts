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
  ArInvoiceStatus,
  ArSourceType,
} from '../../@models/finance/finance.enums';

export class CreateArInvoiceLineDto {
  @ApiProperty({ example: 'Pelunasan 70% Sewa Bus Wisata 5 Hari Solo-Yogya' })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty({ example: 'uuid-akun-pendapatan-42101-atau-piutang' })
  @IsString()
  @IsNotEmpty()
  accountId!: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @Min(0.01)
  @Type(() => Number)
  qty!: number;

  @ApiProperty({ example: 12250000 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  unitPrice!: number;

  @ApiPropertyOptional({ example: 'uuid-spj-wisata' })
  @IsString()
  @IsOptional()
  tripId?: string;

  @ApiPropertyOptional({ example: 'uuid-vehicle' })
  @IsString()
  @IsOptional()
  vehicleId?: string;

  @ApiPropertyOptional({ example: 'uuid-business-unit-wisata' })
  @IsString()
  @IsOptional()
  businessUnitId?: string;

  @ApiPropertyOptional({ example: 'uuid-profit-center-wisata' })
  @IsString()
  @IsOptional()
  profitCenterId?: string;
}

export class CreateArInvoiceDto {
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
  invoiceDate!: string;

  @ApiProperty({ example: '2026-10-25' })
  @IsDateString()
  dueDate!: string;

  @ApiPropertyOptional({ example: 'uuid-akun-piutang-12101' })
  @IsString()
  @IsOptional()
  arAccountId?: string;

  @ApiPropertyOptional({ example: 'uuid-spj-wisata' })
  @IsString()
  @IsOptional()
  tripId?: string;

  @ApiPropertyOptional({ enum: ArSourceType, example: ArSourceType.CHARTER_CONTRACT })
  @IsEnum(ArSourceType)
  @IsOptional()
  sourceType?: ArSourceType;

  @ApiPropertyOptional({ example: 'uuid-source-doc' })
  @IsString()
  @IsOptional()
  sourceId?: string;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  isDownPayment?: boolean;

  @ApiPropertyOptional({ example: 'Pelunasan sisa kontrak sewa bus 5 hari tour Jawa Tengah' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ type: [CreateArInvoiceLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateArInvoiceLineDto)
  lines!: CreateArInvoiceLineDto[];
}

export class CreateCharterPelunasanInvoiceDto {
  @ApiProperty({ example: 'uuid-spj-wisata' })
  @IsString()
  @IsNotEmpty()
  tripId!: string;

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
  invoiceDate!: string;

  @ApiProperty({ example: '2026-10-24' })
  @IsDateString()
  dueDate!: string;

  @ApiProperty({ example: 12250000 })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  remainingAmount!: number;

  @ApiPropertyOptional({ example: 'Invoice pelunasan 70% kontrak sewa wisata SS-02' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class ArInvoiceQueryDto {
  @ApiPropertyOptional({ example: 'uuid-customer' })
  @IsString()
  @IsOptional()
  customerId?: string;

  @ApiPropertyOptional({ enum: ArInvoiceStatus })
  @IsEnum(ArInvoiceStatus)
  @IsOptional()
  status?: ArInvoiceStatus;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  isDownPayment?: boolean;

  @ApiPropertyOptional({ example: 'PT Mitra Sejahtera' })
  @IsString()
  @IsOptional()
  search?: string;

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
