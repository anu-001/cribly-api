import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum MessageType {
    TEXT = 'TEXT',
    IMAGE = 'IMAGE',
    DOCUMENT = 'DOCUMENT',
}

export class SendMessageDto {
    @ApiProperty({
        description: 'Message content or text',
        example: 'Hello! I\'m interested in your property listing.',
        type: String
    })
    @IsString()
    @IsNotEmpty()
    content: string;

    @ApiProperty({
        description: 'Type of message being sent',
        example: 'TEXT',
        enum: MessageType,
        default: MessageType.TEXT,
        required: false
    })
    @IsEnum(MessageType)
    @IsOptional()
    type?: MessageType = MessageType.TEXT;

    @ApiProperty({
        description: 'URL for media attachments (images, documents)',
        example: 'https://cloudinary.com/image.jpg',
        type: String,
        required: false
    })
    @IsString()
    @IsOptional()
    mediaUrl?: string;

    @ApiProperty({
        description: 'Temporary ID for frontend optimistic updates',
        example: 'temp-123456',
        type: String,
        required: false
    })
    @IsString()
    @IsOptional()
    tempId?: string; // For frontend optimistic updates
}

export class CreateChatDto {
    @ApiProperty({
        description: 'ID of the user to start a chat with',
        example: 'uuid-string-participant',
        type: String
    })
    @IsString()
    @IsNotEmpty()
    participantId: string;

    @ApiProperty({
        description: 'Optional name for the chat conversation',
        example: 'Property Discussion',
        type: String,
        required: false
    })
    @IsString()
    @IsOptional()
    name?: string;
}