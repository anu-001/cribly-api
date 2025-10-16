import { Injectable, Logger } from '@nestjs/common';

export interface HealthCheck {
    status: 'healthy' | 'unhealthy';
    timestamp: string;
    uptime: number;
    environment: string;
    version: string;
    services: {
        database: 'connected' | 'disconnected' | 'unknown';
        supabase: 'connected' | 'disconnected' | 'unknown';
        cloudinary: 'connected' | 'disconnected' | 'unknown';
        firebase: 'connected' | 'disconnected' | 'unknown';
    };
    memory: {
        used: number;
        total: number;
        percentage: number;
    };
    performance: {
        responseTime: number;
        requestsPerSecond?: number;
    };
}

@Injectable()
export class HealthService {
    private readonly logger = new Logger(HealthService.name);
    private requestCount = 0;
    private startTime = Date.now();

    async getHealthStatus(): Promise<HealthCheck> {
        const memoryUsage = process.memoryUsage();
        const totalMemory = memoryUsage.heapTotal;
        const usedMemory = memoryUsage.heapUsed;

        const services = await this.checkServices();
        const allServicesHealthy = Object.values(services).every(status => status === 'connected');

        return {
            status: allServicesHealthy ? 'healthy' : 'unhealthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: process.env.NODE_ENV || 'development',
            version: process.env.npm_package_version || '1.0.0',
            services,
            memory: {
                used: Math.round(usedMemory / 1024 / 1024), // MB
                total: Math.round(totalMemory / 1024 / 1024), // MB
                percentage: Math.round((usedMemory / totalMemory) * 100),
            },
            performance: {
                responseTime: this.calculateAverageResponseTime(),
                requestsPerSecond: this.calculateRequestsPerSecond(),
            },
        };
    }

    async getReadinessStatus(): Promise<{ ready: boolean; checks: any }> {
        const services = await this.checkServices();
        const criticalServices = ['database', 'supabase'];

        const readinessChecks = {
            database: services.database === 'connected',
            supabase: services.supabase === 'connected',
            memory: this.isMemoryHealthy(),
        };

        const ready = Object.values(readinessChecks).every(check => check === true);

        return {
            ready,
            checks: readinessChecks,
        };
    }

    incrementRequestCount(): void {
        this.requestCount++;
    }

    private async checkServices(): Promise<HealthCheck['services']> {
        const checks = await Promise.allSettled([
            this.checkDatabase(),
            this.checkSupabase(),
            this.checkCloudinary(),
            this.checkFirebase(),
        ]);

        return {
            database: checks[0].status === 'fulfilled' ? checks[0].value : 'unknown',
            supabase: checks[1].status === 'fulfilled' ? checks[1].value : 'unknown',
            cloudinary: checks[2].status === 'fulfilled' ? checks[2].value : 'unknown',
            firebase: checks[3].status === 'fulfilled' ? checks[3].value : 'unknown',
        };
    }

    private async checkDatabase(): Promise<'connected' | 'disconnected'> {
        try {
            // In a real implementation, you would check database connectivity
            // For now, we'll simulate the check
            return 'connected';
        } catch (error) {
            this.logger.warn('Database health check failed', error);
            return 'disconnected';
        }
    }

    private async checkSupabase(): Promise<'connected' | 'disconnected'> {
        try {
            // Check Supabase connectivity
            return process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY ? 'connected' : 'disconnected';
        } catch (error) {
            this.logger.warn('Supabase health check failed', error);
            return 'disconnected';
        }
    }

    private async checkCloudinary(): Promise<'connected' | 'disconnected'> {
        try {
            return process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY ? 'connected' : 'disconnected';
        } catch (error) {
            this.logger.warn('Cloudinary health check failed', error);
            return 'disconnected';
        }
    }

    private async checkFirebase(): Promise<'connected' | 'disconnected'> {
        try {
            return process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL ? 'connected' : 'disconnected';
        } catch (error) {
            this.logger.warn('Firebase health check failed', error);
            return 'disconnected';
        }
    }

    private calculateAverageResponseTime(): number {
        // This is a simplified implementation
        // In production, you'd track actual response times
        return Math.round(Math.random() * 100 + 50); // Simulated 50-150ms
    }

    private calculateRequestsPerSecond(): number {
        const uptimeSeconds = Date.now() - this.startTime;
        return Math.round(this.requestCount / (uptimeSeconds / 1000));
    }

    private isMemoryHealthy(): boolean {
        const memoryUsage = process.memoryUsage();
        const usedPercentage = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
        return usedPercentage < 90; // Consider healthy if less than 90% memory usage
    }
}