import {
    WebSocketGateway,
    SubscribeMessage,
    MessageBody,
    WebSocketServer,
    ConnectedSocket,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/chat.dto';

@WebSocketGateway({
    cors: {
        origin: '*',
    },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(ChatGateway.name);
    private connectedUsers = new Map<string, string>(); // userId -> socketId

    constructor(private chatService: ChatService) { }

    handleConnection(client: Socket) {
        this.logger.log(`Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Client disconnected: ${client.id}`);

        // Remove user from connected users map
        for (const [userId, socketId] of this.connectedUsers.entries()) {
            if (socketId === client.id) {
                this.connectedUsers.delete(userId);
                break;
            }
        }
    }

    @SubscribeMessage('join')
    async handleJoin(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { userId: string; chatId?: string },
    ) {
        try {
            // Store user connection
            this.connectedUsers.set(data.userId, client.id);

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

    @SubscribeMessage('sendMessage')
    async handleMessage(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: {
            chatId: string;
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
            this.server.to(`chat:${data.chatId}`).emit('newMessage', {
                message,
                chatId: data.chatId,
            });

            // Send delivery confirmation to sender
            client.emit('messageDelivered', {
                messageId: message.id,
                tempId: data.message.tempId, // For frontend optimistic updates
            });

        } catch (error) {
            this.logger.error('Send message failed', error);
            client.emit('messageError', {
                error: error.message,
                tempId: data.message.tempId,
            });
        }
    }

    @SubscribeMessage('typing')
    async handleTyping(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: {
            chatId: string;
            userId: string;
            isTyping: boolean;
        },
    ) {
        try {
            // Broadcast typing status to other users in the chat
            client.to(`chat:${data.chatId}`).emit('userTyping', {
                userId: data.userId,
                isTyping: data.isTyping,
                chatId: data.chatId,
            });
        } catch (error) {
            this.logger.error('Typing event failed', error);
        }
    }

    @SubscribeMessage('markAsRead')
    async handleMarkAsRead(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { chatId: string; userId: string },
    ) {
        try {
            await this.chatService.markAsRead(data.userId, { conversationId: data.chatId });

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
    sendNotificationToUser(userId: string, notification: any) {
        const socketId = this.connectedUsers.get(userId);
        if (socketId) {
            this.server.to(socketId).emit('notification', notification);
        }
    }
}