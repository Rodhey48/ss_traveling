import {
  Body,
  Controller,
  Get,
  Post,
  Res,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiOperation, ApiTags, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from '../services/auth.service';
import { LoginUserDTO, RegisterUserDTO } from '../dto/auth.dto';
import { Response } from 'express';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RequestInterface } from '@interfaces';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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

  @Get('me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user profile and menus' })
  @ApiResponse({ status: 200, description: 'Profile fetched successfully.' })
  async getMe(@Req() req: RequestInterface) {
    return this.authService.getMe(req.user.id);
  }
}
