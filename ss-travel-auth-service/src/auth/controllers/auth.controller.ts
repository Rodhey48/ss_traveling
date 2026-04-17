import { Body, Controller, Post, Res, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiResponse } from '@nestjs/swagger';
import { AuthService } from '../services/auth.service';
import { LoginUserDTO, RegisterUserDTO } from '../dto/auth.dto';
import { Response } from 'express';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('register')
    @ApiOperation({ summary: 'Register a new user' })
    @ApiResponse({ status: 201, description: 'User successfully registered.' })
    async register(@Body() payload: RegisterUserDTO) {
        return this.authService.register(payload);
    }

    @Post('login')
    @UsePipes(new ValidationPipe())
    @ApiOperation({ summary: 'Login user' })
    @ApiResponse({ status: 200, description: 'Login successful.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    async login(@Body() body: LoginUserDTO, @Res() res: Response) {
        return this.authService.login(body, res);
    }
}
