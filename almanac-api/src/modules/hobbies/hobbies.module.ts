import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HobbiesController } from './hobbies.controller';
import { HobbiesService } from './hobbies.service';
import { Hobby } from './hobby.entity';
import { HobbyCompletion } from './hobby-completion.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Hobby, HobbyCompletion])],
  controllers: [HobbiesController],
  providers: [HobbiesService],
  exports: [HobbiesService, TypeOrmModule] // Exportar para uso em outros módulos (ex: Statistics)
})
export class HobbiesModule {}
