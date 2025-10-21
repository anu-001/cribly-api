import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsArray,
  ValidateNested,
  IsBoolean,
  IsUrl,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { MessageType } from './chat.dto';

export class FileUploadDto {
  @ApiProperty({
    description: 'File name with extension',
    example: 'floor-plan.pdf',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @ApiProperty({
    description: 'File size in bytes',
    example: 2048576,
    type: Number,
  })
  @IsNotEmpty()
  fileSize: number;

  @ApiProperty({
    description: 'MIME type of the file',
    example: 'application/pdf',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  mimeType: string;

  @ApiProperty({
    description: 'Secure URL of the uploaded file',
    example: 'https://res.cloudinary.com/cribly/file.pdf',
    type: String,
  })
  @IsUrl()
  @IsNotEmpty()
  fileUrl: string;
}

export class EditMessageDto {
  @ApiProperty({
    description: 'ID of the message to edit',
    example: 'cuid-message-id',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  messageId: string;

  @ApiProperty({
    description: 'New content for the message',
    example: 'Updated message content',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  newContent: string;
}

export class DeleteMessageDto {
  @ApiProperty({
    description: 'ID of the message to delete',
    example: 'cuid-message-id',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  messageId: string;

  @ApiProperty({
    description: 'Whether to delete for everyone or just sender',
    example: false,
    type: Boolean,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  deleteForEveryone?: boolean = false;
}

export class TypingIndicatorDto {
  @ApiProperty({
    description: 'ID of the conversation',
    example: 'cuid-conversation-id',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  conversationId: string;

  @ApiProperty({
    description: 'Whether user is currently typing',
    example: true,
    type: Boolean,
  })
  @IsBoolean()
  isTyping: boolean;
}

export class MessageStatusDto {
  @ApiProperty({
    description: 'ID of the message',
    example: 'cuid-message-id',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  messageId: string;

  @ApiProperty({
    description: 'Status of the message',
    example: 'delivered',
    enum: ['sent', 'delivered', 'read'],
  })
  @IsEnum(['sent', 'delivered', 'read'])
  status: 'sent' | 'delivered' | 'read';
}

export class EnhancedSendMessageDto {
  @ApiProperty({
    description: 'ID of the conversation to send message to',
    example: 'cuid-conversation-id',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  conversationId: string;

  @ApiProperty({
    description: 'Message content or text',
    example: "Hello! Here's the floor plan you requested.",
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({
    description: 'Type of message being sent',
    example: 'TEXT',
    enum: MessageType,
    default: MessageType.TEXT,
    required: false,
  })
  @IsEnum(MessageType)
  @IsOptional()
  type?: MessageType = MessageType.TEXT;

  @ApiProperty({
    description: 'File attachments for the message',
    type: [FileUploadDto],
    required: false,
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => FileUploadDto)
  attachments?: FileUploadDto[];

  @ApiProperty({
    description: 'Temporary ID for frontend optimistic updates',
    example: 'temp-123456789',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  tempId?: string;

  @ApiProperty({
    description: 'ID of message being replied to',
    example: 'cuid-reply-to-message-id',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  replyToMessageId?: string;
}

export class ConversationSettingsDto {
  @ApiProperty({
    description: 'ID of the conversation',
    example: 'cuid-conversation-id',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  conversationId: string;

  @ApiProperty({
    description: 'Whether to mute notifications for this conversation',
    example: false,
    type: Boolean,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isMuted?: boolean;

  @ApiProperty({
    description: 'Whether to enable read receipts',
    example: true,
    type: Boolean,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  readReceipts?: boolean;
}
