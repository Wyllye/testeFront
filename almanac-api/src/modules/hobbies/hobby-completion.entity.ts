import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique
} from 'typeorm';
import { Hobby } from './hobby.entity';

@Entity('hobby_completions')
@Unique(['hobby', 'completion_date'])
export class HobbyCompletion {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Hobby, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'hobby_id' })
  hobby: Hobby;

  @Column({ type: 'date' })
  completion_date: Date;

  @Column({ type: 'boolean', default: true })
  completed: boolean;

  @CreateDateColumn()
  created_at: Date;
}
