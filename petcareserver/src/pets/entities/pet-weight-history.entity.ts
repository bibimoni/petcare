import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Pet } from './pet.entity';

@Entity('pet_weight_history')
export class PetWeightHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'pet_id' })
  pet_id: number;

  @ManyToOne(() => Pet, (pet) => pet.weight_history, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pet_id' })
  pet: Pet;

  @Column('float')
  weight: number;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn()
  recorded_date: Date;
}
