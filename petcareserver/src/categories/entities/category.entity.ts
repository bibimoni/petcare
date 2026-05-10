import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Unique,
} from 'typeorm';
import { Product } from './product.entity';
import { Service } from './service.entity';
import { CategoryType } from '../../common/enum';
import { Store } from '../../stores/entities/store.entity';

@Entity('categories')
@Unique('UQ_CATEGORY_STORE_NAME_TYPE', ['store_id', 'name', 'type'])
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

  @Column({ type: 'simple-enum', enum: CategoryType })
  type: CategoryType;

  @OneToMany(() => Product, (product) => product.category)
  products: Product[];

  @OneToMany(() => Service, (service) => service.category)
  services: Service[];
}
