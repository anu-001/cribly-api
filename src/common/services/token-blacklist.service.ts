import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class TokenBlacklistService {
    private readonly logger = new Logger(TokenBlacklistService.name);
    private blacklistedTokens = new Set<string>();

    /**
     * Add token to blacklist (for logout functionality)
     */
    blacklistToken(token: string): void {
        this.blacklistedTokens.add(token);
        this.logger.log(`Token blacklisted: ${token.substring(0, 20)}...`);
    }

    /**
     * Check if token is blacklisted
     */
    isTokenBlacklisted(token: string): boolean {
        return this.blacklistedTokens.has(token);
    }

    /**
     * Clean expired tokens from blacklist (optional optimization)
     */
    cleanExpiredTokens(): void {
        // In production, implement token expiry check and cleanup
        // For now, we'll keep it simple
        this.logger.debug('Token cleanup executed');
    }
}