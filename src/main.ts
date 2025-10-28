import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);

  // Security
  app.use(helmet());
  app.use(cookieParser());

  // CORS
  const corsOrigin = [
    configService.get('CORS_ORIGIN') || 'http://localhost:5173',
    'https://cribly.netlify.app'
  ];

  app.enableCors({
    origin: corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    exposedHeaders: ['X-Request-ID'],
  });


  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Global pipes
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

  // Global filters
  app.useGlobalFilters(new PrismaExceptionFilter(), new HttpExceptionFilter());

  // Global interceptors
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TransformInterceptor(),
  );

  // API versioning - disabled for simplicity
  // app.enableVersioning({
  //   type: VersioningType.URI,
  //   defaultVersion: '1',
  //   prefix: 'api/v',
  // });

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Cribly - Roommate & Rental Platform API')
    .setDescription(
      'Production-grade API for connecting renters, roommate seekers, landlords, and agents.\n\n' +
      '## Features\n' +
      '- 🔐 JWT Authentication with refresh tokens\n' +
      '- ✅ ID Verification with AWS Rekognition\n' +
      '- 🏠 Property Listings with geospatial search\n' +
      '- 👥 Roommate Matching with compatibility scoring\n' +
      '- 📁 Secure file uploads with virus scanning\n' +
      '- 🔍 Unified discovery & search engine\n' +
      '- 💬 Real-time messaging (coming soon)\n\n' +
      '## Authentication\n' +
      'Use the **Authorize** button to add your JWT token. Get your token from `/auth/signin` or `/auth/signup` endpoints.\n\n' +
      '## Rate Limits\n' +
      '- Default: 100 requests/minute\n' +
      '- Auth endpoints: 5 requests/minute\n' +
      '- Verification: 3 attempts/day\n\n' +
      '## Base URL\n' +
      'All endpoints are prefixed with `/api/v1/`',
    )
    .setVersion('1.0.0')
    .setContact('Cribly Support', 'https://cribly.com', 'support@cribly.com')
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description:
          'Enter JWT access token received from /auth/signin or /auth/signup',
        in: 'header',
      },
      'JWT-auth',
    )
    .addCookieAuth(
      'refreshToken',
      {
        type: 'apiKey',
        in: 'cookie',
        name: 'refreshToken',
        description: 'Refresh token stored in HTTP-only cookie',
      },
      'refresh-token',
    )
    .addTag('Health', 'API health check endpoints')
    .addTag(
      'Auth',
      'Authentication and authorization endpoints - signup, signin, logout',
    )
    .addTag('Users', 'User profile management - view, update, delete profiles')
    .addTag(
      'uploads',
      'File upload service - images, documents with virus scanning',
    )
    .addTag(
      'verification',
      'ID verification system - identity verification flow',
    )
    .addTag(
      'listings',
      'Property listing CRUD - create, search, manage listings',
    )
    .addTag(
      'roommate-profiles',
      'Roommate seeker profiles - matching and preferences',
    )
    .addTag(
      'explore',
      'Unified discovery & search - search listings and profiles together',
    )
    .addTag(
      'favorites',
      'User favorites/bookmarks - save and manage favorite listings',
    )
    .addTag(
      'connections',
      'Connection requests - inquiries and matching between users',
    )
    .addTag('messaging', 'Real-time messaging system - chat functionality')
    .addTag(
      'notifications',
      'Notification system - in-app, email, push notifications',
    )
    .addServer('http://localhost:3001', 'Local development server')
    .addServer('https://api-staging.cribly.com', 'Staging server')
    .addServer('https://api.cribly.com', 'Production server')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Cribly API Documentation',
    customfavIcon: 'https://cribly.com/favicon.ico',
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info { margin: 20px 0; }
      .swagger-ui .info .title { font-size: 36px; }
    `,
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
      deepLinking: true,
      displayRequestDuration: true,
      defaultModelsExpandDepth: 3,
      defaultModelExpandDepth: 3,
      syntaxHighlight: {
        activate: true,
        theme: 'monokai',
      },
      tryItOutEnabled: true,
    },
    explorer: true,
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
