import {
    Controller,
    Get,
    Post,
    Put,
    Body,
    Param,
    Query,
    UseGuards,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { ChatService } from './chat.service';
import {
    SendMessageDto,
    MarkAsReadDto,
    QueryMessagesDto,
    QueryConversationsDto,
    ConversationsResponseDto,
    MessagesResponseDto,
    SendMessageResponseDto,
    MarkAsReadResponseDto,
    UnreadCountResponseDto,
    ConversationDetailResponseDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('chat')
@Controller('chat')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ChatController {
    constructor(private readonly chatService: ChatService) { }

    @Get('conversations')
    @ApiOperation({
        summary: 'Get conversation list',
        description:
            'Retrieve all conversations for the current user with last message, unread count, and pagination. ' +
            'Conversations are ordered by most recent activity.',
    })
    @ApiResponse({
        status: 200,
        description:
            'Conversations retrieved successfully with metadata and unread counts',
        type: ConversationsResponseDto,
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized',
    })
    getConversations(
        @CurrentUser('id') userId: string,
        @Query() query: QueryConversationsDto,
    ) {
        return this.chatService.getConversations(userId, query);
    }

    @Get('conversations/:id')
    @ApiOperation({
        summary: 'Get conversation details',
        description:
            'Get full conversation details including members and connection info',
    })
    @ApiResponse({
        status: 200,
        description: 'Conversation retrieved successfully',
        type: ConversationDetailResponseDto,
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized',
    })
    @ApiResponse({
        status: 403,
        description: 'Forbidden - not a member of this conversation',
    })
    @ApiResponse({
        status: 404,
        description: 'Conversation not found',
    })
    getConversationById(
        @CurrentUser('id') userId: string,
        @Param('id') conversationId: string,
    ) {
        return this.chatService.getConversationById(userId, conversationId);
    }

    @Get('conversations/:id/messages')
    @ApiOperation({
        summary: 'Get conversation messages',
        description:
            'Retrieve all messages for a specific conversation with pagination. ' +
            'Messages are ordered by creation time (oldest first on each page). ' +
            'Only conversation members can access messages.',
    })
    @ApiResponse({
        status: 200,
        description: 'Messages retrieved successfully with pagination metadata',
        type: MessagesResponseDto,
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized',
    })
    @ApiResponse({
        status: 403,
        description: 'Forbidden - not a member of this conversation',
    })
    @ApiResponse({
        status: 404,
        description: 'Conversation not found',
    })
    getMessages(
        @CurrentUser('id') userId: string,
        @Param('id') conversationId: string,
        @Query() query: QueryMessagesDto,
    ) {
        return this.chatService.getMessages(userId, conversationId, query);
    }

    @Post('conversations/:id/messages')
    @ApiOperation({
        summary: 'Send message (HTTP)',
        description:
            'Send a message via HTTP endpoint (also available via WebSocket). ' +
            'Supports text content and file attachments. Real-time delivery via WebSocket.',
    })
    @ApiResponse({
        status: 201,
        description: 'Message sent successfully',
        type: SendMessageResponseDto,
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized',
    })
    @ApiResponse({
        status: 403,
        description: 'Forbidden - not a member of this conversation',
    })
    @ApiResponse({
        status: 404,
        description: 'Conversation not found',
    })
    sendMessage(
        @CurrentUser('id') userId: string,
        @Param('id') conversationId: string,
        @Body() dto: Omit<SendMessageDto, 'conversationId'>,
    ) {
        return this.chatService.sendMessage(userId, {
            conversationId,
            content: dto.content,
            attachmentUrls: dto.attachmentUrls,
        });
    }

    @Put('messages/read')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Mark messages as read',
        description:
            'Mark a single message or all messages in a conversation as read. ' +
            'Updates read receipts and lastReadAt timestamp. Either messageId or conversationId must be provided.',
    })
    @ApiResponse({
        status: 200,
        description: 'Messages marked as read successfully',
        type: MarkAsReadResponseDto,
    })
    @ApiResponse({
        status: 400,
        description: 'Bad request - must provide messageId or conversationId',
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized',
    })
    @ApiResponse({
        status: 403,
        description: 'Forbidden - not a member of this conversation',
    })
    @ApiResponse({
        status: 404,
        description: 'Message or conversation not found',
    })
    markAsRead(@CurrentUser('id') userId: string, @Body() dto: MarkAsReadDto) {
        return this.chatService.markAsRead(userId, dto);
    }

    @Get('unread-count')
    @ApiOperation({
        summary: 'Get unread message count',
        description:
            'Get the total number of unread messages across all conversations for the current user',
    })
    @ApiResponse({
        status: 200,
        description: 'Unread count retrieved successfully',
        type: UnreadCountResponseDto,
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized',
    })
    getUnreadCount(@CurrentUser('id') userId: string) {
        return this.chatService.getUnreadCount(userId);
    }
}
