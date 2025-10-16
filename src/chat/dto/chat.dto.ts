import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum MessageType {
    TEXT = 'TEXT',
    IMAGE = 'IMAGE',
    DOCUMENT = 'DOCUMENT',
}

export class SendMessageDto {
    @ApiProperty({
        description: 'ID of the conversation to send message to',
        example: 'cuid-conversation-id',
        type: String
    })
    @IsString()
    @IsNotEmpty()
    conversationId: string;

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

// Conversations are automatically created when matches are accepted
// No need for manual conversation creation since they're tied to matches
export class JoinConversationDto {
    @ApiProperty({
        description: 'ID of the conversation to join',
        example: 'cuid-conversation-id',
        type: String
    })
    @IsString()
    @IsNotEmpty()
    conversationId: string;
}

export class MarkAsReadDto {
    @ApiProperty({
        description: 'ID of the conversation to mark messages as read',
        example: 'cuid-conversation-id',
        type: String
    })
    @IsString()
    @IsNotEmpty()
    conversationId: string;
}