import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { OffensivesService } from './modules/offensives/offensives.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors(); // Habilitar CORS para permitir comunicação com o front-end
  app.useGlobalPipes(new ValidationPipe()); // Habilitar validação de DTOs

  await app.listen(3000);

  // Agendar verificação de ofensivas expiradas a cada hora
  const offensivesService = app.get(OffensivesService);
  setInterval(() => {
    offensivesService.checkAndUpdateExpiredOffensives()
      .then(() => console.log('Verificação de ofensivas expiradas executada.'))
      .catch(error => console.error('Erro ao verificar ofensivas expiradas:', error));
  }, 3600000); // A cada 1 hora (3600000 ms)

  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
