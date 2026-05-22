import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateMenuDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  url?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  sequence?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  moduleId?: string;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  availableActions?: string[];

  @ApiProperty({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ default: true })
  @IsOptional()
  @IsBoolean()
  isWeb?: boolean;

  @ApiProperty({ default: false })
  @IsOptional()
  @IsBoolean()
  isMobile?: boolean;
}

export class UpdateMenuDto extends CreateMenuDto {}
