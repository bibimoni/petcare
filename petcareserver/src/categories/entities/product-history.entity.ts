import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Product } from './product.entity';

export enum ProductHistoryAction {
  CREATED = 'CREATED',
  UPDATED = 'UPDATED',
  DELETED = 'DELETED',
}

@Entity('product_history')
export class ProductHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'product_id', nullable: true })
  product_id: number;

  @ManyToOne(() => Product, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ name: 'store_id' })
  store_id: number;

  @Column({ type: 'simple-enum', enum: ProductHistoryAction })
  action: ProductHistoryAction;

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
