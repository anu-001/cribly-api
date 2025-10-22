import { Injectable, Logger, HttpStatus, HttpException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import {
    HealthCheckResult,
    ServiceStatus,
} from './dto/health-check-result.dto';

@Injectable()
export class HealthService {
    private readonly logger = new Logger(HealthService.name);
    private readonly startTime = Date.now();

    constructor(
        private readonly prismaService: PrismaService,
        private readonly redisService: RedisService,
    ) { }

    /**
     * Overall health check - checks all dependencies
     */
    async check(): Promise<HealthCheckResult> {
        const services: ServiceStatus[] = [];
        let overallHealthy = true;

        // Check database
        const dbStart = Date.now();
        const dbHealthy = await this.prismaService.healthCheck();
        services.push({
            name: 'database',
            healthy: dbHealthy,
            responseTime: Date.now() - dbStart,
            message: dbHealthy ? 'Connected' : 'Connection failed',
        });

        if (!dbHealthy) overallHealthy = false;

        // Check Redis
        const redisStart = Date.now();
        const redisHealthy = await this.redisService.healthCheck();
        services.push({
            name: 'redis',
            healthy: redisHealthy,
            responseTime: Date.now() - redisStart,
            message: redisHealthy ? 'Connected' : 'Connection failed',
        });

        if (!redisHealthy) overallHealthy = false;

        const result: HealthCheckResult = {
            status: overallHealthy ? 'healthy' : 'unhealthy',
            timestamp: new Date().toISOString(),
            services,
            uptime: Date.now() - this.startTime,
            version: process.env.npm_package_version || '0.0.1',
        };

        if (!overallHealthy) {
            this.logger.warn('Health check failed', result);
            throw new HttpException(result, HttpStatus.SERVICE_UNAVAILABLE);
        }

        return result;
    }

    /**
     * Readiness check - is the service ready to accept traffic
     * Checks if all dependencies are available
     */
    async readiness(): Promise<HealthCheckResult> {
        return this.check();
    }

    /**
     * Liveness check - is the service alive
     * Basic check to see if the service is running
     */
    async liveness(): Promise<HealthCheckResult> {
        return {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            services: [
                {
                    name: 'application',
                    healthy: true,
                    message: 'Service is running',
                },
            ],
            uptime: Date.now() - this.startTime,
            version: process.env.npm_package_version || '0.0.1',
        };
    }
}
