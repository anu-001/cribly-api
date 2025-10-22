import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService } from './health.service';
import { HealthCheckResult } from './dto/health-check-result.dto';

@ApiTags('Health')
@Controller('health')
export class HealthController {
    constructor(private readonly healthService: HealthService) { }

    @Get()
    @ApiOperation({ summary: 'Overall health check' })
    @ApiResponse({
        status: 200,
        description: 'Service is healthy',
        type: HealthCheckResult,
    })
    @ApiResponse({ status: 503, description: 'Service is unhealthy' })
    async check(): Promise<HealthCheckResult> {
        return this.healthService.check();
    }

    @Get('ready')
    @ApiOperation({
        summary: 'Readiness check - is the service ready to accept traffic',
    })
    @ApiResponse({ status: 200, description: 'Service is ready' })
    @ApiResponse({ status: 503, description: 'Service is not ready' })
    async readiness(): Promise<HealthCheckResult> {
        return this.healthService.readiness();
    }

    @Get('live')
    @ApiOperation({ summary: 'Liveness check - is the service alive' })
    @ApiResponse({ status: 200, description: 'Service is alive' })
    @ApiResponse({ status: 503, description: 'Service is not alive' })
    async liveness(): Promise<HealthCheckResult> {
        return this.healthService.liveness();
    }
}
