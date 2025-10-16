import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'crypto';

@Injectable()
export class SecurityService {
    private readonly logger = new Logger(SecurityService.name);

    /**
     * Sanitize HTML input to prevent XSS attacks
     */
    sanitizeHtml(input: string): string {
        if (!input) return input;
        
        return input
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;');
    }

    /**
     * Sanitize object recursively
     */
    sanitizeObject(obj: any): any {
        if (typeof obj === 'string') {
            return this.sanitizeHtml(obj);
        }
        
        if (Array.isArray(obj)) {
            return obj.map(item => this.sanitizeObject(item));
        }
        
        if (obj && typeof obj === 'object') {
            const sanitized: any = {};
            for (const [key, value] of Object.entries(obj)) {
                sanitized[key] = this.sanitizeObject(value);
            }
            return sanitized;
        }
        
        return obj;
    }

    /**
     * Hash sensitive data
     */
    hashData(data: string): string {
        return createHash('sha256').update(data).digest('hex');
    }

    /**
     * Validate email format
     */
    isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Check password strength
     */
    isStrongPassword(password: string): { isValid: boolean; message?: string } {
        if (password.length < 6) {
            return { isValid: false, message: 'Password must be at least 6 characters long' };
        }
        
        if (!/(?=.*[a-z])/.test(password)) {
            return { isValid: false, message: 'Password must contain at least one lowercase letter' };
        }
        
        if (!/(?=.*\d)/.test(password)) {
            return { isValid: false, message: 'Password must contain at least one number' };
        }
        
        return { isValid: true };
    }

    /**
     * Log security events
     */
    logSecurityEvent(event: string, context: any = {}): void {
        this.logger.warn(`Security Event: ${event}`, {
            timestamp: new Date().toISOString(),
            ...context
        });
    }
}