import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
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
  @Transform(({ value }) => (value !== undefined && value !== null && value !== '' ? Number(value) : 0))
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

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  aclName?: string;

  @ApiProperty({ default: false })
  @IsOptional()
  @Transform(({ value }) =>
    value === 'true' || value === true
      ? true
      : value === 'false' || value === false
      ? false
      : Boolean(value),
  )
  @IsBoolean()
  title?: boolean;

  @ApiProperty({ default: true })
  @IsOptional()
  @Transform(({ value }) =>
    value === 'true' || value === true
      ? true
      : value === 'false' || value === false
      ? false
      : true,
  )
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ default: true })
  @IsOptional()
  @Transform(({ value }) =>
    value === 'true' || value === true
      ? true
      : value === 'false' || value === false
      ? false
      : true,
  )
  @IsBoolean()
  isWeb?: boolean;

  @ApiProperty({ default: false })
  @IsOptional()
  @Transform(({ value }) =>
    value === 'true' || value === true
      ? true
      : value === 'false' || value === false
      ? false
      : false,
  )
  @IsBoolean()
  isMobile?: boolean;
}

export class UpdateMenuDto extends CreateMenuDto {}
