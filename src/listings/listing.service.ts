import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ForbiddenException,
    Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateListingDto, UpdateListingDto, ListingFilterDto } from './dto/listing.dto';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../common/constants/app.constants';

@Injectable()
export class ListingService {
    private readonly logger = new Logger(ListingService.name);

    constructor(private prismaService: PrismaService) { }

    async create(userId: string, createListingDto: CreateListingDto) {
        try {
            const listing = await this.prismaService.listing.create({
                data: {
                    ...createListingDto,
                    userId,
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

            let whereClause: any = {
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
                const lngRange = radius / (111 * Math.cos(latitude * Math.PI / 180));

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
            let orderBy: any = {};
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
}