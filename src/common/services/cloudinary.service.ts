import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

export interface FileUploadResult {
  url: string;
  publicId: string;
  format: string;
  resourceType: string;
  bytes: number;
  width?: number;
  height?: number;
}

type CloudinaryResult = {
  secure_url?: string;
  public_id?: string;
  format?: string;
  resource_type?: string;
  bytes?: number;
  width?: number;
  height?: number;
};

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  constructor(private configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  /**
   * Upload file to Cloudinary
   */
  async uploadFile(
    fileBuffer: Buffer,
    fileName: string,
    folder = 'cribly/chat',
  ): Promise<FileUploadResult> {
    try {
      const uploadResult = await new Promise<CloudinaryResult>(
        (resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder,
              public_id: `${Date.now()}-${fileName}`,
              resource_type: 'auto', // Automatically detect file type
              quality: 'auto:good',
              fetch_format: 'auto',
              flags: 'attachment', // Force download for documents
              access_mode: 'public',
            },
            (error, result) => {
              if (error) {
                this.logger.error('Cloudinary upload failed:', error);
                reject(error);
              } else {
                resolve(result as CloudinaryResult);
              }
            },
          );

          // Convert buffer to stream and pipe to Cloudinary
          const stream = Readable.from(fileBuffer);
          stream.pipe(uploadStream);
        },
      );

      return {
        url: uploadResult.secure_url ?? '',
        publicId: uploadResult.public_id ?? '',
        format: uploadResult.format ?? '',
        resourceType: uploadResult.resource_type ?? 'auto',
        bytes: uploadResult.bytes ?? 0,
        width: uploadResult.width,
        height: uploadResult.height,
      };
    } catch (error) {
      this.logger.error('File upload failed:', error);
      throw new BadRequestException('File upload failed');
    }
  }

  /**
   * Upload image with transformations
   */
  async uploadImage(
    fileBuffer: Buffer,
    fileName: string,
    folder = 'cribly/chat/images',
  ): Promise<FileUploadResult> {
    try {
      const uploadResult = await new Promise<CloudinaryResult>(
        (resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder,
              public_id: `${Date.now()}-${fileName}`,
              resource_type: 'image',
              quality: 'auto:good',
              fetch_format: 'auto',
              transformation: [
                { width: 1200, height: 1200, crop: 'limit' },
                { quality: 'auto:good' },
              ],
              access_mode: 'public',
            },
            (error, result) => {
              if (error) {
                this.logger.error('Cloudinary image upload failed:', error);
                reject(error);
              } else {
                resolve(result as CloudinaryResult);
              }
            },
          );

          const stream = Readable.from(fileBuffer);
          stream.pipe(uploadStream);
        },
      );

      return {
        url: uploadResult.secure_url ?? '',
        publicId: uploadResult.public_id ?? '',
        format: uploadResult.format ?? '',
        resourceType: uploadResult.resource_type ?? 'image',
        bytes: uploadResult.bytes ?? 0,
        width: uploadResult.width,
        height: uploadResult.height,
      };
    } catch (error) {
      this.logger.error('Image upload failed:', error);
      throw new BadRequestException('Image upload failed');
    }
  }

  /**
   * Upload document with virus scanning
   */
  async uploadDocument(
    fileBuffer: Buffer,
    fileName: string,
    folder = 'cribly/chat/documents',
  ): Promise<FileUploadResult> {
    try {
      // Validate file type
      const allowedTypes = [
        'pdf',
        'doc',
        'docx',
        'txt',
        'rtf',
        'xls',
        'xlsx',
        'ppt',
        'pptx',
      ];
      const fileExtension = fileName.split('.').pop()?.toLowerCase();

      if (!fileExtension || !allowedTypes.includes(fileExtension)) {
        throw new BadRequestException(
          'Invalid file type. Only documents are allowed.',
        );
      }

      const uploadResult = await new Promise<CloudinaryResult>(
        (resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder,
              public_id: `${Date.now()}-${fileName}`,
              resource_type: 'raw', // For non-image files
              access_mode: 'public',
              flags: 'attachment', // Force download
            },
            (error, result) => {
              if (error) {
                this.logger.error('Cloudinary document upload failed:', error);
                reject(error);
              } else {
                resolve(result as CloudinaryResult);
              }
            },
          );

          const stream = Readable.from(fileBuffer);
          stream.pipe(uploadStream);
        },
      );

      return {
        url: uploadResult.secure_url ?? '',
        publicId: uploadResult.public_id ?? '',
        format: uploadResult.format ?? '',
        resourceType: uploadResult.resource_type ?? 'raw',
        bytes: uploadResult.bytes ?? 0,
      };
    } catch (error) {
      this.logger.error('Document upload failed:', error);
      throw new BadRequestException('Document upload failed');
    }
  }

  /**
   * Delete file from Cloudinary
   */
  async deleteFile(publicId: string, resourceType = 'image'): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
      });
      this.logger.log(`File deleted: ${publicId}`);
    } catch (error) {
      this.logger.error('File deletion failed:', error);
      throw new BadRequestException('File deletion failed');
    }
  }

  /**
   * Generate thumbnail for images
   */
  generateThumbnail(publicId: string, width = 200, height = 200): string {
    return cloudinary.url(publicId, {
      width,
      height,
      crop: 'fill',
      quality: 'auto:low',
      fetch_format: 'auto',
    });
  }

  /**
   * Validate file size and type
   */
  validateFile(
    fileBuffer: Buffer,
    fileName: string,
    maxSizeBytes = 10 * 1024 * 1024, // 10MB default
  ): void {
    if (fileBuffer.length > maxSizeBytes) {
      throw new BadRequestException(
        `File size exceeds limit of ${maxSizeBytes / (1024 * 1024)}MB`,
      );
    }

    const fileExtension = fileName.split('.').pop()?.toLowerCase();
    const allowedExtensions = [
      'jpg',
      'jpeg',
      'png',
      'gif',
      'webp',
      'pdf',
      'doc',
      'docx',
      'txt',
      'rtf',
      'xls',
      'xlsx',
      'ppt',
      'pptx',
    ];

    if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
      throw new BadRequestException(
        'Invalid file type. Only images and documents are allowed.',
      );
    }
  }
}
