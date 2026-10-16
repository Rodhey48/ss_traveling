import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsBoolean,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateCashAccountDto {
  @ApiProperty({ description: 'Kode kas unik', example: 'CASH-POOL-CIPUTAT' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(30)
  code!: string;

  @ApiProperty({ description: 'Nama kas', example: 'Kas Operasional Pool Ciputat' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  name!: string;

  @ApiProperty({ description: 'ID Akun GL (accounts.id)', example: 'uuid-gl-account' })
  @IsNotEmpty()
  @IsUUID()
  accountId!: string;

  @ApiPropertyOptional({ description: 'ID Petugas Kasir Penanggung Jawab', example: 'uuid-user' })
  @IsOptional()
  @IsUUID()
  custodianUserId?: string;

  @ApiPropertyOptional({ description: 'ID Cost Center (Pool/Bengkel)', example: 'uuid-cost-center' })
  @IsOptional()
  @IsUUID()
  costCenterId?: string;

  @ApiPropertyOptional({ description: 'Deskripsi kas' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Company ID' })
  @IsOptional()
  @IsUUID()
  companyId?: string;
}

export class UpdateCashAccountDto extends PartialType(CreateCashAccountDto) {
  @ApiPropertyOptional({ description: 'Status aktif' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CashAccountQueryFilterDto {
  @ApiPropertyOptional({ description: 'Kata kunci pencarian' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter cost center' })
  @IsOptional()
  @IsString()
  costCenterId?: string;

  @ApiPropertyOptional({ description: 'Sertakan yang non-aktif' })
  @IsOptional()
  includeInactive?: boolean | string;
}
