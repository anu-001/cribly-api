import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddFavoriteDto, QueryFavoritesDto } from './dto';

@Injectable()
export class FavoritesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Add a listing to user's favorites
   */
  async addFavorite(userId: string, dto: AddFavoriteDto) {
    // Check if listing exists and is active
    const listing = await this.prisma.propertyListing.findFirst({
      where: {
        id: dto.listingId,
        status: 'ACTIVE',
        deletedAt: null,
      },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found or not active');
    }

    // Check if already favorited
    const existing = await this.prisma.favorite.findUnique({
      where: {
        userId_listingId: {
          userId,
          listingId: dto.listingId,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Listing already in favorites');
    }

    const favorite = await this.prisma.favorite.create({
      data: {
        userId,
        listingId: dto.listingId,
        notes: dto.notes,
      },
      include: {
        listing: {
          include: {
            owner: {
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
      },
    });

    return {
      success: true,
      message: 'Listing added to favorites',
      data: favorite,
    };
  }

  /**
   * Remove a listing from user's favorites
   */
  async removeFavorite(userId: string, listingId: string) {
    const favorite = await this.prisma.favorite.findUnique({
      where: {
        userId_listingId: {
          userId,
          listingId,
        },
      },
    });

    if (!favorite) {
      throw new NotFoundException('Favorite not found');
    }

    await this.prisma.favorite.delete({
      where: {
        id: favorite.id,
      },
    });

    return {
      success: true,
      message: 'Listing removed from favorites',
    };
  }

  /**
   * Get user's favorites with pagination
   */
  async getFavorites(userId: string, query: QueryFavoritesDto) {
    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const [favorites, total] = await Promise.all([
      this.prisma.favorite.findMany({
        where: { userId },
        include: {
          listing: {
            include: {
              owner: {
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
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.favorite.count({
        where: { userId },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      data: favorites,
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
   * Check if a listing is favorited by user
   */
  async isFavorited(userId: string, listingId: string) {
    const favorite = await this.prisma.favorite.findUnique({
      where: {
        userId_listingId: {
          userId,
          listingId,
        },
      },
    });

    return {
      success: true,
      data: {
        isFavorited: !!favorite,
        favoriteId: favorite?.id || null,
      },
    };
  }

  /**
   * Get favorites count for user
   */
  async getFavoritesCount(userId: string) {
    const count = await this.prisma.favorite.count({
      where: { userId },
    });

    return {
      success: true,
      data: { count },
    };
  }
}
