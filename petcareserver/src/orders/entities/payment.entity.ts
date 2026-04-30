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

  // FIX 5 & 6: Đổi kiểu từ `string` sang `string | null` cho các cột nullable.
  // Lỗi TS2322: orders.service.ts gán `charge_id: string | null` và
  // `receiptUrl: string | null` vào 2 field này nhưng TypeScript thấy type là `string`.
  // DB đã khai báo nullable: true → TypeScript type phải phản ánh đúng thực tế.
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
