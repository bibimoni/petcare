import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { User } from '../users/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { CreateStaffDto } from './dto/create-staff.dto';
import { ClaimAccountDto } from './dto/claim-account.dto';
import { UserStatus } from '../common/enum';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.userRepository.findOne({
      where: { email: loginDto.email },
      select: {
        user_id: true,
        email: true,
        password_hash: true,
        full_name: true,
        role: true,
        phone: true,
        is_claimed: true,
      },
    });

    if (!user || !user.password_hash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password_hash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.is_claimed) {
      throw new UnauthorizedException('Please claim your account first');
    }

    const payload = { sub: user.user_id, email: user.email, role: user.role };
    const expiresIn = this.configService.get<string>('JWT_EXPIRES_IN') || '1d';

    const { password_hash, ...userWithoutPassword } = user;

    return {
      access_token: this.jwtService.sign(payload),
      expires_in: expiresIn,
      user: userWithoutPassword,
    };
  }

  async createStaff(createStaffDto: CreateStaffDto) {
    const existingUser = await this.userRepository.findOne({
      where: { email: createStaffDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const user = this.userRepository.create({
      email: createStaffDto.email,
      role: createStaffDto.role,
      status: UserStatus.LOCKED,
      is_claimed: false,
      full_name: '',
    });

    await this.userRepository.save(user);

    const { password_hash, ...savedUser } = user;
    return savedUser;
  }

  async claimAccount(claimAccountDto: ClaimAccountDto) {
    const user = await this.userRepository.findOne({
      where: { email: claimAccountDto.email },
    });

    if (!user) {
      throw new UnauthorizedException('User not found with this email');
    }

    if (user.is_claimed) {
      throw new BadRequestException('Account already claimed');
    }

    const hashedPassword = await bcrypt.hash(claimAccountDto.password, 10);

    await this.userRepository.update(user.user_id, {
      password_hash: hashedPassword,
      full_name: claimAccountDto.full_name || user.full_name,
      phone: claimAccountDto.phone || user.phone,
      is_claimed: true,
      status: UserStatus.ACTIVE,
    });

    const updatedUser = await this.userRepository.findOne({
      where: { user_id: user.user_id },
      select: {
        user_id: true,
        email: true,
        full_name: true,
        role: true,
        phone: true,
        is_claimed: true,
      },
    });

    if (!updatedUser) {
      throw new UnauthorizedException('Failed to update user');
    }

    const payload = {
      sub: updatedUser.user_id,
      email: updatedUser.email,
      role: updatedUser.role,
    };
    const expiresIn = this.configService.get<string>('JWT_EXPIRES_IN') || '1d';

    return {
      message: 'Account claimed successfully',
      access_token: this.jwtService.sign(payload),
      expires_in: expiresIn,
      user: updatedUser,
    };
  }
}
