import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import * as admin from 'firebase-admin';
import { Resend } from 'resend';

@Injectable()
export class NotificationService {
    private readonly logger = new Logger(NotificationService.name);
    private readonly resend: Resend;

    constructor(
        private configService: ConfigService,
        private prismaService: PrismaService,
    ) {
        // Initialize Resend
        this.resend = new Resend(this.configService.get('RESEND_API_KEY'));

        // Initialize Firebase Admin
        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: this.configService.get('FIREBASE_PROJECT_ID'),
                    clientEmail: this.configService.get('FIREBASE_CLIENT_EMAIL'),
                    privateKey: this.configService
                        .get('FIREBASE_PRIVATE_KEY')
                        ?.replace(/\\n/g, '\n'),
                }),
            });
        }
    }

    async sendPushNotification(
        userId: string,
        title: string,
        body: string,
        data?: Record<string, any>,
    ) {
        try {
            // Get user's device tokens
            const deviceTokens = await this.prismaService.deviceToken.findMany({
                where: { userId },
                select: { token: true },
            });

            if (deviceTokens.length === 0) {
                this.logger.warn(`No device tokens found for user: ${userId}`);
                return { success: false, reason: 'No device tokens' };
            }

            const tokens = deviceTokens.map((dt) => dt.token);

            // Send notification using Firebase
            const response = await admin.messaging().sendMulticast({
                tokens,
                notification: {
                    title,
                    body,
                },
                data: data || {},
                android: {
                    notification: {
                        clickAction: 'FLUTTER_NOTIFICATION_CLICK',
                    },
                },
                apns: {
                    payload: {
                        aps: {
                            category: 'GENERAL',
                        },
                    },
                },
            });

            // Remove invalid tokens
            if (response.failureCount > 0) {
                const invalidTokens: string[] = [];
                response.responses.forEach((resp, idx) => {
                    if (!resp.success &&
                        (resp.error?.code === 'messaging/invalid-registration-token' ||
                            resp.error?.code === 'messaging/registration-token-not-registered')) {
                        invalidTokens.push(tokens[idx]);
                    }
                });

                if (invalidTokens.length > 0) {
                    await this.prismaService.deviceToken.deleteMany({
                        where: {
                            token: { in: invalidTokens },
                        },
                    });
                }
            }

            // Store notification in database
            await this.prismaService.notification.create({
                data: {
                    userId,
                    title,
                    body,
                    type: data?.type || 'SYSTEM_UPDATE',
                    data: data || {},
                    isSent: response.successCount > 0,
                },
            });

            return {
                success: response.successCount > 0,
                successCount: response.successCount,
                failureCount: response.failureCount,
            };
        } catch (error) {
            this.logger.error('Send push notification failed', error);
            throw error;
        }
    }

    async sendEmail(
        to: string,
        subject: string,
        html: string,
        from?: string,
    ) {
        try {
            const response = await this.resend.emails.send({
                from: from || 'Cribly <noreply@cribly.com>',
                to,
                subject,
                html,
            });

            return response;
        } catch (error) {
            this.logger.error('Send email failed', error);
            throw error;
        }
    }

    async sendWelcomeEmail(userEmail: string, userName: string) {
        const subject = 'Welcome to Cribly!';
        const html = `
      <h1>Welcome to Cribly, ${userName}!</h1>
      <p>Thank you for joining our platform. We're excited to have you on board.</p>
      <p>Start exploring amazing property listings and connect with others in your area.</p>
      <p>Best regards,<br>The Cribly Team</p>
    `;

        return this.sendEmail(userEmail, subject, html);
    }

    async sendMatchNotification(userId: string, matchData: any) {
        const title = 'New Match Request';
        const body = `Someone is interested in your listing: ${matchData.listingTitle}`;

        return this.sendPushNotification(userId, title, body, {
            type: 'MATCH_REQUEST',
            matchId: matchData.matchId,
            listingId: matchData.listingId,
        });
    }

    async sendMatchAcceptedNotification(userId: string, matchData: any) {
        const title = 'Match Accepted!';
        const body = `Your match request for "${matchData.listingTitle}" was accepted!`;

        return this.sendPushNotification(userId, title, body, {
            type: 'MATCH_ACCEPTED',
            matchId: matchData.matchId,
            chatId: matchData.chatId,
        });
    }

    async sendNewMessageNotification(userId: string, messageData: any) {
        const title = `New message from ${messageData.senderName}`;
        const body = messageData.messageContent;

        return this.sendPushNotification(userId, title, body, {
            type: 'NEW_MESSAGE',
            chatId: messageData.chatId,
            messageId: messageData.messageId,
        });
    }

    async registerDeviceToken(userId: string, token: string, platform: string) {
        try {
            // Check if token already exists
            const existingToken = await this.prismaService.deviceToken.findUnique({
                where: { token },
            });

            if (existingToken) {
                // Update user association if needed
                if (existingToken.userId !== userId) {
                    await this.prismaService.deviceToken.update({
                        where: { token },
                        data: { userId },
                    });
                }
                return existingToken;
            }

            // Create new device token
            const deviceToken = await this.prismaService.deviceToken.create({
                data: {
                    userId,
                    token,
                    platform,
                },
            });

            return deviceToken;
        } catch (error) {
            this.logger.error('Register device token failed', error);
            throw error;
        }
    }

    async getUserNotifications(userId: string, page = 1, limit = 20) {
        try {
            const offset = (page - 1) * limit;

            const notifications = await this.prismaService.notification.findMany({
                where: { userId },
                skip: offset,
                take: limit,
                orderBy: { createdAt: 'desc' },
            });

            const total = await this.prismaService.notification.count({
                where: { userId },
            });

            const unreadCount = await this.prismaService.notification.count({
                where: {
                    userId,
                    isRead: false,
                },
            });

            return {
                notifications,
                unreadCount,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            };
        } catch (error) {
            this.logger.error('Get user notifications failed', error);
            throw error;
        }
    }

    async markNotificationAsRead(notificationId: string, userId: string) {
        try {
            const notification = await this.prismaService.notification.update({
                where: {
                    id: notificationId,
                    userId, // Ensure user can only mark their own notifications
                },
                data: {
                    isRead: true,
                },
            });

            return notification;
        } catch (error) {
            this.logger.error('Mark notification as read failed', error);
            throw error;
        }
    }

    async markAllNotificationsAsRead(userId: string) {
        try {
            await this.prismaService.notification.updateMany({
                where: {
                    userId,
                    isRead: false,
                },
                data: {
                    isRead: true,
                },
            });

            return { success: true };
        } catch (error) {
            this.logger.error('Mark all notifications as read failed', error);
            throw error;
        }
    }
}