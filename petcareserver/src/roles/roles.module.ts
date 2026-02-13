import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from './entities/role.entity';
import { RolePermission } from './entities/role-permission.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Role, RolePermission])],
  exports: [TypeOrmModule],
})
export class RolesModule {}