import {
  IsUUID,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DiscrepancyResolutionDecision } from '../../@models/cashier/cashier.enums';

export class ResolveDiscrepancyDto {
  @ApiProperty({
    enum: DiscrepancyResolutionDecision,
    description: 'Keputusan resmi Finance Manager atas selisih kas',
    example: DiscrepancyResolutionDecision.COMPANY_WAIVER,
  })
  @IsNotEmpty()
  @IsEnum(DiscrepancyResolutionDecision)
  decision!: DiscrepancyResolutionDecision;

  @ApiPropertyOptional({
    description: 'ID Akun Buku Besar untuk pengalihan selisih (misal 58101 Beban Selisih atau 12901 Piutang Kru)',
  })
  @IsOptional()
  @IsUUID()
  resolutionAccountId?: string;

  @ApiProperty({
    description: 'Catatan dasar pertimbangan dan persetujuan resolusi Finance Manager',
    example: 'GPS valid berhenti di SPBU Palimanan, konsumsi liter normal. Selisih disetujui dibebankan ke perusahaan sebagai dispensasi operasional.',
  })
  @IsNotEmpty()
  @IsString()
  resolutionNotes!: string;
}
