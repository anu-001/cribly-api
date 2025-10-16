import { Injectable, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { PrismaService } from '../prisma/prisma.service';
import { SignUpDto, SignInDto, RefreshTokenDto, ResetPasswordDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
    private readonly supabase: SupabaseClient;
    private readonly logger = new Logger(AuthService.name);

    constructor(
        private configService: ConfigService,
        private prismaService: PrismaService,
    ) {
        this.supabase = createClient(
            this.configService.get('SUPABASE_URL'),
            this.configService.get('SUPABASE_ANON_KEY'),
        );
    }

    async signUp(signUpDto: SignUpDto) {
        try {
            const { data, error } = await this.supabase.auth.signUp({
                email: signUpDto.email,
                password: signUpDto.password,
                options: {
                    data: {
                        firstName: signUpDto.firstName,
                        lastName: signUpDto.lastName,
                    },
                },
            });

            if (error) {
                throw new BadRequestException(error.message);
            }

            // Create user in our database
            if (data.user) {
                await this.prismaService.user.create({
                    data: {
                        id: data.user.id,
                        email: data.user.email!,
                        firstName: signUpDto.firstName,
                        lastName: signUpDto.lastName,
                        supabaseId: data.user.id,
                    },
                });
            }

            return {
                user: data.user,
                session: data.session,
            };
        } catch (error) {
            this.logger.error('Sign up failed', error);
            throw error;
        }
    }

    async signIn(signInDto: SignInDto) {
        try {
            const { data, error } = await this.supabase.auth.signInWithPassword({
                email: signInDto.email,
                password: signInDto.password,
            });

            if (error) {
                throw new UnauthorizedException(error.message);
            }

            return {
                user: data.user,
                session: data.session,
            };
        } catch (error) {
            this.logger.error('Sign in failed', error);
            throw error;
        }
    }

    async signOut(accessToken: string) {
        try {
            const { error } = await this.supabase.auth.admin.signOut(accessToken);

            if (error) {
                throw new BadRequestException(error.message);
            }

            return { success: true };
        } catch (error) {
            this.logger.error('Sign out failed', error);
            throw error;
        }
    }

    async refreshToken(refreshTokenDto: RefreshTokenDto) {
        try {
            const { data, error } = await this.supabase.auth.refreshSession({
                refresh_token: refreshTokenDto.refreshToken,
            });

            if (error) {
                throw new UnauthorizedException(error.message);
            }

            return {
                user: data.user,
                session: data.session,
            };
        } catch (error) {
            this.logger.error('Token refresh failed', error);
            throw error;
        }
    }

    async resetPassword(resetPasswordDto: ResetPasswordDto) {
        try {
            const { error } = await this.supabase.auth.resetPasswordForEmail(
                resetPasswordDto.email,
                {
                    redirectTo: `${this.configService.get('FRONTEND_URL')}/reset-password`,
                },
            );

            if (error) {
                throw new BadRequestException(error.message);
            }

            return { success: true };
        } catch (error) {
            this.logger.error('Password reset failed', error);
            throw error;
        }
    }

    async verifyToken(token: string) {
        try {
            const { data: user, error } = await this.supabase.auth.getUser(token);

            if (error || !user) {
                throw new UnauthorizedException('Invalid token');
            }

            return user.user;
        } catch (error) {
            this.logger.error('Token verification failed', error);
            throw new UnauthorizedException('Token verification failed');
        }
    }

    async getCurrentUser(userId: string) {
        try {
            const user = await this.prismaService.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    avatar: true,
                    phone: true,
                    bio: true,
                    latitude: true,
                    longitude: true,
                    preferences: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });

            if (!user) {
                throw new UnauthorizedException('User not found');
            }

            return user;
        } catch (error) {
            this.logger.error('Get current user failed', error);
            throw error;
        }
    }

    async confirmEmailWithToken(tokenHash: string) {
        try {
            this.logger.log('Confirming email with token hash');

            // Verify the email confirmation token with Supabase
            const { data, error } = await this.supabase.auth.verifyOtp({
                token_hash: tokenHash,
                type: 'signup'
            });

            if (error) {
                this.logger.error('Supabase email confirmation error:', error);
                throw new BadRequestException(`Email confirmation failed: ${error.message}`);
            }

            if (!data.user) {
                throw new BadRequestException('No user found in confirmation data');
            }

            this.logger.log(`Email confirmed for user: ${data.user.id}`);

            // Update or create user in our database after email confirmation
            const { user_metadata } = data.user;
            await this.prismaService.user.upsert({
                where: { id: data.user.id },
                update: {
                    email: data.user.email!,
                },
                create: {
                    id: data.user.id,
                    email: data.user.email!,
                    firstName: user_metadata?.firstName || '',
                    lastName: user_metadata?.lastName || '',
                    supabaseId: data.user.id,
                },
            });

            return {
                success: true,
                message: 'Email confirmed successfully',
                user: data.user,
                session: data.session,
            };

        } catch (error) {
            this.logger.error('Email confirmation failed:', error);
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new BadRequestException('Email confirmation failed');
        }
    }
}