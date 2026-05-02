import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Customer } from './customer.entity';
import { User } from '../../users/entities/user.entity';

export enum CustomerHistoryAction {
  CREATED = 'CREATED',
  UPDATED = 'UPDATED',
  DELETED = 'DELETED',
}

@Entity('customer_history')
export class CustomerHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'customer_id' })
  customer_id: number;

  @ManyToOne(() => Customer, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column({ name: 'store_id' })
  store_id: number;

  @Column({ type: 'simple-enum', enum: CustomerHistoryAction })
  action: CustomerHistoryAction;

  @Column({ name: 'performed_by', nullable: true })
  performed_by: number | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'performed_by' })
  performer: User;

  @Column({ type: 'json', nullable: true })
  old_values: Record<string, any> | null;

  @Column({ type: 'json', nullable: true })
  new_values: Record<string, any> | null;

  @CreateDateColumn()
  created_at: Date;
}
