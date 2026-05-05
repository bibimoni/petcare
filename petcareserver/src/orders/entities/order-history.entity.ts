import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Order } from './order.entity';

export enum OrderHistoryAction {
  CREATED = 'CREATED',
  CANCELLED = 'CANCELLED',
  PAID = 'PAID',
  REFUNDED = 'REFUNDED',
}

@Entity('order_history')
export class OrderHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'order_id', nullable: true })
  order_id: number;

  @ManyToOne(() => Order, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ name: 'store_id' })
  store_id: number;

  @Column({ type: 'simple-enum', enum: OrderHistoryAction })
  action: OrderHistoryAction;

  @Column({ name: 'performed_by', nullable: true, type: 'integer' })
  performed_by: number | null;

  @Column({ name: 'performed_by_name', type: 'text', nullable: true })
  performed_by_name: string | null;

  @Column({ type: 'json', nullable: true })
  old_values: Record<string, any> | null;

  @Column({ type: 'json', nullable: true })
  new_values: Record<string, any> | null;

  @CreateDateColumn()
  created_at: Date;
}
