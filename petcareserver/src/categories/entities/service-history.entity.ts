import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Service } from './service.entity';

export enum ServiceHistoryAction {
  CREATED = 'CREATED',
  UPDATED = 'UPDATED',
  DELETED = 'DELETED',
}

@Entity('service_history')
export class ServiceHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'service_id', nullable: true })
  service_id: number;

  @ManyToOne(() => Service, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'service_id' })
  service: Service;

  @Column({ name: 'store_id' })
  store_id: number;

  @Column({ type: 'simple-enum', enum: ServiceHistoryAction })
  action: ServiceHistoryAction;

  @Column({ name: 'performed_by', nullable: true, type: 'integer' })
  performed_by: number | null;

  @Column({ name: 'performed_by_name', type: 'text', nullable: true })
  performed_by_name: string | null;

  @Column({ type: 'json', nullable: true })
  old_values: Record<string, any> | null;

  @Column({ type: 'json', nullable: true })
  new_values: Record<string, any> | null;

  @CreateDateColumn()
  created_at: Date;
}
