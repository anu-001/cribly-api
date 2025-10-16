import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(GlobalExceptionFilter.name);

    constructor(private configService: ConfigService) {}

    catch(exception: unknown, host: ArgumentsHost): void {
        const ctx = host.switchToHttp();
        const request = ctx.getRequest();
        const response = ctx.getResponse();

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Internal server error';
        let details: any = null;

        if (exception instanceof HttpException) {
            status = exception.getStatus();
            const exceptionResponse = exception.getResponse();
            
            if (typeof exceptionResponse === 'string') {
                message = exceptionResponse;
            } else if (typeof exceptionResponse === 'object') {
                message = (exceptionResponse as any).message || message;
                details = (exceptionResponse as any).details;
            }
        } else if (exception instanceof Error) {
            message = exception.message;
        }

        // Log error details
        this.logger.error(
            `HTTP ${status} Error: ${message}`,
            {
                path: request.url,
                method: request.method,
                ip: request.ip,
                userAgent: request.get('user-agent'),
                userId: request.user?.id,
                stack: exception instanceof Error ? exception.stack : undefined,
            }
        );

        // Prepare error response
        const errorResponse: any = {
            success: false,
            statusCode: status,
            message,
            timestamp: new Date().toISOString(),
            path: request.url,
        };

        // Add details in development mode
        const isDevelopment = this.configService.get('NODE_ENV') === 'development';
        if (isDevelopment && details) {
            errorResponse.details = details;
        }

        // Add stack trace in development mode
        if (isDevelopment && exception instanceof Error && exception.stack) {
            errorResponse.stack = exception.stack;
        }

        response.status(status).json(errorResponse);
    }
}