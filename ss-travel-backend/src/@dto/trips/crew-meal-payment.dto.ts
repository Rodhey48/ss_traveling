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
  CrewMealPaymentCategory,
  CrewPayoutTiming,
  SpjPaymentMethod,
} from '../../@models/trips/trip.enums';

export class CreateCrewMealPaymentDto {
  @ApiPropertyOptional({ description: 'ID sesi penugasan kru' })
  @IsOptional()
  @IsUUID()
  crewAssignmentId?: string;

  @ApiProperty({ description: 'ID User kru penerima kompensasi' })
  @IsNotEmpty()
  @IsUUID()
  crewId!: string;

  @ApiProperty({
    enum: CrewMealPaymentCategory,
    description: 'Kategori hak pembayaran kru',
  })
  @IsNotEmpty()
  @IsEnum(CrewMealPaymentCategory)
  paymentCategory!: CrewMealPaymentCategory;

  @ApiProperty({ description: 'Nominal hak rupiah kru', example: '300000.00' })
  @IsNotEmpty()
  @IsNumberString()
  amount!: string;

  @ApiPropertyOptional({
    enum: CrewPayoutTiming,
    default: CrewPayoutTiming.AT_SETTLEMENT,
  })
  @IsOptional()
  @IsEnum(CrewPayoutTiming)
  payoutTiming?: CrewPayoutTiming;

  @ApiPropertyOptional({ description: 'Catatan' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class DisburseEarlyMealPaymentDto {
  @ApiProperty({
    enum: [SpjPaymentMethod.BANK_TRANSFER, SpjPaymentMethod.CASH],
    default: SpjPaymentMethod.BANK_TRANSFER,
  })
  @IsNotEmpty()
  @IsEnum(SpjPaymentMethod)
  paymentMethod!: SpjPaymentMethod;

  @ApiPropertyOptional({ description: 'ID Rekening Bank sumber transfer' })
  @IsOptional()
  @IsUUID()
  bankAccountId?: string;

  @ApiPropertyOptional({ description: 'ID Akun Kas jika tunai' })
  @IsOptional()
  @IsUUID()
  cashAccountId?: string;

  @ApiPropertyOptional({ description: 'Nomor referensi mutasi bank / BKK' })
  @IsOptional()
  @IsString()
  receiptRef?: string;

  @ApiPropertyOptional({ description: 'Catatan pencairan di muka' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class AddPerpalPaymentDto {
  @ApiProperty({
    description: 'Daftar ID penugasan kru yang berhak menerima uang perpal',
    type: [String],
  })
  @IsNotEmpty()
  crewAssignmentIds!: string[];

  @ApiPropertyOptional({
    description: 'Lokasi terminal tempat bus perpal/menginap',
    example: 'Terminal Giwangan Yogyakarta',
  })
  @IsOptional()
  @IsString()
  terminalLocation?: string;

  @ApiPropertyOptional({
    description: 'Jumlah hari perpal menginap di terminal',
    example: 1,
    default: 1,
  })
  @IsOptional()
  daysCount?: number;

  @ApiProperty({
    description: 'Nominal uang perpal per orang per hari',
    example: '100000.00',
  })
  @IsNotEmpty()
  @IsNumberString()
  amountPerPersonPerDay!: string;

  @ApiPropertyOptional({
    enum: CrewPayoutTiming,
    default: CrewPayoutTiming.AT_SETTLEMENT,
  })
  @IsOptional()
  @IsEnum(CrewPayoutTiming)
  payoutTiming?: CrewPayoutTiming;

  @ApiPropertyOptional({ description: 'Catatan tambahan alasan perpal' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ClaimFullSeatBonusDto {
  @ApiProperty({
    description: 'Daftar ID penugasan kru yang menerima bonus full seat',
    type: [String],
  })
  @IsNotEmpty()
  crewAssignmentIds!: string[];

  @ApiProperty({
    description: 'Nominal bonus full seat per orang kru',
    example: '150000.00',
  })
  @IsNotEmpty()
  @IsNumberString()
  bonusAmountPerPerson!: string;

  @ApiPropertyOptional({ description: 'Catatan tambahan klaim bonus' })
  @IsOptional()
  @IsString()
  notes?: string;
}
