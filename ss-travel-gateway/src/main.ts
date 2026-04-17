import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger, ValidationPipe } from '@nestjs/common';
import proxy from 'express-http-proxy';
import { Request } from 'express';

async function bootstrap() {
  const logger = new Logger('Gateway');
  const app = await NestFactory.create(AppModule);

  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  // Swagger Setup
  const config = new DocumentBuilder()
    .setTitle('SS Traveling API Gateway')
    .setDescription('The API Gateway for SS Traveling Microservices')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // Proxy Routes
  const authUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
  const financeUrl = process.env.FINANCE_SERVICE_URL || 'http://localhost:3002';

  app.use('/auth-api', proxy(authUrl, {
    proxyReqPathResolver: (req: Request) => {
      return req.url; // Forward same path
    }
  }));

  app.use('/finance-api', proxy(financeUrl, {
    proxyReqPathResolver: (req: Request) => {
      return req.url;
    }
  }));

  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`Gateway is running on: http://localhost:${port}`);
  logger.log(`Swagger documentation: http://localhost:${port}/api`);
}
bootstrap();
