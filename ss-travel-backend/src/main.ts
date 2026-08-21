import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const logger = new Logger('Main');
  const app = await NestFactory.create(AppModule);

  app.enableCors();
  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('SS Traveling ERP API')
    .setDescription('The monolithic core API for SS Traveling ERP')
    .setVersion('1.0')
    .addTag('Auth')
    .addBearerAuth()
    .addGlobalParameters({
      name: 'x-device-id',
      in: 'header',
      required: false,
      description: 'Device ID used for security fingerprint validation',
      schema: {
        type: 'string',
        default: 'uuid-device-123',
      },
    })
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`Monolithic Backend is running on: http://localhost:${port}`);
  logger.log(`Swagger documentation: http://localhost:${port}/api/docs`);
}
bootstrap();
