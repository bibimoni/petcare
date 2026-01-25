import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Category } from './category.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  product_id: number;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  image_url: string;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  cost_price: number;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  sell_price: number;

  @Column({ default: 0 })
  stock_quantity: number;

  @Column({ default: 5 })
  min_stock_level: number;

  @Column({ type: 'date', nullable: true })
  expiry_date: Date;

  @Column({ default: true })
  is_active: boolean;

  @ManyToOne(() => Category, (category) => category.products)
  category: Category;
}
