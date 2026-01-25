import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { Customer } from './customer.entity';
import { PetWeightHistory } from './pet-weight-history.entity';

@Entity('pets')
export class Pet {
  @PrimaryGeneratedColumn()
  pet_id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  pet_code: string;

  @Column({ nullable: true })
  breed: string;

  @Column({ type: 'date', nullable: true })
  dob: Date;

  @Column({ type: 'text', nullable: true })
  avatar_url: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => Customer, (customer) => customer.pets)
  customer: Customer;

  @OneToMany(() => PetWeightHistory, (history) => history.pet)
  weight_history: PetWeightHistory[];
}
