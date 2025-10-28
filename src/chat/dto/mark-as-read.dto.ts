import { IsUUID, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MarkAsReadDto {
    @ApiProperty({
        description: 'Message ID to mark as read',
        example: '123e4567-e89b-12d3-a456-426614174000',
        required: false,
    })
    @IsUUID()
    @IsOptional()
    messageId?: string;

    @ApiProperty({
        description: 'Conversation ID - marks all messages in conversation as read',
        example: '123e4567-e89b-12d3-a456-426614174000',
        required: false,
    })
    @IsUUID()
    @IsOptional()
    conversationId?: string;
}
