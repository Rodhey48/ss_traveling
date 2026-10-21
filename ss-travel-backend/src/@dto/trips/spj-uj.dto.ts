import {
  IsUUID,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumberString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  SpjDisbursementType,
  SpjPaymentMethod,
  SpjAdditionalRequestStatus,
} from '../../@models/trips/trip.enums';

export class CreateSpjUjDisbursementDto {
  @ApiPropertyOptional({ description: 'ID sesi penugasan kru' })
  @IsOptional()
  @IsUUID()
  crewAssignmentId?: string;

  @ApiPropertyOptional({
    enum: SpjDisbursementType,
    default: SpjDisbursementType.INITIAL,
  })
  @IsOptional()
  @IsEnum(SpjDisbursementType)
  disbursementType?: SpjDisbursementType;

  @ApiProperty({ description: 'Nominal dana UJ yang dicairkan', example: '3500000.00' })
  @IsNotEmpty()
  @IsNumberString()
  amount!: string;

  @ApiProperty({ enum: SpjPaymentMethod, default: SpjPaymentMethod.CASH })
  @IsNotEmpty()
  @IsEnum(SpjPaymentMethod)
  paymentMethod!: SpjPaymentMethod;

  @ApiPropertyOptional({ description: 'ID Akun Kas jika tunai' })
  @IsOptional()
  @IsUUID()
  cashAccountId?: string;

  @ApiPropertyOptional({ description: 'ID Rekening Bank jika transfer' })
  @IsOptional()
  @IsUUID()
  bankAccountId?: string;

  @ApiPropertyOptional({ description: 'Nomor Bukti Kas Keluar / Ref Transfer' })
  @IsOptional()
  @IsString()
  receiptRef?: string;

  @ApiPropertyOptional({ description: 'Catatan pencairan' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateSpjUjReturnDto {
  @ApiPropertyOptional({ description: 'ID sesi penugasan kru' })
  @IsOptional()
  @IsUUID()
  crewAssignmentId?: string;

  @ApiProperty({ description: 'Nominal sisa fisik UJ yang dikembalikan', example: '900000.00' })
  @IsNotEmpty()
  @IsNumberString()
  amount!: string;

  @ApiProperty({ enum: SpjPaymentMethod, default: SpjPaymentMethod.CASH })
  @IsNotEmpty()
  @IsEnum(SpjPaymentMethod)
  paymentMethod!: SpjPaymentMethod;

  @ApiPropertyOptional({ description: 'ID Akun Kas jika tunai' })
  @IsOptional()
  @IsUUID()
  cashAccountId?: string;

  @ApiPropertyOptional({ description: 'ID Rekening Bank jika transfer' })
  @IsOptional()
  @IsUUID()
  bankAccountId?: string;

  @ApiPropertyOptional({ description: 'Nomor Bukti Kas Masuk / Ref' })
  @IsOptional()
  @IsString()
  receiptRef?: string;

  @ApiPropertyOptional({ description: 'Catatan pengembalian' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateSpjUjAdditionalRequestDto {
  @ApiPropertyOptional({ description: 'ID sesi penugasan kru' })
  @IsOptional()
  @IsUUID()
  crewAssignmentId?: string;

  @ApiProperty({ description: 'Nominal tambahan UJ yang diajukan', example: '1000000.00' })
  @IsNotEmpty()
  @IsNumberString()
  amount!: string;

  @ApiProperty({ description: 'Alasan penambahan UJ di jalan' })
  @IsNotEmpty()
  @IsString()
  reason!: string;
}

export class ProcessAdditionalRequestDto {
  @ApiProperty({ enum: [SpjAdditionalRequestStatus.APPROVED, SpjAdditionalRequestStatus.REJECTED] })
  @IsNotEmpty()
  @IsEnum(SpjAdditionalRequestStatus)
  status!: SpjAdditionalRequestStatus;

  @ApiPropertyOptional({ description: 'Alasan penolakan jika ditolak' })
  @IsOptional()
  @IsString()
  rejectionReason?: string;
}

export class UjRolloverDto {
  @ApiProperty({ description: 'ID SPJ Pengganti yang menerima estafet UJ' })
  @IsNotEmpty()
  @IsUUID()
  targetSpjId!: string;

  @ApiProperty({ description: 'Nominal sisa UJ fisik yang diestafetkan', example: '2000000.00' })
  @IsNotEmpty()
  @IsNumberString()
  amount!: string;

  @ApiPropertyOptional({ description: 'Catatan serah terima UJ' })
  @IsOptional()
  @IsString()
  notes?: string;
}
