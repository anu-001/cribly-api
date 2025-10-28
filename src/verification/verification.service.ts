import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { VerificationStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { EmailService } from '../email/email.service';
import {
  InitiateVerificationResponseDto,
  VerificationCallbackDto,
  VerificationStatusResponseDto,
} from './dto';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';
import axios from 'axios';
import { InternalVerificationService } from './internal-verification.service';

@Injectable()
export class VerificationService {
  private readonly logger = new Logger(VerificationService.name);
  private readonly maxAttemptsPerDay = 5;
  private readonly tokenExpiryHours = 2;
  private readonly webhookSecret: string;
  private readonly idvProviderBaseUrl: string;
  private readonly aegisIdUrl: string;

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private emailService: EmailService,
    private configService: ConfigService,
    private internalVerificationService: InternalVerificationService,
  ) {
    this.webhookSecret =
      this.configService.get<string>('VERIFICATION_WEBHOOK_SECRET') || '';
    this.idvProviderBaseUrl = this.configService.get<string>(
      'IDV_PROVIDER_URL',
      'https://idv-provider.com',
    );
    this.aegisIdUrl = this.configService.get<string>(
      'AEGISID_URL',
      'https://your-lambda-url.amazonaws.com/dev',
    );

    if (!this.webhookSecret) {
      this.logger.warn(
        '⚠️  VERIFICATION_WEBHOOK_SECRET not configured! Webhook signature validation will fail.',
      );
    }
  }

  /**
   * Initiate identity verification with AegisID
   * Uploads images to S3 and calls AegisID service
   */
  async initiateVerificationWithAegisId(
    userId: string,
    idImageUrl: string,
    selfieImageUrl: string,
  ): Promise<InitiateVerificationResponseDto> {
    const provider = this.configService.get<string>('VERIFICATION_PROVIDER', 'external');
    // 0. Basic input validation for URLs
    const isValidUrl = (u?: string) => !!u && /^https?:\/\//i.test(u);
    if (!isValidUrl(idImageUrl) || !isValidUrl(selfieImageUrl)) {
      throw new BadRequestException(
        'Invalid image URLs. Provide public HTTPS URLs for idImageUrl and selfieImageUrl',
      );
    }
    // 1. Check if user is already verified
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, verificationStatus: true, email: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.verificationStatus === VerificationStatus.VERIFIED) {
      throw new BadRequestException(
        'User is already verified. No further verification needed.',
      );
    }

    // 2. Check rate limiting (3 attempts per day)
    const today = new Date().toISOString().split('T')[0];
    const rateLimitKey = `verification:attempts:${userId}:${today}`;
    const attempts = await this.redis.get(rateLimitKey);
    const attemptCount = attempts ? parseInt(attempts, 10) : 0;

    if (attemptCount >= this.maxAttemptsPerDay) {
      throw new ForbiddenException(
        `Maximum verification attempts (${this.maxAttemptsPerDay}) reached for today. Please try again tomorrow.`,
      );
    }

    // 3. Generate secure verification token
    const verificationToken = uuidv4();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + this.tokenExpiryHours);

    // 4. Create verification attempt record
    await this.prisma.verificationAttempt.create({
      data: {
        userId,
        verificationToken,
        status: VerificationStatus.PENDING,
        expiresAt,
      },
    });

    // 5. Increment rate limit counter
    await this.redis.set(rateLimitKey, (attemptCount + 1).toString(), 86400);

    // 6. Update user status to PENDING
    await this.prisma.user.update({
      where: { id: userId },
      data: { verificationStatus: VerificationStatus.PENDING },
    });

    // If using internal provider, run verification synchronously here
    if (provider.toLowerCase() === 'internal') {
      try {
        const result = await this.internalVerificationService.verify(
          idImageUrl,
          selfieImageUrl,
        );
        const newStatus = result.verified
          ? VerificationStatus.VERIFIED
          : VerificationStatus.FAILED;

        await this.prisma.$transaction([
          this.prisma.verificationAttempt.updateMany({
            where: { userId, verificationToken },
            data: {
              status: newStatus,
              completedAt: new Date(),
              failureReason: result.message,
            },
          }),
          this.prisma.user.update({
            where: { id: userId },
            data: { verificationStatus: newStatus },
          }),
        ]);

        return {
          verificationUrl: null,
          verificationToken,
          expiresAt: expiresAt.toISOString(),
          remainingAttempts: this.maxAttemptsPerDay - attemptCount - 1,
        };
      } catch (e) {
        this.logger.error(`Internal verification error for ${userId}: ${e.message}`);
        throw new BadRequestException('Verification failed');
      }
    }

    // 7. Call AegisID service
    try {
      const aegisResponse = await axios.post(`${this.aegisIdUrl}/verify`, {
        id_image_url: idImageUrl,
        selfie_image_url: selfieImageUrl,
        user_id: userId,
      }, { timeout: 15000 });

      this.logger.log(
        `✅ AegisID verification initiated for user ${userId}. Response: ${aegisResponse.status}`,
      );
    } catch (error) {
      const status = (error as any)?.response?.status;
      const data = (error as any)?.response?.data;
      const message = (error as any)?.message || 'Unknown error';
      this.logger.error(
        `❌ AegisID verification failed for user ${userId}: status=${status} message=${message} data=${JSON.stringify(
          data,
        )}`,
      );
      // Surface a more actionable message to the client while staying 400
      if (status) {
        throw new BadRequestException(
          `Verification provider error (${status}): ${data?.message || message || 'Request failed'
          }`,
        );
      }
      throw new BadRequestException('Verification service temporarily unavailable');
    }

    return {
      verificationUrl: `${this.idvProviderBaseUrl}/session?token=${verificationToken}`,
      verificationToken,
      expiresAt: expiresAt.toISOString(),
      remainingAttempts: this.maxAttemptsPerDay - attemptCount - 1,
    };
  }

  /**
   * Initiate identity verification for a user (legacy method)
   * Pre-flight checks: already verified, rate limiting
   */
  async initiateVerification(
    userId: string,
  ): Promise<InitiateVerificationResponseDto> {
    // 1. Check if user is already verified
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, verificationStatus: true, email: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.verificationStatus === VerificationStatus.VERIFIED) {
      throw new BadRequestException(
        'User is already verified. No further verification needed.',
      );
    }

    // 2. Check rate limiting (3 attempts per day)
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const rateLimitKey = `verification:attempts:${userId}:${today}`;
    const attempts = await this.redis.get(rateLimitKey);
    const attemptCount = attempts ? parseInt(attempts, 10) : 0;

    if (attemptCount >= this.maxAttemptsPerDay) {
      throw new ForbiddenException(
        `Maximum verification attempts (${this.maxAttemptsPerDay}) reached for today. Please try again tomorrow.`,
      );
    }

    // 3. Generate secure verification token
    const verificationToken = uuidv4();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + this.tokenExpiryHours);

    // 4. Create verification attempt record
    await this.prisma.verificationAttempt.create({
      data: {
        userId,
        verificationToken,
        status: VerificationStatus.PENDING,
        expiresAt,
      },
    });

    // 5. Increment rate limit counter
    await this.redis.set(rateLimitKey, (attemptCount + 1).toString(), 86400); // 24h TTL

    // 6. Update user status to PENDING
    await this.prisma.user.update({
      where: { id: userId },
      data: { verificationStatus: VerificationStatus.PENDING },
    });

    // 7. Construct verification URL
    const verificationUrl = `${this.idvProviderBaseUrl}/session?token=${verificationToken}`;

    this.logger.log(
      `✅ Verification initiated for user ${userId}. Token: ${verificationToken}`,
    );

    return {
      verificationUrl,
      verificationToken,
      expiresAt: expiresAt.toISOString(),
      remainingAttempts: this.maxAttemptsPerDay - attemptCount - 1,
    };
  }

  /**
   * Get current verification status for a user
   */
  async getVerificationStatus(
    userId: string,
  ): Promise<VerificationStatusResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { verificationStatus: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get latest verification attempt
    const latestAttempt = await this.prisma.verificationAttempt.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        createdAt: true,
        completedAt: true,
        failureReason: true,
      },
    });

    // Get remaining attempts today
    const today = new Date().toISOString().split('T')[0];
    const rateLimitKey = `verification:attempts:${userId}:${today}`;
    const attempts = await this.redis.get(rateLimitKey);
    const attemptCount = attempts ? parseInt(attempts, 10) : 0;
    const remainingAttempts = Math.max(
      0,
      this.maxAttemptsPerDay - attemptCount,
    );

    return {
      status: user.verificationStatus,
      lastAttemptAt: latestAttempt?.createdAt.toISOString(),
      completedAt: latestAttempt?.completedAt?.toISOString(),
      failureReason: latestAttempt?.failureReason || undefined,
      remainingAttempts,
    };
  }

  /**
   * Handle webhook callback from IDV provider
   * Validates HMAC-SHA256 signature and updates verification status
   */
  async handleWebhookCallback(
    payload: VerificationCallbackDto,
    signature: string,
  ): Promise<void> {
    // 1. Validate webhook signature
    if (!this.verifyWebhookSignature(payload, signature)) {
      this.logger.error(
        `🚨 Invalid webhook signature for token: ${payload.verificationToken}`,
      );
      throw new UnauthorizedException('Invalid webhook signature');
    }

    // 2. Find verification attempt
    const verificationAttempt =
      await this.prisma.verificationAttempt.findUnique({
        where: { verificationToken: payload.verificationToken },
        include: { user: true },
      });

    if (!verificationAttempt) {
      throw new NotFoundException(
        `Verification attempt not found for token: ${payload.verificationToken}`,
      );
    }

    // 3. Check if token has expired
    if (new Date() > verificationAttempt.expiresAt) {
      this.logger.warn(
        `⏰ Expired verification token: ${payload.verificationToken}`,
      );
      await this.prisma.verificationAttempt.update({
        where: { id: verificationAttempt.id },
        data: {
          status: VerificationStatus.FAILED,
          failureReason: 'Verification token expired',
          completedAt: new Date(),
        },
      });
      throw new BadRequestException('Verification token has expired');
    }

    // 4. Check if already completed
    if (verificationAttempt.completedAt) {
      throw new BadRequestException('Verification already completed');
    }

    // 5. Update verification attempt and user status
    const newStatus = payload.success
      ? VerificationStatus.VERIFIED
      : VerificationStatus.FAILED;

    if (payload.success && payload.documentData) {
      // **KEY PART**: Populate firstName, lastName, dateOfBirth from verified ID
      await this.prisma.$transaction([
        // Update verification attempt
        this.prisma.verificationAttempt.update({
          where: { id: verificationAttempt.id },
          data: {
            status: newStatus,
            completedAt: new Date(),
            failureReason: payload.failureReason,
            documentUrl: payload.faceImageUrl,
            faceImageUrl: payload.faceImageUrl,
          },
        }),
        // Update user with verified data from ID document
        this.prisma.user.update({
          where: { id: verificationAttempt.userId },
          data: {
            verificationStatus: newStatus,
            verificationData: payload.documentData,
            firstName: payload.documentData.firstName as string,
            lastName: payload.documentData.lastName as string,
            dateOfBirth: payload.documentData.dateOfBirth
              ? new Date(payload.documentData.dateOfBirth as string)
              : undefined,
          },
        }),
      ]);

      // Invalidate user cache
      await this.redis.del(`user:${verificationAttempt.userId}`);

      this.logger.log(
        `✅ Verification completed for user ${verificationAttempt.userId}. Data populated from ID.`,
      );

      // Send success email
      await this.emailService.sendVerificationSuccessEmail(
        verificationAttempt.user.email,
        `${payload.documentData.firstName} ${payload.documentData.lastName}`,
      );
    } else {
      // Verification failed
      await this.prisma.$transaction([
        this.prisma.verificationAttempt.update({
          where: { id: verificationAttempt.id },
          data: {
            status: newStatus,
            completedAt: new Date(),
            failureReason: payload.failureReason,
          },
        }),
        this.prisma.user.update({
          where: { id: verificationAttempt.userId },
          data: {
            verificationStatus: newStatus,
          },
        }),
      ]);

      this.logger.log(
        `❌ Verification failed for user ${verificationAttempt.userId}: ${payload.failureReason}`,
      );

      // Get remaining attempts
      const today = new Date().toISOString().split('T')[0];
      const rateLimitKey = `verification:attempts:${verificationAttempt.userId}:${today}`;
      const attempts = await this.redis.get(rateLimitKey);
      const attemptCount = attempts ? parseInt(attempts, 10) : 0;
      const remainingAttempts = Math.max(
        0,
        this.maxAttemptsPerDay - attemptCount,
      );

      // Send failure email
      await this.emailService.sendVerificationFailureEmail(
        verificationAttempt.user.email,
        verificationAttempt.user.firstName || 'User',
        payload.failureReason || 'Unknown reason',
        remainingAttempts,
      );
    }
  }

  /**
   * Verify HMAC-SHA256 webhook signature
   */
  private verifyWebhookSignature(
    payload: VerificationCallbackDto,
    signature: string,
  ): boolean {
    if (!this.webhookSecret) {
      this.logger.warn(
        '⚠️  Webhook secret not configured, skipping validation',
      );
      return true; // Skip validation in development if secret not set
    }

    try {
      const payloadString = JSON.stringify(payload);
      const expectedSignature = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(payloadString)
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature),
      );
    } catch (error) {
      this.logger.error('Error verifying webhook signature:', error);
      return false;
    }
  }

  /**
   * Check if user is verified (utility method)
   */
  async isUserVerified(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { verificationStatus: true },
    });

    return user?.verificationStatus === VerificationStatus.VERIFIED;
  }

  /**
   * Get verification statistics (admin only)
   */
  async getVerificationStats() {
    const [total, verified, pending, failed, unverified] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({
        where: { verificationStatus: VerificationStatus.VERIFIED },
      }),
      this.prisma.user.count({
        where: { verificationStatus: VerificationStatus.PENDING },
      }),
      this.prisma.user.count({
        where: { verificationStatus: VerificationStatus.FAILED },
      }),
      this.prisma.user.count({
        where: { verificationStatus: VerificationStatus.UNVERIFIED },
      }),
    ]);

    const verificationRate = total > 0 ? (verified / total) * 100 : 0;

    return {
      total,
      verified,
      pending,
      failed,
      unverified,
      verificationRate: parseFloat(verificationRate.toFixed(2)),
    };
  }
}
