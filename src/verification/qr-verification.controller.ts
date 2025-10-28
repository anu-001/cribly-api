import {
    Controller,
    Post,
    Get,
    Param,
    Body,
    UseGuards,
    HttpCode,
    HttpStatus,
    BadRequestException,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { QRVerificationService, QRVerificationData, QRVerificationStatus } from './qr-verification.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('qr-verification')
@Controller('verification')
export class QRVerificationController {
    constructor(private readonly qrVerificationService: QRVerificationService) { }

    /**
     * Generate QR code for mobile verification
     */
    @Post('generate-qr')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({
        summary: 'Generate QR code for mobile verification',
        description: 'Creates a QR code that can be scanned by mobile device to continue verification process.',
    })
    @ApiResponse({
        status: 200,
        description: 'QR code generated successfully',
        schema: {
            type: 'object',
            properties: {
                qrCode: { type: 'string', description: 'Base64 encoded QR code image' },
                sessionToken: { type: 'string', description: 'Unique session token' },
                expiresAt: { type: 'string', description: 'Expiration timestamp' },
                verificationUrl: { type: 'string', description: 'Mobile verification URL' },
            },
        },
    })
    @ApiResponse({
        status: 400,
        description: 'Failed to generate QR code',
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized',
    })
    async generateQRCode(
        @CurrentUser('id') userId: string,
    ): Promise<QRVerificationData> {
        return this.qrVerificationService.generateQRCode(userId);
    }

    /**
     * Validate QR session token
     */
    @Get('validate-session/:token')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Validate QR session token',
        description: 'Validates a QR session token and returns user data for mobile verification.',
    })
    @ApiResponse({
        status: 200,
        description: 'Session validated successfully',
        schema: {
            type: 'object',
            properties: {
                user: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        email: { type: 'string' },
                        firstName: { type: 'string' },
                        lastName: { type: 'string' },
                        verificationStatus: { type: 'string' },
                    },
                },
                session: { type: 'object' },
                isValid: { type: 'boolean' },
            },
        },
    })
    @ApiResponse({
        status: 404,
        description: 'Invalid or expired session token',
    })
    async validateSessionToken(
        @Param('token') sessionToken: string,
    ): Promise<any> {
        return this.qrVerificationService.validateSessionToken(sessionToken);
    }

    /**
     * Get QR verification status
     */
    @Get('qr-status/:token')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Get QR verification status',
        description: 'Returns the current status of QR-based verification process.',
    })
    @ApiResponse({
        status: 200,
        description: 'Status retrieved successfully',
        schema: {
            type: 'object',
            properties: {
                status: {
                    type: 'string',
                    enum: ['scanning', 'processing', 'verified', 'failed', 'expired'],
                    description: 'Current verification status'
                },
                message: { type: 'string', description: 'Status message' },
                failureReason: { type: 'string', description: 'Failure reason if applicable' },
            },
        },
    })
    @ApiResponse({
        status: 404,
        description: 'Session not found',
    })
    async getQRVerificationStatus(
        @Param('token') sessionToken: string,
    ): Promise<QRVerificationStatus> {
        return this.qrVerificationService.getQRVerificationStatus(sessionToken);
    }

    /**
     * Update QR session status (called by mobile verification)
     */
    @Post('qr-status/:token')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Update QR session status',
        description: 'Updates the status of a QR session (called internally by mobile verification).',
    })
    @ApiResponse({
        status: 200,
        description: 'Status updated successfully',
    })
    @ApiResponse({
        status: 404,
        description: 'Session not found',
    })
    async updateQRSessionStatus(
        @Param('token') sessionToken: string,
        @Body() body: { status: string; data?: any },
    ): Promise<{ success: boolean; message: string }> {
        try {
            await this.qrVerificationService.updateQRSessionStatus(
                sessionToken,
                body.status,
                body.data,
            );

            return {
                success: true,
                message: 'Status updated successfully',
            };
        } catch (error) {
            throw new BadRequestException('Failed to update session status');
        }
    }
}
