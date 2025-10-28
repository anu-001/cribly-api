import { IsString, IsNotEmpty, IsUUID, IsArray, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendMessageDto {
    @ApiProperty({
        description: 'Conversation ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsUUID()
    @IsNotEmpty()
    conversationId: string;

    @ApiProperty({
        description: 'Message content',
        example: 'Hi, is this property still available?',
    })
    @IsString()
    @IsNotEmpty()
    content: string;

    @ApiProperty({
        description: 'Array of attachment URLs from upload service',
        example: ['https://cloudinary.com/image1.jpg'],
        required: false,
    })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    attachmentUrls?: string[];
}
