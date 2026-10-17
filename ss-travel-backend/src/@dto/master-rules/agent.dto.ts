import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AgentType, AgentSettlementType } from '../../@models/master-rules/agent.entity';
import { CommissionRuleType } from '../../@models/master-rules/agent-commission-rule.entity';

export class CreateAgentDto {
  @ApiProperty({ example: 'AGT-JKT-02', description: 'Kode unik agen' })
  @IsString()
  @IsNotEmpty()
  code!: string;

  @ApiProperty({ example: 'Agen Terminal Kampung Rambutan', description: 'Nama agen mitra' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ enum: AgentType, default: AgentType.OFFLINE })
  @IsEnum(AgentType)
  agentType!: AgentType;

  @ApiProperty({ example: 'JAKARTA', description: 'Kota domisili (JAKARTA, TANGERANG, YOGYAKARTA, ALL)' })
  @IsString()
  @IsNotEmpty()
  city!: string;

  @ApiProperty({ example: '081234567890', description: 'Nomor telepon/WA' })
  @IsString()
  @IsNotEmpty()
  phone!: string;

  @ApiPropertyOptional({ example: 'agen.rambutan@sstravel.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: 'Terminal Kampung Rambutan Loket B12' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ enum: AgentSettlementType, default: AgentSettlementType.CASH_TO_CREW })
  @IsEnum(AgentSettlementType)
  settlementType!: AgentSettlementType;

  @ApiPropertyOptional({ example: 'Pak Joko' })
  @IsString()
  @IsOptional()
  contactPerson?: string;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateAgentDto {
  @ApiPropertyOptional({ example: 'Agen Terminal Kampung Rambutan Baru' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ enum: AgentType })
  @IsEnum(AgentType)
  @IsOptional()
  agentType?: AgentType;

  @ApiPropertyOptional({ example: 'JAKARTA' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ example: '081234567899' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional()
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ enum: AgentSettlementType })
  @IsEnum(AgentSettlementType)
  @IsOptional()
  settlementType?: AgentSettlementType;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  contactPerson?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class AgentQueryFilterDto {
  @ApiPropertyOptional({ enum: AgentType })
  @IsEnum(AgentType)
  @IsOptional()
  agentType?: AgentType;

  @ApiPropertyOptional({ example: 'JAKARTA' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ example: 'true' })
  @IsOptional()
  isActive?: boolean | string;

  @ApiPropertyOptional({ example: 'Pulo Gebang' })
  @IsString()
  @IsOptional()
  search?: string;
}

export class AgentRouteFilterQueryDto {
  @ApiProperty({ example: 'JAKARTA', description: 'Kota Asal Leg' })
  @IsString()
  @IsNotEmpty()
  origin!: string;

  @ApiProperty({ example: 'YOGYAKARTA', description: 'Kota Tujuan Leg' })
  @IsString()
  @IsNotEmpty()
  destination!: string;
}

export class CreateAgentCommissionRuleDto {
  @ApiPropertyOptional({ description: 'ID Master Kelas Kursi (opsional, jika kosong berlaku untuk seluruh kelas)' })
  @IsUUID()
  @IsOptional()
  seatClassId?: string;

  @ApiProperty({ enum: CommissionRuleType, default: CommissionRuleType.FLAT_PER_TICKET })
  @IsEnum(CommissionRuleType)
  ruleType!: CommissionRuleType;

  @ApiProperty({ example: 20000, description: 'Nilai komisi (Nominal Rp atau Persentase %)' })
  @IsNumber()
  @Min(0)
  commissionValue!: number;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  effectiveFrom?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  effectiveUntil?: string;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateAgentCommissionRuleDto {
  @ApiPropertyOptional({ enum: CommissionRuleType })
  @IsEnum(CommissionRuleType)
  @IsOptional()
  ruleType?: CommissionRuleType;

  @ApiPropertyOptional({ example: 25000 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  commissionValue?: number;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  effectiveFrom?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  effectiveUntil?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class CalculateCommissionQueryDto {
  @ApiProperty({ description: 'ID Agen' })
  @IsUUID()
  @IsNotEmpty()
  agentId!: string;

  @ApiPropertyOptional({ description: 'ID Master Kelas Kursi' })
  @IsUUID()
  @IsOptional()
  seatClassId?: string;

  @ApiProperty({ example: 330000, description: 'Harga tiket yang terjual' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  ticketPrice!: number;
}
