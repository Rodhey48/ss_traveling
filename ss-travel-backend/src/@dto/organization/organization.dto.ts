import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

// --- COMPANY DTO ---
export class CreateCompanyDto {
  @ApiProperty({ example: 'SST' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: 'PT SS Traveling Official' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'IDR', default: 'IDR' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ example: 'Asia/Jakarta', default: 'Asia/Jakarta' })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  website?: string;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateCompanyDto extends PartialType(CreateCompanyDto) {}

// --- BUSINESS UNIT DTO ---
export class CreateBusinessUnitDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @ApiProperty({ example: 'AKAP' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: 'AKAP Reguler' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateBusinessUnitDto extends PartialType(CreateBusinessUnitDto) {}

// --- COST CENTER DTO ---
export class CreateCostCenterDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @ApiProperty({ example: 'CC-OPS-POOL' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: 'Operasional Pool Ciputat' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateCostCenterDto extends PartialType(CreateCostCenterDto) {}

// --- PROFIT CENTER DTO ---
export class CreateProfitCenterDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  businessUnitId?: string;

  @ApiProperty({ example: 'PC-AKAP' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: 'Profit Center AKAP Reguler' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateProfitCenterDto extends PartialType(CreateProfitCenterDto) {}
