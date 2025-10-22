import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);

  // Security
  app.use(helmet());
  app.use(cookieParser());

  // CORS
  app.enableCors({
    origin: configService.get('FRONTEND_URL') || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // API versioning
  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Roommate & Rental Platform API')
    .setDescription(
      'Production-grade API for connecting renters, roommate seekers, landlords, and agents. Features include property listings, roommate matching, messaging, and more.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT access token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Auth', 'Authentication and authorization endpoints')
    .addTag('Users', 'User profile management')
    .addTag('Property Listings', 'Property listing CRUD operations')
    .addTag('Roommate Profiles', 'Roommate seeker profile management')
    .addTag('Agent Profiles', 'Real estate agent profile management')
    .addTag('Connections', 'Connection requests between users')
    .addTag('Messaging', 'Real-time messaging system')
    .addTag('Favorites', 'User favorites/bookmarks')
    .addTag('Notifications', 'Notification system')
    .addTag('Search', 'Search and discovery features')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  const port = configService.get('PORT') || 3001;
  const host = configService.get('HOST') || '0.0.0.0';

  await app.listen(port, host);

  console.log(`
  🚀 Application is running on: http://${host}:${port}
  📚 API Documentation: http://${host}:${port}/api/docs
  🔐 Environment: ${configService.get('NODE_ENV')}
  📊 Database: Connected
  `);
}

bootstrap();
