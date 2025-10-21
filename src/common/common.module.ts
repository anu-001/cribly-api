import { Global, Module } from '@nestjs/common';
import { TokenBlacklistService } from './services/token-blacklist.service';
import { SecurityService } from './services/security.service';
import { CacheService } from './services/cache.service';
import { HealthService } from './services/health.service';

@Global()
@Module({
  providers: [
    TokenBlacklistService,
    SecurityService,
    CacheService,
    HealthService,
  ],
  exports: [
    TokenBlacklistService,
    SecurityService,
    CacheService,
    HealthService,
  ],
})
export class CommonModule {}
