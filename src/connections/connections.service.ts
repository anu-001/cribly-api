import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateConnectionDto,
  UpdateConnectionDto,
  QueryConnectionsDto,
} from './dto';
import { ConnectionStatus } from '@prisma/client';

@Injectable()
export class ConnectionsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new connection request
   */
  async createConnection(userId: string, dto: CreateConnectionDto) {
    // Validate that either targetId or listingId is provided
    if (!dto.targetId && !dto.listingId) {
      throw new BadRequestException(
        'Either targetId or listingId must be provided',
      );
    }

    if (dto.targetId && dto.listingId) {
      throw new BadRequestException(
        'Only one of targetId or listingId should be provided',
      );
    }

    let recipientId: string;
    let connectionType: string;
    let roommateProfileId: string | undefined;

    // Handle listing-based connection
    if (dto.listingId) {
      const listing = await this.prisma.propertyListing.findFirst({
        where: {
          id: dto.listingId,
          status: 'ACTIVE',
          deletedAt: null,
        },
        select: { ownerId: true },
      });

      if (!listing) {
        throw new NotFoundException('Listing not found or not active');
      }

      // Check if connecting to own listing
      if (listing.ownerId === userId) {
        throw new BadRequestException('Cannot connect to your own listing');
      }

      recipientId = listing.ownerId;
      connectionType = 'listing';
    }
    // Handle roommate profile-based connection
    else {
      // Check if target user exists and has active profile
      const profile = await this.prisma.roommateProfile.findFirst({
        where: {
          userId: dto.targetId,
          isActive: true,
        },
        select: { id: true, userId: true },
      });

      if (!profile) {
        throw new NotFoundException(
          'Roommate profile not found or not active',
        );
      }

      // Check if connecting to self
      if (dto.targetId === userId) {
        throw new BadRequestException('Cannot connect to yourself');
      }

      recipientId = dto.targetId!;
      roommateProfileId = profile.id;
      connectionType = 'roommate';
    }

    // Check for existing connection
    const existingConnection = await this.prisma.connection.findFirst({
      where: {
        OR: [
          {
            requesterId: userId,
            recipientId,
            listingId: dto.listingId,
          },
          {
            requesterId: recipientId,
            recipientId: userId,
            listingId: dto.listingId,
          },
          {
            requesterId: userId,
            recipientId,
            roommateProfileId,
          },
          {
            requesterId: recipientId,
            recipientId: userId,
            roommateProfileId,
          },
        ],
        status: {
          in: ['PENDING', 'ACCEPTED'],
        },
      },
    });

    if (existingConnection) {
      if (existingConnection.status === 'BLOCKED') {
        throw new ForbiddenException(
          'Cannot connect - user has blocked connections',
        );
      }
      throw new ConflictException('Connection already exists');
    }

    // Check for blocked status
    const blockedConnection = await this.prisma.connection.findFirst({
      where: {
        OR: [
          { requesterId: userId, recipientId, status: 'BLOCKED' },
          { requesterId: recipientId, recipientId: userId, status: 'BLOCKED' },
        ],
      },
    });

    if (blockedConnection) {
      throw new ForbiddenException('Connection is blocked');
    }

    // Create connection with 7-day expiry
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const connection = await this.prisma.connection.create({
      data: {
        requesterId: userId,
        recipientId,
        listingId: dto.listingId,
        roommateProfileId,
        message: dto.message,
        status: 'PENDING',
        connectionType,
        expiresAt,
      },
      include: {
        requester: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            verificationStatus: true,
          },
        },
        recipient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            verificationStatus: true,
          },
        },
        listing: true,
        roommateProfile: true,
      },
    });

    return {
      success: true,
      message: 'Connection request sent successfully',
      data: connection,
    };
  }

  /**
   * Get connections with filters and pagination
   */
  async getConnections(userId: string, query: QueryConnectionsDto) {
    const { status, direction = 'all', page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    // Build where clause based on direction
    const where: any = {
      OR: [],
    };

    if (direction === 'incoming' || direction === 'all') {
      where.OR.push({ recipientId: userId });
    }

    if (direction === 'outgoing' || direction === 'all') {
      where.OR.push({ requesterId: userId });
    }

    if (status) {
      where.status = status;
    }

    const [connections, total] = await Promise.all([
      this.prisma.connection.findMany({
        where,
        include: {
          requester: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
              verificationStatus: true,
            },
          },
          recipient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
              verificationStatus: true,
            },
          },
          listing: {
            select: {
              id: true,
              title: true,
              price: true,
              city: true,
              imageUrls: true,
              propertyType: true,
            },
          },
          roommateProfile: {
            select: {
              id: true,
              bio: true,
              minBudget: true,
              maxBudget: true,
              preferredCities: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.connection.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      data: connections,
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
   * Update connection status (accept/decline)
   */
  async updateConnection(
    userId: string,
    connectionId: string,
    dto: UpdateConnectionDto,
  ) {
    const connection = await this.prisma.connection.findUnique({
      where: { id: connectionId },
      include: {
        requester: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        recipient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!connection) {
      throw new NotFoundException('Connection not found');
    }

    // Only recipient can accept/decline
    if (connection.recipientId !== userId) {
      throw new ForbiddenException(
        'Only the recipient can accept or decline this connection',
      );
    }

    // Check if connection is still pending
    if (connection.status !== 'PENDING') {
      throw new BadRequestException(
        `Connection is already ${connection.status.toLowerCase()}`,
      );
    }

    // Check if connection has expired
    if (new Date() > connection.expiresAt) {
      await this.prisma.connection.update({
        where: { id: connectionId },
        data: { status: 'EXPIRED' },
      });
      throw new BadRequestException('Connection request has expired');
    }

    // Update connection
    const updatedConnection = await this.prisma.connection.update({
      where: { id: connectionId },
      data: {
        status: dto.status,
        declineReason: dto.status === 'DECLINED' ? dto.declineReason : null,
        respondedAt: new Date(),
      },
      include: {
        requester: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            verificationStatus: true,
          },
        },
        recipient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            verificationStatus: true,
          },
        },
        listing: true,
        roommateProfile: true,
      },
    });

    // If accepted, create conversation
    if (dto.status === 'ACCEPTED') {
      const conversation = await this.prisma.conversation.create({
        data: {
          connectionId: connection.id,
          members: {
            create: [
              { userId: connection.requesterId },
              { userId: connection.recipientId },
            ],
          },
        },
      });

      return {
        success: true,
        message: 'Connection accepted and conversation created',
        data: {
          connection: updatedConnection,
          conversationId: conversation.id,
        },
      };
    }

    return {
      success: true,
      message: `Connection ${dto.status.toLowerCase()} successfully`,
      data: updatedConnection,
    };
  }

  /**
   * Cancel outgoing connection request
   */
  async cancelConnection(userId: string, connectionId: string) {
    const connection = await this.prisma.connection.findUnique({
      where: { id: connectionId },
    });

    if (!connection) {
      throw new NotFoundException('Connection not found');
    }

    // Only requester can cancel
    if (connection.requesterId !== userId) {
      throw new ForbiddenException(
        'Only the requester can cancel this connection',
      );
    }

    // Can only cancel pending connections
    if (connection.status !== 'PENDING') {
      throw new BadRequestException('Can only cancel pending connections');
    }

    await this.prisma.connection.delete({
      where: { id: connectionId },
    });

    return {
      success: true,
      message: 'Connection request cancelled successfully',
    };
  }

  /**
   * Block a user from connecting
   */
  async blockConnection(userId: string, connectionId: string) {
    const connection = await this.prisma.connection.findUnique({
      where: { id: connectionId },
    });

    if (!connection) {
      throw new NotFoundException('Connection not found');
    }

    // Only recipient can block
    if (connection.recipientId !== userId) {
      throw new ForbiddenException(
        'Only the recipient can block this connection',
      );
    }

    await this.prisma.connection.update({
      where: { id: connectionId },
      data: {
        status: 'BLOCKED',
        respondedAt: new Date(),
      },
    });

    return {
      success: true,
      message: 'User blocked successfully',
    };
  }

  /**
   * Check expired connections (called by scheduled job)
   */
  async checkExpiredConnections() {
    const now = new Date();

    const expiredConnections = await this.prisma.connection.updateMany({
      where: {
        status: 'PENDING',
        expiresAt: {
          lt: now,
        },
      },
      data: {
        status: 'EXPIRED',
      },
    });

    return {
      success: true,
      message: `${expiredConnections.count} connections expired`,
      count: expiredConnections.count,
    };
  }
}
