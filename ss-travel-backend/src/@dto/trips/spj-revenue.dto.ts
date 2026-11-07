import {
  IsUUID,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumberString,
  IsInt,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  SpjRevenueDeclarationType,
  SpjRevenueDeclarationStatus,
} from '../../@models/trips/trip.enums';
import { AgentSettlementType } from '../../@models/master-rules/agent.entity';

export class CreateSpjRevenueDeclarationDto {
  @ApiPropertyOptional({ description: 'ID Leg SPJ jika spesifik leg tertentu' })
  @IsOptional()
  @IsUUID()
  spjLegId?: string;

  @ApiProperty({
    enum: SpjRevenueDeclarationType,
    description: 'Jenis penerimaan kas operasional kru',
  })
  @IsNotEmpty()
  @IsEnum(SpjRevenueDeclarationType)
  declarationType!: SpjRevenueDeclarationType;

  @ApiProperty({ description: 'Nominal bruto penerimaan', example: '350000.00' })
  @IsNotEmpty()
  @IsNumberString()
  amount!: string;

  @ApiPropertyOptional({ description: 'Nomor manifest atau resi surat jalan kargo' })
  @IsOptional()
  @IsString()
  sourceReference?: string;

  // Komisi kargo dinamis kru (Addendum v1.9 & Skenario 1)
  @ApiPropertyOptional({
    description: 'Persentase hak komisi kru atas kargo (misal 20%)',
    example: '20.00',
  })
  @IsOptional()
  @IsNumberString()
  crewCommissionPercentage?: string;

  @ApiPropertyOptional({
    description: 'Nominal hak komisi kru kargo (jika diisi nominal rupiah langsung)',
    example: '70000.00',
  })
  @IsOptional()
  @IsNumberString()
  crewCommissionAmount?: string;

  @ApiPropertyOptional({
    description: 'ID penugasan kru yang berhak menerima komisi kargo',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @IsOptional()
  @IsUUID()
  recipientCrewAssignmentId?: string;

  // Metadata kargo
  @ApiPropertyOptional({ description: 'Nama pengirim paket' })
  @IsOptional()
  @IsString()
  cargoSenderName?: string;

  @ApiPropertyOptional({ description: 'No HP pengirim paket' })
  @IsOptional()
  @IsString()
  cargoSenderPhone?: string;

  @ApiPropertyOptional({ description: 'Nama penerima paket' })
  @IsOptional()
  @IsString()
  cargoReceiverName?: string;

  @ApiPropertyOptional({ description: 'No HP penerima paket' })
  @IsOptional()
  @IsString()
  cargoReceiverPhone?: string;

  @ApiPropertyOptional({ description: 'Keterangan isi barang paket' })
  @IsOptional()
  @IsString()
  cargoItemDescription?: string;

  // --- ATRIBUT PENJUALAN TIKET AGENT & KOMISI ---
  @ApiPropertyOptional({ description: 'ID Mitra Agen Penjual Tiket' })
  @IsOptional()
  @IsUUID()
  agentId?: string;

  @ApiPropertyOptional({ description: 'ID Kelas Kursi Armada Bus' })
  @IsOptional()
  @IsUUID()
  seatClassId?: string;

  @ApiPropertyOptional({ description: 'Jumlah lembar tiket terjual', example: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  ticketCount?: number;

  @ApiPropertyOptional({ description: 'Harga satuan per lembar tiket', example: '250000.00' })
  @IsOptional()
  @IsNumberString()
  ticketPrice?: string;

  @ApiPropertyOptional({ description: 'Total hak komisi agen', example: '100000.00' })
  @IsOptional()
  @IsNumberString()
  agentCommissionAmount?: string;

  @ApiPropertyOptional({
    enum: AgentSettlementType,
    description: 'Metode penyerahan setoran uang tiket oleh agen',
  })
  @IsOptional()
  @IsEnum(AgentSettlementType)
  settlementType?: AgentSettlementType;

  @ApiPropertyOptional({ description: 'ID Rekening Bank jika setor via transfer bank' })
  @IsOptional()
  @IsUUID()
  bankAccountId?: string;

  @ApiPropertyOptional({ description: 'Catatan tambahan penerimaan' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class VerifySpjRevenueDeclarationDto {
  @ApiProperty({
    enum: [
      SpjRevenueDeclarationStatus.VERIFIED,
      SpjRevenueDeclarationStatus.DISCREPANCY,
    ],
  })
  @IsNotEmpty()
  @IsEnum(SpjRevenueDeclarationStatus)
  status!: SpjRevenueDeclarationStatus;

  @ApiPropertyOptional({ description: 'Catatan verifikasi kasir' })
  @IsOptional()
  @IsString()
  notes?: string;
}
