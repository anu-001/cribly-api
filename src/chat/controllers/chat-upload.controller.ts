import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CloudinaryService } from '../../common/services/cloudinary.service';

@ApiTags('Chat File Upload')
@Controller('api/v1/chat/upload')
@UseGuards(JwtAuthGuard)
export class ChatUploadController {
  constructor(private cloudinaryService: CloudinaryService) {}

  @Post('image')
  @ApiOperation({
    summary: 'Upload image for chat',
    description: 'Upload an image file to be shared in chat conversations',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Image file to upload',
    type: 'multipart/form-data',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Image file (jpg, png, gif, webp)',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Validate file type
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Only images are allowed.',
      );
    }

    // Validate file size (5MB limit for images)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds 5MB limit');
    }

    try {
      const result = await this.cloudinaryService.uploadImage(
        file.buffer,
        file.originalname,
        'cribly/chat/images',
      );

      return {
        success: true,
        data: {
          url: result.url,
          publicId: result.publicId,
          width: result.width,
          height: result.height,
          format: result.format,
          bytes: result.bytes,
          type: 'image',
          filename: file.originalname,
          thumbnail: this.cloudinaryService.generateThumbnail(result.publicId),
        },
      };
    } catch (error) {
      throw new BadRequestException('Image upload failed');
    }
  }

  @Post('document')
  @ApiOperation({
    summary: 'Upload document for chat',
    description: 'Upload a document file to be shared in chat conversations',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Document file to upload',
    type: 'multipart/form-data',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Document file (pdf, doc, docx, txt, etc.)',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Validate file type
    const allowedMimeTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'application/rtf',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Only documents are allowed.',
      );
    }

    // Validate file size (10MB limit for documents)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds 10MB limit');
    }

    try {
      const result = await this.cloudinaryService.uploadDocument(
        file.buffer,
        file.originalname,
        'cribly/chat/documents',
      );

      return {
        success: true,
        data: {
          url: result.url,
          publicId: result.publicId,
          format: result.format,
          bytes: result.bytes,
          type: 'document',
          filename: file.originalname,
          downloadUrl: result.url, // Same as URL for documents
        },
      };
    } catch (error) {
      throw new BadRequestException('Document upload failed');
    }
  }

  @Post('general')
  @ApiOperation({
    summary: 'Upload any file for chat',
    description: 'Upload any supported file type for chat conversations',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'File to upload',
    type: 'multipart/form-data',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'File to upload (images or documents)',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    try {
      // Validate file
      this.cloudinaryService.validateFile(file.buffer, file.originalname);

      // Determine upload method based on file type
      const isImage = file.mimetype.startsWith('image/');
      const result = isImage
        ? await this.cloudinaryService.uploadImage(
            file.buffer,
            file.originalname,
          )
        : await this.cloudinaryService.uploadDocument(
            file.buffer,
            file.originalname,
          );

      return {
        success: true,
        data: {
          url: result.url,
          publicId: result.publicId,
          format: result.format,
          bytes: result.bytes,
          type: isImage ? 'image' : 'document',
          filename: file.originalname,
          ...(isImage && {
            width: result.width,
            height: result.height,
            thumbnail: this.cloudinaryService.generateThumbnail(
              result.publicId,
            ),
          }),
          ...(isImage && { downloadUrl: result.url }),
        },
      };
    } catch (error) {
      throw new BadRequestException(error.message || 'File upload failed');
    }
  }
}
