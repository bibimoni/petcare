import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { Store } from './store.entity';
import { Role } from '../../roles/entities/role.entity';
import { User } from '../../users/entities/user.entity';
import { InvitationStatus } from '../../common/enum';

@Entity('invitations')
export class Invitation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  email: string;

  @Column()
  store_id: number;

  @Column()
  role_id: number;

  @Column({
    type: 'enum',
    enum: InvitationStatus,
    default: InvitationStatus.PENDING,
  })
  status: InvitationStatus;

  @Column({ nullable: true, length: 255 })
  token: string;

  @Column({ nullable: true })
  expires_at: Date;

  @Column({ nullable: true })
  invited_by: number;

  @Column({ type: 'text', nullable: true })
  message: string;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => Store)
  @JoinColumn({ name: 'store_id' })
  store: Store;

  @ManyToOne(() => Role)
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'invited_by' })
  inviter: User;
}