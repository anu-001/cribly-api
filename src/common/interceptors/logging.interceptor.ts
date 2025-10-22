import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
    private readonly logger = new Logger('HTTP');

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const ctx = context.switchToHttp();
        const request = ctx.getRequest();
        const method = request.method;
        const url = request.url;
        const requestId = request.requestId || 'unknown';
        const startTime = Date.now();

        return next.handle().pipe(
            tap({
                next: () => {
                    const response = ctx.getResponse();
                    const statusCode = response.statusCode;
                    const duration = Date.now() - startTime;

                    this.logger.log(
                        `[${requestId}] ${method} ${url} ${statusCode} - ${duration}ms`,
                    );
                },
                error: (error) => {
                    const duration = Date.now() - startTime;
                    const statusCode = error.status || 500;

                    this.logger.error(
                        `[${requestId}] ${method} ${url} ${statusCode} - ${duration}ms`,
                        error.stack,
                    );
                },
            }),
        );
    }
}
