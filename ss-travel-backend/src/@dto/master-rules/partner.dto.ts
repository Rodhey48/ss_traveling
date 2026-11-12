import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { RestaurantSettlementType } from '../../@models/master-rules/restaurant.entity';
import { CoordinatorType } from '../../@models/master-rules/coordinator.entity';

export class CreateRestaurantDto {
  @ApiProperty({ example: 'RM-04', description: 'Kode unik rumah makan mitra' })
  @IsString()
  @IsNotEmpty()
  code!: string;

  @ApiProperty({ example: 'RM Taman Selera 2', description: 'Nama rumah makan mitra' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'SUBANG', description: 'Kota lokasi rumah makan' })
  @IsString()
  @IsNotEmpty()
  city!: string;

  @ApiPropertyOptional({ example: 'Rest Area Tol Cipali KM 102 B' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ example: '0260123456' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: 25000, description: 'Tarif kupon makan per penumpang (Rp)' })
  @IsNumber()
  @Min(0)
  ratePerPax!: number;

  @ApiProperty({ enum: RestaurantSettlementType, default: RestaurantSettlementType.INVOICED_MONTHLY_AP })
  @IsEnum(RestaurantSettlementType)
  settlementType!: RestaurantSettlementType;

  @ApiPropertyOptional({ example: 'Ibu Haryati' })
  @IsString()
  @IsOptional()
  contactPerson?: string;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateRestaurantDto {
  @ApiPropertyOptional({ example: 'RM Taman Selera Reborn' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'SUBANG' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 27500 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  ratePerPax?: number;

  @ApiPropertyOptional({ enum: RestaurantSettlementType })
  @IsEnum(RestaurantSettlementType)
  @IsOptional()
  settlementType?: RestaurantSettlementType;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  contactPerson?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

// ==========================================
// MASTER FIELD COORDINATORS (KORLAP)
// ==========================================

export class CreateCoordinatorDto {
  @ApiProperty({ example: 'KOR-BRT-02', description: 'Kode unik koordinator lapangan' })
  @IsString()
  @IsNotEmpty()
  code!: string;

  @ApiProperty({ example: 'H. Ahmad Sodik', description: 'Nama koordinator / PIC' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ enum: CoordinatorType, default: CoordinatorType.INDIVIDUAL })
  @IsEnum(CoordinatorType)
  @IsOptional()
  type?: CoordinatorType;

  @ApiPropertyOptional({ example: 'Paguyuban Pengurus Jalur Barat' })
  @IsString()
  @IsOptional()
  organizationName?: string;

  @ApiProperty({ example: '081298765432', description: 'Nomor WhatsApp / HP' })
  @IsString()
  @IsNotEmpty()
  phone!: string;

  @ApiPropertyOptional({ example: 'korlap@sstravelink.id' })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: 'JAKARTA - TERMINAL PULO GEBANG', default: 'ALL' })
  @IsString()
  @IsOptional()
  area?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ example: 'BCA', description: 'Nama Bank tujuan transfer settlement' })
  @IsString()
  @IsNotEmpty()
  bankName!: string;

  @ApiProperty({ example: '8830192847', description: 'Nomor rekening bank' })
  @IsString()
  @IsNotEmpty()
  bankAccountNumber!: string;

  @ApiProperty({ example: 'Ahmad Sodik', description: 'Atas nama pemilik rekening bank' })
  @IsString()
  @IsNotEmpty()
  bankAccountHolder!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateCoordinatorDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ enum: CoordinatorType })
  @IsEnum(CoordinatorType)
  @IsOptional()
  type?: CoordinatorType;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  organizationName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  area?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  bankName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  bankAccountNumber?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  bankAccountHolder?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class CoordinatorFilterDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  area?: string;

  @ApiPropertyOptional({ enum: CoordinatorType })
  @IsEnum(CoordinatorType)
  @IsOptional()
  type?: CoordinatorType;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

// ==========================================
// COORDINATOR FEE RULES
// ==========================================

export class CreateCoordinatorFeeRuleDto {
  @ApiPropertyOptional({ example: 'uuid-route', description: 'ID Master Rute Trayek' })
  @IsUUID()
  @IsOptional()
  routeId?: string;

  @ApiPropertyOptional({ example: 'JAKARTA', description: 'Kota Asal Rute (default ALL)' })
  @IsString()
  @IsOptional()
  origin?: string;

  @ApiPropertyOptional({ example: 'SURABAYA', description: 'Kota Tujuan Rute (default ALL)' })
  @IsString()
  @IsOptional()
  destination?: string;

  @ApiPropertyOptional({ description: 'ID Master Koordinator Lapangan Eksternal' })
  @IsUUID()
  @IsOptional()
  coordinatorId?: string;

  @ApiPropertyOptional({ description: 'ID Pengguna Korlap Lapangan (users) - Deprecated' })
  @IsUUID()
  @IsOptional()
  coordinatorUserId?: string;

  @ApiProperty({ example: 10000, description: 'Tarif fee jasa korlap per penumpang (Rp)' })
  @IsNumber()
  @Min(0)
  feePerPax!: number;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  effectiveFrom?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  effectiveUntil?: string;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateCoordinatorFeeRuleDto {
  @ApiPropertyOptional({ description: 'ID Master Rute Trayek' })
  @IsUUID()
  @IsOptional()
  routeId?: string;

  @ApiPropertyOptional({ example: 'JAKARTA' })
  @IsString()
  @IsOptional()
  origin?: string;

  @ApiPropertyOptional({ example: 'YOGYAKARTA' })
  @IsString()
  @IsOptional()
  destination?: string;

  @ApiPropertyOptional({ description: 'ID Master Koordinator Lapangan Eksternal' })
  @IsUUID()
  @IsOptional()
  coordinatorId?: string;

  @ApiPropertyOptional({ description: 'ID Pengguna Korlap Lapangan (users) - Deprecated' })
  @IsUUID()
  @IsOptional()
  coordinatorUserId?: string;

  @ApiPropertyOptional({ example: 12500 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  feePerPax?: number;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  effectiveFrom?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  effectiveUntil?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class CalculateMealExpenseQueryDto {
  @ApiProperty({ description: 'ID Rumah Makan' })
  @IsUUID()
  @IsNotEmpty()
  restaurantId!: string;

  @ApiProperty({ example: 24, description: 'Jumlah Penumpang (Pax)' })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  paxCount!: number;
}

export class CoordinatorFeeQueryDto {
  @ApiProperty({ example: 'JAKARTA', description: 'Kota Asal Rute' })
  @IsString()
  @IsNotEmpty()
  origin!: string;

  @ApiProperty({ example: 'SURABAYA', description: 'Kota Tujuan Rute' })
  @IsString()
  @IsNotEmpty()
  destination!: string;

  @ApiProperty({ example: 24, description: 'Jumlah Penumpang (Pax)' })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  paxCount!: number;
}
