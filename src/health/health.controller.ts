import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService } from '../common/services/health.service';
import { BaseController } from '../common/controllers/base.controller';

@ApiTags('Health')
@Controller('health')
export class HealthController extends BaseController {
  constructor(private readonly healthService: HealthService) {
    super();
  }

  @Get()
  @ApiOperation({
    summary: 'Health Check',
    description:
      'Check if the API is running and healthy with detailed service status.',
  })
  @ApiResponse({
    status: 200,
    description: 'API health status',
    schema: {
      example: {
        status: 'healthy',
        timestamp: '2024-01-01T00:00:00.000Z',
        uptime: 3600,
        environment: 'development',
        version: '1.0.0',
        services: {
          database: 'connected',
          cloudinary: 'connected',
          firebase: 'connected',
        },
        memory: {
          used: 45,
          total: 128,
          percentage: 35,
        },
        performance: {
          responseTime: 85,
          requestsPerSecond: 12,
        },
      },
    },
  })
  async getHealth() {
    this.logRequest('getHealth');
    return this.healthService.getHealthStatus();
  }

  @Get('ready')
  @ApiOperation({
    summary: 'Readiness Check',
    description:
      'Check if the API is ready to accept requests with critical service validation.',
  })
  @ApiResponse({
    status: 200,
    description: 'API readiness status',
    schema: {
      example: {
        ready: true,
        checks: {
          database: true,
          memory: true,
        },
      },
    },
  })
  async getReadiness() {
    this.logRequest('getReadiness');
    return this.healthService.getReadinessStatus();
  }
}
