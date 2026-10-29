import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsDateString,
  IsNumber,
  IsBoolean,
  IsArray,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  TripServiceType,
  TripScheduleStatus,
  CrewAssignmentRole,
} from '../../@models/trips/trip.enums';

export class CreateTripScheduleDto {
  @IsEnum(TripServiceType)
  @IsNotEmpty()
  serviceType!: TripServiceType;

  @IsUUID()
  @IsOptional()
  vehicleId?: string;

  @IsDateString()
  @IsNotEmpty()
  plannedDepartureAt!: string;

  @IsDateString()
  @IsNotEmpty()
  plannedReturnAt!: string;

  @IsString()
  @IsNotEmpty()
  origin!: string;

  @IsString()
  @IsNotEmpty()
  destination!: string;

  @IsUUID()
  @IsOptional()
  customerId?: string;

  @IsString()
  @IsOptional()
  picName?: string;

  @IsString()
  @IsOptional()
  picPhone?: string;

  @IsString()
  @IsOptional()
  pickupNotes?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  totalPackagePrice?: number;

  @IsUUID()
  @IsOptional()
  plannedDriver1Id?: string;

  @IsUUID()
  @IsOptional()
  plannedDriver2Id?: string;

  @IsUUID()
  @IsOptional()
  plannedConductorId?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsUUID()
  @IsOptional()
  businessUnitId?: string;

  @IsUUID()
  @IsOptional()
  costCenterId?: string;

  @IsUUID()
  @IsOptional()
  companyId?: string;
}

export class UpdateTripScheduleDto {
  @IsEnum(TripServiceType)
  @IsOptional()
  serviceType?: TripServiceType;

  @IsUUID()
  @IsOptional()
  vehicleId?: string;

  @IsDateString()
  @IsOptional()
  plannedDepartureAt?: string;

  @IsDateString()
  @IsOptional()
  plannedReturnAt?: string;

  @IsString()
  @IsOptional()
  origin?: string;

  @IsString()
  @IsOptional()
  destination?: string;

  @IsUUID()
  @IsOptional()
  customerId?: string;

  @IsString()
  @IsOptional()
  picName?: string;

  @IsString()
  @IsOptional()
  picPhone?: string;

  @IsString()
  @IsOptional()
  pickupNotes?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  totalPackagePrice?: number;

  @IsUUID()
  @IsOptional()
  plannedDriver1Id?: string;

  @IsUUID()
  @IsOptional()
  plannedDriver2Id?: string;

  @IsUUID()
  @IsOptional()
  plannedConductorId?: string;

  @IsEnum(TripScheduleStatus)
  @IsOptional()
  status?: TripScheduleStatus;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsUUID()
  @IsOptional()
  businessUnitId?: string;

  @IsUUID()
  @IsOptional()
  costCenterId?: string;
}

export class TripScheduleQueryFilterDto {
  @IsEnum(TripServiceType)
  @IsOptional()
  serviceType?: TripServiceType;

  @IsEnum(TripScheduleStatus)
  @IsOptional()
  status?: TripScheduleStatus;

  @IsUUID()
  @IsOptional()
  vehicleId?: string;

  @IsUUID()
  @IsOptional()
  driverId?: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsString()
  @IsOptional()
  search?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;
}

export class ConflictCheckDto {
  @IsUUID()
  @IsOptional()
  vehicleId?: string;

  @IsUUID('4', { each: true })
  @IsOptional()
  crewIds?: string[];

  @IsDateString()
  @IsNotEmpty()
  departureAt!: string;

  @IsDateString()
  @IsNotEmpty()
  returnAt!: string;

  @IsUUID()
  @IsOptional()
  excludeScheduleId?: string;
}

export class CustomCrewRateDto {
  @IsUUID()
  @IsNotEmpty()
  crewId!: string;

  @IsEnum(CrewAssignmentRole)
  @IsNotEmpty()
  role!: CrewAssignmentRole;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  mealAllowance?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  incentive?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  fullSeatBonus?: number;

  @IsString()
  @IsOptional()
  payoutTiming?: string; // 'AT_SETTLEMENT' | 'EARLY_DISBURSEMENT'
}

export class GenerateSpjFromScheduleDto {
  @IsUUID()
  @IsOptional()
  vehicleId?: string; // Jika beda armada saat berangkat

  @IsUUID()
  @IsOptional()
  driver1Id?: string;

  @IsUUID()
  @IsOptional()
  driver2Id?: string;

  @IsUUID()
  @IsOptional()
  conductorId?: string;

  @IsBoolean()
  @IsOptional()
  isRoundTrip?: boolean; // True: 2 Leg (PP), False: 1 Leg (One-way)

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CustomCrewRateDto)
  customCrewRates?: CustomCrewRateDto[];

  @IsString()
  @IsOptional()
  notes?: string;
}
