import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SendMessageDto, CreateChatDto } from './dto/chat.dto';
import { ERROR_MESSAGES } from '../common/constants/app.constants';

@Injectable()
export class ChatService {
    private readonly logger = new Logger(ChatService.name);

    constructor(private prismaService: PrismaService) { }

    async createChat(userId: string, createChatDto: CreateChatDto) {
        try {
            // Check if chat already exists between users
            const existingChat = await this.prismaService.chat.findFirst({
                where: {
                    members: {
                        every: {
                            userId: {
                                in: [userId, createChatDto.participantId],
                            },
                        },
                    },
                    isGroup: false,
                },
                include: {
                    members: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                    avatar: true,
                                },
                            },
                        },
                    },
                },
            });

            if (existingChat) {
                return existingChat;
            }

            // Create new chat
            const chat = await this.prismaService.chat.create({
                data: {
                    name: createChatDto.name,
                    isGroup: false,
                    members: {
                        create: [
                            { userId },
                            { userId: createChatDto.participantId },
                        ],
                    },
                },
                include: {
                    members: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                    avatar: true,
                                },
                            },
                        },
                    },
                },
            });

            return chat;
        } catch (error) {
            this.logger.error('Create chat failed', error);
            throw error;
        }
    }

    async getUserChats(userId: string, page = 1, limit = 20) {
        try {
            const offset = (page - 1) * limit;

            const chats = await this.prismaService.chat.findMany({
                where: {
                    members: {
                        some: {
                            userId,
                            leftAt: null,
                        },
                    },
                },
                include: {
                    members: {
                        where: { leftAt: null },
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                    avatar: true,
                                },
                            },
                        },
                    },
                    messages: {
                        orderBy: { createdAt: 'desc' },
                        take: 1,
                        include: {
                            sender: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                },
                            },
                        },
                    },
                    _count: {
                        select: {
                            messages: {
                                where: {
                                    senderId: { not: userId },
                                    isRead: false,
                                },
                            },
                        },
                    },
                },
                skip: offset,
                take: limit,
                orderBy: { updatedAt: 'desc' },
            });

            const total = await this.prismaService.chat.count({
                where: {
                    members: {
                        some: {
                            userId,
                            leftAt: null,
                        },
                    },
                },
            });

            return {
                chats,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            };
        } catch (error) {
            this.logger.error('Get user chats failed', error);
            throw error;
        }
    }

    async getChatMessages(chatId: string, userId: string, page = 1, limit = 50) {
        try {
            // Check if user is member of this chat
            const chatMember = await this.prismaService.chatMember.findFirst({
                where: {
                    chatId,
                    userId,
                    leftAt: null,
                },
            });

            if (!chatMember) {
                throw new ForbiddenException(ERROR_MESSAGES.NOT_CHAT_MEMBER);
            }

            const offset = (page - 1) * limit;

            const messages = await this.prismaService.message.findMany({
                where: { chatId },
                include: {
                    sender: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            avatar: true,
                        },
                    },
                },
                skip: offset,
                take: limit,
                orderBy: { createdAt: 'desc' },
            });

            const total = await this.prismaService.message.count({
                where: { chatId },
            });

            return {
                messages: messages.reverse(), // Reverse to show oldest first
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            };
        } catch (error) {
            this.logger.error('Get chat messages failed', error);
            throw error;
        }
    }

    async sendMessage(chatId: string, userId: string, sendMessageDto: SendMessageDto) {
        try {
            // Check if user is member of this chat
            const chatMember = await this.prismaService.chatMember.findFirst({
                where: {
                    chatId,
                    userId,
                    leftAt: null,
                },
            });

            if (!chatMember) {
                throw new ForbiddenException(ERROR_MESSAGES.NOT_CHAT_MEMBER);
            }

            const message = await this.prismaService.message.create({
                data: {
                    chatId,
                    senderId: userId,
                    content: sendMessageDto.content,
                    type: sendMessageDto.type || 'TEXT',
                    mediaUrl: sendMessageDto.mediaUrl,
                },
                include: {
                    sender: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            avatar: true,
                        },
                    },
                },
            });

            // Update chat's updatedAt timestamp
            await this.prismaService.chat.update({
                where: { id: chatId },
                data: { updatedAt: new Date() },
            });

            return message;
        } catch (error) {
            this.logger.error('Send message failed', error);
            throw error;
        }
    }

    async markMessagesAsRead(chatId: string, userId: string) {
        try {
            // Check if user is member of this chat
            const chatMember = await this.prismaService.chatMember.findFirst({
                where: {
                    chatId,
                    userId,
                    leftAt: null,
                },
            });

            if (!chatMember) {
                throw new ForbiddenException(ERROR_MESSAGES.NOT_CHAT_MEMBER);
            }

            // Mark all unread messages as read (except user's own messages)
            await this.prismaService.message.updateMany({
                where: {
                    chatId,
                    senderId: { not: userId },
                    isRead: false,
                },
                data: {
                    isRead: true,
                },
            });

            return { success: true };
        } catch (error) {
            this.logger.error('Mark messages as read failed', error);
            throw error;
        }
    }
}