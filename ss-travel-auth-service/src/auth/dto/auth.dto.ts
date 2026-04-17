import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RegisterUserDTO {
    @IsNotEmpty({ message: "Email can't empty" })
    @ApiProperty({ example: 'test@test.com' })
    email: string;

    @IsNotEmpty({ message: "NIP can't empty" })
    @ApiProperty({ example: 'ES931571' })
    nip: string;

    @IsNotEmpty({ message: "password can't empty" })
    @ApiProperty({ example: 'isSecret' })
    password: string;
}

export class LoginUserDTO {
    @IsNotEmpty({ message: "identifier can't empty" })
    @ApiProperty({ example: 'admin@email.com' })
    identifier: string;

    @IsNotEmpty({ message: "password can't empty" })
    @IsString({ message: 'Password must be string' })
    @ApiProperty({ example: 'Asd123' })
    password: string;

    @IsString({ message: 'Type must be string' })
    @IsOptional()
    @ApiProperty({ example: 'employee', required: false })
    type?: string;
}

export class ChangePasswordDto {
    @IsNotEmpty({ message: "password can't empty" })
    @IsString({ message: 'Password must be string' })
    @ApiProperty({ example: 'OldPass123' })
    oldPassword: string;

    @IsNotEmpty({ message: "password can't empty" })
    @IsString({ message: 'Password must be string' })
    @ApiProperty({ example: 'NewPass123' })
    newPassword: string;
}

export class ResetPasswordDto {
    @IsNotEmpty({ message: "password can't empty" })
    @IsString({ message: 'Password must be string' })
    @ApiProperty({ example: 'ResetPass123' })
    newPassword: string;
}
