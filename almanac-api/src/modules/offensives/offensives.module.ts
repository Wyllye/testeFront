import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OffensivesService } from './offensives.service';
import { OffensivesController } from './offensives.controller';
import { Offensive } from './offensive.entity';
import { OffensiveProgress } from './offensive-progress.entity';
import { Hobby } from '../hobbies/hobby.entity';
import { HobbyCompletion } from '../hobbies/hobby-completion.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Offensive, OffensiveProgress, Hobby, HobbyCompletion])],
  controllers: [OffensivesController],
  providers: [OffensivesService],
  exports: [OffensivesService] // Exportar para uso em outros módulos (ex: Statistics)
})
export class OffensivesModule {}
