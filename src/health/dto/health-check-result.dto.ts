import { ApiProperty } from '@nestjs/swagger';

export class ServiceStatus {
    @ApiProperty()
    name: string;

    @ApiProperty()
    healthy: boolean;

    @ApiProperty({ required: false })
    message?: string;

    @ApiProperty({ required: false })
    responseTime?: number;
}

export class HealthCheckResult {
    @ApiProperty()
    status: 'healthy' | 'unhealthy' | 'degraded';

    @ApiProperty()
    timestamp: string;

    @ApiProperty({ type: [ServiceStatus] })
    services: ServiceStatus[];

    @ApiProperty({ required: false })
    uptime?: number;

    @ApiProperty({ required: false })
    version?: string;
}
