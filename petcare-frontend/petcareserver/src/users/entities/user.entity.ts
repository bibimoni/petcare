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
import { Order } from '../../orders/entities/order.entity';
import { Role } from '../../roles/entities/role.entity';
import { Store } from '../../stores/entities/store.entity';
import { UserRole, UserStatus } from '../../common/enum';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  user_id: number;

  @Column()
  full_name: string;

  @Column({ unique: true })
  email: string;
  @Column({ select: false, nullable: true })
  password_hash: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ name: 'store_id', nullable: true })
  store_id: number;

  @ManyToOne(() => Store, (store) => store.users, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'store_id' })
  store: Store;

  @Column({ name: 'role_id', nullable: true })
  role_id: number;

  @ManyToOne(() => Role, (role) => role.users, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @Column({ name: 'legacy_role', type: 'enum', enum: UserRole, default: UserRole.STAFF, nullable: true })
  legacy_role: UserRole;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.LOCKED })
  status: UserStatus;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  last_login_at: Date;

  @Column({ type: 'text', nullable: true })
  avatar_url: string;

  @OneToMany(() => Order, (order) => order.user)
  orders: Order[];

  @OneToMany(() => Order, (order) => order.cancelled_by_user)
  cancelled_orders: Order[];
}