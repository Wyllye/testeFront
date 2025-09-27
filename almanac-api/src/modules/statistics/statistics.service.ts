import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Hobby } from '../hobbies/hobby.entity';
import { HobbyCompletion } from '../hobbies/hobby-completion.entity';
import { Offensive, OffensiveStatus } from '../offensives/offensive.entity';
import { OffensiveProgress } from '../offensives/offensive-progress.entity';
import { HobbiesService } from '../hobbies/hobbies.service';

export interface StatisticsResponse {
  totalHabits: number;
  currentStreak: number;
  completedToday: number;
  achievements: number;
  weeklyProgress: number[];
  categoryStats: { [key: string]: number };
  offensiveStats: {
    active: number;
    completed: number;
    failed: number;
    totalCreated: number;
  };
  monthlyCompletion: {
    month: string;
    completions: number;
  }[];
}

@Injectable()
export class StatisticsService {
  constructor(
    @InjectRepository(Hobby)
    private readonly hobbyRepo: Repository<Hobby>,
    @InjectRepository(HobbyCompletion)
    private readonly completionRepo: Repository<HobbyCompletion>,
    @InjectRepository(Offensive)
    private readonly offensiveRepo: Repository<Offensive>,
    @InjectRepository(OffensiveProgress)
    private readonly progressRepo: Repository<OffensiveProgress>,
    private readonly hobbiesService: HobbiesService,
  ) {}

  async getGeneralStatistics(): Promise<StatisticsResponse> {
    const [
      totalHabits,
      currentStreak,
      completedToday,
      achievements,
      weeklyProgress,
      categoryStats,
      offensiveStats,
      monthlyCompletion
    ] = await Promise.all([
      this.getTotalHabits(),
      this.getCurrentStreak(),
      this.getCompletedToday(),
      this.getAchievements(),
      this.getWeeklyProgress(),
      this.getCategoryStats(),
      this.getOffensiveStats(),
      this.getMonthlyCompletion()
    ]);

    return {
      totalHabits,
      currentStreak,
      completedToday,
      achievements,
      weeklyProgress,
      categoryStats,
      offensiveStats,
      monthlyCompletion
    };
  }

  private async getTotalHabits(): Promise<number> {
    return this.hobbyRepo.count();
  }

  private async getCurrentStreak(): Promise<number> {
    return this.hobbiesService.getMaxStreak();
  }

  private async getCompletedToday(): Promise<number> {
    return this.hobbiesService.getTotalCompletedToday();
  }

  private async getAchievements(): Promise<number> {
    // Calcular conquistas baseadas em diferentes critérios
    let achievements = 0;

    // Conquista: Primeiro hábito criado
    const totalHabits = await this.getTotalHabits();
    if (totalHabits > 0) achievements++;

    // Conquista: Primeira semana de streak
    const maxStreak = await this.getCurrentStreak();
    if (maxStreak >= 7) achievements++;

    // Conquista: Streak de 30 dias
    if (maxStreak >= 30) achievements++;

    // Conquista: 10 hábitos criados
    if (totalHabits >= 10) achievements++;

    // Conquista: Primeira ofensiva completada
    const completedOffensives = await this.offensiveRepo.count({
      where: { status: OffensiveStatus.COMPLETED }
    });
    if (completedOffensives > 0) achievements++;

    // Conquista: 100 completions totais
    const totalCompletions = await this.completionRepo.count({
      where: { completed: true }
    });
    if (totalCompletions >= 100) achievements++;

    return achievements;
  }

  private async getWeeklyProgress(): Promise<number[]> {
    return this.hobbiesService.getWeeklyProgress();
  }

  private async getCategoryStats(): Promise<{ [key: string]: number }> {
    return this.hobbiesService.getCategoryStats();
  }

  private async getOffensiveStats(): Promise<{
    active: number;
    completed: number;
    failed: number;
    totalCreated: number;
  }> {
    const [active, completed, failed, totalCreated] = await Promise.all([
      this.offensiveRepo.count({ where: { status: OffensiveStatus.ACTIVE } }),
      this.offensiveRepo.count({ where: { status: OffensiveStatus.COMPLETED } }),
      this.offensiveRepo.count({ where: { status: OffensiveStatus.FAILED } }),
      this.offensiveRepo.count()
    ]);

    return { active, completed, failed, totalCreated };
  }

  private async getMonthlyCompletion(): Promise<{ month: string; completions: number }[]> {
    const now = new Date();
    const monthlyData: { month: string; completions: number }[] = [];

    // Últimos 6 meses
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      
      const completions = await this.completionRepo.count({
        where: {
          completion_date: Between(date, nextMonth),
          completed: true
        }
      });

      monthlyData.push({
        month: date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
        completions
      });
    }

    return monthlyData;
  }

  async getHobbitStatistics(hobbyId: number): Promise<{
    totalCompletions: number;
    currentStreak: number;
    completionRate: number;
    weeklyProgress: number[];
    monthlyProgress: { month: string; completions: number }[];
  }> {
    const hobby = await this.hobbyRepo.findOneBy({ id: hobbyId });
    if (!hobby) {
      throw new Error('Hábito não encontrado');
    }

    const [
      totalCompletions,
      currentStreak,
      weeklyProgress,
      monthlyProgress
    ] = await Promise.all([
      this.getTotalCompletionsForHobby(hobbyId),
      this.hobbiesService.calculateStreak(hobbyId),
      this.hobbiesService.getWeeklyProgress(hobbyId),
      this.getMonthlyProgressForHobby(hobbyId)
    ]);

    // Calcular taxa de conclusão (últimos 30 dias)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const completionsLast30Days = await this.completionRepo.count({
      where: {
        hobby: { id: hobbyId },
        completion_date: Between(thirtyDaysAgo, new Date()),
        completed: true
      }
    });

    const completionRate = (completionsLast30Days / 30) * 100;

    return {
      totalCompletions,
      currentStreak,
      completionRate,
      weeklyProgress,
      monthlyProgress
    };
  }

  private async getTotalCompletionsForHobby(hobbyId: number): Promise<number> {
    return this.completionRepo.count({
      where: {
        hobby: { id: hobbyId },
        completed: true
      }
    });
  }

  private async getMonthlyProgressForHobby(hobbyId: number): Promise<{ month: string; completions: number }[]> {
    const now = new Date();
    const monthlyData: { month: string; completions: number }[] = [];

    // Últimos 6 meses
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      
      const completions = await this.completionRepo.count({
        where: {
          hobby: { id: hobbyId },
          completion_date: Between(date, nextMonth),
          completed: true
        }
      });

      monthlyData.push({
        month: date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
        completions
      });
    }

    return monthlyData;
  }

  async getOffensiveStatistics(offensiveId: number): Promise<{
    totalDays: number;
    completedDays: number;
    progress: number;
    dailyProgress: {
      date: string;
      completed: boolean;
      completionRate: number;
    }[];
    habitProgress: {
      habitName: string;
      completions: number;
      totalDays: number;
    }[];
  }> {
    const offensive = await this.offensiveRepo.findOne({
      where: { id: offensiveId },
      relations: ['hobbies']
    });

    if (!offensive) {
      throw new Error('Ofensiva não encontrada');
    }

    const progressData = await this.progressRepo.find({
      where: { offensive: { id: offensiveId } },
      order: { progress_date: 'ASC' }
    });

    const dailyProgress = progressData.map(progress => ({
      date: progress.progress_date.toISOString().split('T')[0],
      completed: progress.day_completed,
      completionRate: progress.daily_completion_rate
    }));

    // Calcular progresso por hábito
    const habitProgress = await Promise.all(
      offensive.hobbies.map(async (hobby) => {
        const completions = await this.completionRepo.count({
          where: {
            hobby: { id: hobby.id },
            completion_date: Between(offensive.start_date, offensive.end_date),
            completed: true
          }
        });

        return {
          habitName: hobby.name,
          completions,
          totalDays: offensive.duration
        };
      })
    );

    return {
      totalDays: offensive.duration,
      completedDays: offensive.completed_days,
      progress: offensive.progress,
      dailyProgress,
      habitProgress
    };
  }
}
