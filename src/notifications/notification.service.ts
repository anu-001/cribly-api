import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { EmailTemplateService } from './services/email-template.service';
import {
  WelcomeEmailContext,
  PasswordResetContext,
  MatchNotificationContext,
  MessageNotificationContext,
} from './templates/email-template.interface';
import * as admin from 'firebase-admin';
import type { Prisma, NotificationType, DevicePlatform } from '@prisma/client';
import { Resend } from 'resend';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private readonly resend: Resend;

  constructor(
    private configService: ConfigService,
    private prismaService: PrismaService,
    private emailTemplateService: EmailTemplateService,
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
    data?: Prisma.InputJsonValue,
  ) {
    try {
      const isRecordWithType = (v: Prisma.InputJsonValue): boolean => {
        return (
          v !== null &&
          typeof v === 'object' &&
          !Array.isArray(v) &&
          'type' in (v as Record<string, unknown>)
        );
      };
      // normalize data for FCM (string map) and for DB storage
      const fcmData: Record<string, string> = {};
      if (data && typeof data === 'object') {
        try {
          const obj = data as Record<string, unknown>;
          Object.keys(obj).forEach((k) => {
            const v = obj[k];
            fcmData[k] = v === undefined || v === null ? '' : String(v);
          });
        } catch (e) {
          // fallback: stringify entire payload
          fcmData.payload = JSON.stringify(data);
        }
      }
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
        data: fcmData,
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
          if (
            !resp.success &&
            (resp.error?.code === 'messaging/invalid-registration-token' ||
              resp.error?.code ===
                'messaging/registration-token-not-registered')
          ) {
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
      const notificationType = isRecordWithType(data)
        ? ((data as Record<string, unknown>).type as NotificationType)
        : ('SYSTEM_UPDATE' as NotificationType);

      await this.prismaService.notification.create({
        data: {
          userId,
          title,
          body,
          type: notificationType,
          data: (data as Prisma.InputJsonValue) || {},
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

  async sendEmail(to: string, subject: string, html: string, from?: string) {
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

  async sendWelcomeEmail(context: WelcomeEmailContext) {
    try {
      const emailTemplate =
        this.emailTemplateService.getWelcomeTemplate(context);

      return await this.sendEmail(
        context.email,
        emailTemplate.subject,
        emailTemplate.html,
      );
    } catch (error) {
      this.logger.error('Send welcome email failed', error);
      throw error;
    }
  }

  async sendPasswordResetEmail(context: PasswordResetContext) {
    try {
      const emailTemplate =
        this.emailTemplateService.getPasswordResetTemplate(context);

      return await this.sendEmail(
        context.email,
        emailTemplate.subject,
        emailTemplate.html,
      );
    } catch (error) {
      this.logger.error('Send password reset email failed', error);
      throw error;
    }
  }

  async sendMatchNotification(
    userId: string,
    matchData: {
      matchId: string;
      listingId?: string;
      listingTitle?: string;
      matcherName: string;
      matchType: 'property' | 'roommate';
      userEmail?: string;
      userName?: string;
    },
  ) {
    try {
      const title = 'New Match Request';
      const body = `Someone is interested in your ${matchData.matchType === 'property' ? 'listing' : 'roommate profile'}: ${matchData.listingTitle || 'Your Profile'}`;

      // Send push notification
      const pushResult = await this.sendPushNotification(userId, title, body, {
        type: 'MATCH_REQUEST',
        matchId: matchData.matchId,
        listingId: matchData.listingId,
      });

      // Send email notification if user email is available
      if (matchData.userEmail && matchData.userName) {
        const emailContext: MatchNotificationContext = {
          firstName: matchData.userName,
          email: matchData.userEmail,
          matchType: matchData.matchType,
          matchTitle: matchData.listingTitle || 'Your Profile',
          matcherName: matchData.matcherName,
          viewUrl: `${this.configService.get('FRONTEND_URL')}/matches/${matchData.matchId}`,
        };

        const emailTemplate =
          this.emailTemplateService.getMatchNotificationTemplate(emailContext);

        await this.sendEmail(
          matchData.userEmail,
          emailTemplate.subject,
          emailTemplate.html,
        );
      }

      return pushResult;
    } catch (error) {
      this.logger.error('Send match notification failed', error);
      throw error;
    }
  }

  async sendMatchAcceptedNotification(
    userId: string,
    matchData: { matchId: string; listingTitle?: string; chatId?: string },
  ) {
    const title = 'Match Accepted!';
    const body = `Your match request for "${matchData.listingTitle}" was accepted!`;

    return this.sendPushNotification(userId, title, body, {
      type: 'MATCH_ACCEPTED',
      matchId: matchData.matchId,
      chatId: matchData.chatId,
    });
  }

  async sendNewMessageNotification(
    userId: string,
    messageData: {
      chatId: string;
      messageId: string;
      senderName: string;
      messageContent: string;
      userEmail?: string;
      userName?: string;
    },
  ) {
    try {
      const title = `New message from ${messageData.senderName}`;
      const body = messageData.messageContent;

      // Send push notification
      const pushResult = await this.sendPushNotification(userId, title, body, {
        type: 'NEW_MESSAGE',
        chatId: messageData.chatId,
        messageId: messageData.messageId,
      });

      // Send email notification if user email is available
      if (messageData.userEmail && messageData.userName) {
        const emailContext: MessageNotificationContext = {
          firstName: messageData.userName,
          email: messageData.userEmail,
          senderName: messageData.senderName,
          messagePreview:
            messageData.messageContent.substring(0, 100) +
            (messageData.messageContent.length > 100 ? '...' : ''),
          conversationUrl: `${this.configService.get('FRONTEND_URL')}/chat/${messageData.chatId}`,
        };

        const emailTemplate =
          this.emailTemplateService.getMessageNotificationTemplate(
            emailContext,
          );

        await this.sendEmail(
          messageData.userEmail,
          emailTemplate.subject,
          emailTemplate.html,
        );
      }

      return pushResult;
    } catch (error) {
      this.logger.error('Send message notification failed', error);
      throw error;
    }
  }

  async registerDeviceToken(
    userId: string,
    token: string,
    platform: DevicePlatform | string,
  ) {
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
          platform: platform as DevicePlatform, // TODO: Fix once Prisma client syncs with enum
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

  async removeDeviceToken(token: string) {
    try {
      await this.prismaService.deviceToken.deleteMany({ where: { token } });
      return { success: true };
    } catch (error) {
      this.logger.error('Remove device token failed', error);
      throw error;
    }
  }
}
