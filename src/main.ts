import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('/api/v1');
  app.enableCors({
    origin: '*',
  });
  const configService = app.get(ConfigService);
  const port = configService.get<number>('APP_PORT') || 3003;

  await app.listen(port, () => {
    console.log(`App is running on port ${port}...`);
  });
}
bootstrap();
