import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Order } from './order.entity';
import { Product } from '../../categories/entities/product.entity';
import { Service } from '../../categories/entities/service.entity';
import { Pet } from '../../pets/entities/pet.entity';
import { CategoryType } from '../../common/enum';

@Entity('order_details')
export class OrderDetail {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'order_id' })
  order_id: number;

  @ManyToOne(() => Order, (order) => order.order_details, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ name: 'item_type', type: 'simple-enum', enum: CategoryType })
  item_type: CategoryType;

  @Column({ name: 'product_id', nullable: true })
  product_id: number;

  @ManyToOne(() => Product, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ name: 'service_id', nullable: true })
  service_id: number;

  @ManyToOne(() => Service, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'service_id' })
  service: Service;

  @Column({ name: 'pet_id', nullable: true })
  pet_id: number;

  @ManyToOne(() => Pet, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'pet_id' })
  pet: Pet;

  @Column('int')
  quantity: number;

  @Column('decimal', { precision: 12, scale: 2 })
  unit_price: number;

  @Column('decimal', { precision: 12, scale: 2 })
  original_cost: number;

  @Column('decimal', { precision: 12, scale: 2 })
  subtotal: number;

  @Column({ type: 'text', nullable: true })
  notes: string;
}
