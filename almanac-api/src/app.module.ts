import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HobbiesModule } from './modules/hobbies/hobbies.module';
import { Offensive } from './modules/offensives/offensive.entity';
import { OffensiveProgress } from './modules/offensives/offensive-progress.entity';
import { HobbyCompletion } from './modules/hobbies/hobby-completion.entity';
import { OffensivesModule } from './modules/offensives/offensives.module';
import { StatisticsModule } from './modules/statistics/statistics.module';
import { Hobby } from './modules/hobbies/hobby.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        type: 'postgres',
        host: cfg.get<string>('DB_HOST'),
        port: parseInt(cfg.get<string>('DB_PORT') ?? '5432', 10),
        username: cfg.get<string>('DB_USER'),
        password: cfg.get<string>('DB_PASS'),
        database: cfg.get<string>('DB_NAME'),
        entities: [Hobby, HobbyCompletion, Offensive, OffensiveProgress], // Adicionar novas entidades aqui
        synchronize: true, // cria/atualiza as tabelas automaticamente
      }),
    }),
    HobbiesModule,
    OffensivesModule,
    StatisticsModule,
  ],
})
export class AppModule {}
