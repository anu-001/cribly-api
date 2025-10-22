import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateRoommateProfileDto,
  UpdateRoommateProfileDto,
  QueryRoommateProfileDto,
} from './dto';

@Injectable()
export class RoommateProfilesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new roommate profile (upsert pattern - one profile per user)
   */
  async create(createDto: CreateRoommateProfileDto, userId: string) {
    // Validate budget
    if (createDto.maxBudget < createDto.minBudget) {
      throw new BadRequestException(
        'Maximum budget must be greater than or equal to minimum budget',
      );
    }

    // Check if profile already exists
    const existingProfile = await this.prisma.roommateProfile.findUnique({
      where: { userId },
    });

    if (existingProfile) {
      throw new ConflictException(
        'You already have a roommate profile. Use update endpoint to modify it.',
      );
    }

    // Create profile
    const profile = await this.prisma.roommateProfile.create({
      data: {
        ...createDto,
        userId,
        petTypes: createDto.petTypes || [],
        preferredGender: createDto.preferredGender || [],
        preferredPropertyTypes: createDto.preferredPropertyTypes || [],
        preferredNeighborhoods: createDto.preferredNeighborhoods || [],
        preferredAmenities: createDto.preferredAmenities || [],
        dealBreakers: createDto.dealBreakers || [],
        interests: createDto.interests || [],
        languages: createDto.languages || [],
        hobbies: createDto.hobbies || [],
        isActive: createDto.isActive ?? true,
        hasListing: createDto.hasListing ?? false,
      },
      include: {
        user: {
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

    return profile;
  }

  /**
   * Find all roommate profiles with filters and pagination
   */
  async findAll(queryDto: QueryRoommateProfileDto) {
    const {
      minBudget,
      maxBudget,
      moveInDateFrom,
      moveInDateTo,
      city,
      cleanliness,
      smoker,
      hasPets,
      workFromHome,
      isActive = true,
      sortBy = 'newest',
      page = 1,
      limit = 20,
    } = queryDto;

    // Build where clause
    const where: any = {
      isActive,
    };

    // Budget filter - find profiles with overlapping budget ranges
    if (minBudget !== undefined || maxBudget !== undefined) {
      where.AND = [];

      if (minBudget !== undefined) {
        where.AND.push({
          maxBudget: { gte: minBudget },
        });
      }

      if (maxBudget !== undefined) {
        where.AND.push({
          minBudget: { lte: maxBudget },
        });
      }
    }

    // Move-in date filter
    if (moveInDateFrom || moveInDateTo) {
      where.preferredMoveInDate = {};
      if (moveInDateFrom) {
        where.preferredMoveInDate.gte = new Date(moveInDateFrom);
      }
      if (moveInDateTo) {
        where.preferredMoveInDate.lte = new Date(moveInDateTo);
      }
    }

    // City filter - check if city is in preferredCities array
    if (city) {
      where.preferredCities = {
        has: city,
      };
    }

    // Lifestyle filters
    if (cleanliness !== undefined) {
      where.cleanliness = cleanliness;
    }

    if (smoker !== undefined) {
      where.smoker = smoker;
    }

    if (hasPets !== undefined) {
      where.hasPets = hasPets;
    }

    if (workFromHome !== undefined) {
      where.workFromHome = workFromHome;
    }

    // Determine sort order
    let orderBy: any = { createdAt: 'desc' }; // Default: newest

    switch (sortBy) {
      case 'budget_asc':
        orderBy = { minBudget: 'asc' };
        break;
      case 'budget_desc':
        orderBy = { maxBudget: 'desc' };
        break;
      case 'move_in_date':
        orderBy = { preferredMoveInDate: 'asc' };
        break;
      case 'newest':
      default:
        orderBy = { createdAt: 'desc' };
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute query
    const [profiles, total] = await Promise.all([
      this.prisma.roommateProfile.findMany({
        where,
        include: {
          user: {
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
      this.prisma.roommateProfile.count({ where }),
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);

    return {
      data: profiles,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  /**
   * Find roommate profile by user ID
   */
  async findOne(userId: string) {
    const profile = await this.prisma.roommateProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            verificationStatus: true,
            createdAt: true,
          },
        },
      },
    });

    if (!profile) {
      throw new NotFoundException('Roommate profile not found');
    }

    return profile;
  }

  /**
   * Get current user's profile
   */
  async getMyProfile(userId: string) {
    return this.findOne(userId);
  }

  /**
   * Update roommate profile (owner only)
   */
  async update(
    userId: string,
    updateDto: UpdateRoommateProfileDto,
    currentUserId: string,
  ) {
    // Check if profile exists
    const existingProfile = await this.prisma.roommateProfile.findUnique({
      where: { userId },
    });

    if (!existingProfile) {
      throw new NotFoundException('Roommate profile not found');
    }

    // Check ownership
    if (existingProfile.userId !== currentUserId) {
      throw new ForbiddenException('You can only update your own profile');
    }

    // Validate budget if both are being updated
    if (
      updateDto.minBudget !== undefined &&
      updateDto.maxBudget !== undefined
    ) {
      if (updateDto.maxBudget < updateDto.minBudget) {
        throw new BadRequestException(
          'Maximum budget must be greater than or equal to minimum budget',
        );
      }
    }

    // Validate budget if only one is being updated
    if (
      updateDto.minBudget !== undefined &&
      updateDto.maxBudget === undefined
    ) {
      if (updateDto.minBudget > existingProfile.maxBudget.toNumber()) {
        throw new BadRequestException(
          'Minimum budget cannot be greater than existing maximum budget',
        );
      }
    }

    if (
      updateDto.maxBudget !== undefined &&
      updateDto.minBudget === undefined
    ) {
      if (updateDto.maxBudget < existingProfile.minBudget.toNumber()) {
        throw new BadRequestException(
          'Maximum budget cannot be less than existing minimum budget',
        );
      }
    }

    // Update profile
    const updatedProfile = await this.prisma.roommateProfile.update({
      where: { userId },
      data: updateDto,
      include: {
        user: {
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

    return updatedProfile;
  }

  /**
   * Delete roommate profile (owner only)
   */
  async remove(userId: string, currentUserId: string) {
    // Check if profile exists
    const existingProfile = await this.prisma.roommateProfile.findUnique({
      where: { userId },
    });

    if (!existingProfile) {
      throw new NotFoundException('Roommate profile not found');
    }

    // Check ownership
    if (existingProfile.userId !== currentUserId) {
      throw new ForbiddenException('You can only delete your own profile');
    }

    // Delete profile
    await this.prisma.roommateProfile.delete({
      where: { userId },
    });

    return {
      message: 'Roommate profile deleted successfully',
    };
  }

  /**
   * Check if user has a profile
   */
  async hasProfile(userId: string): Promise<boolean> {
    const profile = await this.prisma.roommateProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    return !!profile;
  }
}
