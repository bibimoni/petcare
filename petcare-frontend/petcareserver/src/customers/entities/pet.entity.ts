import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Customer } from './customer.entity';
import { PetWeightHistory } from './pet-weight-history.entity';
import { Store } from '../../stores/entities/store.entity';

export enum PetGender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
}

export enum PetStatus {
  ALIVE = 'ALIVE',
  DECEASED = 'DECEASED',
}

@Entity('pets')
export class Pet {
  @PrimaryGeneratedColumn()
  pet_id: number;

  @Column({ name: 'store_id' })
  store_id: number;

  @ManyToOne(() => Store, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'store_id' })
  store: Store;

  @Column({ name: 'customer_id' })
  customer_id: number;

  @ManyToOne(() => Customer, (customer) => customer.pets, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column()
  name: string;

  @Column({ unique: true })
  pet_code: string;

  @Column({
    type: 'enum',
    enum: PetGender,
    nullable: true,
  })
  gender: PetGender;

  @Column({ nullable: true })
  breed: string;

  @Column({ type: 'date', nullable: true })
  dob: Date;

  @Column({ type: 'text', nullable: true })
  avatar_url: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({
    type: 'enum',
    enum: PetStatus,
    default: PetStatus.ALIVE,
  })
  status: PetStatus;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => PetWeightHistory, (history) => history.pet, { cascade: true })
  weight_history: PetWeightHistory[];
}
