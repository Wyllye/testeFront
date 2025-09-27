import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';
import { Hobby } from '../hobbies/hobby.entity';

export enum OffensiveStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  FAILED = 'failed',
  PAUSED = 'paused'
}

@Entity('offensives')
export class Offensive {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'int' })
  duration: number; // duração em dias

  @Column({ type: 'date' })
  start_date: Date;

  @Column({ type: 'date' })
  end_date: Date;

  @Column({
    type: 'enum',
    enum: OffensiveStatus,
    default: OffensiveStatus.ACTIVE
  })
  status: OffensiveStatus;

  @Column({ type: 'int', default: 0 })
  completed_days: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  progress: number; // porcentagem de progresso

  @ManyToMany(() => Hobby, { eager: true })
  @JoinTable({
    name: 'offensive_hobbies',
    joinColumn: { name: 'offensive_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'hobby_id', referencedColumnName: 'id' }
  })
  hobbies: Hobby[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
