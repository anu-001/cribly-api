import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import appConfig from './config/app.config';

// Modules
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './users/user.module';
import { ListingModule } from './listings/listing.module';
import { MatchModule } from './matches/match.module';
import { ChatModule } from './chat/chat.module';
import { NotificationModule } from './notifications/notification.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { HealthModule } from './health/health.module';
import { CommonModule } from './common/common.module';

// Guards, Interceptors, and Filters
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { CacheInterceptor } from './common/interceptors/cache.interceptor';
import { SanitizationInterceptor } from './common/interceptors/sanitization.interceptor';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';

@Module({
    imports: [
        // Core Configuration
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
            load: [appConfig],
        }),

        // Rate Limiting
        ThrottlerModule.forRoot([
            {
                ttl: 60 * 1000, // 1 minute
                limit: 100, // 100 requests per minute
            },
        ]),

        // Database
        PrismaModule,

        // Common Services
        CommonModule,

        // Feature Modules
        AuthModule,
        UserModule,
        ListingModule,
        MatchModule,
        ChatModule,
        NotificationModule,
        CloudinaryModule,
        HealthModule,
    ],
    controllers: [AppController],
    providers: [
        // Global Exception Filter
        {
            provide: APP_FILTER,
            useClass: GlobalExceptionFilter,
        },

        // Global Guards
        {
            provide: APP_GUARD,
            useClass: ThrottlerGuard,
        },

        // Global Interceptors
        {
            provide: APP_INTERCEPTOR,
            useClass: SanitizationInterceptor,
        },
        {
            provide: APP_INTERCEPTOR,
            useClass: CacheInterceptor,
        },
        {
            provide: APP_INTERCEPTOR,
            useClass: LoggingInterceptor,
        },
        {
            provide: APP_INTERCEPTOR,
            useClass: ResponseInterceptor,
        },
        {
            provide: APP_INTERCEPTOR,
            useClass: TransformInterceptor,
        },
    ],
})
export class AppModule { }