import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from '../users/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UserStatus } from '../common/enum';
import { ForgotPasswordDto  } from './dto/forgot-password.dto';
import { comparePassword, generateRandomToken, hashPassword, RESET_PASSWORD_TOKEN_EXPIRATION_MINUTES } from 'src/common';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private mailService: MailService,
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.userRepository.findOne({
      where: { email: loginDto.email },
      relations: {
        role: {
          role_permissions: {
            permission: true,
          },
        },
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

    const isPasswordValid = await comparePassword(loginDto.password, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Account is not active');
    }

    const permissions =
      user.role?.role_permissions?.map((rp) => rp.permission.slug) || [];

    const payload = {
      sub: user.user_id,
      email: user.email,
      role_id: user.role_id,
      role_name: user.role?.name,
      store_id: user.store_id,
      permissions: permissions,
    };

    const expiresIn = this.configService.get<string>('JWT_EXPIRES_IN') || '1d';

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

    const hashedPassword = await hashPassword(registerDto.password);

    const user = this.userRepository.create({
      email: registerDto.email,
      password_hash: hashedPassword,
      full_name: registerDto.full_name,
      phone: registerDto.phone,
      address: registerDto.address,
      status: UserStatus.ACTIVE,
    });

    const savedUser = await this.userRepository.save(user);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password_hash, ...userWithoutPassword } = savedUser;

    return {
      message: 'User registered successfully',
      user: userWithoutPassword,
    };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
 		const user = await this.userRepository.findOne({
      where: { email: forgotPasswordDto.email },
		});
	  if (!user) {
	  	throw new UnauthorizedException('User not found');
	  }

		if (user.reset_password_expires_at && user.reset_password_expires_at >= new Date() && user.reset_password_token) {
			throw new ConflictException('A password reset request is already pending for this email');
		}

		const token = generateRandomToken()
		user.reset_password_token = token;
		user.reset_password_expires_at = new Date(Date.now() + RESET_PASSWORD_TOKEN_EXPIRATION_MINUTES * 60 * 1000);

		await this.userRepository.save(user);
		await this.mailService.sendResetPasswordEmail(user.email, token);

		return {
			message: 'If an account with that email exists, a password reset link has been sent.',
		};
  }

  async resetPassword(token: string, newPassword: string) {
		const user = await this.userRepository.findOne({
			where: { reset_password_token: token },
		});

		if (!user) {
	    throw new UnauthorizedException('Invalid token: token not found');
	  }

	  if (!user.reset_password_expires_at) {
	    throw new UnauthorizedException('Invalid token: no expiration set');
	  }

	  if (user.reset_password_expires_at < new Date()) {
	    const minutesElapsed = Math.floor(
	      (new Date().getTime() - new Date(user.reset_password_expires_at).getTime()) / 60000
	    );
	    throw new UnauthorizedException(
	      `Token expired ${Math.abs(minutesElapsed)} minutes ago. Please request a new one.`
	    );
	  }
		user.password_hash = await hashPassword(newPassword);
		user.reset_password_token = null;
		user.reset_password_expires_at = null;

		await this.userRepository.save(user);

		return { message: 'Password reset successfully' };
  }
}
