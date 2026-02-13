import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { RolePermission } from '../../roles/entities/role-permission.entity';
import { PermissionScope } from '../../common/enum';

@Entity('permissions')
export class Permission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  slug: string;

  @Column({
    type: 'enum',
    enum: PermissionScope,
  })
  scope: PermissionScope;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'module', nullable: true })
  module: string; // e.g. 'store', 'customer', 'order', etc.

  @Column({
    name: 'is_system_defined',
    default: false,
    comment: 'System-defined permissions cannot be deleted'
  })
  is_system_defined: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relationships
  @OneToMany(() => RolePermission, (rolePermission) => rolePermission.permission)
  role_permissions: RolePermission[];
}