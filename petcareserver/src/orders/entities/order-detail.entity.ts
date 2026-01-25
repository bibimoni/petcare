import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Order } from './order.entity';
import { Product } from '../../products/entities/product.entity';
import { Pet } from '../../customers/entities/pet.entity';

@Entity('order_details')
export class OrderDetail {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('int')
  quantity: number;

  @Column('decimal', { precision: 12, scale: 2 })
  unit_price: number;

  @Column('decimal', { precision: 12, scale: 2 })
  original_cost: number;

  @Column('decimal', { precision: 12, scale: 2 })
  subtotal: number;

  @ManyToOne(() => Order, (order) => order.order_details)
  order: Order;

  @ManyToOne(() => Product)
  product: Product;

  @ManyToOne(() => Pet, { nullable: true })
  pet: Pet;
}
