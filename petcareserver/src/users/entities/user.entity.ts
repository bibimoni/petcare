import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { Order } from '../../orders/entities/order.entity';
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

  @Column({ type: 'enum', enum: UserRole, default: UserRole.STAFF })
  role: UserRole;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.LOCKED })
  status: UserStatus;

  @CreateDateColumn()
  created_at: Date;

  @Column({ default: false })
  is_claimed: boolean;

  @OneToMany(() => Order, (order) => order.user)
  orders: Order[];
}
