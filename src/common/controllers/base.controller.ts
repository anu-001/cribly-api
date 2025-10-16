import { Logger } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';

export abstract class BaseController {
    protected readonly logger = new Logger(this.constructor.name);

    @ApiResponse({ status: 500, description: 'Internal server error' })
    protected handleError(error: any, context: string): never {
        this.logger.error(`${context}: ${error.message}`, error.stack);
        throw error;
    }

    protected logRequest(method: string, params?: any): void {
        this.logger.debug(`${method} called${params ? ` with params: ${JSON.stringify(params)}` : ''}`);
    }

    protected createSuccessResponse<T>(
        data: T,
        message?: string,
        meta?: any
    ): { data: T; message?: string; meta?: any } {
        const response: any = { data };

        if (message) {
            response.message = message;
        }

        if (meta) {
            response.meta = meta;
        }

        return response;
    }

    protected createPaginatedResponse<T>(
        data: T[],
        total: number,
        page: number,
        limit: number,
        message?: string
    ): {
        data: T[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
            hasNext: boolean;
            hasPrev: boolean;
        };
        message?: string;
    } {
        const totalPages = Math.ceil(total / limit);

        const response = {
            data,
            meta: {
                total,
                page,
                limit,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1,
            },
        };

        return message ? { ...response, message } : response;
    }
}