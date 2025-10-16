import {
    Controller,
    Post,
    Get,
    Body,
    UseGuards,
    HttpCode,
    HttpStatus,
    Query,
    Res,
} from '@nestjs/common';
import { Response } from 'express';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiBody,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import {
    SignUpDto,
    SignInDto,
    RefreshTokenDto,
    ResetPasswordDto,
} from './dto/auth.dto';
import { SUCCESS_MESSAGES } from '../common/constants/app.constants';
import { BaseController } from '../common/controllers/base.controller';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController extends BaseController {
    constructor(private readonly authService: AuthService) {
        super();
    }

    @Post('signup')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({
        summary: 'User Registration',
        description: 'Create a new user account with email and password. Returns JWT tokens for immediate authentication.'
    })
    @ApiBody({ type: SignUpDto })
    @ApiResponse({
        status: 201,
        description: 'User successfully registered',
        schema: {
            example: {
                user: {
                    id: "uuid-string",
                    email: "user@example.com",
                    firstName: "John",
                    lastName: "Doe"
                },
                tokens: {
                    access_token: "jwt-token",
                    refresh_token: "refresh-token"
                },
                message: "Registration successful"
            }
        }
    })
    @ApiResponse({ status: 400, description: 'Invalid input data' })
    @ApiResponse({ status: 409, description: 'User already exists' })
    async signUp(@Body() signUpDto: SignUpDto) {
        const result = await this.authService.signUp(signUpDto);
        return {
            ...result,
            message: SUCCESS_MESSAGES.USER_CREATED,
        };
    }

    @Post('signin')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'User Login',
        description: 'Authenticate user with email/password and return JWT tokens.'
    })
    @ApiBody({ type: SignInDto })
    @ApiResponse({
        status: 200,
        description: 'Login successful',
        schema: {
            example: {
                user: {
                    id: "uuid-string",
                    email: "user@example.com",
                    firstName: "John",
                    lastName: "Doe"
                },
                tokens: {
                    access_token: "jwt-token",
                    refresh_token: "refresh-token"
                }
            }
        }
    })
    @ApiResponse({ status: 401, description: 'Invalid credentials' })
    async signIn(@Body() signInDto: SignInDto) {
        return this.authService.signIn(signInDto);
    }

    @Post('signout')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'User Logout',
        description: 'Invalidate the current JWT token and log out the user.'
    })
    @ApiBearerAuth('JWT-auth')
    @ApiResponse({ status: 200, description: 'Successfully logged out' })
    @ApiResponse({ status: 401, description: 'Invalid or expired token' })
    async signOut(@CurrentUser() user: any) {
        return this.authService.signOut(user.access_token);
    }

    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Refresh JWT Token',
        description: 'Exchange refresh token for new access and refresh tokens.'
    })
    @ApiBody({ type: RefreshTokenDto })
    @ApiResponse({
        status: 200,
        description: 'Tokens refreshed successfully',
        schema: {
            example: {
                access_token: "new-jwt-token",
                refresh_token: "new-refresh-token"
            }
        }
    })
    @ApiResponse({ status: 401, description: 'Invalid refresh token' })
    async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
        return this.authService.refreshToken(refreshTokenDto);
    }

    @Post('reset-password')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Reset Password',
        description: 'Send password reset email to the user.'
    })
    @ApiBody({ type: ResetPasswordDto })
    @ApiResponse({ status: 200, description: 'Password reset email sent' })
    @ApiResponse({ status: 404, description: 'User not found' })
    async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
        return this.authService.resetPassword(resetPasswordDto);
    }

    @Get('confirm')
    @ApiOperation({
        summary: 'Email Confirmation',
        description: 'Handle email confirmation when users click the link sent to their email. This endpoint is called by Supabase redirect.'
    })
    @ApiResponse({
        status: 200,
        description: 'Email confirmation processed',
        content: {
            'text/html': {
                schema: {
                    type: 'string',
                    example: '<html><body><h1>Email Confirmed Successfully!</h1></body></html>'
                }
            }
        }
    })
    async confirmEmail(
        @Query('token_hash') tokenHash: string,
        @Query('type') type: string,
        @Query('access_token') accessToken: string,
        @Query('refresh_token') refreshToken: string,
        @Res() res: Response,
    ) {
        try {
            this.logRequest('confirmEmail', { type, hasToken: !!tokenHash });

            if (type === 'signup' && tokenHash) {
                // Verify the email confirmation
                const result = await this.authService.confirmEmailWithToken(tokenHash);

                // Return success HTML page
                const successHtml = `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Email Confirmed - Cribly</title>
                    <style>
                        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5; }
                        .container { background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); max-width: 500px; margin: 0 auto; }
                        .success { color: #28a745; }
                        .info { color: #666; margin-top: 20px; }
                        .token-info { background: #f8f9fa; padding: 15px; border-radius: 5px; margin-top: 20px; font-family: monospace; font-size: 12px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1 class="success">✅ Email Confirmed Successfully!</h1>
                        <p>Your email has been verified and your account is now active.</p>
                        <p class="info">You can now sign in to your Cribly account using the API endpoints.</p>
                        ${accessToken ? `
                        <div class="token-info">
                            <strong>Your Access Token:</strong><br>
                            ${accessToken}
                            <br><br>
                            <strong>Your Refresh Token:</strong><br>
                            ${refreshToken}
                            <br><br>
                            <small>Use these tokens for API authentication</small>
                        </div>
                        ` : ''}
                        <p class="info"><strong>API Documentation:</strong> <a href="/docs" target="_blank">http://localhost:3001/docs</a></p>
                    </div>
                </body>
                </html>
                `;

                return res.status(200).send(successHtml);
            }

            // Handle other confirmation types or missing token
            const errorHtml = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Confirmation Error - Cribly</title>
                <style>
                    body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5; }
                    .container { background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); max-width: 500px; margin: 0 auto; }
                    .error { color: #dc3545; }
                    .info { color: #666; margin-top: 20px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1 class="error">❌ Invalid Confirmation Link</h1>
                    <p>The confirmation link is invalid or has expired.</p>
                    <p class="info">Please try registering again or contact support if the issue persists.</p>
                    <p class="info"><strong>API Documentation:</strong> <a href="/docs" target="_blank">http://localhost:3001/docs</a></p>
                </div>
            </body>
            </html>
            `;

            return res.status(400).send(errorHtml);

        } catch (error) {
            this.logger.error('Email confirmation failed:', error);

            const errorHtml = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Confirmation Failed - Cribly</title>
                <style>
                    body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5; }
                    .container { background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); max-width: 500px; margin: 0 auto; }
                    .error { color: #dc3545; }
                    .info { color: #666; margin-top: 20px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1 class="error">❌ Confirmation Failed</h1>
                    <p>An error occurred while confirming your email.</p>
                    <p class="info">Please try again or contact support.</p>
                    <p class="info"><strong>API Documentation:</strong> <a href="/docs" target="_blank">http://localhost:3001/docs</a></p>
                </div>
            </body>
            </html>
            `;

            return res.status(500).send(errorHtml);
        }
    }

    @Get('me')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({
        summary: 'Get Current User',
        description: 'Retrieve the current authenticated user\'s profile information.'
    })
    @ApiBearerAuth('JWT-auth')
    @ApiResponse({
        status: 200,
        description: 'User profile retrieved successfully',
        schema: {
            example: {
                id: "uuid-string",
                email: "user@example.com",
                firstName: "John",
                lastName: "Doe",
                avatar: "https://cloudinary.com/image.jpg",
                isVerified: true,
                createdAt: "2024-01-01T00:00:00.000Z"
            }
        }
    })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async getCurrentUser(@CurrentUser() user: any) {
        return this.authService.getCurrentUser(user.id);
    }
}