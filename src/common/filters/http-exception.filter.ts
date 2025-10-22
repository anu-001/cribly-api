import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(HttpExceptionFilter.name);

    catch(exception: HttpException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();
        const status = exception.getStatus();
        const exceptionResponse = exception.getResponse();

        const errorResponse = {
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: request.url,
            method: request.method,
            requestId: request['requestId'],
            message:
                typeof exceptionResponse === 'string'
                    ? exceptionResponse
                    : (exceptionResponse as any).message || 'An error occurred',
            error:
                typeof exceptionResponse === 'object'
                    ? (exceptionResponse as any).error
                    : undefined,
        };

        // Log error
        if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
            this.logger.error(
                `[${request['requestId']}] ${request.method} ${request.url} - ${status}`,
                exception.stack,
            );
        } else {
            this.logger.warn(
                `[${request['requestId']}] ${request.method} ${request.url} - ${status}`,
            );
        }

        response.status(status).json(errorResponse);
    }
}
