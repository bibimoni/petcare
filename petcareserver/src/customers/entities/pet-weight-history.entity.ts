import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Pet } from './pet.entity';

@Entity('pet_weight_history')
export class PetWeightHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('float')
  weight: number;

  @CreateDateColumn()
  recorded_date: Date;

  @ManyToOne(() => Pet, (pet) => pet.weight_history)
  pet: Pet;
}
