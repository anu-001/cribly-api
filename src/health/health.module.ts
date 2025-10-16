import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { HealthService } from '../common/services/health.service';

@Module({
    controllers: [HealthController],
    providers: [HealthService],
    exports: [HealthService],
})
export class HealthModule { }