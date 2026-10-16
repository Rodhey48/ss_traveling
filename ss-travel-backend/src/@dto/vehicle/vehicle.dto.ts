import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  OwnershipStatus,
  VehicleType,
} from '../../@models/fleet/vehicle.entity';
import { SeatClassName } from '../../@models/fleet/vehicle-seat-class.entity';

// --- MASTER SEAT CLASS DTO ---
export class CreateSeatClassDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @ApiProperty({ example: 'SLEEPER' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: 'Sleeper Class' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '1-1', required: false })
  @IsOptional()
  @IsString()
  defaultLayout?: string;

  @ApiProperty({
    example: 'Kabin tidur pribadi dengan fasilitas bantal, selimut, dan AVOD',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateSeatClassDto extends PartialType(CreateSeatClassDto) {}

// --- VEHICLE SEAT CLASS (ARMADA PLOTTING) DTO ---
export class CreateVehicleSeatClassDto {
  @ApiProperty({ required: false, description: 'ID Master Kelas Kursi' })
  @IsOptional()
  @IsUUID()
  seatClassId?: string;

  @ApiProperty({ enum: SeatClassName, example: SeatClassName.LUXURY_2_1 })
  @IsEnum(SeatClassName)
  @IsNotEmpty()
  className: SeatClassName;

  @ApiProperty({ example: 20 })
  @IsInt()
  @Min(1)
  seatCapacity: number;

  @ApiProperty({ example: '2-1 Luxury', required: false })
  @IsOptional()
  @IsString()
  seatLayout?: string;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateVehicleSeatClassDto extends PartialType(
  CreateVehicleSeatClassDto,
) {}

// --- VEHICLE IMAGE DTO ---
export class CreateVehicleImageDto {
  @ApiProperty({
    example: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957',
  })
  @IsString()
  @IsNotEmpty()
  imageUrl: string;

  @ApiProperty({ example: 'Tampak Depan Jetbus 5', required: false })
  @IsOptional()
  @IsString()
  caption?: string;

  @ApiProperty({ example: true, required: false, default: false })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @ApiProperty({ example: 0, required: false, default: 0 })
  @IsOptional()
  @IsInt()
  sequence?: number;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateVehicleImageDto extends PartialType(CreateVehicleImageDto) {}

// --- VEHICLE DTO ---
export class CreateVehicleDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @ApiProperty({ example: 'SS-01' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: 'Executive Combi', required: false })
  @IsOptional()
  @IsString()
  nickname?: string;

  @ApiProperty({ example: 'B 7123 SS' })
  @IsString()
  @IsNotEmpty()
  plateNumber: string;

  @ApiProperty({ enum: VehicleType, default: VehicleType.BIG_BUS })
  @IsEnum(VehicleType)
  vehicleType: VehicleType;

  @ApiProperty({ example: 'Mercedes-Benz OH 1626', required: false })
  @IsOptional()
  @IsString()
  chassisModel?: string;

  @ApiProperty({ example: 'Jetbus 5 Combi', required: false })
  @IsOptional()
  @IsString()
  bodyModel?: string;

  @ApiProperty({
    enum: OwnershipStatus,
    default: OwnershipStatus.OWNED_PAID_OFF,
  })
  @IsEnum(OwnershipStatus)
  ownershipStatus: OwnershipStatus;

  @ApiProperty({ example: 24, required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  capacity?: number;

  @ApiProperty({ example: 2024, required: false })
  @IsOptional()
  @IsInt()
  year?: number;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({
    type: [CreateVehicleSeatClassDto],
    required: false,
    description: 'Konfigurasi multi-class kursi',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVehicleSeatClassDto)
  seatClasses?: CreateVehicleSeatClassDto[];

  @ApiProperty({
    type: [CreateVehicleImageDto],
    required: false,
    description: 'Galeri foto armada bus',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVehicleImageDto)
  images?: CreateVehicleImageDto[];
}

export class UpdateVehicleDto extends PartialType(CreateVehicleDto) {}

export class VehicleQueryFilterDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ enum: VehicleType, required: false })
  @IsOptional()
  @IsEnum(VehicleType)
  vehicleType?: VehicleType;

  @ApiProperty({ enum: OwnershipStatus, required: false })
  @IsOptional()
  @IsEnum(OwnershipStatus)
  ownershipStatus?: OwnershipStatus;

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
