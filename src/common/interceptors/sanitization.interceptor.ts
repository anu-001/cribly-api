import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SecurityService } from '../services/security.service';

@Injectable()
export class SanitizationInterceptor implements NestInterceptor {
    constructor(private securityService: SecurityService) { }

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();

        // Sanitize request body
        if (request.body) {
            request.body = this.securityService.sanitizeObject(request.body);
        }

        // Sanitize query parameters
        if (request.query) {
            request.query = this.securityService.sanitizeObject(request.query);
        }

        return next.handle().pipe(
            map(data => {
                // Don't sanitize response data as it should already be safe
                return data;
            })
        );
    }
}