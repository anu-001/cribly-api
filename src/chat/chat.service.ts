import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notifications/notification.service';
import {
  SendMessageDto,
  JoinConversationDto,
  MarkAsReadDto,
} from './dto/chat.dto';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private prismaService: PrismaService,
    private notificationService: NotificationService,
  ) {}

  // Get user's conversations (from matches that have been accepted)
  async getUserConversations(userId: string, page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit;

      const conversations = await this.prismaService.conversation.findMany({
        where: {
          participants: {
            some: {
              userId,
              leftAt: null, // User hasn't left the conversation
            },
          },
          isActive: true,
        },
        include: {
          participants: {
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
            where: {
              userId: { not: userId }, // Exclude current user from participants
              leftAt: null,
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
          match: {
            include: {
              listing: {
                select: {
                  id: true,
                  title: true,
                  listingImages: {
                    take: 1,
                    select: { url: true },
                  },
                },
              },
            },
          },
        },
        orderBy: [{ lastMessageAt: 'desc' }, { createdAt: 'desc' }],
        skip: offset,
        take: limit,
      });

      const total = await this.prismaService.conversation.count({
        where: {
          participants: {
            some: {
              userId,
              leftAt: null,
            },
          },
          isActive: true,
        },
      });

      // Calculate unread count for each conversation
      const conversationsWithUnread = await Promise.all(
        conversations.map(async (conversation) => {
          const participant =
            await this.prismaService.conversationParticipant.findFirst({
              where: {
                conversationId: conversation.id,
                userId,
              },
            });

          const unreadCount = await this.prismaService.message.count({
            where: {
              conversationId: conversation.id,
              senderId: { not: userId },
              createdAt: {
                gt: participant?.lastReadAt || new Date(0),
              },
              isDeleted: false,
            },
          });

          return {
            ...conversation,
            unreadCount,
            lastMessage: conversation.messages?.[0] ?? null,
            otherParticipant: conversation.participants?.[0]?.user ?? null,
          };
        }),
      );

      return {
        conversations: conversationsWithUnread,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error('Get conversations failed', error);
      throw error;
    }
  }

  // Send message in a conversation
  async sendMessage(userId: string, sendMessageDto: SendMessageDto) {
    try {
      // Verify user is participant in conversation
      const participant =
        await this.prismaService.conversationParticipant.findFirst({
          where: {
            conversationId: sendMessageDto.conversationId,
            userId,
            leftAt: null,
          },
        });

      if (!participant) {
        throw new BadRequestException(
          'User is not a participant in this conversation',
        );
      }

      // Validate media URL if provided
      if (
        sendMessageDto.mediaUrl &&
        !this.isValidMediaUrl(sendMessageDto.mediaUrl)
      ) {
        throw new BadRequestException('Invalid media URL provided');
      }

      // Create message
      const message = await this.prismaService.message.create({
        data: {
          content: sendMessageDto.content,
          type: sendMessageDto.type || 'TEXT',
          mediaUrl: sendMessageDto.mediaUrl,
          senderId: userId,
          conversationId: sendMessageDto.conversationId,
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
          conversation: {
            include: {
              participants: {
                where: {
                  userId: { not: userId }, // Get other participants
                  leftAt: null,
                },
                include: {
                  user: {
                    select: {
                      id: true,
                      firstName: true,
                      email: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      // Update conversation's lastMessageAt
      await this.prismaService.conversation.update({
        where: { id: sendMessageDto.conversationId },
        data: { lastMessageAt: new Date() },
      });

      // Send push and email notifications to other participants
      const otherParticipants = message.conversation.participants;
      for (const participant of otherParticipants) {
        try {
          // Send push notification
          await this.notificationService.sendNewMessageNotification(
            participant.userId,
            {
              chatId: sendMessageDto.conversationId,
              messageId: message.id,
              senderName: `${message.sender.firstName} ${message.sender.lastName}`,
              messageContent: message.content,
              userEmail: participant.user.email,
              userName: participant.user.firstName,
            },
          );
        } catch (notificationError) {
          this.logger.warn(
            `Failed to send notification to user ${participant.userId}:`,
            notificationError,
          );
        }
      }

      return {
        id: message.id,
        content: message.content,
        type: message.type,
        mediaUrl: message.mediaUrl,
        senderId: message.senderId,
        conversationId: message.conversationId,
        createdAt: message.createdAt,
        isRead: message.isRead,
        isEdited: message.isEdited,
        sender: message.sender,
      };
    } catch (error) {
      this.logger.error('Send message failed', error);
      throw error;
    }
  }

  // Validate media URLs (basic validation)
  private isValidMediaUrl(url: string): boolean {
    try {
      const parsedUrl = new URL(url);
      // Accept https URLs and common media domains
      return (
        parsedUrl.protocol === 'https:' &&
        (parsedUrl.hostname.includes('cloudinary.com') ||
          parsedUrl.hostname.includes('amazonaws.com') ||
          parsedUrl.hostname.includes('cribly.com'))
      );
    } catch {
      return false;
    }
  }

  // Get messages for a conversation with pagination
  async getConversationMessages(
    userId: string,
    conversationId: string,
    page = 1,
    limit = 50,
  ) {
    try {
      // Verify user is participant in conversation
      const participant =
        await this.prismaService.conversationParticipant.findFirst({
          where: {
            conversationId,
            userId,
            leftAt: null,
          },
        });

      if (!participant) {
        throw new NotFoundException('Conversation not found or access denied');
      }

      const offset = (page - 1) * limit;

      const messages = await this.prismaService.message.findMany({
        where: {
          conversationId,
          isDeleted: false,
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
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      });

      const total = await this.prismaService.message.count({
        where: {
          conversationId,
          isDeleted: false,
        },
      });

      // Mark messages as delivered when fetched
      await this.prismaService.message.updateMany({
        where: {
          conversationId,
          senderId: { not: userId },
          isRead: false,
          isDeleted: false,
        },
        data: {
          isRead: true,
        },
      });

      return {
        messages: messages.reverse(), // Return in chronological order
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error('Get conversation messages failed', error);
      throw error;
    }
  }

  // Join/create a conversation based on match
  async joinConversation(
    userId: string,
    joinConversationDto: JoinConversationDto,
  ) {
    try {
      // Check if conversation exists
      const conversation = await this.prismaService.conversation.findUnique({
        where: { id: joinConversationDto.conversationId },
        include: {
          participants: {
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
          match: {
            select: {
              id: true,
              status: true,
            },
          },
        },
      });

      if (!conversation) {
        throw new NotFoundException('Conversation not found');
      }

      // Check if user is already a participant
      const existingParticipant = conversation.participants.find(
        (p) => p.userId === userId && p.leftAt === null,
      );

      if (existingParticipant) {
        return {
          id: conversation.id,
          matchId: conversation.matchId,
          participants: conversation.participants,
          createdAt: conversation.createdAt,
          updatedAt: conversation.updatedAt,
          isActive: conversation.isActive,
        };
      }

      // Check if user has previously left and wants to rejoin
      const previousParticipant = conversation.participants.find(
        (p) => p.userId === userId,
      );

      if (previousParticipant && previousParticipant.leftAt) {
        // User rejoining conversation
        await this.prismaService.conversationParticipant.update({
          where: { id: previousParticipant.id },
          data: {
            leftAt: null,
            joinedAt: new Date(),
          },
        });
      } else {
        // New participant (shouldn't happen in normal flow, but handle it)
        await this.prismaService.conversationParticipant.create({
          data: {
            conversationId: conversation.id,
            userId,
            joinedAt: new Date(),
          },
        });
      }

      // Return updated conversation
      const updatedConversation =
        await this.prismaService.conversation.findUnique({
          where: { id: joinConversationDto.conversationId },
          include: {
            participants: {
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
          },
        });

      return {
        id: updatedConversation!.id,
        matchId: updatedConversation!.matchId,
        participants: updatedConversation!.participants,
        createdAt: updatedConversation!.createdAt,
        updatedAt: updatedConversation!.updatedAt,
        isActive: updatedConversation!.isActive,
      };
    } catch (error) {
      this.logger.error('Join conversation failed', error);
      throw error;
    }
  }

  // Mark messages as read
  async markAsRead(userId: string, markAsReadDto: MarkAsReadDto) {
    try {
      // Verify user is participant in conversation
      const participant =
        await this.prismaService.conversationParticipant.findFirst({
          where: {
            conversationId: markAsReadDto.conversationId,
            userId,
            leftAt: null,
          },
        });

      if (!participant) {
        throw new NotFoundException('Conversation not found or access denied');
      }

      // Update participant's lastReadAt timestamp
      await this.prismaService.conversationParticipant.update({
        where: {
          id: participant.id,
        },
        data: {
          lastReadAt: new Date(),
        },
      });

      // Mark all messages in conversation as read for this user
      const updateResult = await this.prismaService.message.updateMany({
        where: {
          conversationId: markAsReadDto.conversationId,
          senderId: { not: userId }, // Don't mark own messages as read
          isRead: false,
          isDeleted: false,
        },
        data: {
          isRead: true,
        },
      });

      return {
        success: true,
        messagesMarkedRead: updateResult.count,
      };
    } catch (error) {
      this.logger.error('Mark as read failed', error);
      throw error;
    }
  }

  // Get conversation by ID
  async getConversationById(userId: string, conversationId: string) {
    try {
      // TODO: Implement once Prisma client recognizes new models
      // For now, return placeholder to prevent compilation errors
      return {
        id: conversationId,
        matchId: 'placeholder-match-id',
        participants: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      this.logger.error('Get conversation by ID failed', error);
      throw error;
    }
  }

  // Delete/leave conversation
  async leaveConversation(_userId: string, _conversationId: string) {
    try {
      // TODO: Implement once Prisma client recognizes new models
      // For now, return success placeholder
      return { success: true };
    } catch (error) {
      this.logger.error('Leave conversation failed', error);
      throw error;
    }
  }
}
