import {
    Injectable,
    CanActivate,
    ExecutionContext,
    UnauthorizedException,
    Logger,
} from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';
import { TokenBlacklistService } from '../services/token-blacklist.service';
import { SecurityService } from '../services/security.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
    private readonly logger = new Logger(JwtAuthGuard.name);

    constructor(
        private configService: ConfigService,
        private tokenBlacklistService: TokenBlacklistService,
        private securityService: SecurityService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const token = this.extractTokenFromHeader(request);

        if (!token) {
            this.securityService.logSecurityEvent('NO_TOKEN_PROVIDED', {
                ip: request.ip,
                userAgent: request.get('user-agent'),
                path: request.url,
            });
            throw new UnauthorizedException('No token provided');
        }

        // Check token blacklist
        if (this.tokenBlacklistService.isTokenBlacklisted(token)) {
            this.securityService.logSecurityEvent('BLACKLISTED_TOKEN_USED', {
                ip: request.ip,
                userAgent: request.get('user-agent'),
                tokenPrefix: token.substring(0, 20),
            });
            throw new UnauthorizedException('Token has been revoked');
        }

        try {
            const supabase = createClient(
                this.configService.get('SUPABASE_URL'),
                this.configService.get('SUPABASE_ANON_KEY'),
            );

            const { data: user, error } = await supabase.auth.getUser(token);

            if (error || !user) {
                this.securityService.logSecurityEvent('INVALID_TOKEN', {
                    ip: request.ip,
                    error: error?.message,
                    tokenPrefix: token.substring(0, 20),
                });
                throw new UnauthorizedException('Invalid token');
            }

            // Attach user and token to request object
            request.user = user.user;
            request.token = token;

            this.logger.debug(`User authenticated: ${user.user.email}`);
            return true;
        } catch (error) {
            this.securityService.logSecurityEvent('TOKEN_VALIDATION_FAILED', {
                ip: request.ip,
                error: error.message,
                tokenPrefix: token.substring(0, 20),
            });

            if (error instanceof UnauthorizedException) {
                throw error;
            }

            throw new UnauthorizedException('Token validation failed');
        }
    }

    private extractTokenFromHeader(request: any): string | undefined {
        const [type, token] = request.headers.authorization?.split(' ') ?? [];
        return type === 'Bearer' ? token : undefined;
    }
}