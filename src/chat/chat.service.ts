import {
    Injectable,
    NotFoundException,
    ForbiddenException,
    BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
    SendMessageDto,
    MarkAsReadDto,
    QueryMessagesDto,
    QueryConversationsDto,
} from './dto';

@Injectable()
export class ChatService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Get user's conversation list with last message and unread count
     */
    async getConversations(userId: string, query: QueryConversationsDto) {
        const { page = 1, limit = 20 } = query;
        const skip = (page - 1) * limit;

        // Get conversations where user is a member
        const [conversations, total] = await Promise.all([
            this.prisma.conversation.findMany({
                where: {
                    members: {
                        some: {
                            userId,
                        },
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
                                    avatarUrl: true,
                                    verificationStatus: true,
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
                                    avatarUrl: true,
                                },
                            },
                        },
                    },
                    connection: {
                        include: {
                            listing: {
                                select: {
                                    id: true,
                                    title: true,
                                    city: true,
                                    propertyType: true,
                                    imageUrls: true,
                                },
                            },
                            requester: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                    avatarUrl: true,
                                },
                            },
                            recipient: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                    avatarUrl: true,
                                },
                            },
                        },
                    },
                },
                orderBy: {
                    updatedAt: 'desc',
                },
                skip,
                take: limit,
            }),
            this.prisma.conversation.count({
                where: {
                    members: {
                        some: {
                            userId,
                        },
                    },
                },
            }),
        ]);

        // Calculate unread count for each conversation
        const conversationsWithUnread = await Promise.all(
            conversations.map(async (conversation) => {
                const member = conversation.members.find((m) => m.userId === userId);
                const unreadCount = await this.prisma.message.count({
                    where: {
                        conversationId: conversation.id,
                        senderId: { not: userId },
                        createdAt: {
                            gt: member?.lastReadAt || new Date(0),
                        },
                    },
                });

                return {
                    ...conversation,
                    unreadCount,
                    lastMessage: conversation.messages[0] || null,
                };
            }),
        );

        const totalPages = Math.ceil(total / limit);

        return {
            success: true,
            data: conversationsWithUnread,
            meta: {
                total,
                page,
                limit,
                totalPages,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1,
            },
        };
    }

    /**
     * Get messages for a conversation with pagination
     */
    async getMessages(
        userId: string,
        conversationId: string,
        query: QueryMessagesDto,
    ) {
        // Validate user has access to conversation
        await this.validateConversationAccess(userId, conversationId);

        const { page = 1, limit = 50 } = query;
        const skip = (page - 1) * limit;

        const [messages, total] = await Promise.all([
            this.prisma.message.findMany({
                where: {
                    conversationId,
                    deletedAt: null,
                },
                include: {
                    sender: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            avatarUrl: true,
                            verificationStatus: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.message.count({
                where: {
                    conversationId,
                    deletedAt: null,
                },
            }),
        ]);

        const totalPages = Math.ceil(total / limit);

        return {
            success: true,
            data: messages.reverse(), // Reverse to show oldest first on current page
            meta: {
                total,
                page,
                limit,
                totalPages,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1,
            },
        };
    }

    /**
     * Send a message in a conversation
     */
    async sendMessage(userId: string, dto: SendMessageDto) {
        const { conversationId, content, attachmentUrls = [] } = dto;

        // Validate user has access to conversation
        await this.validateConversationAccess(userId, conversationId);

        // Create message
        const message = await this.prisma.message.create({
            data: {
                conversationId,
                senderId: userId,
                content,
                attachmentUrls,
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        avatarUrl: true,
                        verificationStatus: true,
                    },
                },
                conversation: {
                    include: {
                        members: {
                            select: {
                                userId: true,
                            },
                        },
                    },
                },
            },
        });

        // Update conversation's updatedAt timestamp
        await this.prisma.conversation.update({
            where: { id: conversationId },
            data: { updatedAt: new Date() },
        });

        return {
            success: true,
            message: 'Message sent successfully',
            data: message,
        };
    }

    /**
     * Mark message(s) as read
     */
    async markAsRead(userId: string, dto: MarkAsReadDto) {
        if (!dto.messageId && !dto.conversationId) {
            throw new BadRequestException(
                'Either messageId or conversationId must be provided',
            );
        }

        if (dto.messageId) {
            // Mark single message as read
            const message = await this.prisma.message.findUnique({
                where: { id: dto.messageId },
                include: {
                    conversation: {
                        include: {
                            members: {
                                where: { userId },
                            },
                        },
                    },
                },
            });

            if (!message) {
                throw new NotFoundException('Message not found');
            }

            if (message.conversation.members.length === 0) {
                throw new ForbiddenException('Access denied to this conversation');
            }

            // Only mark as read if user is not the sender
            if (message.senderId !== userId) {
                await this.prisma.message.update({
                    where: { id: dto.messageId },
                    data: {
                        isRead: true,
                        readAt: new Date(),
                    },
                });
            }

            return {
                success: true,
                message: 'Message marked as read',
            };
        }

        if (dto.conversationId) {
            // Validate access
            await this.validateConversationAccess(userId, dto.conversationId);

            // Mark all messages in conversation as read (except user's own messages)
            await this.prisma.message.updateMany({
                where: {
                    conversationId: dto.conversationId,
                    senderId: { not: userId },
                    isRead: false,
                },
                data: {
                    isRead: true,
                    readAt: new Date(),
                },
            });

            // Update lastReadAt for this user in conversation
            await this.prisma.conversationMember.updateMany({
                where: {
                    conversationId: dto.conversationId,
                    userId,
                },
                data: {
                    lastReadAt: new Date(),
                },
            });

            return {
                success: true,
                message: 'All messages marked as read',
            };
        }
    }

    /**
     * Get total unread message count for user
     */
    async getUnreadCount(userId: string) {
        // Get all conversations user is a member of
        const conversations = await this.prisma.conversationMember.findMany({
            where: { userId },
            select: {
                conversationId: true,
                lastReadAt: true,
            },
        });

        // Count unread messages across all conversations
        const unreadCount = await this.prisma.message.count({
            where: {
                conversationId: {
                    in: conversations.map((c) => c.conversationId),
                },
                senderId: { not: userId },
                OR: conversations.map((c) => ({
                    conversationId: c.conversationId,
                    createdAt: {
                        gt: c.lastReadAt || new Date(0),
                    },
                })),
            },
        });

        return {
            success: true,
            data: { count: unreadCount },
        };
    }

    /**
     * Validate user has access to conversation (is a member)
     */
    async validateConversationAccess(
        userId: string,
        conversationId: string,
    ): Promise<void> {
        const member = await this.prisma.conversationMember.findUnique({
            where: {
                conversationId_userId: {
                    conversationId,
                    userId,
                },
            },
        });

        if (!member) {
            throw new ForbiddenException(
                'Access denied - you are not a member of this conversation',
            );
        }
    }

    /**
     * Get conversation by ID with full details
     */
    async getConversationById(userId: string, conversationId: string) {
        await this.validateConversationAccess(userId, conversationId);

        const conversation = await this.prisma.conversation.findUnique({
            where: { id: conversationId },
            include: {
                members: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                avatarUrl: true,
                                verificationStatus: true,
                            },
                        },
                    },
                },
                connection: {
                    include: {
                        listing: {
                            select: {
                                id: true,
                                title: true,
                                city: true,
                                propertyType: true,
                                imageUrls: true,
                            },
                        },
                    },
                },
            },
        });

        if (!conversation) {
            throw new NotFoundException('Conversation not found');
        }

        return {
            success: true,
            data: conversation,
        };
    }
}
