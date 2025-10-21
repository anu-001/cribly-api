import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards, ValidationPipe } from '@nestjs/common';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/chat.dto';
import {
  EnhancedSendMessageDto,
  EditMessageDto,
  DeleteMessageDto,
  TypingIndicatorDto,
  MessageStatusDto,
} from './dto/enhanced-chat.dto';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
})
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private connectedUsers = new Map<string, Socket>(); // userId -> socket
  private userSockets = new Map<string, string>(); // socketId -> userId
  private userTyping = new Map<string, Set<string>>(); // conversationId -> Set<userId>

  constructor(private chatService: ChatService) { }

  afterInit(server: Server) {
    this.logger.log('ChatGateway initialized');

    // Configure server settings
    server.engine.generateId = () => {
      return `cribly-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    };
  }

  handleConnection(client: Socket) {
    this.logger.log(
      `Client connected: ${client.id} from ${client.handshake.address}`,
    );

    // Set up heartbeat
    client.on('pong', () => {
      client.data.isAlive = true;
    });

    client.data.isAlive = true;
    client.data.connectedAt = new Date();

    // Send connection acknowledgment
    client.emit('connected', {
      socketId: client.id,
      timestamp: new Date().toISOString(),
    });
  }

  handleDisconnect(client: Socket) {
    const userId = this.userSockets.get(client.id);

    this.logger.log(
      `Client disconnected: ${client.id}${userId ? ` (user: ${userId})` : ''}`,
    );

    if (userId) {
      // Remove user from connected users and socket maps
      this.connectedUsers.delete(userId);
      this.userSockets.delete(client.id);

      // Clear typing indicators for this user
      for (const [conversationId, typingUsers] of this.userTyping.entries()) {
        if (typingUsers.has(userId)) {
          typingUsers.delete(userId);
          // Notify other users that this user stopped typing
          client.to(`chat:${conversationId}`).emit('userTyping', {
            userId,
            isTyping: false,
            conversationId,
          });
        }
      }

      // Notify user's contacts about offline status
      this.server.emit('userOffline', { userId });
    }
  }

  @SubscribeMessage('join')
  async handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string; chatId?: string },
  ) {
    try {
  // Store user connection
      this.connectedUsers.set(data.userId, client);
      this.userSockets.set(client.id, data.userId);

      // Join user to their personal room
      client.join(`user:${data.userId}`);

      // Join specific chat room if provided
      if (data.chatId) {
        client.join(`chat:${data.chatId}`);
      }

      this.logger.log(`User ${data.userId} joined with socket ${client.id}`);

      client.emit('joined', { success: true });
    } catch (error) {
      this.logger.error('Join failed', error);
      client.emit('error', { message: 'Failed to join' });
    }
  }

  @SubscribeMessage('joinChat')
  async handleJoinChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string },
  ) {
    try {
      client.join(`chat:${data.chatId}`);
      client.emit('joinedChat', { chatId: data.chatId });
    } catch (error) {
      this.logger.error('Join chat failed', error);
      client.emit('error', { message: 'Failed to join chat' });
    }
  }

  @SubscribeMessage('leaveChat')
  async handleLeaveChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string },
  ) {
    try {
      client.leave(`chat:${data.chatId}`);
      client.emit('leftChat', { chatId: data.chatId });
    } catch (error) {
      this.logger.error('Leave chat failed', error);
    }
  }

  @SubscribeMessage('markAsRead')
  async handleMarkAsRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string; userId: string },
  ) {
    try {
      await this.chatService.markAsRead(data.userId, {
        conversationId: data.chatId,
      });

      // Notify other users in chat that messages were read
      client.to(`chat:${data.chatId}`).emit('messagesRead', {
        userId: data.userId,
        chatId: data.chatId,
      });

      client.emit('markedAsRead', { chatId: data.chatId });
    } catch (error) {
      this.logger.error('Mark as read failed', error);
      client.emit('error', { message: 'Failed to mark messages as read' });
    }
  }

  // Utility method to send notification to a specific user
  sendNotificationToUser(
    userId: string,
    notification: Record<string, unknown>,
  ) {
    const socket = this.connectedUsers.get(userId);
    if (socket) {
      socket.emit('notification', notification);
    }
  }

  // Get online status of users
  @SubscribeMessage('getOnlineUsers')
  async handleGetOnlineUsers(@ConnectedSocket() client: Socket) {
    const onlineUsers = Array.from(this.connectedUsers.keys());
    client.emit('onlineUsers', { users: onlineUsers });
  }

  // Enhanced typing indicator with timeout
  @SubscribeMessage('typing')
  async handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      conversationId: string;
      userId: string;
      isTyping: boolean;
    },
  ) {
    try {
      const conversationTyping =
        this.userTyping.get(data.conversationId) || new Set();

      if (data.isTyping) {
        conversationTyping.add(data.userId);
        this.userTyping.set(data.conversationId, conversationTyping);

        // Auto-stop typing after 3 seconds
        setTimeout(() => {
          const currentTyping = this.userTyping.get(data.conversationId);
          if (currentTyping?.has(data.userId)) {
            currentTyping.delete(data.userId);
            client.to(`chat:${data.conversationId}`).emit('userTyping', {
              userId: data.userId,
              isTyping: false,
              conversationId: data.conversationId,
            });
          }
        }, 3000);
      } else {
        conversationTyping.delete(data.userId);
      }

      // Broadcast typing status to other users in the chat
      client.to(`chat:${data.conversationId}`).emit('userTyping', {
        userId: data.userId,
        isTyping: data.isTyping,
        conversationId: data.conversationId,
      });
    } catch (error) {
      this.logger.error('Typing event failed', error);
    }
  }

  // Enhanced message delivery with status tracking
  @SubscribeMessage('sendMessage')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      conversationId: string;
      userId: string;
      message: SendMessageDto;
    },
  ) {
    try {
      const message = await this.chatService.sendMessage(
        data.userId,
        data.message,
      );

      // Emit message to all users in the chat
      this.server.to(`chat:${data.conversationId}`).emit('newMessage', {
        message,
        conversationId: data.conversationId,
      });

      // Send delivery confirmation to sender
      client.emit('messageDelivered', {
        messageId: message.id,
        tempId: data.message.tempId,
        timestamp: new Date().toISOString(),
      });

      // Send read receipts to other participants
      this.server.to(`chat:${data.conversationId}`).emit('messageStatus', {
        messageId: message.id,
        status: 'delivered',
        conversationId: data.conversationId,
      });
    } catch (error) {
      this.logger.error('Send message failed', error);
      client.emit('messageError', {
        error: error.message,
        tempId: data.message.tempId,
      });
    }
  }
}
