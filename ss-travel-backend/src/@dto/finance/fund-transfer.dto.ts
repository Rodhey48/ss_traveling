import {
  IsEnum,
  IsNumberString,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FundTransferType, FundTransferStatus } from '../../@models/finance/finance.enums';

export class CreateFundTransferDto {
  @ApiProperty({ enum: FundTransferType })
  @IsEnum(FundTransferType)
  transferType: FundTransferType;

  @ApiPropertyOptional({ example: 'uuid-source-bank' })
  @IsOptional()
  @IsUUID()
  sourceBankAccountId?: string;

  @ApiPropertyOptional({ example: 'uuid-source-cash' })
  @IsOptional()
  @IsUUID()
  sourceCashAccountId?: string;

  @ApiPropertyOptional({ example: 'uuid-target-bank' })
  @IsOptional()
  @IsUUID()
  targetBankAccountId?: string;

  @ApiPropertyOptional({ example: 'uuid-target-cash' })
  @IsOptional()
  @IsUUID()
  targetCashAccountId?: string;

  @ApiProperty({ example: '1000000.00' })
  @IsNumberString()
  amount: string;

  @ApiProperty({ example: 'Dropping UJ AKAP', maxLength: 255 })
  @IsString()
  purpose: string;

  @ApiPropertyOptional({ example: 'Ref Transfer #12345', maxLength: 255 })
  @IsOptional()
  @IsString()
  referenceDoc?: string;
}

export class RejectFundTransferDto {
  @ApiProperty({ example: 'Salah nominal dropping' })
  @IsString()
  rejectionReason: string;
}

export class FundTransferQueryFilterDto {
  @ApiPropertyOptional({ enum: FundTransferStatus })
  @IsOptional()
  @IsEnum(FundTransferStatus)
  status?: FundTransferStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;
}
