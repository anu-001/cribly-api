import {
    Injectable,
    UnauthorizedException,
    BadRequestException,
    ConflictException,
    Logger
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import {
    SignUpDto,
    SignInDto,
    RefreshTokenDto,
    ForgotPasswordDto,
    ResetPasswordDto,
    VerifyEmailDto,
    AuthResponseDto,
    MessageResponseDto
} from './dto/auth.dto';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        private configService: ConfigService,
        private prismaService: PrismaService,
        private jwtService: JwtService,
    ) { }

    async signUp(signUpDto: SignUpDto): Promise<AuthResponseDto> {
        try {
            // Check if user already exists
            const existingUser = await this.prismaService.user.findUnique({
                where: { email: signUpDto.email },
            });

            if (existingUser) {
                throw new ConflictException('User with this email already exists');
            }

            // Hash password
            const saltRounds = 12;
            const passwordHash = await bcrypt.hash(signUpDto.password, saltRounds);

            // Generate email verification token
            const emailVerificationToken = randomBytes(32).toString('hex');

            // Create user
            const user = await this.prismaService.user.create({
                data: {
                    email: signUpDto.email,
                    firstName: signUpDto.firstName,
                    lastName: signUpDto.lastName,
                    phone: signUpDto.phone,
                    passwordHash,
                    emailVerificationToken,
                    emailVerified: false, // Require email verification
                    isActive: true,
                },
            });

            // Generate tokens
            const { accessToken, refreshToken } = await this.generateTokens(user.id);

            // Store refresh token
            await this.storeRefreshToken(user.id, refreshToken);

            // TODO: Send verification email (implement later)
            this.logger.log(`User registered: ${user.email}. Verification token: ${emailVerificationToken}`);

            return {
                accessToken,
                refreshToken,
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    avatar: user.avatar,
                    emailVerified: user.emailVerified,
                    createdAt: user.createdAt,
                },
            };
        } catch (error) {
            this.logger.error('Sign up failed', error);
            throw error;
        }
    }

    async signIn(signInDto: SignInDto): Promise<AuthResponseDto> {
        try {
            // Find user by email
            const user = await this.prismaService.user.findUnique({
                where: { email: signInDto.email },
            });

            if (!user || !user.passwordHash) {
                throw new UnauthorizedException('Invalid email or password');
            }

            if (!user.isActive) {
                throw new UnauthorizedException('Account is deactivated');
            }

            // Verify password
            const isPasswordValid = await bcrypt.compare(signInDto.password, user.passwordHash);
            if (!isPasswordValid) {
                throw new UnauthorizedException('Invalid email or password');
            }

            // Generate tokens
            const { accessToken, refreshToken } = await this.generateTokens(user.id);

            // Store refresh token and update last login
            await Promise.all([
                this.storeRefreshToken(user.id, refreshToken),
                this.prismaService.user.update({
                    where: { id: user.id },
                    data: { lastLogin: new Date() },
                }),
            ]);

            return {
                accessToken,
                refreshToken,
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    avatar: user.avatar,
                    emailVerified: user.emailVerified,
                    createdAt: user.createdAt,
                },
            };
        } catch (error) {
            this.logger.error('Sign in failed', error);
            throw error;
        }
    }

    async refreshToken(refreshTokenDto: RefreshTokenDto): Promise<{ accessToken: string }> {
        try {
            // Find user by refresh token
            const user = await this.prismaService.user.findUnique({
                where: { refreshToken: refreshTokenDto.refreshToken },
            });

            if (!user) {
                throw new UnauthorizedException('Invalid refresh token');
            }

            // Verify refresh token
            try {
                await this.jwtService.verifyAsync(refreshTokenDto.refreshToken, {
                    secret: this.configService.get('JWT_REFRESH_SECRET'),
                });
            } catch {
                throw new UnauthorizedException('Invalid refresh token');
            }

            // Generate new access token
            const accessToken = await this.jwtService.signAsync(
                { sub: user.id, email: user.email },
                {
                    secret: this.configService.get('JWT_SECRET'),
                    expiresIn: '15m',
                }
            );

            return { accessToken };
        } catch (error) {
            this.logger.error('Refresh token failed', error);
            throw error;
        }
    }

    async signOut(userId: string): Promise<MessageResponseDto> {
        try {
            // Clear refresh token
            await this.prismaService.user.update({
                where: { id: userId },
                data: { refreshToken: null },
            });

            return {
                message: 'Successfully signed out',
                success: true,
            };
        } catch (error) {
            this.logger.error('Sign out failed', error);
            throw error;
        }
    }

    async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<MessageResponseDto> {
        try {
            const user = await this.prismaService.user.findUnique({
                where: { email: forgotPasswordDto.email },
            });

            if (!user) {
                // Don't reveal if email exists or not for security
                return {
                    message: 'If an account with that email exists, a password reset link has been sent',
                    success: true,
                };
            }

            // Generate password reset token
            const resetToken = randomBytes(32).toString('hex');
            const resetExpires = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

            await this.prismaService.user.update({
                where: { id: user.id },
                data: {
                    passwordResetToken: resetToken,
                    passwordResetExpires: resetExpires,
                },
            });

            // TODO: Send password reset email
            this.logger.log(`Password reset requested for: ${user.email}. Reset token: ${resetToken}`);

            return {
                message: 'If an account with that email exists, a password reset link has been sent',
                success: true,
            };
        } catch (error) {
            this.logger.error('Forgot password failed', error);
            throw error;
        }
    }

    async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<MessageResponseDto> {
        try {
            const user = await this.prismaService.user.findUnique({
                where: { passwordResetToken: resetPasswordDto.token },
            });

            if (!user || !user.passwordResetExpires || user.passwordResetExpires < new Date()) {
                throw new BadRequestException('Invalid or expired reset token');
            }

            // Hash new password
            const saltRounds = 12;
            const passwordHash = await bcrypt.hash(resetPasswordDto.newPassword, saltRounds);

            // Update password and clear reset token
            await this.prismaService.user.update({
                where: { id: user.id },
                data: {
                    passwordHash,
                    passwordResetToken: null,
                    passwordResetExpires: null,
                    refreshToken: null, // Force re-login
                },
            });

            return {
                message: 'Password reset successful',
                success: true,
            };
        } catch (error) {
            this.logger.error('Reset password failed', error);
            throw error;
        }
    }

    async verifyEmail(verifyEmailDto: VerifyEmailDto): Promise<MessageResponseDto> {
        try {
            const user = await this.prismaService.user.findUnique({
                where: { emailVerificationToken: verifyEmailDto.token },
            });

            if (!user) {
                throw new BadRequestException('Invalid verification token');
            }

            await this.prismaService.user.update({
                where: { id: user.id },
                data: {
                    emailVerified: true,
                    emailVerificationToken: null,
                },
            });

            return {
                message: 'Email verified successfully',
                success: true,
            };
        } catch (error) {
            this.logger.error('Email verification failed', error);
            throw error;
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
                    emailVerified: true,
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

    // Private helper methods
    private async generateTokens(userId: string): Promise<{ accessToken: string; refreshToken: string }> {
        const user = await this.prismaService.user.findUnique({
            where: { id: userId },
            select: { id: true, email: true },
        });

        const payload = { sub: userId, email: user.email };

        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(payload, {
                secret: this.configService.get('JWT_SECRET'),
                expiresIn: '15m',
            }),
            this.jwtService.signAsync(payload, {
                secret: this.configService.get('JWT_REFRESH_SECRET'),
                expiresIn: '7d',
            }),
        ]);

        return { accessToken, refreshToken };
    }

    private async storeRefreshToken(userId: string, refreshToken: string): Promise<void> {
        await this.prismaService.user.update({
            where: { id: userId },
            data: { refreshToken },
        });
    }

    async validateUser(userId: string) {
        const user = await this.prismaService.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                isActive: true,
                emailVerified: true,
            },
        });

        if (!user || !user.isActive) {
            return null;
        }

        return user;
    }
}