import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { CreateListingDto, UpdateListingDto, QueryListingDto } from './dto';
import { PropertyStatus, Prisma } from '@prisma/client';

@Injectable()
export class ListingsService {
  private readonly CACHE_TTL = 1800; // 30 minutes
  private readonly CACHE_PREFIX = 'listing:';

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  /**
   * Create a new property listing
   * Requires verified user
   */
  async create(createListingDto: CreateListingDto, ownerId: string) {
    // Validate image URLs
    if (
      !createListingDto.imageUrls ||
      createListingDto.imageUrls.length === 0
    ) {
      throw new BadRequestException('At least one image is required');
    }

    // Set publishedAt if status is ACTIVE
    const publishedAt =
      createListingDto.status === PropertyStatus.ACTIVE ? new Date() : null;

    const listing = await this.prisma.propertyListing.create({
      data: {
        ...createListingDto,
        ownerId,
        publishedAt,
      },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            verificationStatus: true,
          },
        },
      },
    });

    return listing;
  }

  /**
   * Get all listings with search, filters, and pagination
   */
  async findAll(queryDto: QueryListingDto) {
    const {
      search,
      minPrice,
      maxPrice,
      propertyType,
      minBedrooms,
      city,
      latitude,
      longitude,
      radiusKm,
      sortBy = 'newest',
      page = 1,
      limit = 20,
    } = queryDto;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.PropertyListingWhereInput = {
      status: PropertyStatus.ACTIVE,
      deletedAt: null,
    };

    // Text search across title, description, address
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Price range
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) {
        where.price.gte = minPrice;
      }
      if (maxPrice !== undefined) {
        where.price.lte = maxPrice;
      }
    }

    // Property type
    if (propertyType) {
      where.propertyType = propertyType;
    }

    // Bedrooms
    if (minBedrooms !== undefined) {
      where.bedrooms = { gte: minBedrooms };
    }

    // City
    if (city) {
      where.city = { equals: city, mode: 'insensitive' };
    }

    // Build orderBy clause
    let orderBy: Prisma.PropertyListingOrderByWithRelationInput = {};
    switch (sortBy) {
      case 'newest':
        orderBy = { createdAt: 'desc' };
        break;
      case 'price_asc':
        orderBy = { price: 'asc' };
        break;
      case 'price_desc':
        orderBy = { price: 'desc' };
        break;
      case 'proximity':
        // Will handle manually after fetch
        orderBy = { createdAt: 'desc' };
        break;
    }

    // Execute query
    const [listings, total] = await Promise.all([
      this.prisma.propertyListing.findMany({
        where,
        include: {
          owner: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
              verificationStatus: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.propertyListing.count({ where }),
    ]);

    // Apply geospatial filtering and sorting if coordinates provided
    let processedListings: any[] = listings;
    if (latitude !== undefined && longitude !== undefined) {
      // Calculate distances
      processedListings = listings.map((listing) => ({
        ...listing,
        distance: this.calculateDistance(
          latitude,
          longitude,
          Number(listing.latitude),
          Number(listing.longitude),
        ),
      }));

      // Filter by radius if specified
      if (radiusKm !== undefined) {
        processedListings = processedListings.filter(
          (listing: any) => listing.distance <= radiusKm,
        );
      }

      // Sort by proximity if requested
      if (sortBy === 'proximity') {
        processedListings.sort((a: any, b: any) => a.distance - b.distance);
      }
    }

    return {
      data: processedListings,
      meta: {
        total: radiusKm ? processedListings.length : total,
        page,
        limit,
        totalPages: Math.ceil(
          (radiusKm ? processedListings.length : total) / limit,
        ),
      },
    };
  }

  /**
   * Get a single listing by ID
   * Increments view count
   * Public access
   */
  async findOne(id: string) {
    // Check cache first
    const cacheKey = `${this.CACHE_PREFIX}${id}`;
    const cached = await this.redis.get(cacheKey);

    if (cached) {
      // Still increment view count even for cached listings
      await this.incrementViewCount(id);
      return JSON.parse(cached);
    }

    const listing = await this.prisma.propertyListing.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            verificationStatus: true,
          },
        },
      },
    });

    if (!listing || listing.deletedAt) {
      throw new NotFoundException('Listing not found');
    }

    // Only show active listings to public
    if (listing.status !== PropertyStatus.ACTIVE) {
      throw new NotFoundException('Listing not found');
    }

    // Increment view count atomically
    await this.incrementViewCount(id);

    // Cache the listing
    await this.redis.set(cacheKey, JSON.stringify(listing), this.CACHE_TTL);

    return listing;
  }

  /**
   * Update a listing
   * Only owner can update
   */
  async update(id: string, updateListingDto: UpdateListingDto, userId: string) {
    // Check if listing exists and belongs to user
    const existingListing = await this.prisma.propertyListing.findUnique({
      where: { id },
    });

    if (!existingListing || existingListing.deletedAt) {
      throw new NotFoundException('Listing not found');
    }

    // Ownership validation
    if (existingListing.ownerId !== userId) {
      throw new ForbiddenException('You can only update your own listings');
    }

    // Set publishedAt if transitioning to ACTIVE
    const publishedAt =
      updateListingDto.status === PropertyStatus.ACTIVE &&
      !existingListing.publishedAt
        ? new Date()
        : undefined;

    const updatedListing = await this.prisma.propertyListing.update({
      where: { id },
      data: {
        ...updateListingDto,
        publishedAt,
      },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            verificationStatus: true,
          },
        },
      },
    });

    // Invalidate cache
    await this.redis.del(`${this.CACHE_PREFIX}${id}`);

    return updatedListing;
  }

  /**
   * Delete a listing (soft delete)
   * Only owner can delete
   */
  async remove(id: string, userId: string) {
    // Check if listing exists and belongs to user
    const existingListing = await this.prisma.propertyListing.findUnique({
      where: { id },
    });

    if (!existingListing || existingListing.deletedAt) {
      throw new NotFoundException('Listing not found');
    }

    // Ownership validation
    if (existingListing.ownerId !== userId) {
      throw new ForbiddenException('You can only delete your own listings');
    }

    // Soft delete
    await this.prisma.propertyListing.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    // Invalidate cache
    await this.redis.del(`${this.CACHE_PREFIX}${id}`);

    return { success: true, message: 'Listing deleted successfully' };
  }

  /**
   * Get all listings for current user
   */
  async getMyListings(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [listings, total] = await Promise.all([
      this.prisma.propertyListing.findMany({
        where: {
          ownerId: userId,
          deletedAt: null,
        },
        include: {
          owner: {
            select: {
              id: true,
              email: true,
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
      this.prisma.propertyListing.count({
        where: {
          ownerId: userId,
          deletedAt: null,
        },
      }),
    ]);

    return {
      data: listings,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   * Returns distance in kilometers
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Math.round(distance * 100) / 100; // Round to 2 decimals
  }

  /**
   * Convert degrees to radians
   */
  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Increment view count atomically
   */
  private async incrementViewCount(id: string): Promise<void> {
    await this.prisma.propertyListing.update({
      where: { id },
      data: {
        viewCount: {
          increment: 1,
        },
      },
    });
  }
}
