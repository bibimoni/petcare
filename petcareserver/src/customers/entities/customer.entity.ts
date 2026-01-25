import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { Pet } from './pet.entity';
import { Order } from '../../orders/entities/order.entity';

@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn()
  customer_id: number;

  @Column({ unique: true })
  phone: string;

  @Column()
  full_name: string;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  total_spend: number;

  @CreateDateColumn()
  created_at: Date;

  @OneToMany(() => Pet, (pet) => pet.customer)
  pets: Pet[];

  @OneToMany(() => Order, (order) => order.customer)
  orders: Order[];
}
