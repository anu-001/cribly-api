import {
    Injectable,
    NotFoundException,
    BadRequestException,
    Logger
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto, UpdateLocationDto, UserFilterDto } from './dto/user.dto';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../common/constants/app.constants';

@Injectable()
export class UserService {
    private readonly logger = new Logger(UserService.name);

    constructor(private prismaService: PrismaService) { }

    async findById(id: string) {
        try {
            const user = await this.prismaService.user.findUnique({
                where: { id },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    avatar: true,
                    phone: true,
                    bio: true,
                    latitude: true,
                    longitude: true,
                    preferences: true,
                    createdAt: true,
                    updatedAt: true,
                    _count: {
                        select: {
                            listings: true,
                            sentMatches: true,
                            receivedMatches: true,
                        },
                    },
                },
            });

            if (!user) {
                throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND);
            }

            return user;
        } catch (error) {
            this.logger.error(`Find user by ID failed: ${id}`, error);
            throw error;
        }
    }

    async findByEmail(email: string) {
        try {
            const user = await this.prismaService.user.findUnique({
                where: { email },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    avatar: true,
                    phone: true,
                    bio: true,
                    createdAt: true,
                },
            });

            if (!user) {
                throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND);
            }

            return user;
        } catch (error) {
            this.logger.error(`Find user by email failed: ${email}`, error);
            throw error;
        }
    }

    async updateProfile(userId: string, updateUserDto: UpdateUserDto) {
        try {
            // Check if email is already taken by another user
            if (updateUserDto.email) {
                const existingUser = await this.prismaService.user.findFirst({
                    where: {
                        email: updateUserDto.email,
                        NOT: { id: userId },
                    },
                });

                if (existingUser) {
                    throw new BadRequestException(ERROR_MESSAGES.EMAIL_ALREADY_EXISTS);
                }
            }

            const updatedUser = await this.prismaService.user.update({
                where: { id: userId },
                data: updateUserDto,
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    avatar: true,
                    phone: true,
                    bio: true,
                    latitude: true,
                    longitude: true,
                    preferences: true,
                    updatedAt: true,
                },
            });

            return updatedUser;
        } catch (error) {
            this.logger.error(`Update user profile failed: ${userId}`, error);
            throw error;
        }
    }

    async updateLocation(userId: string, updateLocationDto: UpdateLocationDto) {
        try {
            const updatedUser = await this.prismaService.user.update({
                where: { id: userId },
                data: {
                    latitude: updateLocationDto.latitude,
                    longitude: updateLocationDto.longitude,
                },
                select: {
                    id: true,
                    latitude: true,
                    longitude: true,
                    updatedAt: true,
                },
            });

            return updatedUser;
        } catch (error) {
            this.logger.error(`Update user location failed: ${userId}`, error);
            throw error;
        }
    }

    async findNearbyUsers(userFilterDto: UserFilterDto) {
        try {
            const { page = 1, limit = 20, latitude, longitude, radius = 50 } = userFilterDto;
            const offset = (page - 1) * limit;

            let whereClause: any = {};

            // Add search filter if provided
            if (userFilterDto.search) {
                whereClause.OR = [
                    {
                        firstName: {
                            contains: userFilterDto.search,
                            mode: 'insensitive',
                        },
                    },
                    {
                        lastName: {
                            contains: userFilterDto.search,
                            mode: 'insensitive',
                        },
                    },
                    {
                        email: {
                            contains: userFilterDto.search,
                            mode: 'insensitive',
                        },
                    },
                ];
            }

            // Add location filter if coordinates are provided
            if (latitude && longitude) {
                // Using a simple bounding box for performance
                // For more accurate distance calculation, use PostGIS or similar
                const latRange = radius / 111; // roughly 111 km per degree
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

            const users = await this.prismaService.user.findMany({
                where: whereClause,
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    avatar: true,
                    bio: true,
                    latitude: true,
                    longitude: true,
                    createdAt: true,
                },
                skip: offset,
                take: limit,
                orderBy: {
                    createdAt: 'desc',
                },
            });

            const total = await this.prismaService.user.count({
                where: whereClause,
            });

            return {
                users,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            };
        } catch (error) {
            this.logger.error('Find nearby users failed', error);
            throw error;
        }
    }

    async deleteAccount(userId: string) {
        try {
            await this.prismaService.user.delete({
                where: { id: userId },
            });

            return { success: true, message: SUCCESS_MESSAGES.USER_DELETED };
        } catch (error) {
            this.logger.error(`Delete user account failed: ${userId}`, error);
            throw error;
        }
    }
}