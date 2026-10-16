import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  CustomerTier,
  CustomerType,
  LeadSource,
} from '../../@models/customer/customer.entity';

export class CreateCustomerDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @ApiProperty({
    example: 'CUST-0001',
    required: false,
    description: 'Kode unik pelanggan (otomatis dibuat jika kosong)',
  })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiProperty({
    enum: CustomerType,
    default: CustomerType.CORPORATE,
    example: CustomerType.CORPORATE,
  })
  @IsEnum(CustomerType)
  customerType: CustomerType;

  @ApiProperty({
    example: 'PT Mitra Sejahtera Abadi',
    required: false,
    description: 'Nama instansi/sekolah/komunitas',
  })
  @IsOptional()
  @IsString()
  institutionName?: string;

  @ApiProperty({ example: 'Bpk. Aris Setiawan' })
  @IsString()
  @IsNotEmpty()
  picName: string;

  @ApiProperty({ example: '081234567890' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: 'procurement@mitrasejahtera.co.id', required: false })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({
    example: 'Kawasan Industri MM2100 Blok C-4, Cikarang',
    required: false,
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ example: 'Bekasi', required: false })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({
    enum: LeadSource,
    default: LeadSource.DIRECT,
    example: LeadSource.DIRECT,
  })
  @IsEnum(LeadSource)
  leadSource: LeadSource;

  @ApiProperty({
    enum: CustomerTier,
    default: CustomerTier.BRONZE,
    example: CustomerTier.PLATINUM,
  })
  @IsEnum(CustomerTier)
  customerTier: CustomerTier;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  lastTripDate?: string;

  @ApiProperty({ example: 0, required: false, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  totalTripsCount?: number;

  @ApiProperty({
    example: 'Sewa rutin tahunan bus pariwisata 5 armada',
    required: false,
  })
  @IsOptional()
  @IsString()
  specialNotes?: string;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateCustomerDto extends PartialType(CreateCustomerDto) {}

export class CustomerQueryFilterDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ enum: CustomerType, required: false })
  @IsOptional()
  @IsEnum(CustomerType)
  customerType?: CustomerType;

  @ApiProperty({ enum: LeadSource, required: false })
  @IsOptional()
  @IsEnum(LeadSource)
  leadSource?: LeadSource;

  @ApiProperty({ enum: CustomerTier, required: false })
  @IsOptional()
  @IsEnum(CustomerTier)
  customerTier?: CustomerTier;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  page?: number = 1;

  @ApiProperty({ required: false, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  limit?: number = 10;
}
