
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Order } from './order.entity';
import { Product } from '../../products/entities/product.entity';
import { Service } from '../../products/entities/service.entity';
import { Pet } from '../../customers/entities/pet.entity';

export enum ItemType {
  PRODUCT = 'PRODUCT',
  SERVICE = 'SERVICE',
}

@Entity('order_details')
export class OrderDetail {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'order_id' })
  order_id: number;

  @ManyToOne(() => Order, (order) => order.order_details, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  // Polymorphic relationship: can be either a product or a service
  @Column({ name: 'item_type', type: 'enum', enum: ItemType })
  item_type: ItemType;

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
