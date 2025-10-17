import {
    Controller,
    Post,
    Get,
    Body,
    UseGuards,
    HttpCode,
    HttpStatus,
    Request,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiBody,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import {
    SignUpDto,
    SignInDto,
    RefreshTokenDto,
    ForgotPasswordDto,
    ResetPasswordDto,
    VerifyEmailDto,
    AuthResponseDto,
    MessageResponseDto,
} from './dto/auth.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

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
        type: AuthResponseDto,
    })
    @ApiResponse({ status: 400, description: 'Invalid input data' })
    @ApiResponse({ status: 409, description: 'User already exists' })
    async signUp(@Body() signUpDto: SignUpDto): Promise<AuthResponseDto> {
        return await this.authService.signUp(signUpDto);
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
        type: AuthResponseDto,
    })
    @ApiResponse({ status: 401, description: 'Invalid credentials' })
    async signIn(@Body() signInDto: SignInDto): Promise<AuthResponseDto> {
        return await this.authService.signIn(signInDto);
    }

    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Refresh Access Token',
        description: 'Generate a new access token using a valid refresh token.'
    })
    @ApiBody({ type: RefreshTokenDto })
    @ApiResponse({
        status: 200,
        description: 'New access token generated',
        schema: {
            type: 'object',
            properties: {
                accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }
            }
        }
    })
    @ApiResponse({ status: 401, description: 'Invalid refresh token' })
    async refreshToken(@Body() refreshTokenDto: RefreshTokenDto): Promise<{ accessToken: string }> {
        return await this.authService.refreshToken(refreshTokenDto);
    }

    @Post('signout')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Sign Out',
        description: 'Sign out user and invalidate refresh token.'
    })
    @ApiResponse({
        status: 200,
        description: 'Successfully signed out',
        type: MessageResponseDto,
    })
    async signOut(@CurrentUser() user: any): Promise<MessageResponseDto> {
        return await this.authService.signOut(user.id);
    }

    @Post('forgot-password')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Forgot Password',
        description: 'Send password reset email to user.'
    })
    @ApiBody({ type: ForgotPasswordDto })
    @ApiResponse({
        status: 200,
        description: 'Password reset email sent if account exists',
        type: MessageResponseDto,
    })
    async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto): Promise<MessageResponseDto> {
        return await this.authService.forgotPassword(forgotPasswordDto);
    }

    @Post('reset-password')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Reset Password',
        description: 'Reset password using reset token from email.'
    })
    @ApiBody({ type: ResetPasswordDto })
    @ApiResponse({
        status: 200,
        description: 'Password reset successful',
        type: MessageResponseDto,
    })
    @ApiResponse({ status: 400, description: 'Invalid or expired reset token' })
    async resetPassword(@Body() resetPasswordDto: ResetPasswordDto): Promise<MessageResponseDto> {
        return await this.authService.resetPassword(resetPasswordDto);
    }

    @Post('verify-email')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Verify Email',
        description: 'Verify user email using verification token.'
    })
    @ApiBody({ type: VerifyEmailDto })
    @ApiResponse({
        status: 200,
        description: 'Email verified successfully',
        type: MessageResponseDto,
    })
    @ApiResponse({ status: 400, description: 'Invalid verification token' })
    async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto): Promise<MessageResponseDto> {
        return await this.authService.verifyEmail(verifyEmailDto);
    }

    @Get('me')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Get Current User',
        description: 'Get current authenticated user information.'
    })
    @ApiResponse({
        status: 200,
        description: 'Current user information',
        schema: {
            type: 'object',
            properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                firstName: { type: 'string' },
                lastName: { type: 'string' },
                avatar: { type: 'string' },
                phone: { type: 'string' },
                bio: { type: 'string' },
                emailVerified: { type: 'boolean' },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' },
            }
        }
    })
    @ApiResponse({ status: 401, description: 'Authentication required' })
    async getCurrentUser(@CurrentUser() user: any) {
        return await this.authService.getCurrentUser(user.id);
    }
}