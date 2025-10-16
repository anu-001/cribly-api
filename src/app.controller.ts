import { Controller, Get, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Application')
@Controller()
export class AppController {
    @Get()
    @ApiOperation({
        summary: 'API Status / Supabase Redirect Handler',
        description: 'Get basic information about the Cribly Backend API or handle Supabase email confirmation redirects'
    })
    @ApiResponse({
        status: 200,
        description: 'API information retrieved successfully or redirect processed',
        schema: {
            example: {
                message: 'Cribly Backend API',
                version: '1.0.0',
                status: 'healthy',
                docs: '/docs',
                timestamp: '2024-01-01T00:00:00.000Z'
            }
        }
    })
    getApiInfo(
        @Query('token') token?: string,
        @Query('type') type?: string,
        @Res() res?: Response
    ) {
        // Handle Supabase confirmation redirect
        if (token && type && res) {
            const redirectUrl = `/api/v1/auth/confirm?token=${token}&type=${type}`;
            return res.redirect(302, redirectUrl);
        }

        return {
            message: 'Cribly Backend API',
            version: '1.0.0',
            status: 'healthy',
            docs: '/docs',
            timestamp: new Date().toISOString(),
        };
    }
}