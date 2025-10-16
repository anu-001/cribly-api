import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { APP_CONSTANTS } from './common/constants/app.constants';

async function bootstrap() {
    const logger = new Logger('Bootstrap');

    const app = await NestFactory.create(AppModule, {
        logger: ['log', 'error', 'warn', 'debug', 'verbose'],
    });

    const configService = app.get(ConfigService);

    // Global Configuration
    app.setGlobalPrefix(APP_CONSTANTS.API_PREFIX);

    // Validation Pipe
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

    // CORS Configuration
    app.enableCors({
        origin: [
            'http://localhost:3000',
            'http://localhost:3001',
            configService.get('FRONTEND_URL'),
            'https://localhost:3000', // HTTPS development
            'https://cribly.vercel.app', // Production frontend
        ].filter(Boolean),
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: [
            'Origin',
            'X-Requested-With',
            'Content-Type',
            'Accept',
            'Authorization',
            'Cache-Control',
            'X-Forwarded-For',
            'X-Real-IP'
        ],
        exposedHeaders: ['Content-Length', 'X-Request-ID'],
        preflightContinue: false,
        optionsSuccessStatus: 204, // Some legacy browsers choke on 204
    });

    // Swagger Configuration (Only in development/staging)
    const nodeEnv = configService.get('NODE_ENV');
    if (nodeEnv !== 'production') {
        const config = new DocumentBuilder()
            .setTitle('Cribly Backend API')
            .setDescription(
                `Production-grade REST API for Cribly - A property listing and matching platform.
                
**Features:**
- 🔐 JWT-based authentication with Supabase
- 🏠 Property listing management with geolocation
- 🤝 User-property matching system
- 💬 Real-time chat with WebSocket support
- 🔔 Push notifications via Firebase FCM
- 📧 Email notifications via Resend
- 📱 Mobile-optimized endpoints
- 🌍 Geolocation-based property discovery
- 📊 Advanced filtering and search

**Authentication:**
Most endpoints require a valid JWT token. Obtain one by registering/logging in via the auth endpoints.

**WebSocket Events:** (Connect to \`/socket.io\`)
- \`join\` - Join a chat room
- \`leave\` - Leave a chat room  
- \`sendMessage\` - Send message to chat
- \`messageReceived\` - Receive incoming messages
- \`typing\` - Indicate user is typing
- \`stopTyping\` - Stop typing indicator`
            )
            .setVersion('1.0.0')
            .setContact('Cribly Team', 'https://cribly.app', 'support@cribly.app')
            .setLicense('MIT License', 'https://opensource.org/licenses/MIT')
            .addServer('http://localhost:3001', 'Local Development Server')
            .addServer('https://api-staging.cribly.app', 'Staging Server')
            .addServer('https://api.cribly.app', 'Production Server')
            .addBearerAuth(
                {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    name: 'JWT',
                    description: 'Enter JWT token',
                    in: 'header',
                },
                'JWT-auth'
            )
            .addTag('Authentication', 'User registration, login, and JWT token management')
            .addTag('Users', 'User profile management and geolocation features')
            .addTag('Listings', 'Property listing CRUD operations with advanced search')
            .addTag('Matches', 'User-property matching system with request/accept flow')
            .addTag('Chat (WebSocket)', 'Real-time messaging via Socket.IO - Events: join, leave, sendMessage, messageReceived, typing, stopTyping')
            .addTag('Notifications', 'Push and email notification management')
            .addTag('Health', 'System health checks and monitoring utilities')
            .build();

        const document = SwaggerModule.createDocument(app, config, {
            operationIdFactory: (controllerKey: string, methodKey: string) => methodKey,
        });

        // Custom CSS for better UI
        const customCss = `
            .swagger-ui .topbar { display: none; }
            .swagger-ui .info .title { color: #1976d2; }
            .swagger-ui .scheme-container { background: #fafafa; padding: 15px; border-radius: 4px; }
        `;

        SwaggerModule.setup('docs', app, document, {
            customCss,
            customSiteTitle: 'Cribly API Documentation',
            customfavIcon: 'https://cribly.app/favicon.ico',
            swaggerOptions: {
                persistAuthorization: true,
                displayRequestDuration: true,
                docExpansion: 'none',
                filter: true,
                showRequestHeaders: true,
                tryItOutEnabled: true,
            },
        });

        logger.log(`📚 Swagger documentation available at http://${configService.get('HOST') || 'localhost'}:${configService.get('PORT') || 3000}/docs`);
    }

    // Start server
    const port = configService.get('PORT') || 3000;
    const host = configService.get('HOST') || '0.0.0.0';

    await app.listen(port, host);

    logger.log(`🚀 Server running on http://${host}:${port}/${APP_CONSTANTS.API_PREFIX}`);
    logger.log(`📱 WebSocket server ready for real-time connections`);
    logger.log(`🔧 Environment: ${configService.get('NODE_ENV') || 'development'}`);
}

bootstrap().catch((error) => {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
});