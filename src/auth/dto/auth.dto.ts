import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SignUpDto {
    @ApiProperty({
        description: 'User email address',
        example: 'john.doe@example.com',
        format: 'email'
    })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({
        description: 'User password (minimum 8 characters)',
        example: 'SecurePass123!',
        minLength: 8
    })
    @IsString()
    @IsNotEmpty()
    @MinLength(8)
    password: string;

    @ApiProperty({
        description: 'User first name',
        example: 'John',
        required: false
    })
    @IsString()
    @IsOptional()
    firstName?: string;

    @ApiProperty({
        description: 'User last name',
        example: 'Doe',
        required: false
    })
    @IsString()
    @IsOptional()
    lastName?: string;

    @ApiProperty({
        description: 'User phone number',
        example: '+1-416-555-0123',
        required: false
    })
    @IsString()
    @IsOptional()
    phone?: string;
}

export class SignInDto {
    @ApiProperty({
        description: 'User email address',
        example: 'john.doe@example.com',
        format: 'email'
    })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({
        description: 'User password',
        example: 'SecurePass123!'
    })
    @IsString()
    @IsNotEmpty()
    password: string;
}

export class RefreshTokenDto {
    @ApiProperty({
        description: 'JWT refresh token',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
    })
    @IsString()
    @IsNotEmpty()
    refreshToken: string;
}

export class ForgotPasswordDto {
    @ApiProperty({
        description: 'User email address',
        example: 'john.doe@example.com',
        format: 'email'
    })
    @IsEmail()
    @IsNotEmpty()
    email: string;
}

export class ResetPasswordDto {
    @ApiProperty({
        description: 'Password reset token',
        example: 'abc123-def456-ghi789'
    })
    @IsString()
    @IsNotEmpty()
    token: string;

    @ApiProperty({
        description: 'New password (minimum 8 characters)',
        example: 'NewSecurePass123!',
        minLength: 8
    })
    @IsString()
    @IsNotEmpty()
    @MinLength(8)
    newPassword: string;
}

export class VerifyEmailDto {
    @ApiProperty({
        description: 'Email verification token',
        example: 'abc123-def456-ghi789'
    })
    @IsString()
    @IsNotEmpty()
    token: string;
}

// Response DTOs
export class AuthResponseDto {
    @ApiProperty({
        description: 'JWT access token (expires in 15 minutes)',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
    })
    accessToken: string;

    @ApiProperty({
        description: 'JWT refresh token (expires in 7 days)',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
    })
    refreshToken: string;

    @ApiProperty({
        description: 'User information'
    })
    user: {
        id: string;
        email: string;
        firstName?: string;
        lastName?: string;
        avatar?: string;
        emailVerified: boolean;
        createdAt: Date;
    };
}

export class MessageResponseDto {
    @ApiProperty({
        description: 'Response message',
        example: 'Email verification sent successfully'
    })
    message: string;

    @ApiProperty({
        description: 'Success status',
        example: true
    })
    success: boolean;
}