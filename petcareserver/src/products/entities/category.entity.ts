import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Product } from './product.entity';
import { Service } from './service.entity';
import { CategoryType } from '../../common/enum';
import { Store } from '../../stores/entities/store.entity';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn()
  category_id: number;

  @Column({ name: 'store_id' })
  store_id: number;

  @ManyToOne(() => Store, (store) => store.categories, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'store_id' })
  store: Store;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: CategoryType })
  type: CategoryType;

  @Column({ type: 'text', nullable: true })
  description: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => Product, (product) => product.category)
  products: Product[];

  @OneToMany(() => Service, (service) => service.category)
  services: Service[];
}
