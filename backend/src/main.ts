import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { initializeTransactionalContext } from 'typeorm-transactional';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  initializeTransactionalContext();
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

  app.enableCors({
    origin: [frontendUrl, 'http://localhost:3002', 'http://localhost:3000'],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());

  const port = process.env.PORT || 3003;
  await app.listen(port);
  logger.log(`Application is running on: http://localhost:${port}`);
}

bootstrap();

