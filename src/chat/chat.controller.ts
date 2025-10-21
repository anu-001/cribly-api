import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ChatService } from './chat.service';
import {
  SendMessageDto,
  JoinConversationDto,
  MarkAsReadDto,
} from './dto/chat.dto';
import {
  EnhancedSendMessageDto,
  EditMessageDto,
} from './dto/enhanced-chat.dto';

// Define a type for authenticated requests to include the user property
type AuthenticatedRequest = ExpressRequest & { user: { id: string } };

@ApiTags('Chat & Messaging')
@Controller('api/v1/chat')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('conversations')
  @ApiOperation({
    summary: 'Get user conversations',
    description:
      'Retrieve all conversations for the authenticated user with pagination.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 20)',
  })
  @ApiResponse({
    status: 200,
    description: 'A paginated list of user conversations.',
  })
  async getUserConversations(
    @Request() req: AuthenticatedRequest,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    const userId = req.user.id;
    return this.chatService.getUserConversations(
      userId,
      Number(page),
      Number(limit),
    );
  }

  @Get('conversations/:conversationId')
  @ApiOperation({
    summary: 'Get conversation details',
    description: 'Get detailed information about a specific conversation.',
  })
  @ApiParam({
    name: 'conversationId',
    description: 'The ID of the conversation.',
  })
  @ApiResponse({ status: 200, description: 'The conversation details.' })
  async getConversationById(
    @Request() req: AuthenticatedRequest,
    @Param('conversationId') conversationId: string,
  ) {
    const userId = req.user.id;
    return this.chatService.getConversationById(userId, conversationId);
  }

  @Get('conversations/:conversationId/messages')
  @ApiOperation({
    summary: 'Get conversation messages',
    description:
      'Retrieve messages for a specific conversation with pagination.',
  })
  @ApiParam({
    name: 'conversationId',
    description: 'The ID of the conversation.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Messages per page (default: 50)',
  })
  @ApiResponse({ status: 200, description: 'A paginated list of messages.' })
  async getConversationMessages(
    @Request() req: AuthenticatedRequest,
    @Param('conversationId') conversationId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 50,
  ) {
    const userId = req.user.id;
    return this.chatService.getConversationMessages(
      userId,
      conversationId,
      Number(page),
      Number(limit),
    );
  }

  @Post('conversations/:conversationId/messages')
  @ApiOperation({
    summary: 'Send a message',
    description: 'Send a text or media message to a conversation.',
  })
  @ApiParam({
    name: 'conversationId',
    description: 'The ID of the conversation to send the message to.',
  })
  @ApiResponse({
    status: 201,
    description: 'The message was sent successfully.',
  })
  async sendMessage(
    @Request() req: AuthenticatedRequest,
    @Param('conversationId') conversationId: string,
    @Body() sendMessageDto: Omit<SendMessageDto, 'conversationId'>,
  ) {
    const userId = req.user.id;
    const messageDto: SendMessageDto = { ...sendMessageDto, conversationId };
    return this.chatService.sendMessage(userId, messageDto);
  }

  @Post('conversations/:conversationId/messages/enhanced')
  @ApiOperation({
    summary: 'Send an enhanced message',
    description: 'Send a message with features like attachments and replies.',
  })
  @ApiParam({
    name: 'conversationId',
    description: 'The ID of the conversation.',
  })
  @ApiResponse({
    status: 201,
    description: 'The enhanced message was sent successfully.',
  })
  async sendEnhancedMessage(
    @Request() req: AuthenticatedRequest,
    @Param('conversationId') conversationId: string,
    @Body() sendMessageDto: Omit<EnhancedSendMessageDto, 'conversationId'>,
  ) {
    const userId = req.user.id;
    // This maps the enhanced DTO to the basic one. A real implementation might handle this differently.
    const basicMessageDto: SendMessageDto = {
      conversationId,
      content: sendMessageDto.content,
      type: (sendMessageDto as any).type ?? 'TEXT',
      mediaUrl: (sendMessageDto as any).attachments?.[0]?.fileUrl,
      tempId: (sendMessageDto as any).tempId,
    };
    return this.chatService.sendMessage(userId, basicMessageDto);
  }

  @Post('conversations/join')
  @ApiOperation({
    summary: 'Join a conversation',
    description: 'Join or rejoin a conversation.',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully joined the conversation.',
  })
  async joinConversation(
    @Request() req: AuthenticatedRequest,
    @Body() joinConversationDto: JoinConversationDto,
  ) {
    const userId = req.user.id;
    return this.chatService.joinConversation(userId, joinConversationDto);
  }

  @Delete('conversations/:conversationId/leave')
  @ApiOperation({
    summary: 'Leave a conversation',
    description: 'Leave a conversation to stop receiving messages.',
  })
  @ApiParam({
    name: 'conversationId',
    description: 'The ID of the conversation to leave.',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully left the conversation.',
  })
  async leaveConversation(
    @Request() req: AuthenticatedRequest,
    @Param('conversationId') conversationId: string,
  ) {
    const userId = req.user.id;
    return this.chatService.leaveConversation(userId, conversationId);
  }

  @Post('conversations/:conversationId/mark-read')
  @ApiOperation({
    summary: 'Mark messages as read',
    description: 'Mark all messages in a conversation as read by the user.',
  })
  @ApiParam({
    name: 'conversationId',
    description: 'The ID of the conversation.',
  })
  @ApiResponse({
    status: 200,
    description: 'Messages were marked as read successfully.',
  })
  async markAsRead(
    @Request() req: AuthenticatedRequest,
    @Param('conversationId') conversationId: string,
  ) {
    const userId = req.user.id;
    const markAsReadDto: MarkAsReadDto = { conversationId };
    return this.chatService.markAsRead(userId, markAsReadDto);
  }

  @Put('messages/:messageId')
  @ApiOperation({
    summary: 'Edit a message',
    description: 'Edit the content of an existing message (sender only).',
  })
  @ApiParam({
    name: 'messageId',
    description: 'The ID of the message to edit.',
  })
  @ApiResponse({
    status: 200,
    description: 'The message was edited successfully.',
  })
  @ApiResponse({ status: 400, description: 'Feature not implemented.' })
  async editMessage(
    @Request() _req: AuthenticatedRequest,
    @Param('messageId') _messageId: string,
    @Body() _editMessageDto: Omit<EditMessageDto, 'messageId'>,
  ) {
    // TODO: Implement message editing logic in the ChatService
    throw new BadRequestException('Message editing is not yet implemented.');
  }

  @Delete('messages/:messageId')
  @ApiOperation({
    summary: 'Delete a message',
    description: 'Delete a message (sender only).',
  })
  @ApiParam({
    name: 'messageId',
    description: 'The ID of the message to delete.',
  })
  @ApiResponse({
    status: 200,
    description: 'The message was deleted successfully.',
  })
  @ApiResponse({ status: 400, description: 'Feature not implemented.' })
  async deleteMessage(
    @Request() _req: AuthenticatedRequest,
    @Param('messageId') _messageId: string,
  ) {
    // TODO: Implement message deletion logic in the ChatService
    throw new BadRequestException('Message deletion is not yet implemented.');
  }
}
