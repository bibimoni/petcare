import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { InStoreFilter, UserStatus } from '../common/enum';
import { UpdateProfileDto } from '../auth/dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findAll(
    storeId: number | null,
    isAdmin: boolean,
    filters?: {
      search?: string;
      store_id?: number;
      status?: UserStatus;
      role_id?: number;
      in_store?: InStoreFilter;
    },
  ): Promise<Partial<User>[]> {
    const query = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .leftJoinAndSelect('user.store', 'store')
      .select([
        'user.user_id',
        'user.full_name',
        'user.email',
        'user.phone',
        'user.address',
        'user.store_id',
        'user.role_id',
        'user.status',
        'user.avatar_url',
        'user.last_login_at',
        'user.created_at',
        'user.updated_at',
        'role.id',
        'role.name',
        'store.id',
        'store.name',
      ])
      .orderBy('user.created_at', 'DESC');

    if (isAdmin) {
      if (filters?.store_id) {
        query.where('user.store_id = :filterStoreId', {
          filterStoreId: filters.store_id,
        });
      }
    } else if (storeId) {
      query.where('(user.store_id = :storeId OR user.store_id IS NULL)', {
        storeId,
      });
    }

    if (filters?.in_store) {
      if (filters.in_store === InStoreFilter.IN_STORE) {
        query.andWhere('user.store_id IS NOT NULL');
      } else if (filters.in_store === InStoreFilter.NOT_IN_STORE) {
        query.andWhere('user.store_id IS NULL');
      }
    }

    if (filters?.search) {
      query.andWhere(
        '(user.full_name ILIKE :search OR user.email ILIKE :search OR user.phone ILIKE :search)',
        {
          search: `%${filters.search}%`,
        },
      );
    }

    if (filters?.status) {
      query.andWhere('user.status = :status', { status: filters.status });
    }

    if (filters?.role_id) {
      query.andWhere('user.role_id = :roleId', { roleId: filters.role_id });
    }

    return query.getMany();
  }

  async getProfile(userId: number) {
    const user = await this.userRepository.findOne({
      where: { user_id: userId },
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
      throw new UnauthorizedException('Không tìm thấy người dùng');
    }

    const permissions =
      user.role?.role_permissions?.map((rp) => rp.permission.slug) || [];

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
      throw new UnauthorizedException('Không tìm thấy người dùng');
    }

    await this.userRepository.update(userId, updateProfileDto);

    const updatedUser = await this.userRepository.findOne({
      where: { user_id: userId },
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
      throw new UnauthorizedException('Cập nhật thông tin thất bại');
    }

    const permissions =
      updatedUser.role?.role_permissions?.map((rp) => rp.permission.slug) || [];

    return {
      ...updatedUser,
      permissions,
    };
  }
}
