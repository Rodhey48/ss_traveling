import { IsString, IsNotEmpty, IsOptional, IsArray, IsBoolean } from 'class-validator';

export class CreateRoleDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsOptional()
  @IsArray()
  permissions: RolePermissionDto[];
}

export class RolePermissionDto {
  @IsNotEmpty()
  @IsString()
  menuId: string;

  @IsBoolean()
  isRead: boolean;

  @IsBoolean()
  isCreate: boolean;

  @IsBoolean()
  isUpdate: boolean;

  @IsBoolean()
  isDelete: boolean;
}

export class UpdateRoleDto extends CreateRoleDto {}
