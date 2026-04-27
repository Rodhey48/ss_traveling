import { IsArray, IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsString()
  nip: string;

  @IsOptional()
  @IsString()
  phone: string;

  @IsOptional()
  @IsEnum(['admin', 'employee', 'user'])
  type: 'admin' | 'employee' | 'user';

  @IsOptional()
  @IsArray()
  roleIds: string[];
}
