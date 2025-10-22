import {
    IsEnum,
    IsOptional,
    IsString,
    IsNotEmpty,
    IsNumber,
    Min,
    Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum UploadUseCase {
    AVATAR = 'AVATAR',
    LISTING_IMAGE = 'LISTING_IMAGE',
    VERIFICATION_DOCUMENT = 'VERIFICATION_DOCUMENT',
    CHAT_ATTACHMENT = 'CHAT_ATTACHMENT',
}

export class UploadFileDto {
    @ApiProperty({
        enum: UploadUseCase,
        description: 'Use case for the file upload',
        example: UploadUseCase.AVATAR,
    })
    @IsEnum(UploadUseCase)
    @IsNotEmpty()
    useCase: UploadUseCase;
}

export class UploadResponseDto {
    @ApiProperty({
        description: 'S3 key of the uploaded file',
        example: 'cribly/avatars/user-123/avatar-1634567890.jpg',
    })
    key: string;

    @ApiProperty({
        description: 'Public URL of the uploaded file',
        example: 'https://cribly-bucket.s3.us-east-1.amazonaws.com/...',
    })
    url: string;

    @ApiProperty({
        description: 'Original filename',
        example: 'profile-photo.jpg',
    })
    originalName: string;

    @ApiProperty({
        description: 'File size in bytes',
        example: 1024000,
    })
    size: number;

    @ApiProperty({
        description: 'MIME type',
        example: 'image/jpeg',
    })
    mimeType: string;

    @ApiProperty({
        description: 'Upload timestamp',
        example: '2025-10-22T10:30:00Z',
    })
    uploadedAt: Date;
}

export class DeleteFileDto {
    @ApiProperty({
        description: 'S3 key of the file to delete',
        example: 'cribly/avatars/user-123/avatar-1634567890.jpg',
    })
    @IsString()
    @IsNotEmpty()
    key: string;
}

export class GetPresignedUrlDto {
    @ApiProperty({
        description: 'S3 key of the file',
        example: 'cribly/avatars/user-123/avatar-1634567890.jpg',
    })
    @IsString()
    @IsNotEmpty()
    key: string;

    @ApiProperty({
        description: 'Expiration time in seconds (default: 3600 = 1 hour)',
        example: 3600,
        required: false,
    })
    @IsOptional()
    @IsNumber()
    @Min(60)
    @Max(86400) // Max 24 hours
    expiresIn?: number;
}

export class PresignedUrlResponseDto {
    @ApiProperty({
        description: 'Presigned URL for temporary file access',
        example: 'https://cribly-bucket.s3.us-east-1.amazonaws.com/...?X-Amz-...',
    })
    url: string;

    @ApiProperty({
        description: 'Expiration timestamp',
        example: '2025-10-22T11:30:00Z',
    })
    expiresAt: Date;
}

export class CheckFileExistsDto {
    @ApiProperty({
        description: 'S3 key of the file to check',
        example: 'cribly/avatars/user-123/avatar-1634567890.jpg',
    })
    @IsString()
    @IsNotEmpty()
    key: string;
}

export class FileExistsResponseDto {
    @ApiProperty({
        description: 'Whether the file exists',
        example: true,
    })
    exists: boolean;

    @ApiProperty({
        description: 'File size in bytes (if exists)',
        example: 1024000,
        required: false,
    })
    size?: number;

    @ApiProperty({
        description: 'Last modified date (if exists)',
        example: '2025-10-22T10:30:00Z',
        required: false,
    })
    lastModified?: Date;
}
