import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Hobby } from './hobby.entity';
import { HobbyCompletion } from './hobby-completion.entity';
import { CreateHobbyDto } from './dto/create-hobby.dto';
import { UpdateHobbyDto } from './dto/update-hobby.dto';
import { CompleteHobbyDto } from './dto/complete-hobby.dto';

@Injectable()
export class HobbiesService {
  constructor(
    @InjectRepository(Hobby)
    private readonly hobbyRepo: Repository<Hobby>,
    @InjectRepository(HobbyCompletion)
    private readonly completionRepo: Repository<HobbyCompletion>,
  ) {}

  create(dto: CreateHobbyDto) {
    const hobby = this.hobbyRepo.create(dto);
    return this.hobbyRepo.save(hobby);
  }

  async findAll() {
    const hobbies = await this.hobbyRepo.find();
    
    // Para cada hábito, verificar se foi completado hoje e calcular streak
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const enrichedHobbies = await Promise.all(
      hobbies.map(async (hobby) => {
        const completedToday = await this.isCompletedToday(hobby.id);
        const streak = await this.calculateStreak(hobby.id);
        
        return {
          ...hobby,
          completedToday,
          streak
        };
      })
    );

    return enrichedHobbies;
  }

  findOne(id: number) {
    return this.hobbyRepo.findOneBy({ id });
  }

  async update(id: number, dto: UpdateHobbyDto) {
    await this.hobbyRepo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.hobbyRepo.delete(id);
    return { deleted: true };
  }

  async completeHabit(id: number, dto: CompleteHobbyDto): Promise<{ success: boolean; message: string }> {
    const hobby = await this.findOne(id);
    if (!hobby) {
      throw new NotFoundException(`Hábito com ID ${id} não encontrado`);
    }

    const completionDate = dto.completion_date ? new Date(dto.completion_date) : new Date();
    completionDate.setHours(0, 0, 0, 0);

    // Verificar se já existe um registro para esta data
    const existingCompletion = await this.completionRepo.findOne({
      where: {
        hobby: { id },
        completion_date: completionDate
      }
    });

    if (existingCompletion) {
      // Atualizar registro existente
      existingCompletion.completed = dto.completed;
      await this.completionRepo.save(existingCompletion);
    } else {
      // Criar novo registro
      const completion = this.completionRepo.create({
        hobby: { id },
        completion_date: completionDate,
        completed: dto.completed
      });
      await this.completionRepo.save(completion);
    }

    const message = dto.completed ? 'Hábito marcado como concluído!' : 'Hábito desmarcado';
    return { success: true, message };
  }

  async isCompletedToday(hobbyId: number): Promise<boolean> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const completion = await this.completionRepo.findOne({
      where: {
        hobby: { id: hobbyId },
        completion_date: today,
        completed: true
      }
    });

    return !!completion;
  }

  async calculateStreak(hobbyId: number): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let streak = 0;
    let currentDate = new Date(today);

    // Verificar se foi completado hoje, se não, começar de ontem
    const completedToday = await this.isCompletedToday(hobbyId);
    if (!completedToday) {
      currentDate.setDate(currentDate.getDate() - 1);
    }

    // Contar dias consecutivos para trás
    while (true) {
      const completion = await this.completionRepo.findOne({
        where: {
          hobby: { id: hobbyId },
          completion_date: currentDate,
          completed: true
        }
      });

      if (completion) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  }

  async getHobbyCompletions(hobbyId: number, startDate?: Date, endDate?: Date): Promise<HobbyCompletion[]> {
    const whereCondition: any = { hobby: { id: hobbyId } };

    if (startDate && endDate) {
      whereCondition.completion_date = Between(startDate, endDate);
    }

    return this.completionRepo.find({
      where: whereCondition,
      order: { completion_date: 'DESC' }
    });
  }

  async getWeeklyProgress(hobbyId?: number): Promise<number[]> {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - 6); // 7 dias atrás
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(today);
    weekEnd.setHours(23, 59, 59, 999);

    const whereCondition: any = {
      completion_date: Between(weekStart, weekEnd),
      completed: true
    };

    if (hobbyId) {
      whereCondition.hobby = { id: hobbyId };
    }

    const completions = await this.completionRepo.find({
      where: whereCondition,
      relations: ['hobby']
    });

    // Criar array com 7 posições (domingo a sábado)
    const weeklyData = new Array(7).fill(0);

    completions.forEach(completion => {
      const dayOfWeek = completion.completion_date.getDay(); // 0 = domingo, 6 = sábado
      weeklyData[dayOfWeek]++;
    });

    return weeklyData;
  }

  async getCategoryStats(): Promise<{ [key: string]: number }> {
    const hobbies = await this.hobbyRepo.find();
    
    const categoryStats: { [key: string]: number } = {};
    
    hobbies.forEach(hobby => {
      if (categoryStats[hobby.category]) {
        categoryStats[hobby.category]++;
      } else {
        categoryStats[hobby.category] = 1;
      }
    });

    return categoryStats;
  }

  async getTotalCompletedToday(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.completionRepo.count({
      where: {
        completion_date: today,
        completed: true
      }
    });
  }

  async getMaxStreak(): Promise<number> {
    const hobbies = await this.hobbyRepo.find();
    let maxStreak = 0;

    for (const hobby of hobbies) {
      const streak = await this.calculateStreak(hobby.id);
      if (streak > maxStreak) {
        maxStreak = streak;
      }
    }

    return maxStreak;
  }
}
