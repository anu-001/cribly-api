import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { APP_CONSTANTS, ERROR_MESSAGES } from '../common/constants/app.constants';

@Injectable()
export class CloudinaryService {
    private readonly logger = new Logger(CloudinaryService.name);

    constructor(private configService: ConfigService) {
        cloudinary.config({
            cloud_name: this.configService.get('CLOUDINARY_CLOUD_NAME'),
            api_key: this.configService.get('CLOUDINARY_API_KEY'),
            api_secret: this.configService.get('CLOUDINARY_API_SECRET'),
        });
    }

    async uploadImage(
        buffer: Buffer,
        originalName: string,
        folder: string = 'cribly',
    ): Promise<UploadApiResponse> {
        try {
            // Validate file size
            if (buffer.length > APP_CONSTANTS.MAX_FILE_SIZE) {
                throw new BadRequestException(ERROR_MESSAGES.FILE_TOO_LARGE);
            }

            // Create a promise to handle the upload
            return new Promise((resolve, reject) => {
                cloudinary.uploader.upload_stream(
                    {
                        folder,
                        resource_type: 'image',
                        public_id: `${Date.now()}-${originalName.split('.')[0]}`,
                        transformation: [
                            { width: 1200, height: 800, crop: 'limit' },
                            { quality: 'auto' },
                            { fetch_format: 'auto' },
                        ],
                    },
                    (error, result) => {
                        if (error) {
                            this.logger.error('Cloudinary upload failed', error);
                            reject(new BadRequestException(ERROR_MESSAGES.UPLOAD_FAILED));
                        } else {
                            resolve(result as UploadApiResponse);
                        }
                    },
                ).end(buffer);
            });
        } catch (error) {
            this.logger.error('Upload image failed', error);
            throw error;
        }
    }

    async uploadMultipleImages(
        files: Array<{ buffer: Buffer; originalName: string }>,
        folder: string = 'cribly',
    ): Promise<UploadApiResponse[]> {
        try {
            if (files.length > APP_CONSTANTS.MAX_IMAGES_PER_LISTING) {
                throw new BadRequestException(
                    `Maximum ${APP_CONSTANTS.MAX_IMAGES_PER_LISTING} images allowed`,
                );
            }

            const uploadPromises = files.map((file) =>
                this.uploadImage(file.buffer, file.originalName, folder),
            );

            return Promise.all(uploadPromises);
        } catch (error) {
            this.logger.error('Upload multiple images failed', error);
            throw error;
        }
    }

    async deleteImage(publicId: string): Promise<void> {
        try {
            await cloudinary.uploader.destroy(publicId);
            this.logger.log(`Image deleted: ${publicId}`);
        } catch (error) {
            this.logger.error('Delete image failed', error);
            throw error;
        }
    }

    async deleteMultipleImages(publicIds: string[]): Promise<void> {
        try {
            const deletePromises = publicIds.map((publicId) =>
                this.deleteImage(publicId),
            );
            await Promise.all(deletePromises);
        } catch (error) {
            this.logger.error('Delete multiple images failed', error);
            throw error;
        }
    }

    // Utility method to extract public ID from Cloudinary URL
    extractPublicId(url: string): string {
        try {
            const parts = url.split('/');
            const filename = parts[parts.length - 1];
            return filename.split('.')[0];
        } catch (error) {
            this.logger.error('Extract public ID failed', error);
            throw new BadRequestException('Invalid Cloudinary URL');
        }
    }

    // Generate thumbnail URL
    generateThumbnailUrl(publicId: string, width = 300, height = 200): string {
        return cloudinary.url(publicId, {
            width,
            height,
            crop: 'fill',
            quality: 'auto',
            fetch_format: 'auto',
        });
    }

    // Generate optimized URL
    generateOptimizedUrl(publicId: string): string {
        return cloudinary.url(publicId, {
            quality: 'auto',
            fetch_format: 'auto',
        });
    }

    // Validate image file
    validateImageFile(mimetype: string, size: number): void {
        if (!APP_CONSTANTS.ALLOWED_IMAGE_TYPES.includes(mimetype as any)) {
            throw new BadRequestException(ERROR_MESSAGES.INVALID_FILE_TYPE);
        }

        if (size > APP_CONSTANTS.MAX_FILE_SIZE) {
            throw new BadRequestException(ERROR_MESSAGES.FILE_TOO_LARGE);
        }
    }
}