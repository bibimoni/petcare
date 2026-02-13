
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Pet } from './pet.entity';
import { Order } from '../../orders/entities/order.entity';
import { Store } from '../../stores/entities/store.entity';

@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn()
  customer_id: number;

  @Column({ name: 'store_id' })
  store_id: number;

  @ManyToOne(() => Store, (store) => store.customers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'store_id' })
  store: Store;

  @Column()
  full_name: string;

  @Column()
  phone: string;

  @Column({ nullable: true })
  email: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ type: 'date', nullable: true })
  last_visit: Date;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  total_spend: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => Pet, (pet) => pet.customer)
  pets: Pet[];

  @OneToMany(() => Order, (order) => order.customer)
  orders: Order[];
}
