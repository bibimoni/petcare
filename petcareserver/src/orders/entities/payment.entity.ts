import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Order } from './order.entity';
import { PaymentMethod, PaymentStatus } from 'src/common/enum';

@Index('UQ_payments_order_pending', ['order_id'], {
  unique: true,
  where: `"status" = 'PENDING'`,
})
@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn()
  payment_id: number;

  @Column({ name: 'order_id' })
  order_id: number;

  @ManyToOne(() => Order, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ type: 'simple-enum', enum: PaymentMethod })
  payment_method: PaymentMethod;

  @Column('decimal', {
    precision: 15,
    scale: 3,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  amount: number;

  @Column({
    type: 'simple-enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  @Index()
  @Column({ type: 'varchar', nullable: true })
  stripe_payment_intent_id: string;

  @Column({ type: 'varchar', nullable: true })
  stripe_client_secret: string;

  @Column({ type: 'varchar', nullable: true })
  stripe_charge_id: string | null;

  @Column({ type: 'text', nullable: true })
  stripe_receipt_url: string | null;

  @Column({ type: 'text', nullable: true })
  error_message: string;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
