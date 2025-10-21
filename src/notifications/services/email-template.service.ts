import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  EmailTemplate,
  WelcomeEmailContext,
  PasswordResetContext,
  MatchNotificationContext,
  MessageNotificationContext,
} from '../templates/email-template.interface';

@Injectable()
export class EmailTemplateService {
  private readonly frontendUrl: string;
  private readonly supportEmail: string;
  private readonly companyName = 'Cribly';
  private readonly brandColor = '#2563eb';
  private readonly accentColor = '#f59e0b';

  constructor(private readonly configService: ConfigService) {
    this.frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'https://cribly.com';
    this.supportEmail =
      this.configService.get<string>('SUPPORT_EMAIL') || 'hello@cribly.com';
  }

  private getBaseStyles(): string {
    return `
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; 
          line-height: 1.6; 
          color: #1f2937; 
          background-color: #f9fafb;
          margin: 0;
          padding: 20px;
        }
        .email-container { 
          max-width: 600px; 
          margin: 0 auto; 
          background: #ffffff; 
          border-radius: 12px; 
          overflow: hidden; 
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .header { 
          background: linear-gradient(135deg, ${this.brandColor} 0%, #1d4ed8 100%); 
          color: white; 
          padding: 40px 30px; 
          text-align: center; 
        }
        .header h1 { 
          font-size: 28px; 
          font-weight: 700; 
          margin-bottom: 8px; 
          letter-spacing: -0.5px;
        }
        .header p { 
          font-size: 16px; 
          opacity: 0.9; 
          margin: 0;
        }
        .content { 
          padding: 40px 30px; 
          background: #ffffff; 
        }
        .content h2 { 
          color: #111827; 
          font-size: 24px; 
          font-weight: 600; 
          margin-bottom: 20px;
          letter-spacing: -0.3px;
        }
        .content p { 
          margin-bottom: 16px; 
          font-size: 16px; 
          line-height: 1.7; 
          color: #374151;
        }
        .button { 
          display: inline-block; 
          padding: 16px 32px; 
          background: ${this.brandColor}; 
          color: white; 
          text-decoration: none; 
          border-radius: 8px; 
          font-weight: 600; 
          font-size: 16px;
          transition: background-color 0.2s;
        }
        .button:hover { 
          background: #1d4ed8; 
        }
        .button-center { 
          text-align: center; 
          margin: 32px 0; 
        }
        .highlight-box { 
          background: #eff6ff; 
          border: 1px solid #dbeafe;
          border-left: 4px solid ${this.brandColor}; 
          padding: 20px; 
          border-radius: 8px; 
          margin: 24px 0; 
        }
        .highlight-box h3 { 
          color: ${this.brandColor}; 
          font-size: 18px; 
          font-weight: 600; 
          margin-bottom: 8px; 
        }
        .feature-list { 
          list-style: none; 
          padding: 0; 
          margin: 20px 0; 
        }
        .feature-list li { 
          padding: 8px 0; 
          font-size: 16px; 
          color: #374151;
          position: relative;
          padding-left: 24px;
        }
        .feature-list li:before {
          content: "✓";
          position: absolute;
          left: 0;
          color: #10b981;
          font-weight: bold;
        }
        .footer { 
          background: #f3f4f6; 
          padding: 30px; 
          text-align: center; 
          border-top: 1px solid #e5e7eb;
        }
        .footer p { 
          font-size: 14px; 
          color: #6b7280; 
          margin-bottom: 8px; 
        }
        .footer a { 
          color: ${this.brandColor}; 
          text-decoration: none; 
        }
        .warning-box {
          background: #fef3c7;
          border: 1px solid #f59e0b;
          border-left: 4px solid ${this.accentColor};
          padding: 16px;
          border-radius: 8px;
          margin: 20px 0;
        }
        .warning-box p {
          color: #92400e;
          margin-bottom: 0;
        }
        .match-card {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-left: 4px solid #10b981;
          padding: 20px;
          border-radius: 8px;
          margin: 24px 0;
        }
        .match-card h3 {
          color: #047857;
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 12px;
        }
        .url-text {
          word-break: break-all;
          color: #6b7280;
          font-size: 14px;
          background: #f9fafb;
          padding: 12px;
          border-radius: 6px;
          border: 1px solid #e5e7eb;
          font-family: 'Courier New', monospace;
        }
      </style>
    `;
  }

  /**
   * Welcome & Email Verification Template
   */
  getWelcomeTemplate(context: WelcomeEmailContext): EmailTemplate {
    const subject = `Welcome to ${this.companyName} - Let's Find Your Perfect Home! 🏠`;

    const html = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to ${this.companyName}</title>
          ${this.getBaseStyles()}
        </head>
        <body>
          <div class="email-container">
            <div class="header">
              <h1>🏠 Welcome to ${this.companyName}!</h1>
              <p>Canada's trusted housing & roommate platform</p>
            </div>
            
            <div class="content">
              <h2>Hey ${context.firstName}! 👋</h2>
              
              <p>Welcome to <strong>${this.companyName}</strong> - we're thrilled you've joined thousands of Canadians finding their perfect home and ideal roommates!</p>
              
              <div class="highlight-box">
                <h3>🔐 Verify your email to get started</h3>
                <p>Before you dive into browsing amazing properties and connecting with potential roommates, let's make sure your account is secure.</p>
              </div>
              
              <div class="button-center">
                <a href="${context.verificationUrl}" class="button">Verify My Email Address</a>
              </div>
              
              <p><strong>What makes ${this.companyName} special:</strong></p>
              <ul class="feature-list">
                <li>Browse verified property listings across Canada</li>
                <li>Find compatible roommates with our smart matching</li>
                <li>Connect safely through our secure messaging system</li>
                <li>Get personalized recommendations based on your preferences</li>
                <li>Access exclusive listings from trusted landlords</li>
              </ul>
              
              <p>Ready to start your housing journey? Once verified, you can create your profile, set your preferences, and start discovering your next home.</p>
              
              <p>Questions or need help getting started? Our support team is here for you at <a href="mailto:${context.supportEmail}">${context.supportEmail}</a></p>
              
              <p>Here's to finding your perfect place! 🎉</p>
              <p><strong>The ${this.companyName} Team</strong></p>
            </div>
            
            <div class="footer">
              <p>© 2024 ${this.companyName}. Proudly Canadian 🇨🇦</p>
              <p>Didn't sign up? <a href="mailto:${context.supportEmail}">Let us know</a> and we'll take care of it.</p>
              <p>This verification link expires in 24 hours for your security.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
      Welcome to ${this.companyName}!
      
      Hey ${context.firstName},
      
      Welcome to ${this.companyName} - Canada's trusted housing & roommate platform!
      
      Please verify your email address: ${context.verificationUrl}
      
      What makes ${this.companyName} special:
      ✓ Browse verified property listings across Canada
      ✓ Find compatible roommates with our smart matching
      ✓ Connect safely through our secure messaging system
      ✓ Get personalized recommendations based on your preferences
      ✓ Access exclusive listings from trusted landlords
      
      Questions? Contact us: ${context.supportEmail}
      
      The ${this.companyName} Team
      
      This verification link expires in 24 hours.
    `;

    return { subject, html, text };
  }

  /**
   * Password Reset Template
   */
  getPasswordResetTemplate(context: PasswordResetContext): EmailTemplate {
    const subject = `Reset Your ${this.companyName} Password - Secure & Quick`;

    const html = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset - ${this.companyName}</title>
          ${this.getBaseStyles()}
        </head>
        <body>
          <div class="email-container">
            <div class="header">
              <h1>🔐 Password Reset Request</h1>
              <p>${this.companyName} Security</p>
            </div>
            
            <div class="content">
              <h2>Hi ${context.firstName},</h2>
              
              <p>We received a request to reset your ${this.companyName} account password. No worries - it happens to the best of us!</p>
              
              <div class="warning-box">
                <p><strong>⚠️ Security Check:</strong> If you didn't request this password reset, you can safely ignore this email. Your account remains secure and no changes will be made.</p>
              </div>
              
              <p>Ready to set a new password? Click the button below:</p>
              
              <div class="button-center">
                <a href="${context.resetUrl}" class="button">Reset My Password</a>
              </div>
              
              <p><strong>Important security details:</strong></p>
              <ul class="feature-list">
                <li>This secure link expires in ${context.expirationTime}</li>
                <li>The link can only be used once for your protection</li>
                <li>Choose a strong password with at least 8 characters</li>
                <li>Consider using a password manager for extra security</li>
              </ul>
              
              <p>Having trouble with the button? Copy and paste this link into your browser:</p>
              <div class="url-text">${context.resetUrl}</div>
              
              <p>Need assistance? Our security team is here to help at <a href="mailto:${this.supportEmail}">${this.supportEmail}</a></p>
              
              <p>Stay secure,<br><strong>The ${this.companyName} Security Team</strong></p>
            </div>
            
            <div class="footer">
              <p>© 2024 ${this.companyName}. Your security is our priority.</p>
              <p>This is an automated security notification.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
      Password Reset - ${this.companyName}
      
      Hi ${context.firstName},
      
      We received a request to reset your ${this.companyName} account password.
      
      Reset your password: ${context.resetUrl}
      
      Important:
      - Link expires in ${context.expirationTime}
      - Can only be used once
      - If you didn't request this, ignore this email
      
      Need help? Contact: ${this.supportEmail}
      
      The ${this.companyName} Security Team
    `;

    return { subject, html, text };
  }

  /**
   * Match Notification Template
   */
  getMatchNotificationTemplate(
    context: MatchNotificationContext,
  ): EmailTemplate {
    const matchTypeText =
      context.matchType === 'property' ? 'Property Match' : 'Roommate Match';
    const emoji = context.matchType === 'property' ? '🏠' : '👥';
    const subject = `${emoji} You've Got a ${matchTypeText} - "${context.matchTitle}"`;

    const html = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Match - ${this.companyName}</title>
          ${this.getBaseStyles()}
        </head>
        <body>
          <div class="email-container">
            <div class="header">
              <h1>${emoji} You've Got a Match!</h1>
              <p>${this.companyName} - Connecting Canadians</p>
            </div>
            
            <div class="content">
              <h2>Exciting news, ${context.firstName}! 🎉</h2>
              
              <p>Someone's interested in your ${context.matchType === 'property' ? 'property listing' : 'roommate profile'}! This could be the start of something great.</p>
              
              <div class="match-card">
                <h3>📋 Match Details</h3>
                <p><strong>${matchTypeText}:</strong> ${context.matchTitle}</p>
                <p><strong>Interested Person:</strong> ${context.matcherName}</p>
                <p><strong>Status:</strong> Awaiting your response</p>
              </div>
              
              <div class="button-center">
                <a href="${context.viewUrl}" class="button">View Match & Connect</a>
              </div>
              
              <p><strong>Your next steps:</strong></p>
              <ul class="feature-list">
                <li>Review their ${context.matchType === 'property' ? 'profile and requirements' : 'housing preferences and lifestyle'}</li>
                <li>Start a conversation to learn more about each other</li>
                <li>Share details about ${context.matchType === 'property' ? 'your property' : 'your living situation'}</li>
                <li>Arrange a ${context.matchType === 'property' ? 'property viewing' : 'meet-up'} when you're both ready</li>
              </ul>
              
              <div class="highlight-box">
                <h3>💡 Pro Tips for Success</h3>
                <p>Respond within 24 hours to show genuine interest, ask thoughtful questions about compatibility, be honest about your expectations, and always prioritize safety when meeting in person.</p>
              </div>
              
              <p>The best matches happen when both parties are engaged and communicative. Don't let this opportunity slip away!</p>
              
              <p>Happy matching! 🤝</p>
              <p><strong>The ${this.companyName} Team</strong></p>
            </div>
            
            <div class="footer">
              <p>© 2024 ${this.companyName}. Building communities, one match at a time.</p>
              <p><a href="${this.frontendUrl}/settings/notifications">Manage your notification preferences</a></p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
      New ${matchTypeText} - ${this.companyName}
      
      Exciting news, ${context.firstName}!
      
      Someone's interested in your ${context.matchType === 'property' ? 'property listing' : 'roommate profile'}.
      
      Match Details:
      ${matchTypeText}: ${context.matchTitle}
      Interested Person: ${context.matcherName}
      Status: Awaiting your response
      
      View and connect: ${context.viewUrl}
      
      Next steps:
      - Review their ${context.matchType === 'property' ? 'profile and requirements' : 'housing preferences'}
      - Start a conversation
      - Share relevant details
      - Arrange a ${context.matchType === 'property' ? 'viewing' : 'meet-up'}
      
      Happy matching!
      The ${this.companyName} Team
    `;

    return { subject, html, text };
  }

  /**
   * New Message Notification Template
   */
  getMessageNotificationTemplate(
    context: MessageNotificationContext,
  ): EmailTemplate {
    const subject = `💬 New message from ${context.senderName} on ${this.companyName}`;

    const html = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Message - ${this.companyName}</title>
          ${this.getBaseStyles()}
        </head>
        <body>
          <div class="email-container">
            <div class="header">
              <h1>💬 New Message</h1>
              <p>${this.companyName} Messaging</p>
            </div>
            
            <div class="content">
              <h2>Hi ${context.firstName}!</h2>
              
              <p>You have a new message from <strong>${context.senderName}</strong> waiting for you on ${this.companyName}.</p>
              
              <div class="highlight-box">
                <h3>📝 Message Preview</h3>
                <p style="font-style: italic; color: #374151;">"${context.messagePreview}"</p>
              </div>
              
              <div class="button-center">
                <a href="${context.conversationUrl}" class="button">Read Full Message</a>
              </div>
              
              <p><strong>Why quick responses matter:</strong></p>
              <ul class="feature-list">
                <li>Shows you're genuinely interested and engaged</li>
                <li>Keeps the conversation momentum going</li>
                <li>Helps build trust and rapport</li>
                <li>Increases your chances of finding the perfect match</li>
              </ul>
              
              <p>Great connections start with great conversations. Take a moment to reply and keep the dialogue flowing!</p>
              
              <p>Happy chatting! 😊</p>
              <p><strong>The ${this.companyName} Team</strong></p>
            </div>
            
            <div class="footer">
              <p>© 2024 ${this.companyName}. Facilitating meaningful connections.</p>
              <p><a href="${this.frontendUrl}/settings/notifications">Turn off message notifications</a> | <a href="${this.frontendUrl}/help">Get Help</a></p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
      New Message - ${this.companyName}
      
      Hi ${context.firstName}!
      
      You have a new message from ${context.senderName} on ${this.companyName}.
      
      Message preview: "${context.messagePreview}"
      
      Read full message: ${context.conversationUrl}
      
      Quick responses help build better connections and show genuine interest.
      
      Happy chatting!
      The ${this.companyName} Team
    `;

    return { subject, html, text };
  }

  /**
   * Account Deletion Confirmation Template
   */
  getAccountDeletionTemplate(firstName: string): EmailTemplate {
    const subject = `Account Successfully Deleted - Thank You for Using ${this.companyName}`;

    const html = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Account Deleted - ${this.companyName}</title>
          ${this.getBaseStyles()}
        </head>
        <body>
          <div class="email-container">
            <div class="header" style="background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);">
              <h1>👋 Account Successfully Deleted</h1>
              <p>${this.companyName}</p>
            </div>
            
            <div class="content">
              <h2>Goodbye ${firstName},</h2>
              
              <p>Your ${this.companyName} account has been permanently deleted as requested. We're sorry to see you go, and we hope our platform was helpful during your housing journey.</p>
              
              <div class="highlight-box">
                <h3>📋 What we've removed:</h3>
                <ul class="feature-list">
                  <li>Your profile and personal information</li>
                  <li>All property and roommate listings</li>
                  <li>Match history and conversation records</li>
                  <li>Notification preferences and settings</li>
                  <li>Account activity and saved searches</li>
                </ul>
              </div>
              
              <p><strong>📧 Privacy Assurance:</strong> This email address has been permanently removed from all our mailing lists and databases. You will not receive any further communications from ${this.companyName}.</p>
              
              <p><strong>🔄 Changed your mind?</strong> While your current account data is gone, you're always welcome to create a fresh account at <a href="${this.frontendUrl}" style="color: ${this.brandColor};">${this.frontendUrl}</a> if your housing needs change in the future.</p>
              
              <p>Thank you for being part of the ${this.companyName} community. We wish you all the best in your future housing endeavors!</p>
              
              <p>With appreciation,<br><strong>The ${this.companyName} Team</strong></p>
            </div>
            
            <div class="footer">
              <p>© 2024 ${this.companyName}. Respecting your privacy choices.</p>
              <p>This is your final communication from us. Your data deletion is complete.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
      Account Successfully Deleted - ${this.companyName}
      
      Goodbye ${firstName},
      
      Your ${this.companyName} account has been permanently deleted as requested.
      
      What we've removed:
      - Your profile and personal information
      - All property and roommate listings
      - Match history and conversation records
      - Notification preferences and settings
      - Account activity and saved searches
      
      This email address has been removed from all our systems.
      
      Changed your mind? You can create a new account at ${this.frontendUrl}
      
      Thank you for being part of the ${this.companyName} community.
      
      The ${this.companyName} Team
    `;

    return { subject, html, text };
  }
}
