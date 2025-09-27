import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatisticsController } from './statistics.controller';
import { StatisticsService } from './statistics.service';
import { Hobby } from '../hobbies/hobby.entity';
import { HobbyCompletion } from '../hobbies/hobby-completion.entity';
import { Offensive } from '../offensives/offensive.entity';
import { OffensiveProgress } from '../offensives/offensive-progress.entity';
import { HobbiesModule } from '../hobbies/hobbies.module'; // Importar HobbiesModule

@Module({
  imports: [
    TypeOrmModule.forFeature([Hobby, HobbyCompletion, Offensive, OffensiveProgress]),
    HobbiesModule // Importar para usar HobbiesService
  ],
  controllers: [StatisticsController],
  providers: [StatisticsService],
  exports: [StatisticsService]
})
export class StatisticsModule {}
