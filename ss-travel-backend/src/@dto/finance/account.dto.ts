import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsBoolean,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { AccountType, NormalBalance } from '../../@models/finance/account.entity';

export class CreateAccountDto {
  @ApiProperty({ description: 'Kode akun unik', example: '11101' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(30)
  code!: string;

  @ApiProperty({ description: 'Nama akun', example: 'Kas Operasional Pool Ciputat' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(150)
  name!: string;

  @ApiProperty({ enum: AccountType, example: AccountType.ASSET })
  @IsNotEmpty()
  @IsEnum(AccountType)
  type!: AccountType;

  @ApiProperty({ enum: NormalBalance, example: NormalBalance.DEBIT })
  @IsNotEmpty()
  @IsEnum(NormalBalance)
  normalBalance!: NormalBalance;

  @ApiPropertyOptional({ description: 'ID akun induk (parent)', example: 'uuid-parent' })
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiPropertyOptional({ description: 'Apakah akun dapat menerima jurnal', default: true })
  @IsOptional()
  @IsBoolean()
  isPostable?: boolean;

  @ApiPropertyOptional({ description: 'Deskripsi akun' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Status aktif akun', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Company ID' })
  @IsOptional()
  @IsUUID()
  companyId?: string;
}

export class UpdateAccountDto extends PartialType(CreateAccountDto) {}

export class AccountQueryFilterDto {
  @ApiPropertyOptional({ enum: AccountType })
  @IsOptional()
  @IsEnum(AccountType)
  type?: AccountType;

  @ApiPropertyOptional({ description: 'Filter akun postable atau header' })
  @IsOptional()
  isPostable?: boolean | string;

  @ApiPropertyOptional({ description: 'Kata kunci pencarian (kode atau nama)' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter parent ID' })
  @IsOptional()
  @IsString()
  parentId?: string;

  @ApiPropertyOptional({ description: 'Sertakan akun non-aktif' })
  @IsOptional()
  includeInactive?: boolean | string;

  @ApiPropertyOptional({ description: 'Kembalikan format pohon hierarki', default: false })
  @IsOptional()
  tree?: boolean | string;
}
