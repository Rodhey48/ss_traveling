import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsDateString,
  IsNumber,
  IsArray,
  ValidateNested,
  IsBoolean,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  TripServiceType,
  SpjOperationalStatus,
  SpjFinancialStatus,
  SpjLegDirection,
  SpjLegStatus,
  CrewAssignmentRole,
  CrewAssignmentStatus,
} from '../../@models/trips/trip.enums';

export class CreateSpjLegDto {
  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  sequenceNo!: number;

  @IsEnum(SpjLegDirection)
  @IsNotEmpty()
  direction!: SpjLegDirection;

  @IsString()
  @IsNotEmpty()
  origin!: string;

  @IsString()
  @IsNotEmpty()
  destination!: string;

  @IsDateString()
  @IsOptional()
  departureAt?: string;

  @IsDateString()
  @IsOptional()
  arrivalAt?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  passengerCount?: number = 0;
}

export class UpdateSpjLegDto {
  @IsEnum(SpjLegStatus)
  @IsOptional()
  status?: SpjLegStatus;

  @IsDateString()
  @IsOptional()
  departureAt?: string;

  @IsDateString()
  @IsOptional()
  arrivalAt?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  passengerCount?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  mealPaxCount?: number;

  @IsString()
  @IsOptional()
  mealDiscrepancyNotes?: string;
}

export class CreateSpjCrewAssignmentDto {
  @IsUUID()
  @IsNotEmpty()
  crewId!: string;

  @IsEnum(CrewAssignmentRole)
  @IsNotEmpty()
  role!: CrewAssignmentRole;

  @IsUUID()
  @IsOptional()
  spjLegId?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class CreateSpjDto {
  @IsEnum(TripServiceType)
  @IsNotEmpty()
  serviceType!: TripServiceType;

  @IsUUID()
  @IsNotEmpty()
  vehicleId!: string;

  @IsUUID()
  @IsOptional()
  tripScheduleId?: string;

  @IsUUID()
  @IsOptional()
  parentSpjId?: string;

  @IsUUID()
  @IsOptional()
  businessUnitId?: string;

  @IsUUID()
  @IsOptional()
  profitCenterId?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateSpjLegDto)
  legs?: CreateSpjLegDto[];

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateSpjCrewAssignmentDto)
  crewAssignments?: CreateSpjCrewAssignmentDto[];
}

export class ReplaceCrewDto {
  @IsUUID()
  @IsNotEmpty()
  assignmentId!: string;

  @IsUUID()
  @IsNotEmpty()
  replacementCrewId!: string;

  @IsEnum(CrewAssignmentRole)
  @IsOptional()
  role?: CrewAssignmentRole;

  @IsString()
  @IsNotEmpty()
  reason!: string;
}

export class EmergencyReplaceBusDto {
  @IsUUID()
  @IsNotEmpty()
  parentSpjId!: string;

  @IsUUID()
  @IsNotEmpty()
  newVehicleId!: string;

  @IsString()
  @IsNotEmpty()
  incidentLocation!: string; // Misal: "KM 214 Tol Cipali"

  @IsString()
  @IsNotEmpty()
  incidentNotes!: string; // Misal: "Radiator pecah dan overheat mesin"

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  transferPassengerCount?: number = 0;

  @IsBoolean()
  @IsOptional()
  continueWithExistingCrew?: boolean = true;
}

export class SpjQueryFilterDto {
  @IsEnum(TripServiceType)
  @IsOptional()
  serviceType?: TripServiceType;

  @IsEnum(SpjOperationalStatus)
  @IsOptional()
  operationalStatus?: SpjOperationalStatus;

  @IsEnum(SpjFinancialStatus)
  @IsOptional()
  financialStatus?: SpjFinancialStatus;

  @IsUUID()
  @IsOptional()
  vehicleId?: string;

  @IsUUID()
  @IsOptional()
  crewId?: string;

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
