import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Role } from '../../roles/entities/role.entity';
import { Customer } from '../../customers/entities/customer.entity';
import { Product } from '../../products/entities/product.entity';
import { Category } from '../../products/entities/category.entity';
import { Service } from '../../products/entities/service.entity';
import { Order } from '../../orders/entities/order.entity';
import { StoreStatus } from '../../common/enum';

@Entity('stores')
export class Store {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: StoreStatus,
    default: StoreStatus.ACTIVE,
  })
  status: StoreStatus;

  @Column({ nullable: true })
  phone: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ type: 'text', nullable: true })
  city: string;

  @Column({ type: 'text', nullable: true })
  state: string;

  @Column({ type: 'text', nullable: true })
  country: string;

  @Column({ type: 'text', nullable: true })
  postal_code: string;

  @Column({ type: 'text', nullable: true })
  logo_url: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => User, (user) => user.store)
  users: User[];

  @OneToMany(() => Role, (role) => role.store)
  roles: Role[];

  @OneToMany(() => Customer, (customer) => customer.store)
  customers: Customer[];

  @OneToMany(() => Product, (product) => product.store)
  products: Product[];

  @OneToMany(() => Category, (category) => category.store)
  categories: Category[];

  @OneToMany(() => Service, (service) => service.store)
  services: Service[];

  @OneToMany(() => Order, (order) => order.store)
  orders: Order[];
}