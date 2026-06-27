import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Préfixe défini dans docs/api/README.md
  app.setGlobalPrefix('api/v1');
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`Vertech API démarrée sur http://localhost:${port}/api/v1`);
}

bootstrap();
