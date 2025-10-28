import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';
import * as QRCode from 'qrcode';

export interface QRVerificationData {
    qrCode: string;
    sessionToken: string;
    expiresAt: string;
    verificationUrl: string;
}

export interface QRVerificationStatus {
    status: 'scanning' | 'processing' | 'verified' | 'failed' | 'expired';
    message: string;
    failureReason?: string;
}

@Injectable()
export class QRVerificationService {
    private readonly logger = new Logger(QRVerificationService.name);
    private readonly sessionExpiryMinutes = 5;

    constructor(
        private prisma: PrismaService,
        private redis: RedisService,
        private configService: ConfigService,
    ) { }

    /**
     * Generate QR code for mobile verification
     */
    async generateQRCode(userId: string): Promise<QRVerificationData> {
        try {
            // Generate session token
            const sessionToken = uuidv4();
            const expiresAt = new Date(Date.now() + this.sessionExpiryMinutes * 60 * 1000);

            // Get frontend URL for mobile verification
            const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:5173');
            const verificationUrl = `${frontendUrl}/verification/mobile?token=${sessionToken}`;

            // Generate QR code image from the verification URL (better for native camera scanners)
            const qrCodeImage = await QRCode.toDataURL(verificationUrl, {
                width: 256,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF',
                },
            });

            // Store session in Redis
            await this.redis.set(
                `qr_session:${sessionToken}`,
                JSON.stringify({
                    userId,
                    status: 'scanning',
                    createdAt: new Date().toISOString(),
                    expiresAt: expiresAt.toISOString(),
                }),
                this.sessionExpiryMinutes * 60, // TTL in seconds
            );

            this.logger.log(`QR code generated for user ${userId}, session: ${sessionToken}`);

            return {
                qrCode: qrCodeImage,
                sessionToken,
                expiresAt: expiresAt.toISOString(),
                verificationUrl,
            };
        } catch (error) {
            // Improve error signal to help frontend distinguish causes
            const message = error?.message || 'Unknown error';
            this.logger.error(`Failed to generate QR code for user ${userId}: ${message}`);
            if (message.includes('ECONNREFUSED') || message.toLowerCase().includes('redis')) {
                throw new BadRequestException('Failed to generate QR code (cache unavailable)');
            }
            throw new BadRequestException('Failed to generate QR code');
        }
    }

    /**
     * Validate QR session token
     */
    async validateSessionToken(sessionToken: string): Promise<any> {
        try {
            const sessionData = await this.redis.get(`qr_session:${sessionToken}`);

            if (!sessionData) {
                throw new NotFoundException('Invalid or expired session token');
            }

            const session = JSON.parse(sessionData);

            // Check if session is expired
            if (new Date(session.expiresAt) < new Date()) {
                await this.redis.del(`qr_session:${sessionToken}`);
                throw new NotFoundException('Session has expired');
            }

            // Get user data
            const user = await this.prisma.user.findUnique({
                where: { id: session.userId },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    verificationStatus: true,
                },
            });

            if (!user) {
                throw new NotFoundException('User not found');
            }

            return {
                user,
                session,
                isValid: true,
            };
        } catch (error) {
            this.logger.error(`Failed to validate session token ${sessionToken}:`, error);
            throw error;
        }
    }

    /**
     * Get QR verification status
     */
    async getQRVerificationStatus(sessionToken: string): Promise<QRVerificationStatus> {
        try {
            const sessionData = await this.redis.get(`qr_session:${sessionToken}`);

            if (!sessionData) {
                return {
                    status: 'expired',
                    message: 'Session has expired',
                };
            }

            const session = JSON.parse(sessionData);

            // Check if session is expired
            if (new Date(session.expiresAt) < new Date()) {
                await this.redis.del(`qr_session:${sessionToken}`);
                return {
                    status: 'expired',
                    message: 'Session has expired',
                };
            }

            // Get current verification status from database
            const user = await this.prisma.user.findUnique({
                where: { id: session.userId },
                select: { verificationStatus: true },
            });

            if (!user) {
                return {
                    status: 'failed',
                    message: 'User not found',
                };
            }

            switch (user.verificationStatus) {
                case 'VERIFIED':
                    return {
                        status: 'verified',
                        message: 'Identity verified successfully',
                    };
                case 'PENDING':
                    return {
                        status: 'processing',
                        message: 'Verification in progress',
                    };
                case 'FAILED':
                    return {
                        status: 'failed',
                        message: 'Verification failed',
                        failureReason: 'Identity verification failed',
                    };
                default:
                    return {
                        status: 'scanning',
                        message: 'Waiting for mobile device to scan QR code',
                    };
            }
        } catch (error) {
            this.logger.error(`Failed to get QR verification status for ${sessionToken}:`, error);
            return {
                status: 'failed',
                message: 'Failed to get verification status',
            };
        }
    }

    /**
     * Update QR session status
     */
    async updateQRSessionStatus(sessionToken: string, status: string, data?: any): Promise<void> {
        try {
            const sessionData = await this.redis.get(`qr_session:${sessionToken}`);

            if (!sessionData) {
                throw new NotFoundException('Session not found');
            }

            const session = JSON.parse(sessionData);
            session.status = status;
            session.updatedAt = new Date().toISOString();

            if (data) {
                session.data = data;
            }

            await this.redis.set(
                `qr_session:${sessionToken}`,
                JSON.stringify(session),
                this.sessionExpiryMinutes * 60,
            );

            this.logger.log(`QR session ${sessionToken} status updated to: ${status}`);
        } catch (error) {
            this.logger.error(`Failed to update QR session status for ${sessionToken}:`, error);
            throw error;
        }
    }

    /**
     * Clean up expired sessions
     */
    async cleanupExpiredSessions(): Promise<void> {
        try {
            // This would typically be called by a cron job
            const pattern = 'qr_session:*';
            const keys = await this.redis.keys(pattern);

            for (const key of keys) {
                const sessionData = await this.redis.get(key);
                if (sessionData) {
                    const session = JSON.parse(sessionData);
                    if (new Date(session.expiresAt) < new Date()) {
                        await this.redis.del(key);
                        this.logger.log(`Cleaned up expired session: ${key}`);
                    }
                }
            }
        } catch (error) {
            this.logger.error('Failed to cleanup expired sessions:', error);
        }
    }
}
