import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

interface SendEmailOptions {
    to: string;
    subject: string;
    html: string;
    from?: string;
}

@Injectable()
export class EmailService {
    private readonly logger = new Logger(EmailService.name);
    private resend: Resend;
    private fromEmail: string;

    constructor(private configService: ConfigService) {
        const apiKey = this.configService.get<string>('RESEND_API_KEY');
        if (!apiKey) {
            this.logger.warn('RESEND_API_KEY not found. Email functionality will be disabled.');
        } else {
            this.resend = new Resend(apiKey);
        }
        this.fromEmail = this.configService.get<string>('RESEND_FROM_EMAIL') || 'Cribly <noreply@cribly.com>';
    }

    async sendEmail({ to, subject, html, from }: SendEmailOptions): Promise<boolean> {
        if (!this.resend) {
            this.logger.warn('Resend not initialized. Email not sent.');
            return false;
        }

        try {
            const { data, error } = await this.resend.emails.send({
                from: from || this.fromEmail,
                to: [to],
                subject,
                html,
            });

            if (error) {
                this.logger.error(`Failed to send email to ${to}: ${error.message}`);
                return false;
            }

            this.logger.log(`Email sent successfully to ${to}. ID: ${data.id}`);
            return true;
        } catch (error) {
            this.logger.error(`Exception sending email to ${to}:`, error);
            return false;
        }
    }

    async sendWelcomeEmail(email: string, name: string): Promise<boolean> {
        const html = this.getWelcomeEmailTemplate(name);
        return this.sendEmail({
            to: email,
            subject: '🎉 Welcome to Cribly - Your Roommate & Property Matching Platform',
            html,
        });
    }

    async sendVerificationEmail(email: string, name: string, verificationToken: string): Promise<boolean> {
        const verificationUrl = `${this.configService.get<string>('FRONTEND_URL')}/verify-email?token=${verificationToken}`;
        const html = this.getVerificationEmailTemplate(name, verificationUrl);
        return this.sendEmail({
            to: email,
            subject: '✉️ Verify Your Cribly Account',
            html,
        });
    }

    async sendPasswordResetEmail(email: string, name: string, resetToken: string): Promise<boolean> {
        const resetUrl = `${this.configService.get<string>('FRONTEND_URL')}/reset-password?token=${resetToken}`;
        const html = this.getPasswordResetEmailTemplate(name, resetUrl);
        return this.sendEmail({
            to: email,
            subject: '🔒 Reset Your Cribly Password',
            html,
        });
    }

    async sendConnectionRequestEmail(email: string, name: string, requesterName: string, connectionType: string): Promise<boolean> {
        const html = this.getConnectionRequestEmailTemplate(name, requesterName, connectionType);
        return this.sendEmail({
            to: email,
            subject: `🤝 New Connection Request from ${requesterName}`,
            html,
        });
    }

    async sendConnectionAcceptedEmail(email: string, name: string, accepterName: string): Promise<boolean> {
        const html = this.getConnectionAcceptedEmailTemplate(name, accepterName);
        return this.sendEmail({
            to: email,
            subject: `✅ ${accepterName} Accepted Your Connection Request`,
            html,
        });
    }

    async sendNewMessageEmail(email: string, name: string, senderName: string, messagePreview: string): Promise<boolean> {
        const html = this.getNewMessageEmailTemplate(name, senderName, messagePreview);
        return this.sendEmail({
            to: email,
            subject: `💬 New Message from ${senderName}`,
            html,
        });
    }

    async sendPropertyInquiryEmail(email: string, agentName: string, inquirerName: string, propertyTitle: string): Promise<boolean> {
        const html = this.getPropertyInquiryEmailTemplate(agentName, inquirerName, propertyTitle);
        return this.sendEmail({
            to: email,
            subject: `🏠 New Inquiry for ${propertyTitle}`,
            html,
        });
    }

    // Email Templates
    private getBaseTemplate(content: string): string {
        return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Cribly</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          background-color: #f5f5f5;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 40px 20px;
          text-align: center;
        }
        .logo {
          font-size: 32px;
          font-weight: bold;
          color: #ffffff;
          margin: 0;
        }
        .content {
          padding: 40px 30px;
          color: #333333;
          line-height: 1.6;
        }
        .content h1 {
          color: #667eea;
          font-size: 24px;
          margin-top: 0;
        }
        .content p {
          margin: 15px 0;
          font-size: 16px;
        }
        .button {
          display: inline-block;
          padding: 14px 32px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: #ffffff !important;
          text-decoration: none;
          border-radius: 8px;
          margin: 20px 0;
          font-weight: 600;
          font-size: 16px;
        }
        .footer {
          background-color: #f8f9fa;
          padding: 30px;
          text-align: center;
          color: #6c757d;
          font-size: 14px;
        }
        .footer a {
          color: #667eea;
          text-decoration: none;
        }
        .divider {
          height: 1px;
          background-color: #e9ecef;
          margin: 30px 0;
        }
        .highlight {
          background-color: #f8f9ff;
          padding: 20px;
          border-radius: 8px;
          border-left: 4px solid #667eea;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 class="logo">🏠 Cribly</h1>
        </div>
        <div class="content">
          ${content}
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Cribly. All rights reserved.</p>
          <p>
            <a href="${this.configService.get<string>('FRONTEND_URL')}/help">Help Center</a> • 
            <a href="${this.configService.get<string>('FRONTEND_URL')}/privacy">Privacy Policy</a> • 
            <a href="${this.configService.get<string>('FRONTEND_URL')}/terms">Terms of Service</a>
          </p>
          <p style="font-size: 12px; color: #9ca3af; margin-top: 20px;">
            You received this email because you're a valued member of Cribly.
          </p>
        </div>
      </div>
    </body>
    </html>
    `;
    }

    private getWelcomeEmailTemplate(name: string): string {
        const content = `
      <h1>Welcome to Cribly, ${name}! 🎉</h1>
      <p>We're thrilled to have you join our community of roommates, property seekers, and landlords.</p>
      
      <div class="highlight">
        <p><strong>Get started with Cribly:</strong></p>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li>Complete your profile to get better matches</li>
          <li>Browse available properties and roommate listings</li>
          <li>Connect with potential roommates or tenants</li>
          <li>Chat securely with verified users</li>
        </ul>
      </div>

      <a href="${this.configService.get<string>('FRONTEND_URL')}/dashboard" class="button">
        Go to Dashboard
      </a>

      <div class="divider"></div>

      <p>Need help getting started? Check out our <a href="${this.configService.get<string>('FRONTEND_URL')}/help">Help Center</a> or reach out to our support team.</p>
      
      <p>Best regards,<br>The Cribly Team</p>
    `;
        return this.getBaseTemplate(content);
    }

    private getVerificationEmailTemplate(name: string, verificationUrl: string): string {
        const content = `
      <h1>Verify Your Email Address</h1>
      <p>Hi ${name},</p>
      <p>Thanks for signing up with Cribly! Please verify your email address to activate your account and start exploring.</p>

      <a href="${verificationUrl}" class="button">
        Verify Email Address
      </a>

      <p style="color: #6c757d; font-size: 14px;">
        Or copy and paste this link into your browser:<br>
        <a href="${verificationUrl}" style="color: #667eea; word-break: break-all;">${verificationUrl}</a>
      </p>

      <div class="divider"></div>

      <p style="color: #dc3545; font-size: 14px;">
        <strong>⚠️ Security Note:</strong> This link will expire in 24 hours. If you didn't create an account with Cribly, please ignore this email.
      </p>
    `;
        return this.getBaseTemplate(content);
    }

    private getPasswordResetEmailTemplate(name: string, resetUrl: string): string {
        const content = `
      <h1>Reset Your Password</h1>
      <p>Hi ${name},</p>
      <p>We received a request to reset your Cribly account password. Click the button below to create a new password:</p>

      <a href="${resetUrl}" class="button">
        Reset Password
      </a>

      <p style="color: #6c757d; font-size: 14px;">
        Or copy and paste this link into your browser:<br>
        <a href="${resetUrl}" style="color: #667eea; word-break: break-all;">${resetUrl}</a>
      </p>

      <div class="divider"></div>

      <p style="color: #dc3545; font-size: 14px;">
        <strong>⚠️ Security Note:</strong> This link will expire in 1 hour. If you didn't request a password reset, please ignore this email or contact support if you have concerns.
      </p>
    `;
        return this.getBaseTemplate(content);
    }

    private getConnectionRequestEmailTemplate(name: string, requesterName: string, connectionType: string): string {
        const content = `
      <h1>New Connection Request 🤝</h1>
      <p>Hi ${name},</p>
      <p><strong>${requesterName}</strong> sent you a connection request regarding <strong>${connectionType}</strong>.</p>

      <div class="highlight">
        <p>Review their profile and decide if they're a good match for you!</p>
      </div>

      <a href="${this.configService.get<string>('FRONTEND_URL')}/connections" class="button">
        View Request
      </a>

      <p>You can accept or decline the request from your connections page.</p>
    `;
        return this.getBaseTemplate(content);
    }

    private getConnectionAcceptedEmailTemplate(name: string, accepterName: string): string {
        const content = `
      <h1>Connection Accepted! ✅</h1>
      <p>Hi ${name},</p>
      <p>Great news! <strong>${accepterName}</strong> accepted your connection request.</p>

      <div class="highlight">
        <p>You can now:</p>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li>Send direct messages</li>
          <li>Share contact information</li>
          <li>Schedule viewings or meetups</li>
        </ul>
      </div>

      <a href="${this.configService.get<string>('FRONTEND_URL')}/messages" class="button">
        Start Chatting
      </a>
    `;
        return this.getBaseTemplate(content);
    }

    private getNewMessageEmailTemplate(name: string, senderName: string, messagePreview: string): string {
        const preview = messagePreview.length > 100 ? messagePreview.substring(0, 100) + '...' : messagePreview;
        const content = `
      <h1>New Message 💬</h1>
      <p>Hi ${name},</p>
      <p><strong>${senderName}</strong> sent you a message:</p>

      <div class="highlight">
        <p style="font-style: italic; color: #495057;">"${preview}"</p>
      </div>

      <a href="${this.configService.get<string>('FRONTEND_URL')}/messages" class="button">
        Reply to Message
      </a>

      <p style="color: #6c757d; font-size: 14px;">
        You can manage your notification preferences in your account settings.
      </p>
    `;
        return this.getBaseTemplate(content);
    }

    private getPropertyInquiryEmailTemplate(agentName: string, inquirerName: string, propertyTitle: string): string {
        const content = `
      <h1>New Property Inquiry 🏠</h1>
      <p>Hi ${agentName},</p>
      <p><strong>${inquirerName}</strong> is interested in your property listing:</p>

      <div class="highlight">
        <p style="font-weight: 600; color: #667eea; font-size: 18px;">${propertyTitle}</p>
      </div>

      <a href="${this.configService.get<string>('FRONTEND_URL')}/dashboard" class="button">
        View Inquiry Details
      </a>

      <p>Respond quickly to increase your chances of closing the deal!</p>
    `;
        return this.getBaseTemplate(content);
    }

    /**
     * Send verification success email
     */
    async sendVerificationSuccessEmail(to: string, name: string): Promise<boolean> {
        const subject = '✅ Identity Verification Successful!';
        const html = this.getVerificationSuccessTemplate(name);
        return this.sendEmail({ to, subject, html });
    }

    /**
     * Send verification failure email
     */
    async sendVerificationFailureEmail(
        to: string,
        name: string,
        reason: string,
        remainingAttempts: number,
    ): Promise<boolean> {
        const subject = '❌ Identity Verification Failed';
        const html = this.getVerificationFailureTemplate(name, reason, remainingAttempts);
        return this.sendEmail({ to, subject, html });
    }

    /**
     * Verification success email template
     */
    private getVerificationSuccessTemplate(name: string): string {
        const content = `
      <h1 style="color: #7c3aed; margin-bottom: 20px;">🎉 Verification Complete!</h1>
      <p>Hi ${name},</p>
      <p>Great news! Your identity has been successfully verified.</p>
      
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 8px; margin: 30px 0;">
        <h2 style="color: white; margin: 0 0 10px 0;">✅ You're All Set!</h2>
        <p style="color: white; margin: 0;">You now have full access to all Cribly features:</p>
        <ul style="color: white; margin: 15px 0 0 20px;">
          <li>Create property listings</li>
          <li>Build your roommate profile</li>
          <li>Connect with verified users</li>
          <li>Send and receive messages</li>
        </ul>
      </div>

      <p>Your profile has been updated with your verified information:</p>
      <ul>
        <li>✓ First Name & Last Name (from ID)</li>
        <li>✓ Date of Birth (from ID)</li>
        <li>✓ Verification Badge</li>
      </ul>

      <p style="color: #666; font-size: 14px; margin-top: 30px;">
        <strong>Note:</strong> Your verified information (name and date of birth) cannot be changed as it matches your government-issued ID.
      </p>

      <p>Start exploring verified listings and connect with verified roommates today!</p>
    `;
        return this.getBaseTemplate(content);
    }

    /**
     * Verification failure email template
     */
    private getVerificationFailureTemplate(
        name: string,
        reason: string,
        remainingAttempts: number,
    ): string {
        const content = `
      <h1 style="color: #ef4444; margin-bottom: 20px;">Verification Update</h1>
      <p>Hi ${name},</p>
      <p>Unfortunately, your identity verification was not successful.</p>
      
      <div style="background: #fee2e2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0; color: #7f1d1d;">
          <strong>Reason:</strong> ${reason}
        </p>
      </div>

      ${
        remainingAttempts > 0
          ? `
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 8px; margin: 30px 0;">
        <h2 style="color: white; margin: 0 0 10px 0;">Try Again</h2>
        <p style="color: white; margin: 0;">You have <strong>${remainingAttempts} attempt${remainingAttempts > 1 ? 's' : ''}</strong> remaining today.</p>
        <p style="color: white; margin: 10px 0 0 0;">
          <a href="${this.configService.get<string>('FRONTEND_URL')}/verification" 
             style="display: inline-block; background: white; color: #7c3aed; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 10px;">
            Retry Verification
          </a>
        </p>
      </div>

      <h3>Tips for Successful Verification:</h3>
      <ul>
        <li>Ensure good lighting when taking photos</li>
        <li>Use a valid, non-expired government ID</li>
        <li>Make sure all text on the ID is clearly visible</li>
        <li>Remove any glare or reflections</li>
        <li>Hold the ID steady when capturing</li>
      </ul>
      `
          : `
      <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0; color: #78350f;">
          <strong>Daily Limit Reached:</strong> You've used all 3 verification attempts for today. Please try again tomorrow.
        </p>
      </div>

      <p>If you continue to experience issues, please contact our support team for assistance.</p>
      `
      }

      <p style="color: #666; font-size: 14px; margin-top: 30px;">
        If you have questions or need help, reply to this email or contact our support team.
      </p>
    `;
        return this.getBaseTemplate(content);
    }
}
