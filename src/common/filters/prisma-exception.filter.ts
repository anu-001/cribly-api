import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(PrismaExceptionFilter.name);

    catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Database error occurred';

        // Handle specific Prisma error codes
        switch (exception.code) {
            case 'P2002':
                // Unique constraint failed
                status = HttpStatus.CONFLICT;
                message = `Duplicate entry: ${this.extractFieldName(exception)} already exists`;
                break;
            case 'P2025':
                // Record not found
                status = HttpStatus.NOT_FOUND;
                message = 'Record not found';
                break;
            case 'P2003':
                // Foreign key constraint failed
                status = HttpStatus.BAD_REQUEST;
                message = 'Invalid reference to related record';
                break;
            case 'P2014':
                // Required relation violation
                status = HttpStatus.BAD_REQUEST;
                message = 'Required relation is missing';
                break;
            default:
                this.logger.error(
                    `Unhandled Prisma error code: ${exception.code}`,
                    exception.stack,
                );
                break;
        }

        const errorResponse = {
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: request.url,
            method: request.method,
            requestId: request['requestId'],
            message,
            error: 'DatabaseError',
            code: exception.code,
        };

        this.logger.error(
            `[${request['requestId']}] Prisma Error ${exception.code}: ${message}`,
        );

        response.status(status).json(errorResponse);
    }

    private extractFieldName(
        exception: Prisma.PrismaClientKnownRequestError,
    ): string {
        if (exception.meta && typeof exception.meta.target === 'string') {
            return exception.meta.target;
        }
        if (exception.meta && Array.isArray(exception.meta.target)) {
            return exception.meta.target.join(', ');
        }
        return 'field';
    }
}
