import {
    Controller,
    Post,
    Delete,
    Get,
    Body,
    Query,
    UseGuards,
    UseInterceptors,
    UploadedFile,
    UploadedFiles,
    HttpCode,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
    ApiTags,
    ApiOperation,
    ApiConsumes,
    ApiBody,
    ApiResponse,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { UploadsService } from './uploads.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators';
import {
    UploadFileDto,
    UploadResponseDto,
    DeleteFileDto,
    GetPresignedUrlDto,
    PresignedUrlResponseDto,
    CheckFileExistsDto,
    FileExistsResponseDto,
    UploadUseCase,
} from './dto';

@ApiTags('Uploads')
@Controller('uploads')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UploadsController {
    private readonly logger = new Logger(UploadsController.name);

    constructor(private readonly uploadsService: UploadsService) { }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @UseInterceptors(FileInterceptor('file'))
    @ApiOperation({
        summary: 'Upload a single file',
        description:
            'Upload a file to S3 with virus scanning. Requires authentication.',
    })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                    description: 'File to upload',
                },
                useCase: {
                    type: 'string',
                    enum: Object.values(UploadUseCase),
                    description: 'Purpose of the file upload',
                    example: UploadUseCase.AVATAR,
                },
            },
            required: ['file', 'useCase'],
        },
    })
    @ApiResponse({
        status: 201,
        description: 'File uploaded successfully',
        type: UploadResponseDto,
    })
    @ApiResponse({
        status: 400,
        description: 'Invalid file or virus detected',
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized',
    })
    async uploadFile(
        @UploadedFile() file: Express.Multer.File,
        @Query() uploadDto: UploadFileDto,
        @CurrentUser('sub') userId: string,
    ): Promise<UploadResponseDto> {
        this.logger.log(
            `Upload request from user ${userId} for ${uploadDto.useCase}`,
        );

        if (!file) {
            throw new Error('No file provided');
        }

        return this.uploadsService.uploadFile(file, uploadDto.useCase, userId);
    }

    @Post('multiple')
    @HttpCode(HttpStatus.CREATED)
    @UseInterceptors(FilesInterceptor('files', 10))
    @ApiOperation({
        summary: 'Upload multiple files',
        description:
            'Upload up to 10 files to S3 with virus scanning. Requires authentication.',
    })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                files: {
                    type: 'array',
                    items: {
                        type: 'string',
                        format: 'binary',
                    },
                    description: 'Files to upload (max 10)',
                },
                useCase: {
                    type: 'string',
                    enum: Object.values(UploadUseCase),
                    description: 'Purpose of the file uploads',
                    example: UploadUseCase.LISTING_IMAGE,
                },
            },
            required: ['files', 'useCase'],
        },
    })
    @ApiResponse({
        status: 201,
        description: 'Files uploaded successfully',
        type: [UploadResponseDto],
    })
    @ApiResponse({
        status: 400,
        description: 'Invalid files or virus detected',
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized',
    })
    async uploadMultipleFiles(
        @UploadedFiles() files: Express.Multer.File[],
        @Query() uploadDto: UploadFileDto,
        @CurrentUser('sub') userId: string,
    ): Promise<UploadResponseDto[]> {
        this.logger.log(
            `Multiple upload request from user ${userId} for ${uploadDto.useCase}`,
        );

        if (!files || files.length === 0) {
            throw new Error('No files provided');
        }

        return this.uploadsService.uploadMultipleFiles(
            files,
            uploadDto.useCase,
            userId,
        );
    }

    @Delete()
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({
        summary: 'Delete a file',
        description:
            'Delete a file from S3. Users can only delete their own files.',
    })
    @ApiResponse({
        status: 204,
        description: 'File deleted successfully',
    })
    @ApiResponse({
        status: 400,
        description: 'Invalid key or permission denied',
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized',
    })
    async deleteFile(
        @Body() deleteDto: DeleteFileDto,
        @CurrentUser('sub') userId: string,
    ): Promise<void> {
        this.logger.log(`Delete request from user ${userId} for ${deleteDto.key}`);
        return this.uploadsService.deleteFile(deleteDto.key, userId);
    }

    @Get('presigned-url')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Get presigned URL',
        description:
            'Generate a temporary presigned URL for file access (default: 1 hour)',
    })
    @ApiResponse({
        status: 200,
        description: 'Presigned URL generated successfully',
        type: PresignedUrlResponseDto,
    })
    @ApiResponse({
        status: 404,
        description: 'File not found',
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized',
    })
    async getPresignedUrl(
        @Query() getUrlDto: GetPresignedUrlDto,
    ): Promise<PresignedUrlResponseDto> {
        this.logger.log(`Presigned URL request for ${getUrlDto.key}`);
        return this.uploadsService.getPresignedUrl(
            getUrlDto.key,
            getUrlDto.expiresIn,
        );
    }

    @Get('check-exists')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Check if file exists',
        description: 'Check if a file exists in S3 and get metadata',
    })
    @ApiResponse({
        status: 200,
        description: 'File existence check completed',
        type: FileExistsResponseDto,
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized',
    })
    async checkFileExists(
        @Query() checkDto: CheckFileExistsDto,
    ): Promise<FileExistsResponseDto> {
        this.logger.log(`File existence check for ${checkDto.key}`);
        return this.uploadsService.checkFileExists(checkDto.key);
    }
}
