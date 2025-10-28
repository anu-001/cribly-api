import { ApiProperty } from '@nestjs/swagger';

export class MessageResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  conversationId: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  senderId: string;

  @ApiProperty({ example: 'Hello! Is this property still available?' })
  content: string;

  @ApiProperty({
    example: ['https://cloudinary.com/image1.jpg'],
    type: [String],
  })
  attachmentUrls: string[];

  @ApiProperty({ example: false })
  isRead: boolean;

  @ApiProperty({ example: '2025-10-22T10:30:00.000Z', nullable: true })
  readAt: Date | null;

  @ApiProperty({ example: '2025-10-22T10:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2025-10-22T10:00:00.000Z' })
  updatedAt: Date;

  @ApiProperty({
    type: 'object',
    properties: {
      id: { type: 'string' },
      firstName: { type: 'string' },
      lastName: { type: 'string' },
      avatarUrl: { type: 'string', nullable: true },
      verificationStatus: { type: 'string' },
    },
  })
  sender: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
    verificationStatus: string;
  };
}

export class ConversationResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  connectionId: string;

  @ApiProperty({ example: '2025-10-22T10:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2025-10-22T10:30:00.000Z' })
  updatedAt: Date;

  @ApiProperty({ example: 3 })
  unreadCount: number;

  @ApiProperty({
    type: MessageResponseDto,
    nullable: true,
  })
  lastMessage: MessageResponseDto | null;

  @ApiProperty({
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        conversationId: { type: 'string' },
        userId: { type: 'string' },
        lastReadAt: { type: 'string', nullable: true },
        joinedAt: { type: 'string' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            avatarUrl: { type: 'string', nullable: true },
            verificationStatus: { type: 'string' },
          },
        },
      },
    },
  })
  members: Array<{
    id: string;
    conversationId: string;
    userId: string;
    lastReadAt: Date | null;
    joinedAt: Date;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      avatarUrl: string | null;
      verificationStatus: string;
    };
  }>;
}

export class PaginationMetaDto {
  @ApiProperty({ example: 42 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;

  @ApiProperty({ example: 3 })
  totalPages: number;

  @ApiProperty({ example: true })
  hasNextPage: boolean;

  @ApiProperty({ example: false })
  hasPreviousPage: boolean;
}

export class ConversationsResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: [ConversationResponseDto] })
  data: ConversationResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}

export class MessagesResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: [MessageResponseDto] })
  data: MessageResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}

export class SendMessageResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Message sent successfully' })
  message: string;

  @ApiProperty({ type: MessageResponseDto })
  data: MessageResponseDto;
}

export class MarkAsReadResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Message(s) marked as read' })
  message: string;
}

export class UnreadCountResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({
    type: 'object',
    properties: {
      count: { type: 'number', example: 15 },
    },
  })
  data: {
    count: number;
  };
}

export class ConversationDetailResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: ConversationResponseDto })
  data: ConversationResponseDto;
}
