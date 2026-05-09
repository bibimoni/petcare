import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Store } from '../../stores/entities/store.entity';
import { Product } from '../../categories/entities/product.entity';
import { User } from '../../users/entities/user.entity';

export enum NotificationType {
  LOW_STOCK = 'Sắp hết hàng',
  EXPIRY_WARNING = 'Sắp hết hạn',
  EXPIRED = 'Hết hạn',
  OUT_OF_STOCK = 'Hết hàng',
  STORE_INVITATION = 'Lời mời cửa hàng',
}

export enum NotificationStatus {
  UNREAD = 'UNREAD',
  READ = 'READ',
  ARCHIVED = 'ARCHIVED',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn()
  notification_id: number;

  @Column({ name: 'store_id' })
  store_id: number;

  @ManyToOne(() => Store, (store) => store.notifications, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'store_id' })
  store: Store;

  @Column({ name: 'product_id', nullable: true })
  product_id: number | null;

  @ManyToOne(() => Product, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'product_id' })
  product: Product | null;

  @Column({ name: 'user_id', nullable: true })
  user_id: number | null;

  @ManyToOne(() => User, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'user_id' })
  user: User | null;

  @Column({
    type: 'simple-enum',
    enum: NotificationType,
    default: NotificationType.LOW_STOCK,
  })
  type: NotificationType;

  @Column({
    type: 'simple-enum',
    enum: NotificationStatus,
    default: NotificationStatus.UNREAD,
  })
  status: NotificationStatus;

  @Column()
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'varchar', nullable: true })
  product_name: string | null;

  @Column({ type: 'varchar', nullable: true })
  action_url: string | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
