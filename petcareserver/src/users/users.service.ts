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
      select: {
        user_id: true,
        email: true,
        full_name: true,
        role: true,
        phone: true,
        is_claimed: true,
        created_at: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
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
      select: {
        user_id: true,
        email: true,
        full_name: true,
        role: true,
        phone: true,
        is_claimed: true,
        created_at: true,
      },
    });

    return updatedUser;
  }
}
