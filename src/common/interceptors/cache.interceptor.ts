import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { CACHE_KEY } from '../decorators/cache.decorator';
import { CacheService } from '../services/cache.service';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CacheInterceptor.name);

  constructor(
    private reflector: Reflector,
    private cacheService: CacheService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ttl = this.reflector.get<number>(CACHE_KEY, context.getHandler());

    if (!ttl) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const cacheKey = this.generateCacheKey(request);

    // Try to get from cache
    const cachedData = this.cacheService.get(cacheKey);
    if (cachedData) {
      this.logger.debug(`Cache hit for key: ${cacheKey}`);
      return of(cachedData);
    }

    // Execute handler and cache result
    return next.handle().pipe(
      tap((data) => {
        this.cacheService.set(cacheKey, data, ttl);
        this.logger.debug(`Cache set for key: ${cacheKey}`);
      }),
    );
  }

  private generateCacheKey(request: any): string {
    const userId = request.user?.id || 'anonymous';
    const method = request.method;
    const path = request.route?.path || request.url.split('?')[0];
    const query = JSON.stringify(request.query || {});

    return `${method}:${path}:${userId}:${query}`;
  }
}
