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
  DeleteMessageDto,
} from './dto/enhanced-chat.dto';

@ApiTags('Chat & Messaging')
@Controller('api/v1/chat')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChatController {
  constructor(private readonly chatService: ChatService) { }

  @Get('conversations')
  @ApiOperation({
    summary: 'Get user conversations',
    description: 'Retrieve all conversations for the authenticated user with pagination',
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
    description: 'List of user conversations with unread counts',
  })
  async getUserConversations(
    @Request() req: any,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    const userId = req.user.id;
    return this.chatService.getUserConversations(userId, Number(page), Number(limit));
  }

  @Get('conversations/:conversationId/messages')
  @ApiOperation({
    summary: 'Get conversation messages',
    description: 'Retrieve messages for a specific conversation with pagination',
  })
  @ApiParam({
    name: 'conversationId',
    description: 'ID of the conversation',
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
  @ApiResponse({
    status: 200,
    description: 'List of conversation messages',
  })
  async getConversationMessages(
    @Request() req: any,
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
    summary: 'Send message',
    description: 'Send a new message in a conversation',
  })
  @ApiParam({
    name: 'conversationId',
    description: 'ID of the conversation',
  })
  @ApiResponse({
    status: 201,
    description: 'Message sent successfully',
  })
  async sendMessage(
    @Request() req: any,
    @Param('conversationId') conversationId: string,
    @Body() sendMessageDto: Omit<SendMessageDto, 'conversationId'>,
  ) {
    const userId = req.user.id;
    const messageDto = { ...sendMessageDto, conversationId };
    return this.chatService.sendMessage(userId, messageDto);
  }

  @Post('conversations/:conversationId/messages/enhanced')
  @ApiOperation({
    summary: 'Send enhanced message',
    description: 'Send a message with file attachments and reply functionality',
  })
  @ApiParam({
    name: 'conversationId',
    description: 'ID of the conversation',
  })
  @ApiResponse({
    status: 201,
    description: 'Enhanced message sent successfully',
  })
  async sendEnhancedMessage(
    @Request() req: any,
    @Param('conversationId') conversationId: string,
    @Body() sendMessageDto: Omit<EnhancedSendMessageDto, 'conversationId'>,
  ) {
    const userId = req.user.id;

    // Convert enhanced DTO to basic DTO for now
    // TODO: Implement enhanced message handling in service
    const basicMessageDto: SendMessageDto = {
      conversationId,
      content: sendMessageDto.content,
      type: sendMessageDto.type,
      mediaUrl: sendMessageDto.attachments?.[0]?.fileUrl,
      tempId: sendMessageDto.tempId,
    };

    return this.chatService.sendMessage(userId, basicMessageDto);
  }

  @Put('messages/:messageId')
  @ApiOperation({
    summary: 'Edit message',
    description: 'Edit an existing message (sender only)',
  })
  @ApiParam({
    name: 'messageId',
    description: 'ID of the message to edit',
  })
  @ApiResponse({
    status: 200,
    description: 'Message edited successfully',
  })
  async editMessage(
    @Request() req: any,
    @Param('messageId') messageId: string,
    @Body() editMessageDto: Omit<EditMessageDto, 'messageId'>,
  ) {
    // TODO: Implement message editing in service
    throw new BadRequestException('Message editing not yet implemented');
  }

  @Delete('messages/:messageId')
  @ApiOperation({
    summary: 'Delete message',
    description: 'Delete a message (sender only)',
  })
  @ApiParam({
    name: 'messageId',
    description: 'ID of the message to delete',
  })
  @ApiResponse({
    status: 200,
    description: 'Message deleted successfully',
  })
  async deleteMessage(
    @Request() req: any,
    @Param('messageId') messageId: string,
    @Body() deleteMessageDto?: Omit<DeleteMessageDto, 'messageId'>,
  ) {
    // TODO: Implement message deletion in service
    throw new BadRequestException('Message deletion not yet implemented');
  }

  @Post('conversations/join')
  @ApiOperation({
    summary: 'Join conversation',
    description: 'Join or rejoin a conversation',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully joined conversation',
  })
  async joinConversation(
    @Request() req: any,
    @Body() joinConversationDto: JoinConversationDto,
  ) {
    const userId = req.user.id;
    return this.chatService.joinConversation(userId, joinConversationDto);
  }

  @Post('conversations/:conversationId/mark-read')
  @ApiOperation({
    summary: 'Mark messages as read',
    description: 'Mark all messages in a conversation as read',
  })
  @ApiParam({
    name: 'conversationId',
    description: 'ID of the conversation',
  })
  @ApiResponse({
    status: 200,
    description: 'Messages marked as read successfully',
  })
  async markAsRead(
    @Request() req: any,
    @Param('conversationId') conversationId: string,
  ) {
    const userId = req.user.id;
    const markAsReadDto: MarkAsReadDto = { conversationId };
    return this.chatService.markAsRead(userId, markAsReadDto);
  }

  @Get('conversations/:conversationId')
  @ApiOperation({
    summary: 'Get conversation details',
    description: 'Get detailed information about a specific conversation',
  })
  @ApiParam({
    name: 'conversationId',
    description: 'ID of the conversation',
  })
  @ApiResponse({
    status: 200,
    description: 'Conversation details',
  })
  async getConversationById(
    @Request() req: any,
    @Param('conversationId') conversationId: string,
  ) {
    const userId = req.user.id;
    return this.chatService.getConversationById(userId, conversationId);
  }

  @Delete('conversations/:conversationId/leave')
  @ApiOperation({
    summary: 'Leave conversation',
    description: 'Leave a conversation (stops receiving messages)',
  })
  @ApiParam({
    name: 'conversationId',
    description: 'ID of the conversation to leave',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully left conversation',
  })
  async leaveConversation(
    @Request() req: any,
    @Param('conversationId') conversationId: string,
  ) {
    const userId = req.user.id;
    return this.chatService.leaveConversation(userId, conversationId);
  }
}