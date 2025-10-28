import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    ConnectedSocket,
    MessageBody,
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';
import { PrismaService } from '../prisma/prisma.service';

@WebSocketGateway({
    cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
        credentials: true,
    },
    namespace: '/chat',
})
export class ChatGateway
    implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(ChatGateway.name);

    constructor(
        private readonly jwtService: JwtService,
        private readonly chatService: ChatService,
        private readonly prisma: PrismaService,
    ) { }

    afterInit(server: Server) {
        this.logger.log('WebSocket Gateway initialized');
    }

    async handleConnection(client: Socket) {
        try {
            // Extract JWT token from auth or query
            const token =
                client.handshake.auth?.token || client.handshake.query?.token;

            if (!token) {
                this.logger.warn(`Client ${client.id} - No token provided`);
                client.emit('error', {
                    message: 'Authentication required',
                    code: 'NO_TOKEN',
                });
                client.disconnect();
                return;
            }

            // Verify JWT token
            const payload = await this.jwtService.verifyAsync(token as string, {
                secret: process.env.JWT_SECRET,
            });

            // Store user ID in socket data
            client.data.userId = payload.sub;

            this.logger.log(
                `Client connected: ${client.id} (User: ${client.data.userId})`,
            );

            // Join user to their personal room for notifications
            client.join(`user:${client.data.userId}`);

            // Emit connection success
            client.emit('connected', {
                message: 'Connected to chat server',
                userId: client.data.userId,
            });
        } catch (error) {
            this.logger.error(
                `Client ${client.id} - Authentication failed: ${error.message}`,
            );
            client.emit('error', {
                message: 'Authentication failed',
                code: 'AUTH_FAILED',
            });
            client.disconnect();
        }
    }

    handleDisconnect(client: Socket) {
        this.logger.log(
            `Client disconnected: ${client.id} (User: ${client.data.userId || 'unknown'})`,
        );
    }

    /**
     * Join a conversation room
     */
    @SubscribeMessage('join_room')
    async handleJoinRoom(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { conversationId: string },
    ) {
        try {
            const userId = client.data.userId;
            const { conversationId } = data;

            if (!conversationId) {
                client.emit('error', {
                    message: 'conversationId is required',
                    code: 'MISSING_CONVERSATION_ID',
                });
                return;
            }

            // Validate user has access to conversation
            await this.chatService.validateConversationAccess(userId, conversationId);

            // Join the conversation room
            const roomName = `conversation:${conversationId}`;
            client.join(roomName);

            this.logger.log(`User ${userId} joined room ${roomName}`);

            client.emit('room_joined', {
                conversationId,
                message: 'Successfully joined conversation',
            });
        } catch (error) {
            this.logger.error(`Join room error: ${error.message}`);
            client.emit('error', {
                message: error.message || 'Failed to join room',
                code: 'JOIN_ROOM_FAILED',
            });
        }
    }

    /**
     * Leave a conversation room
     */
    @SubscribeMessage('leave_room')
    async handleLeaveRoom(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { conversationId: string },
    ) {
        try {
            const { conversationId } = data;

            if (!conversationId) {
                client.emit('error', {
                    message: 'conversationId is required',
                    code: 'MISSING_CONVERSATION_ID',
                });
                return;
            }

            const roomName = `conversation:${conversationId}`;
            client.leave(roomName);

            this.logger.log(`User ${client.data.userId} left room ${roomName}`);

            client.emit('room_left', {
                conversationId,
                message: 'Successfully left conversation',
            });
        } catch (error) {
            this.logger.error(`Leave room error: ${error.message}`);
            client.emit('error', {
                message: 'Failed to leave room',
                code: 'LEAVE_ROOM_FAILED',
            });
        }
    }

    /**
     * Send a message via WebSocket
     */
    @SubscribeMessage('send_message')
    async handleSendMessage(
        @ConnectedSocket() client: Socket,
        @MessageBody()
        data: {
            conversationId: string;
            content: string;
            attachmentUrls?: string[];
        },
    ) {
        try {
            const userId = client.data.userId;
            const { conversationId, content, attachmentUrls = [] } = data;

            if (!conversationId || !content) {
                client.emit('error', {
                    message: 'conversationId and content are required',
                    code: 'MISSING_REQUIRED_FIELDS',
                });
                return;
            }

            // Send message via service
            const result = await this.chatService.sendMessage(userId, {
                conversationId,
                content,
                attachmentUrls,
            });

            const message = result.data;

            // Broadcast message to all users in the conversation room
            const roomName = `conversation:${conversationId}`;
            this.server.to(roomName).emit('new_message', {
                message,
            });

            // Send acknowledgment to sender
            client.emit('message_sent', {
                message,
                success: true,
            });

            this.logger.log(
                `Message sent in conversation ${conversationId} by user ${userId}`,
            );
        } catch (error) {
            this.logger.error(`Send message error: ${error.message}`);
            client.emit('error', {
                message: error.message || 'Failed to send message',
                code: 'SEND_MESSAGE_FAILED',
            });
        }
    }

    /**
     * Handle typing start event
     */
    @SubscribeMessage('typing_start')
    async handleTypingStart(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { conversationId: string },
    ) {
        try {
            const userId = client.data.userId;
            const { conversationId } = data;

            if (!conversationId) {
                return;
            }

            // Validate access
            await this.chatService.validateConversationAccess(userId, conversationId);

            // Broadcast to room (except sender)
            const roomName = `conversation:${conversationId}`;
            client.to(roomName).emit('user_typing', {
                userId,
                conversationId,
                isTyping: true,
            });
        } catch (error) {
            this.logger.error(`Typing start error: ${error.message}`);
        }
    }

    /**
     * Handle typing stop event
     */
    @SubscribeMessage('typing_stop')
    async handleTypingStop(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { conversationId: string },
    ) {
        try {
            const userId = client.data.userId;
            const { conversationId } = data;

            if (!conversationId) {
                return;
            }

            // Validate access
            await this.chatService.validateConversationAccess(userId, conversationId);

            // Broadcast to room (except sender)
            const roomName = `conversation:${conversationId}`;
            client.to(roomName).emit('user_typing', {
                userId,
                conversationId,
                isTyping: false,
            });
        } catch (error) {
            this.logger.error(`Typing stop error: ${error.message}`);
        }
    }

    /**
     * Handle message read event
     */
    @SubscribeMessage('message_read')
    async handleMessageRead(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { messageId?: string; conversationId?: string },
    ) {
        try {
            const userId = client.data.userId;
            const { messageId, conversationId } = data;

            if (!messageId && !conversationId) {
                client.emit('error', {
                    message: 'messageId or conversationId is required',
                    code: 'MISSING_REQUIRED_FIELDS',
                });
                return;
            }

            // Mark as read via service
            await this.chatService.markAsRead(userId, { messageId, conversationId });

            // If conversationId provided, broadcast read receipt to room
            if (conversationId) {
                const roomName = `conversation:${conversationId}`;
                this.server.to(roomName).emit('messages_read', {
                    userId,
                    conversationId,
                    readAt: new Date(),
                });
            } else if (messageId) {
                // Get conversation ID from message
                const message = await this.prisma.message.findUnique({
                    where: { id: messageId },
                    select: { conversationId: true },
                });

                if (message) {
                    const roomName = `conversation:${message.conversationId}`;
                    this.server.to(roomName).emit('message_read', {
                        messageId,
                        userId,
                        readAt: new Date(),
                    });
                }
            }

            client.emit('read_receipt_sent', {
                success: true,
            });
        } catch (error) {
            this.logger.error(`Message read error: ${error.message}`);
            client.emit('error', {
                message: 'Failed to mark as read',
                code: 'MARK_READ_FAILED',
            });
        }
    }
}
