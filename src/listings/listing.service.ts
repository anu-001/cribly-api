import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateListingDto,
  UpdateListingDto,
  ListingFilterDto,
} from './dto/listing.dto';
import { ExploreListingsDto, SortBy } from './dto/explore-listings.dto';
import { GeolocationService } from '../common/services/geolocation.service';
import {
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
} from '../common/constants/app.constants';

@Injectable()
export class ListingService {
  private readonly logger = new Logger(ListingService.name);

  constructor(
    private prismaService: PrismaService,
    private geolocationService: GeolocationService,
  ) {}

  async create(userId: string, createListingDto: CreateListingDto) {
    try {
      const { ...listingData } = createListingDto;

      const listing = await this.prismaService.listing.create({
        data: {
          userId,
          ...listingData,
        },
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
      });

      return listing;
    } catch (error) {
      this.logger.error('Create listing failed', error);
      throw error;
    }
  }

  async findAll(listingFilterDto: ListingFilterDto) {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        city,
        country,
        propertyType,
        minPrice,
        maxPrice,
        bedrooms,
        bathrooms,
        furnished,
        latitude,
        longitude,
        radius = 50,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = listingFilterDto;

      const offset = (page - 1) * limit;

      const whereClause: any = {
        isActive: true,
        isAvailable: true,
      };

      // Text search
      if (search) {
        whereClause.OR = [
          {
            title: {
              contains: search,
              mode: 'insensitive',
            },
          },
          {
            description: {
              contains: search,
              mode: 'insensitive',
            },
          },
          {
            address: {
              contains: search,
              mode: 'insensitive',
            },
          },
        ];
      }

      // Location filters
      if (city) {
        whereClause.city = {
          contains: city,
          mode: 'insensitive',
        };
      }

      if (country) {
        whereClause.country = {
          contains: country,
          mode: 'insensitive',
        };
      }

      // Property filters
      if (propertyType) {
        whereClause.propertyType = propertyType;
      }

      if (minPrice !== undefined) {
        whereClause.price = { ...whereClause.price, gte: minPrice };
      }

      if (maxPrice !== undefined) {
        whereClause.price = { ...whereClause.price, lte: maxPrice };
      }

      if (bedrooms !== undefined) {
        whereClause.bedrooms = bedrooms;
      }

      if (bathrooms !== undefined) {
        whereClause.bathrooms = bathrooms;
      }

      if (furnished !== undefined) {
        whereClause.furnished = furnished;
      }

      // Location-based filtering (simple bounding box)
      if (latitude && longitude) {
        const latRange = radius / 111;
        const lngRange = radius / (111 * Math.cos((latitude * Math.PI) / 180));

        whereClause.AND = [
          {
            latitude: {
              gte: latitude - latRange,
              lte: latitude + latRange,
            },
          },
          {
            longitude: {
              gte: longitude - lngRange,
              lte: longitude + lngRange,
            },
          },
        ];
      }

      // Sorting
      const orderBy: any = {};
      if (sortBy === 'distance' && latitude && longitude) {
        // For distance sorting, we'd need a more complex query
        // For now, fallback to createdAt
        orderBy.createdAt = sortOrder;
      } else {
        orderBy[sortBy] = sortOrder;
      }

      const listings = await this.prismaService.listing.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
          _count: {
            select: {
              matches: true,
            },
          },
        },
        skip: offset,
        take: limit,
        orderBy,
      });

      const total = await this.prismaService.listing.count({
        where: whereClause,
      });

      return {
        listings,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error('Find all listings failed', error);
      throw error;
    }
  }

  async findById(id: string) {
    try {
      const listing = await this.prismaService.listing.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
              phone: true,
            },
          },
          _count: {
            select: {
              matches: true,
            },
          },
        },
      });

      if (!listing) {
        throw new NotFoundException(ERROR_MESSAGES.LISTING_NOT_FOUND);
      }

      return listing;
    } catch (error) {
      this.logger.error(`Find listing by ID failed: ${id}`, error);
      throw error;
    }
  }

  async findByUser(userId: string, page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit;

      const listings = await this.prismaService.listing.findMany({
        where: { userId },
        include: {
          _count: {
            select: {
              matches: true,
            },
          },
        },
        skip: offset,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      });

      const total = await this.prismaService.listing.count({
        where: { userId },
      });

      return {
        listings,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error(`Find listings by user failed: ${userId}`, error);
      throw error;
    }
  }

  async update(id: string, userId: string, updateListingDto: UpdateListingDto) {
    try {
      // Check if listing exists and user owns it
      const existingListing = await this.prismaService.listing.findUnique({
        where: { id },
        select: { userId: true },
      });

      if (!existingListing) {
        throw new NotFoundException(ERROR_MESSAGES.LISTING_NOT_FOUND);
      }

      if (existingListing.userId !== userId) {
        throw new ForbiddenException('You can only update your own listings');
      }

      const updatedListing = await this.prismaService.listing.update({
        where: { id },
        data: updateListingDto,
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
      });

      return updatedListing;
    } catch (error) {
      this.logger.error(`Update listing failed: ${id}`, error);
      throw error;
    }
  }

  async delete(id: string, userId: string) {
    try {
      // Check if listing exists and user owns it
      const existingListing = await this.prismaService.listing.findUnique({
        where: { id },
        select: { userId: true },
      });

      if (!existingListing) {
        throw new NotFoundException(ERROR_MESSAGES.LISTING_NOT_FOUND);
      }

      if (existingListing.userId !== userId) {
        throw new ForbiddenException('You can only delete your own listings');
      }

      await this.prismaService.listing.delete({
        where: { id },
      });

      return { success: true, message: SUCCESS_MESSAGES.LISTING_DELETED };
    } catch (error) {
      this.logger.error(`Delete listing failed: ${id}`, error);
      throw error;
    }
  }

  async explore(exploreDto: ExploreListingsDto, requestIp?: string) {
    try {
      const {
        search,
        propertyTypes,
        minPrice,
        maxPrice,
        minBedrooms,
        maxBedrooms,
        minBathrooms,
        maxBathrooms,
        furnished,
        lat,
        lng,
        radius = 50,
        city,
        province,
        sortBy,
        page = 1,
        limit = 20,
      } = exploreDto;

      // Calculate pagination
      const offset = (page - 1) * limit;

      // Build where clause
      const whereClause: any = {
        isActive: true,
        isAvailable: true,
      };

      // Text search across multiple fields
      if (search) {
        whereClause.OR = [
          {
            title: {
              contains: search,
              mode: 'insensitive',
            },
          },
          {
            description: {
              contains: search,
              mode: 'insensitive',
            },
          },
          {
            address: {
              contains: search,
              mode: 'insensitive',
            },
          },
          {
            city: {
              contains: search,
              mode: 'insensitive',
            },
          },
          {
            province: {
              contains: search,
              mode: 'insensitive',
            },
          },
        ];
      }

      // Property type filter
      if (propertyTypes && propertyTypes.length > 0) {
        whereClause.propertyType = {
          in: propertyTypes,
        };
      }

      // Price range filters
      if (minPrice !== undefined || maxPrice !== undefined) {
        whereClause.price = {};
        if (minPrice !== undefined) {
          whereClause.price.gte = minPrice;
        }
        if (maxPrice !== undefined) {
          whereClause.price.lte = maxPrice;
        }
      }

      // Room filters
      if (minBedrooms !== undefined || maxBedrooms !== undefined) {
        whereClause.bedrooms = {};
        if (minBedrooms !== undefined) {
          whereClause.bedrooms.gte = minBedrooms;
        }
        if (maxBedrooms !== undefined) {
          whereClause.bedrooms.lte = maxBedrooms;
        }
      }

      if (minBathrooms !== undefined || maxBathrooms !== undefined) {
        whereClause.bathrooms = {};
        if (minBathrooms !== undefined) {
          whereClause.bathrooms.gte = minBathrooms;
        }
        if (maxBathrooms !== undefined) {
          whereClause.bathrooms.lte = maxBathrooms;
        }
      }

      // Furnished filter
      if (furnished !== undefined) {
        whereClause.furnished = furnished;
      }

      // Location filters
      if (city) {
        whereClause.city = {
          contains: city,
          mode: 'insensitive',
        };
      }

      if (province) {
        whereClause.province = {
          contains: province,
          mode: 'insensitive',
        };
      }

      // Geographic proximity filter
      let userLocation = null;
      if (lat && lng) {
        userLocation = { latitude: lat, longitude: lng };

        // Validate coordinates
        if (!this.geolocationService.validateCoordinates(lat, lng)) {
          throw new BadRequestException('Invalid coordinates provided');
        }

        // Create bounding box for initial filtering
        const boundingBox = this.createBoundingBox(lat, lng, radius);
        whereClause.AND = [
          {
            latitude: {
              gte: boundingBox.minLat,
              lte: boundingBox.maxLat,
            },
          },
          {
            longitude: {
              gte: boundingBox.minLng,
              lte: boundingBox.maxLng,
            },
          },
        ];
      } else if (requestIp && !lat && !lng) {
        // Try to get location from IP if coordinates not provided
        try {
          userLocation = this.geolocationService.getLocationFromIP(requestIp);
          if (userLocation && userLocation.latitude && userLocation.longitude) {
            const boundingBox = this.createBoundingBox(
              userLocation.latitude,
              userLocation.longitude,
              radius,
            );
            whereClause.AND = [
              {
                latitude: {
                  gte: boundingBox.minLat,
                  lte: boundingBox.maxLat,
                },
              },
              {
                longitude: {
                  gte: boundingBox.minLng,
                  lte: boundingBox.maxLng,
                },
              },
            ];
          }
        } catch (error) {
          this.logger.warn('Failed to get location from IP', error);
          // Continue without location-based filtering
        }
      }

      // Determine sort order based on SortBy enum
      const orderBy: any = {};
      if (sortBy === SortBy.PROXIMITY && userLocation) {
        // For distance sorting, use createdAt and calculate distance post-query
        orderBy.createdAt = 'desc';
      } else if (sortBy === SortBy.PRICE_LOW_TO_HIGH) {
        orderBy.price = 'asc';
      } else if (sortBy === SortBy.PRICE_HIGH_TO_LOW) {
        orderBy.price = 'desc';
      } else if (sortBy === SortBy.RECENCY) {
        orderBy.createdAt = 'desc';
      } else {
        orderBy.createdAt = 'desc'; // Default fallback
      }

      // Execute query
      const [listings, total] = await Promise.all([
        this.prismaService.listing.findMany({
          where: whereClause,
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
            _count: {
              select: {
                matches: true,
              },
            },
          },
          skip: offset,
          take: limit,
          orderBy,
        }),
        this.prismaService.listing.count({
          where: whereClause,
        }),
      ]);

      // Calculate distances and sort by distance if requested
      let processedListings = listings;
      if (sortBy === SortBy.PROXIMITY && userLocation) {
        processedListings = listings
          .map((listing) => ({
            ...listing,
            distance: this.geolocationService.calculateDistance(
              userLocation.latitude,
              userLocation.longitude,
              listing.latitude,
              listing.longitude,
            ),
          }))
          .sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
      } else if (userLocation) {
        // Add distance field even if not sorting by it
        processedListings = listings.map((listing) => ({
          ...listing,
          distance: this.geolocationService.calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            listing.latitude,
            listing.longitude,
          ),
        }));
      }

      const totalPages = Math.ceil(total / limit);

      return {
        listings: processedListings,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
        filters: {
          appliedFilters: {
            search,
            propertyTypes,
            priceRange: minPrice || maxPrice ? { minPrice, maxPrice } : null,
            rooms:
              minBedrooms || maxBedrooms || minBathrooms || maxBathrooms
                ? {
                    minBedrooms,
                    maxBedrooms,
                    minBathrooms,
                    maxBathrooms,
                  }
                : null,
            furnished,
            location: userLocation
              ? {
                  latitude: userLocation.latitude,
                  longitude: userLocation.longitude,
                  radius,
                }
              : null,
            geographic: city || province ? { city, province } : null,
          },
          sorting: {
            sortBy,
          },
        },
        meta: {
          totalListings: total,
          resultsCount: processedListings.length,
          searchLocation: userLocation,
          hasLocationFiltering: !!userLocation,
        },
      };
    } catch (error) {
      this.logger.error('Explore listings failed', error);
      throw error;
    }
  }

  private createBoundingBox(
    latitude: number,
    longitude: number,
    radiusKm: number,
  ) {
    // Approximate conversion: 1 degree ≈ 111 km
    const latDelta = radiusKm / 111;
    const lngDelta = radiusKm / (111 * Math.cos((latitude * Math.PI) / 180));

    return {
      minLat: latitude - latDelta,
      maxLat: latitude + latDelta,
      minLng: longitude - lngDelta,
      maxLng: longitude + lngDelta,
    };
  }
}
