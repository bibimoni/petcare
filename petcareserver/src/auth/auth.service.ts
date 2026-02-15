import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { User } from '../users/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
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
      relations: {
      	role: {
     		role_permissions: {
		       permission: true
	       }
        }
      },
      select: {
        user_id: true,
        email: true,
        password_hash: true,
        full_name: true,
        role: true,
        status: true,
        phone: true,
        store_id: true,
        role_id: true,
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

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Account is not active');
    }

    const permissions = user.role?.role_permissions?.map(
      (rp) => rp.permission.slug,
    ) || [];

    const payload = {
      sub: user.user_id,
      email: user.email,
      role_id: user.role_id,
      role_name: user.role?.name,
      store_id: user.store_id,
      permissions: permissions,
    };

    const expiresIn = this.configService.get<string>('JWT_EXPIRES_IN') || '1d';

    const { password_hash, ...userWithoutPassword } = user;

    return {
      access_token: this.jwtService.sign(payload),
      expires_in: expiresIn,
      user: {
        ...userWithoutPassword,
        permissions,
      },
    };
  }

  async register(registerDto: RegisterDto) {
    const existingUser = await this.userRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const user = this.userRepository.create({
      email: registerDto.email,
      password_hash: hashedPassword,
      full_name: registerDto.full_name,
      phone: registerDto.phone,
      address: registerDto.address,
      status: UserStatus.ACTIVE,
    });

    const savedUser = await this.userRepository.save(user);

    const { password_hash, ...userWithoutPassword } = savedUser;

    return {
      message: 'User registered successfully',
      user: userWithoutPassword,
    };
  }
}
