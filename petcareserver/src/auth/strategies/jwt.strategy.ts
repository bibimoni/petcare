import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { UserStatus } from '../../common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'your-secret-key',
    });
  }

  async validate(payload: any) {
    const user = await this.userRepository.findOne({
      where: { user_id: payload.sub },
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
        full_name: true,
        role: true,
        role_id: true,
        store_id: true,
        status: true,
        phone: true,
      },
    });

    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException();
    }

    const permissions = user.role?.role_permissions?.map(
      (rp) => rp.permission.slug,
    ) || [];

    return {
      ...user,
      permissions,
    };
  }
}