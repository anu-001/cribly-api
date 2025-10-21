export interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

export interface EmailTemplateContext {
  [key: string]: any;
}

export interface WelcomeEmailContext extends EmailTemplateContext {
  firstName: string;
  verificationUrl: string;
  supportEmail: string;
}

export interface PasswordResetContext extends EmailTemplateContext {
  firstName: string;
  resetUrl: string;
  expirationTime: string;
}

export interface MatchNotificationContext extends EmailTemplateContext {
  firstName: string;
  matchType: 'property' | 'roommate';
  matchTitle: string;
  matcherName: string;
  viewUrl: string;
}

export interface MessageNotificationContext extends EmailTemplateContext {
  firstName: string;
  senderName: string;
  messagePreview: string;
  conversationUrl: string;
}
