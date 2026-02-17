import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Store } from '../../stores/entities/store.entity';
import { RolePermission } from './role-permission.entity';
import { User } from '../../users/entities/user.entity';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    name: 'is_editable',
    default: true,
    comment: 'False for system default roles like SUPER_ADMIN and ADMIN'
  })
  is_editable: boolean;

  @Column({ name: 'store_id', nullable: true })
  store_id: number;

  @ManyToOne(() => Store, (store) => store.roles, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'store_id' })
  store: Store;

  @Column({
    name: 'is_system_role',
    default: false,
    comment: 'True for system roles that exist globally'
  })
  is_system_role: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => RolePermission, (rolePermission) => rolePermission.role)
  role_permissions: RolePermission[];

  @OneToMany(() => User, (user) => user.role)
  users: User[];
}