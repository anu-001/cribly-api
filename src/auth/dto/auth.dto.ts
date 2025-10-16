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
        description: 'User password (minimum 6 characters)',
        example: 'securePassword123',
        minLength: 6
    })
    @IsString()
    @IsNotEmpty()
    @MinLength(6)
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
        example: 'securePassword123'
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

export class ResetPasswordDto {
    @ApiProperty({
        description: 'Email address to send password reset link',
        example: 'john.doe@example.com',
        format: 'email'
    })
    @IsEmail()
    @IsNotEmpty()
    email: string;
}

export class UpdatePasswordDto {
    @ApiProperty({
        description: 'New password (minimum 6 characters)',
        example: 'newSecurePassword123',
        minLength: 6
    })
    @IsString()
    @IsNotEmpty()
    @MinLength(6)
    newPassword: string;
}