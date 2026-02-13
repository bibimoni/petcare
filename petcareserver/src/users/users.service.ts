import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UpdateProfileDto } from '../auth/dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async getProfile(userId: number) {
    const user = await this.userRepository.findOne({
      where: { user_id: userId },
      relations: ['role', 'role.role_permissions', 'role.role_permissions.permission', 'store'],
      select: {
        user_id: true,
        email: true,
        full_name: true,
        role: true,
        role_id: true,
        store_id: true,
        store: {
          id: true,
          name: true,
          status: true,
        },
        status: true,
        phone: true,
        address: true,
        avatar_url: true,
        last_login_at: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Extract permissions from user's role
    const permissions = user.role?.role_permissions?.map(
      (rp) => rp.permission.slug,
    ) || [];

    return {
      ...user,
      permissions,
    };
  }

  async updateProfile(userId: number, updateProfileDto: UpdateProfileDto) {
    const user = await this.userRepository.findOne({
      where: { user_id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    await this.userRepository.update(userId, updateProfileDto);

    const updatedUser = await this.userRepository.findOne({
      where: { user_id: userId },
      relations: ['role', 'role.role_permissions', 'role.role_permissions.permission', 'store'],
      select: {
        user_id: true,
        email: true,
        full_name: true,
        role: true,
        role_id: true,
        store_id: true,
        store: {
          id: true,
          name: true,
          status: true,
        },
        status: true,
        phone: true,
        address: true,
        avatar_url: true,
        last_login_at: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!updatedUser) {
      throw new UnauthorizedException('Failed to update user');
    }

    // Extract permissions from user's role
    const permissions = updatedUser.role?.role_permissions?.map(
      (rp) => rp.permission.slug,
    ) || [];

    return {
      ...updatedUser,
      permissions,
    };
  }
}