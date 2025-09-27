import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique
} from 'typeorm';
import { Offensive } from './offensive.entity';

@Entity('offensive_progress')
@Unique(['offensive', 'progress_date'])
export class OffensiveProgress {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Offensive, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'offensive_id' })
  offensive: Offensive;

  @Column({ type: 'date' })
  progress_date: Date;

  @Column({ type: 'int', default: 0 })
  completed_hobbies: number; // quantos hábitos foram completados neste dia

  @Column({ type: 'int', default: 0 })
  total_hobbies: number; // total de hábitos da ofensiva

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  daily_completion_rate: number; // porcentagem de conclusão do dia

  @Column({ type: 'boolean', default: false })
  day_completed: boolean; // se o dia foi considerado completo (todos os hábitos feitos)

  @CreateDateColumn()
  created_at: Date;
}
