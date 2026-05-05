import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Role } from './role.entity';

export enum RoleHistoryAction {
  CREATED = 'CREATED',
  UPDATED = 'UPDATED',
  PERMISSIONS_CHANGED = 'PERMISSIONS_CHANGED',
  DELETED = 'DELETED',
}

@Entity('role_history')
export class RoleHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'role_id', nullable: true })
  role_id: number;

  @ManyToOne(() => Role, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @Column({ name: 'store_id' })
  store_id: number;

  @Column({ type: 'simple-enum', enum: RoleHistoryAction })
  action: RoleHistoryAction;

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
