import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ForbiddenException,
    Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMatchDto, UpdateMatchStatusDto } from './dto/match.dto';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../common/constants/app.constants';

@Injectable()
export class MatchService {
    private readonly logger = new Logger(MatchService.name);

    constructor(private prismaService: PrismaService) { }

    async createMatch(userId: string, createMatchDto: CreateMatchDto) {
        try {
            // Check if listing exists
            const listing = await this.prismaService.listing.findUnique({
                where: { id: createMatchDto.listingId },
                select: { userId: true, isActive: true, isAvailable: true },
            });

            if (!listing) {
                throw new NotFoundException(ERROR_MESSAGES.LISTING_NOT_FOUND);
            }

            if (!listing.isActive || !listing.isAvailable) {
                throw new BadRequestException(ERROR_MESSAGES.LISTING_NOT_AVAILABLE);
            }

            if (listing.userId === userId) {
                throw new BadRequestException(ERROR_MESSAGES.CANNOT_MATCH_OWN_LISTING);
            }

            // Check if match already exists
            const existingMatch = await this.prismaService.match.findUnique({
                where: {
                    userId_listingId: {
                        userId,
                        listingId: createMatchDto.listingId,
                    },
                },
            });

            if (existingMatch) {
                throw new BadRequestException(ERROR_MESSAGES.MATCH_ALREADY_EXISTS);
            }

            const match = await this.prismaService.match.create({
                data: {
                    userId,
                    listingId: createMatchDto.listingId,
                    ownerId: listing.userId,
                    message: createMatchDto.message,
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
                    listing: {
                        select: {
                            id: true,
                            title: true,
                            price: true,
                            currency: true,
                            images: true,
                            address: true,
                            city: true,
                        },
                    },
                },
            });

            return match;
        } catch (error) {
            this.logger.error('Create match failed', error);
            throw error;
        }
    }

    async getSentMatches(userId: string, page = 1, limit = 20) {
        try {
            const offset = (page - 1) * limit;

            const matches = await this.prismaService.match.findMany({
                where: { userId },
                include: {
                    listing: {
                        select: {
                            id: true,
                            title: true,
                            price: true,
                            currency: true,
                            images: true,
                            address: true,
                            city: true,
                        },
                    },
                    owner: {
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

            const total = await this.prismaService.match.count({
                where: { userId },
            });

            return {
                matches,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            };
        } catch (error) {
            this.logger.error('Get sent matches failed', error);
            throw error;
        }
    }

    async getReceivedMatches(userId: string, page = 1, limit = 20) {
        try {
            const offset = (page - 1) * limit;

            const matches = await this.prismaService.match.findMany({
                where: { ownerId: userId },
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            avatar: true,
                        },
                    },
                    listing: {
                        select: {
                            id: true,
                            title: true,
                            price: true,
                            currency: true,
                            images: true,
                            address: true,
                            city: true,
                        },
                    },
                },
                skip: offset,
                take: limit,
                orderBy: { createdAt: 'desc' },
            });

            const total = await this.prismaService.match.count({
                where: { ownerId: userId },
            });

            return {
                matches,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            };
        } catch (error) {
            this.logger.error('Get received matches failed', error);
            throw error;
        }
    }

    async updateMatchStatus(
        matchId: string,
        ownerId: string,
        updateMatchStatusDto: UpdateMatchStatusDto,
    ) {
        try {
            // Check if match exists and user owns the listing
            const match = await this.prismaService.match.findUnique({
                where: { id: matchId },
                select: { ownerId: true, status: true },
            });

            if (!match) {
                throw new NotFoundException(ERROR_MESSAGES.MATCH_NOT_FOUND);
            }

            if (match.ownerId !== ownerId) {
                throw new ForbiddenException('You can only update matches for your own listings');
            }

            if (match.status !== 'PENDING') {
                throw new BadRequestException('Match has already been processed');
            }

            const updatedMatch = await this.prismaService.match.update({
                where: { id: matchId },
                data: { status: updateMatchStatusDto.status },
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            avatar: true,
                        },
                    },
                    listing: {
                        select: {
                            id: true,
                            title: true,
                            price: true,
                            currency: true,
                            images: true,
                        },
                    },
                },
            });

            return updatedMatch;
        } catch (error) {
            this.logger.error('Update match status failed', error);
            throw error;
        }
    }

    async getMatchById(matchId: string, userId: string) {
        try {
            const match = await this.prismaService.match.findUnique({
                where: { id: matchId },
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
                    owner: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            avatar: true,
                            phone: true,
                        },
                    },
                    listing: true,
                },
            });

            if (!match) {
                throw new NotFoundException(ERROR_MESSAGES.MATCH_NOT_FOUND);
            }

            // Check if user is involved in this match
            if (match.userId !== userId && match.ownerId !== userId) {
                throw new ForbiddenException('Access denied');
            }

            return match;
        } catch (error) {
            this.logger.error('Get match by ID failed', error);
            throw error;
        }
    }
}