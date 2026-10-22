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
  ApInvoiceStatus,
  ApSourceType,
} from '../../@models/finance/finance.enums';

export class CreateApInvoiceLineDto {
  @ApiProperty({ example: 'Servis Kupon Makan RM Taman Selera' })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty({ example: 'uuid-akun-beban-51102' })
  @IsString()
  @IsNotEmpty()
  accountId!: string;

  @ApiProperty({ example: 22 })
  @IsNumber()
  @Min(0.01)
  @Type(() => Number)
  qty!: number;

  @ApiProperty({ example: 25000 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  unitPrice!: number;

  @ApiPropertyOptional({ example: 'uuid-spj' })
  @IsString()
  @IsOptional()
  tripId?: string;

  @ApiPropertyOptional({ example: 'uuid-spj-leg' })
  @IsString()
  @IsOptional()
  tripLegId?: string;

  @ApiPropertyOptional({ example: 'uuid-vehicle' })
  @IsString()
  @IsOptional()
  vehicleId?: string;

  @ApiPropertyOptional({ example: 'uuid-cost-center' })
  @IsString()
  @IsOptional()
  costCenterId?: string;

  @ApiPropertyOptional({ example: 'uuid-business-unit' })
  @IsString()
  @IsOptional()
  businessUnitId?: string;

  @ApiPropertyOptional({ example: 24 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  manifestPaxCount?: number;

  @ApiPropertyOptional({ example: 22 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  couponCount?: number;

  @ApiPropertyOptional({ example: '2 penumpang tidur/puasa' })
  @IsString()
  @IsOptional()
  discrepancyNotes?: string;
}

export class CreateApInvoiceDto {
  @ApiProperty({ enum: ApVendorType, example: ApVendorType.RESTAURANT })
  @IsEnum(ApVendorType)
  vendorType!: ApVendorType;

  @ApiPropertyOptional({ example: 'uuid-restaurant-or-vendor' })
  @IsString()
  @IsOptional()
  vendorId?: string;

  @ApiProperty({ example: 'RM Taman Selera Subang' })
  @IsString()
  @IsNotEmpty()
  vendorName!: string;

  @ApiPropertyOptional({ example: 'INV-RMTS-2026/10/012' })
  @IsString()
  @IsOptional()
  vendorInvoiceNo?: string;

  @ApiProperty({ example: '2026-10-22' })
  @IsDateString()
  invoiceDate!: string;

  @ApiProperty({ example: '2026-10-29' })
  @IsDateString()
  dueDate!: string;

  @ApiProperty({ example: 'uuid-akun-utang-21101' })
  @IsString()
  @IsNotEmpty()
  apAccountId!: string;

  @ApiPropertyOptional({ enum: ApSourceType, example: ApSourceType.RESTAURANT_PERIODIC })
  @IsEnum(ApSourceType)
  @IsOptional()
  sourceType?: ApSourceType;

  @ApiPropertyOptional({ example: 'uuid-source-doc' })
  @IsString()
  @IsOptional()
  sourceId?: string;

  @ApiPropertyOptional({ example: 'Tagihan servis makan periode 15-21 Okt 2026' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ type: [CreateApInvoiceLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateApInvoiceLineDto)
  lines!: CreateApInvoiceLineDto[];
}

export class RestaurantBillSpjItemDto {
  @ApiProperty({ example: 'uuid-spj' })
  @IsString()
  @IsNotEmpty()
  tripId!: string;

  @ApiPropertyOptional({ example: 'uuid-spj-leg' })
  @IsString()
  @IsOptional()
  tripLegId?: string;

  @ApiProperty({ example: 22 })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  couponCount!: number;

  @ApiPropertyOptional({ example: '2 penumpang tidak makan karena puasa' })
  @IsString()
  @IsOptional()
  discrepancyNotes?: string;
}

export class CreateRestaurantBillDto {
  @ApiProperty({ example: 'uuid-restaurant' })
  @IsString()
  @IsNotEmpty()
  restaurantId!: string;

  @ApiProperty({ example: 'INV-RMTS-2026/10/012' })
  @IsString()
  @IsNotEmpty()
  vendorInvoiceNo!: string;

  @ApiProperty({ example: '2026-10-22' })
  @IsDateString()
  invoiceDate!: string;

  @ApiProperty({ example: '2026-10-29' })
  @IsDateString()
  dueDate!: string;

  @ApiPropertyOptional({ example: 'Tagihan servis makan berkala 2x seminggu' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ type: [RestaurantBillSpjItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RestaurantBillSpjItemDto)
  spjItems!: RestaurantBillSpjItemDto[];
}

export class ApInvoiceQueryDto {
  @ApiPropertyOptional({ enum: ApVendorType })
  @IsEnum(ApVendorType)
  @IsOptional()
  vendorType?: ApVendorType;

  @ApiPropertyOptional({ enum: ApInvoiceStatus })
  @IsEnum(ApInvoiceStatus)
  @IsOptional()
  status?: ApInvoiceStatus;

  @ApiPropertyOptional({ example: 'RM Taman Selera' })
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
