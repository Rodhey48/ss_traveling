import {
  IsUUID,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
  IsDateString,
  IsNumber,
  IsNumberString,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RecordSpjMealDto {
  @ApiProperty({
    description: 'ID Restoran Mitra tempat bus singgah',
    example: '40d8c6dd-6a2d-43f9-b649-5864d3faccb9',
  })
  @IsNotEmpty()
  @IsUUID()
  restaurantId!: string;

  @ApiPropertyOptional({
    description: 'ID Leg SPJ perjalanan (opsional)',
  })
  @IsOptional()
  @IsUUID()
  spjLegId?: string;

  @ApiProperty({
    description: 'Jumlah kupon makan riil yang ditukarkan penumpang (bisa diedit fleksibel)',
    example: 22,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  actualPax!: number;

  @ApiPropertyOptional({
    description: 'Tarif kupon makan per pax (default snapshot dari restoran, bisa diedit manual)',
    example: '25000.00',
  })
  @IsOptional()
  @IsNumberString()
  ratePerPax?: string;

  @ApiPropertyOptional({
    description: 'Catatan selisih pax (misal: 3 orang tidur di bus / puasa)',
    example: '3 orang tidur di kabin',
  })
  @IsOptional()
  @IsString()
  discrepancyNotes?: string;
}

export class CreateRestaurantSettlementBatchDto {
  @ApiProperty({
    description: 'ID Restoran Mitra penerima transfer gelondongan',
    example: '40d8c6dd-6a2d-43f9-b649-5864d3faccb9',
  })
  @IsNotEmpty()
  @IsUUID()
  restaurantId!: string;

  @ApiProperty({
    type: [String],
    description: 'Daftar ID kewajiban kupon makan SPJ yang dibayarkan gelondongan',
    example: ['uuid-meal-1', 'uuid-meal-2'],
  })
  @IsNotEmpty()
  @IsArray()
  spjMealRecordIds!: string[];

  @ApiProperty({
    description: 'Tanggal pembayaran transfer bank',
    example: '2026-11-07',
  })
  @IsNotEmpty()
  @IsDateString()
  paymentDate!: string;

  @ApiProperty({
    description: 'ID akun rekening kas/bank kantor (misal Bank BCA)',
    example: 'uuid-cash-account-bca',
  })
  @IsNotEmpty()
  @IsUUID()
  bankAccountId!: string;

  @ApiPropertyOptional({
    description: 'Nomor referensi transfer bank (No. Ref / Bukti Transfer)',
    example: 'TRF-BCA-RM-001',
  })
  @IsOptional()
  @IsString()
  referenceNumber?: string;

  @ApiPropertyOptional({
    description: 'URL file foto/PDF bukti transfer bank',
  })
  @IsOptional()
  @IsString()
  receiptUrl?: string;

  @ApiPropertyOptional({
    description: 'Catatan tambahan transfer gelondongan restoran',
    example: 'Pelunasan kupon servis makan minggu ke-1 November 2026',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class RestaurantSettlementFilterDto {
  @ApiPropertyOptional({
    description: 'Filter berdasarkan ID restoran mitra',
  })
  @IsOptional()
  @IsUUID()
  restaurantId?: string;

  @ApiPropertyOptional({
    description: 'Pencarian nomor SPJ, rute, atau nama restoran',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
