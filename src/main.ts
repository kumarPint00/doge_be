import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { setupSwagger } from './swaggers/swagger.setup';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  setupSwagger(app);

  await app.listen(3000);
  console.log('Application is running on: http://localhost:3000');
  console.log('Swagger docs available at: http://localhost:3000/docs');
}
bootstrap();
