import { Controller, Post, Get, Patch, Body, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

import { JwtAuthGuard, RolesGuard, Roles, UserRole } from '../common';
import { ForgotPasswordDto } from './dto/forgot-password.dto';

@ApiTags('Authentication')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Login to get JWT token' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiBody({ type: LoginDto })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('register')
  @ApiOperation({ summary: 'Register a new user account' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  @ApiBody({ type: RegisterDto })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Restart password for a user account' })
	@ApiResponse({ status: 200, description: 'Password reset email sent' })
	@ApiResponse({ status: 404, description: 'User not found' })
	@ApiBody({ type: ForgotPasswordDto })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
  	this.authService.forgotPassword(forgotPasswordDto);
  }
}
