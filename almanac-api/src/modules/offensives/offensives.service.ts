import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Offensive, OffensiveStatus } from './offensive.entity';
import { OffensiveProgress } from './offensive-progress.entity';
import { Hobby } from '../hobbies/hobby.entity';
import { HobbyCompletion } from '../hobbies/hobby-completion.entity';
import { CreateOffensiveDto } from './dto/create-offensive.dto';
import { UpdateOffensiveDto } from './dto/update-offensive.dto';

@Injectable()
export class OffensivesService {
  constructor(
    @InjectRepository(Offensive)
    private readonly offensiveRepo: Repository<Offensive>,
    @InjectRepository(OffensiveProgress)
    private readonly progressRepo: Repository<OffensiveProgress>,
    @InjectRepository(Hobby)
    private readonly hobbyRepo: Repository<Hobby>,
    @InjectRepository(HobbyCompletion)
    private readonly completionRepo: Repository<HobbyCompletion>,
  ) {}

  async create(dto: CreateOffensiveDto): Promise<Offensive> {
    // Verificar se os hábitos existem
    const hobbies = await this.hobbyRepo.findBy({ id: In(dto.habits) });
    if (hobbies.length !== dto.habits.length) {
      throw new BadRequestException('Um ou mais hábitos não foram encontrados');
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + dto.duration);

    const offensive = this.offensiveRepo.create({
      name: dto.name,
      description: dto.description,
      duration: dto.duration,
      start_date: startDate,
      end_date: endDate,
      hobbies,
      status: OffensiveStatus.ACTIVE,
      completed_days: 0,
      progress: 0,
    });

    const savedOffensive = await this.offensiveRepo.save(offensive);
    
    // Criar registro de progresso inicial
    await this.createDailyProgress(savedOffensive.id, startDate);
    
    return savedOffensive;
  }

  async findAll(): Promise<Offensive[]> {
    return this.offensiveRepo.find({
      relations: ['hobbies'],
      order: { created_at: 'DESC' }
    });
  }

  async findOne(id: number): Promise<Offensive> {
    const offensive = await this.offensiveRepo.findOne({
      where: { id },
      relations: ['hobbies']
    });

    if (!offensive) {
      throw new NotFoundException(`Ofensiva com ID ${id} não encontrada`);
    }

    return offensive;
  }

  async update(id: number, dto: UpdateOffensiveDto): Promise<Offensive> {
    const offensive = await this.findOne(id);
    
    if (dto.habits) {
      const hobbies = await this.hobbyRepo.findBy({ id: In(dto.habits) });
      if (hobbies.length !== dto.habits.length) {
        throw new BadRequestException('Um ou mais hábitos não foram encontrados');
      }
      offensive.hobbies = hobbies;
    }

    Object.assign(offensive, dto);
    return this.offensiveRepo.save(offensive);
  }

  async remove(id: number): Promise<{ deleted: boolean }> {
    const result = await this.offensiveRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Ofensiva com ID ${id} não encontrada`);
    }
    return { deleted: true };
  }

  async pauseOffensive(id: number): Promise<Offensive> {
    const offensive = await this.findOne(id);
    
    if (offensive.status !== OffensiveStatus.ACTIVE) {
      throw new BadRequestException('Apenas ofensivas ativas podem ser pausadas');
    }

    offensive.status = OffensiveStatus.PAUSED;
    return this.offensiveRepo.save(offensive);
  }

  async resumeOffensive(id: number): Promise<Offensive> {
    const offensive = await this.findOne(id);
    
    if (offensive.status !== OffensiveStatus.PAUSED) {
      throw new BadRequestException('Apenas ofensivas pausadas podem ser retomadas');
    }

    offensive.status = OffensiveStatus.ACTIVE;
    return this.offensiveRepo.save(offensive);
  }

  async completeOffensive(id: number): Promise<Offensive> {
    const offensive = await this.findOne(id);
    
    if (offensive.status === OffensiveStatus.COMPLETED) {
      throw new BadRequestException('Ofensiva já está completa');
    }

    offensive.status = OffensiveStatus.COMPLETED;
    offensive.progress = 100;
    return this.offensiveRepo.save(offensive);
  }

  async updateOffensiveProgress(offensiveId: number): Promise<void> {
    const offensive = await this.findOne(offensiveId);
    
    if (offensive.status !== OffensiveStatus.ACTIVE) {
      return; // Não atualiza progresso se não estiver ativa
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Verificar se já existe progresso para hoje
    let todayProgress = await this.progressRepo.findOne({
      where: {
        offensive: { id: offensiveId },
        progress_date: today
      }
    });

    if (!todayProgress) {
      todayProgress = await this.createDailyProgress(offensiveId, today);
    }

    // Contar quantos hábitos da ofensiva foram completados hoje
    const completedToday = await this.completionRepo.count({
      where: {
        hobby: { id: In(offensive.hobbies.map(h => h.id)) },
        completion_date: today,
        completed: true
      }
    });

    const totalHobbies = offensive.hobbies.length;
    const dailyCompletionRate = totalHobbies > 0 ? (completedToday / totalHobbies) * 100 : 0;
    const dayCompleted = completedToday === totalHobbies;

    // Atualizar progresso do dia
    todayProgress.completed_hobbies = completedToday;
    todayProgress.total_hobbies = totalHobbies;
    todayProgress.daily_completion_rate = dailyCompletionRate;
    todayProgress.day_completed = dayCompleted;

    await this.progressRepo.save(todayProgress);

    // Calcular progresso geral da ofensiva
    await this.calculateOverallProgress(offensiveId);
  }

  private async createDailyProgress(offensiveId: number, date: Date): Promise<OffensiveProgress> {
    const offensive = await this.findOne(offensiveId);
    
    const progress = this.progressRepo.create({
      offensive: { id: offensiveId },
      progress_date: date,
      completed_hobbies: 0,
      total_hobbies: offensive.hobbies.length,
      daily_completion_rate: 0,
      day_completed: false
    });

    return this.progressRepo.save(progress);
  }

  private async calculateOverallProgress(offensiveId: number): Promise<void> {
    const offensive = await this.findOne(offensiveId);
    
    // Contar quantos dias foram completados
    const completedDays = await this.progressRepo.count({
      where: {
        offensive: { id: offensiveId },
        day_completed: true
      }
    });

    // Calcular progresso baseado nos dias completados
    const progress = offensive.duration > 0 ? (completedDays / offensive.duration) * 100 : 0;

    // Verificar se a ofensiva deve ser marcada como completa ou falhada
    const today = new Date();
    const isExpired = today > offensive.end_date;
    
    let status = offensive.status;
    if (isExpired && status === OffensiveStatus.ACTIVE) {
      status = progress >= 80 ? OffensiveStatus.COMPLETED : OffensiveStatus.FAILED; // Exemplo: 80% para completar
    }

    // Atualizar a ofensiva
    await this.offensiveRepo.update(offensiveId, {
      completed_days: completedDays,
      progress: Math.min(progress, 100),
      status
    });
  }

  async getOffensiveProgress(id: number): Promise<OffensiveProgress[]> {
    return this.progressRepo.find({
      where: { offensive: { id } },
      order: { progress_date: 'ASC' }
    });
  }

  async getActiveOffensives(): Promise<Offensive[]> {
    return this.offensiveRepo.find({
      where: { status: OffensiveStatus.ACTIVE },
      relations: ['hobbies']
    });
  }

  async checkAndUpdateExpiredOffensives(): Promise<void> {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const expiredOffensives = await this.offensiveRepo.find({
      where: {
        status: OffensiveStatus.ACTIVE,
        end_date: { $lt: today } as any // TypeORM não suporta diretamente, pode precisar de um QueryBuilder
      }
    });

    for (const offensive of expiredOffensives) {
      await this.calculateOverallProgress(offensive.id);
    }
  }
}
