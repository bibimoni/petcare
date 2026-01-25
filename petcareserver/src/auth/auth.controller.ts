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
import { CreateStaffDto } from './dto/create-staff.dto';
import { ClaimAccountDto } from './dto/claim-account.dto';
import { JwtAuthGuard, RolesGuard, Roles, UserRole } from '../common';

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

  @Post('staff')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new staff account (Admin only)' })
  @ApiResponse({ status: 201, description: 'Staff account created' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  @ApiBody({ type: CreateStaffDto })
  async createStaff(@Body() createStaffDto: CreateStaffDto) {
    return this.authService.createStaff(createStaffDto);
  }

  @Post('claim')
  @ApiOperation({ summary: 'Claim account and set password' })
  @ApiResponse({ status: 201, description: 'Account claimed successfully' })
  @ApiResponse({ status: 400, description: 'Account already claimed' })
  @ApiResponse({
    status: 401,
    description: 'Invalid email or account already claimed',
  })
  @ApiBody({ type: ClaimAccountDto })
  async claimAccount(@Body() claimAccountDto: ClaimAccountDto) {
    return this.authService.claimAccount(claimAccountDto);
  }
}
