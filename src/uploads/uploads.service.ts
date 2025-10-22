import {
    Injectable,
    Inject,
    Logger,
    BadRequestException,
    NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { S3_CLIENT } from './config/s3.provider';
import { VirusScannerService } from './virus-scanner.service';
import { UploadUseCase, UploadResponseDto } from './dto';
import { v4 as uuidv4 } from 'uuid';
import * as streamifier from 'streamifier';

interface FileValidationRules {
    maxSizeBytes: number;
    allowedMimeTypes: string[];
}

@Injectable()
export class UploadsService {
    private readonly logger = new Logger(UploadsService.name);
    private readonly bucketName: string;

    private readonly validationRules: Record<UploadUseCase, FileValidationRules> = {
        [UploadUseCase.AVATAR]: {
            maxSizeBytes: 5 * 1024 * 1024, // 5MB
            allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        },
        [UploadUseCase.LISTING_IMAGE]: {
            maxSizeBytes: 10 * 1024 * 1024, // 10MB
            allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        },
        [UploadUseCase.VERIFICATION_DOCUMENT]: {
            maxSizeBytes: 10 * 1024 * 1024, // 10MB
            allowedMimeTypes: [
                'image/jpeg',
                'image/png',
                'image/webp',
                'application/pdf',
            ],
        },
        [UploadUseCase.CHAT_ATTACHMENT]: {
            maxSizeBytes: 5 * 1024 * 1024, // 5MB
            allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        },
    };

    constructor(
        @Inject(S3_CLIENT) private readonly s3Client: S3Client,
        private readonly virusScannerService: VirusScannerService,
        private readonly configService: ConfigService,
    ) {
        const bucketName = this.configService.get<string>('AWS_S3_BUCKET_NAME');
        if (!bucketName) {
            throw new Error('AWS_S3_BUCKET_NAME not configured in environment variables');
        }
        this.bucketName = bucketName;
    }

    /**
     * Upload a single file to S3
     */
    async uploadFile(
        file: Express.Multer.File,
        useCase: UploadUseCase,
        userId: string,
    ): Promise<UploadResponseDto> {
        this.logger.log(`Uploading file: ${file.originalname} for user ${userId}`);

        // Validate file
        this.validateFile(file, useCase);

        // Scan for viruses
        await this.scanFileForViruses(file);

        // Generate S3 key
        const key = this.generateS3Key(file, useCase, userId);

        // Upload to S3
        const url = await this.uploadToS3(file.buffer, key, file.mimetype);

        this.logger.log(`File uploaded successfully: ${key}`);

        return {
            key,
            url,
            originalName: file.originalname,
            size: file.size,
            mimeType: file.mimetype,
            uploadedAt: new Date(),
        };
    }

    /**
     * Upload multiple files to S3
     */
    async uploadMultipleFiles(
        files: Express.Multer.File[],
        useCase: UploadUseCase,
        userId: string,
    ): Promise<UploadResponseDto[]> {
        if (files.length > 10) {
            throw new BadRequestException('Maximum 10 files allowed per upload');
        }

        this.logger.log(
            `Uploading ${files.length} files for user ${userId}`,
        );

        const uploadPromises = files.map((file) =>
            this.uploadFile(file, useCase, userId),
        );

        return Promise.all(uploadPromises);
    }

    /**
     * Delete a file from S3
     */
    async deleteFile(key: string, userId: string): Promise<void> {
        this.logger.log(`Deleting file: ${key} for user ${userId}`);

        // Validate ownership (key should contain userId)
        if (!key.includes(userId)) {
            throw new BadRequestException(
                'You can only delete your own files',
            );
        }

        try {
            const command = new DeleteObjectCommand({
                Bucket: this.bucketName,
                Key: key,
            });

            await this.s3Client.send(command);
            this.logger.log(`File deleted successfully: ${key}`);
        } catch (error) {
            this.logger.error(`Error deleting file ${key}: ${error.message}`);
            throw new BadRequestException('Failed to delete file');
        }
    }

    /**
     * Generate a presigned URL for temporary file access
     */
    async getPresignedUrl(
        key: string,
        expiresIn: number = 3600,
    ): Promise<{ url: string; expiresAt: Date }> {
        this.logger.log(`Generating presigned URL for: ${key}`);

        // Check if file exists
        const exists = await this.checkFileExists(key);
        if (!exists.exists) {
            throw new NotFoundException('File not found');
        }

        try {
            const command = new HeadObjectCommand({
                Bucket: this.bucketName,
                Key: key,
            });

            const url = await getSignedUrl(this.s3Client, command, { expiresIn });
            const expiresAt = new Date(Date.now() + expiresIn * 1000);

            this.logger.log(`Presigned URL generated for: ${key}`);

            return { url, expiresAt };
        } catch (error) {
            this.logger.error(
                `Error generating presigned URL for ${key}: ${error.message}`,
            );
            throw new BadRequestException('Failed to generate presigned URL');
        }
    }

    /**
     * Check if a file exists in S3
     */
    async checkFileExists(
        key: string,
    ): Promise<{ exists: boolean; size?: number; lastModified?: Date }> {
        try {
            const command = new HeadObjectCommand({
                Bucket: this.bucketName,
                Key: key,
            });

            const response = await this.s3Client.send(command);

            return {
                exists: true,
                size: response.ContentLength,
                lastModified: response.LastModified,
            };
        } catch (error) {
            if (error.name === 'NotFound') {
                return { exists: false };
            }
            this.logger.error(
                `Error checking file existence ${key}: ${error.message}`,
            );
            throw new BadRequestException('Failed to check file existence');
        }
    }

    /**
     * Validate file against use case rules
     */
    private validateFile(file: Express.Multer.File, useCase: UploadUseCase): void {
        const rules = this.validationRules[useCase];

        // Check file size
        if (file.size > rules.maxSizeBytes) {
            const maxSizeMB = rules.maxSizeBytes / (1024 * 1024);
            throw new BadRequestException(
                `File size exceeds maximum allowed (${maxSizeMB}MB) for ${useCase}`,
            );
        }

        // Check MIME type
        if (!rules.allowedMimeTypes.includes(file.mimetype)) {
            throw new BadRequestException(
                `File type ${file.mimetype} not allowed for ${useCase}. Allowed types: ${rules.allowedMimeTypes.join(', ')}`,
            );
        }

        this.logger.debug(`File validation passed for ${file.originalname}`);
    }

    /**
     * Scan file for viruses
     */
    private async scanFileForViruses(file: Express.Multer.File): Promise<void> {
        const scanResult = await this.virusScannerService.scanBuffer(
            file.buffer,
            file.originalname,
        );

        if (scanResult.isInfected) {
            this.logger.error(
                `Virus detected in file ${file.originalname}: ${scanResult.viruses?.join(', ')}`,
            );
            throw new BadRequestException(
                'File rejected: Virus or malware detected',
            );
        }
    }

    /**
     * Upload buffer to S3
     */
    private async uploadToS3(
        buffer: Buffer,
        key: string,
        mimeType: string,
    ): Promise<string> {
        try {
            const stream = streamifier.createReadStream(buffer);

            const command = new PutObjectCommand({
                Bucket: this.bucketName,
                Key: key,
                Body: buffer,
                ContentType: mimeType,
                ServerSideEncryption: 'AES256',
            });

            await this.s3Client.send(command);

            const region = this.configService.get<string>('AWS_REGION');
            const url = `https://${this.bucketName}.s3.${region}.amazonaws.com/${key}`;

            return url;
        } catch (error) {
            this.logger.error(`Error uploading to S3: ${error.message}`);
            throw new BadRequestException('Failed to upload file to storage');
        }
    }

    /**
     * Generate S3 key (path) for file
     */
    private generateS3Key(
        file: Express.Multer.File,
        useCase: UploadUseCase,
        userId: string,
    ): string {
        const folder = this.getFolderByUseCase(useCase);
        const timestamp = Date.now();
        const uuid = uuidv4();
        const extension = file.originalname.split('.').pop();
        const filename = `${uuid}-${timestamp}.${extension}`;

        return `cribly/${folder}/${userId}/${filename}`;
    }

    /**
     * Get S3 folder name by use case
     */
    private getFolderByUseCase(useCase: UploadUseCase): string {
        const folderMap: Record<UploadUseCase, string> = {
            [UploadUseCase.AVATAR]: 'avatars',
            [UploadUseCase.LISTING_IMAGE]: 'listings',
            [UploadUseCase.VERIFICATION_DOCUMENT]: 'verification',
            [UploadUseCase.CHAT_ATTACHMENT]: 'chat',
        };

        return folderMap[useCase];
    }
}
