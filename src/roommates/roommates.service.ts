import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoommateProfileDto } from './dto/create-roommate-profile.dto';
import { UpdateRoommateProfileDto } from './dto/update-roommate-profile.dto';
import { SearchRoommatesDto, RoommateSortBy } from './dto/search-roommates.dto';

@Injectable()
export class RoommatesService {
  constructor(private prisma: PrismaService) {}

  async createProfile(userId: string, createDto: CreateRoommateProfileDto) {
    // Check if user already has a roommate profile
    const existingProfile = await this.prisma.roommateProfile.findUnique({
      where: { userId },
    });

    if (existingProfile) {
      throw new BadRequestException('User already has a roommate profile');
    }

    // Validate budget range
    if (createDto.budgetMin > createDto.budgetMax) {
      throw new BadRequestException(
        'Minimum budget cannot be greater than maximum budget',
      );
    }

    return this.prisma.roommateProfile.create({
      data: {
        userId,
        age: createDto.age,
        gender: createDto.gender,
        occupation: createDto.occupation,
        bio: createDto.bio,
        preferredCities: createDto.preferredCities,
        budgetMin: createDto.budgetMin,
        budgetMax: createDto.budgetMax,
        smokingPreference: createDto.smokingPreference,
        petPreference: createDto.petPreference,
        cleanlinessLevel: createDto.cleanlinessLevel,
        socialLevel: createDto.socialLevel,
        interests: createDto.interests || [],
        hasPets: createDto.hasPets,
        isSmoke: createDto.isSmoke,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
            createdAt: true,
          },
        },
      },
    });
  }

  async updateProfile(userId: string, updateDto: UpdateRoommateProfileDto) {
    const profile = await this.prisma.roommateProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Roommate profile not found');
    }

    // Validate budget range if both are provided
    if (
      updateDto.budgetMin !== undefined &&
      updateDto.budgetMax !== undefined
    ) {
      if (updateDto.budgetMin > updateDto.budgetMax) {
        throw new BadRequestException(
          'Minimum budget cannot be greater than maximum budget',
        );
      }
    }

    return this.prisma.roommateProfile.update({
      where: { userId },
      data: updateDto,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
            createdAt: true,
          },
        },
      },
    });
  }

  async getProfile(userId: string) {
    const profile = await this.prisma.roommateProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
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

  async getProfileByProfileId(profileId: string) {
    const profile = await this.prisma.roommateProfile.findUnique({
      where: { id: profileId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
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

  async deleteProfile(userId: string) {
    const profile = await this.prisma.roommateProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Roommate profile not found');
    }

    await this.prisma.roommateProfile.delete({
      where: { userId },
    });

    return { message: 'Roommate profile deleted successfully' };
  }

  async searchRoommates(searchDto: SearchRoommatesDto, currentUserId?: string) {
    const {
      search,
      ageMin,
      ageMax,
      gender,
      budgetMin,
      budgetMax,
      city,
      province,
      smokingPreference,
      petPreference,
      cleanlinessLevel,
      socialLevel,
      interests,
      hasPets,
      isSmoke,
      sortBy = RoommateSortBy.CREATED_AT,
      sortOrder = 'desc',
      page = 1,
      limit = 20,
    } = searchDto;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      // Exclude current user if provided
      ...(currentUserId && { userId: { not: currentUserId } }),
    };

    // Search in bio, occupation, or interests
    if (search) {
      where.OR = [
        { bio: { contains: search, mode: 'insensitive' } },
        { occupation: { contains: search, mode: 'insensitive' } },
        { interests: { hasSome: [search] } },
      ];
    }

    // Age filters
    if (ageMin !== undefined) {
      where.age = { ...where.age, gte: ageMin };
    }
    if (ageMax !== undefined) {
      where.age = { ...where.age, lte: ageMax };
    }

    // Gender filter
    if (gender) {
      where.gender = gender;
    }

    // Budget filters (overlap logic - find roommates whose budget range overlaps with search range)
    if (budgetMin !== undefined || budgetMax !== undefined) {
      where.AND = where.AND || [];

      if (budgetMin !== undefined) {
        where.AND.push({ budgetMax: { gte: budgetMin } });
      }
      if (budgetMax !== undefined) {
        where.AND.push({ budgetMin: { lte: budgetMax } });
      }
    }

    // Location filters
    if (city) {
      where.preferredCities = { hasSome: [city] };
    }

    // Preference filters
    if (smokingPreference) {
      where.smokingPreference = smokingPreference;
    }
    if (petPreference) {
      where.petPreference = petPreference;
    }
    if (cleanlinessLevel) {
      where.cleanlinessLevel = cleanlinessLevel;
    }
    if (socialLevel) {
      where.socialLevel = socialLevel;
    }

    // Interest filters
    if (interests && interests.length > 0) {
      where.interests = { hasSome: interests };
    }

    // Boolean filters
    if (hasPets !== undefined) {
      where.hasPets = hasPets;
    }
    if (isSmoke !== undefined) {
      where.isSmoke = isSmoke;
    }

    // Build order by clause
    const orderBy: any = {};
    switch (sortBy) {
      case RoommateSortBy.AGE:
        orderBy.age = sortOrder;
        break;
      case RoommateSortBy.BUDGET:
        orderBy.budgetMin = sortOrder;
        break;
      case RoommateSortBy.CREATED_AT:
      default:
        orderBy.createdAt = sortOrder;
        break;
    }

    // Execute queries
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
              avatar: true,
              createdAt: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.roommateProfile.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
      data: profiles,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
      filters: {
        search,
        ageMin,
        ageMax,
        gender,
        budgetMin,
        budgetMax,
        city,
        province,
        smokingPreference,
        petPreference,
        cleanlinessLevel,
        socialLevel,
        interests,
        hasPets,
        isSmoke,
        sortBy,
        sortOrder,
      },
    };
  }

  async getCompatibilityScore(userId: string, targetProfileId: string) {
    const [userProfile, targetProfile] = await Promise.all([
      this.prisma.roommateProfile.findUnique({ where: { userId } }),
      this.prisma.roommateProfile.findUnique({
        where: { id: targetProfileId },
      }),
    ]);

    if (!userProfile) {
      throw new NotFoundException('Your roommate profile not found');
    }
    if (!targetProfile) {
      throw new NotFoundException('Target roommate profile not found');
    }

    // Calculate compatibility score (0-100)
    let score = 0;
    let totalFactors = 0;

    // Budget compatibility (30% weight)
    const budgetOverlap =
      Math.min(userProfile.budgetMax, targetProfile.budgetMax) -
      Math.max(userProfile.budgetMin, targetProfile.budgetMin);
    if (budgetOverlap > 0) {
      const userBudgetRange = userProfile.budgetMax - userProfile.budgetMin;
      const targetBudgetRange =
        targetProfile.budgetMax - targetProfile.budgetMin;
      const avgRange = (userBudgetRange + targetBudgetRange) / 2;
      const budgetScore = Math.min(100, (budgetOverlap / avgRange) * 100);
      score += budgetScore * 0.3;
    }
    totalFactors += 0.3;

    // Location compatibility (25% weight)
    const commonCities = userProfile.preferredCities.filter((city) =>
      targetProfile.preferredCities.includes(city),
    );
    if (commonCities.length > 0) {
      const locationScore = Math.min(
        100,
        (commonCities.length /
          Math.max(
            userProfile.preferredCities.length,
            targetProfile.preferredCities.length,
          )) *
          100,
      );
      score += locationScore * 0.25;
    }
    totalFactors += 0.25;

    // Lifestyle compatibility (25% weight)
    let lifestyleScore = 0;
    let lifestyleFactors = 0;

    // Smoking compatibility
    if (
      userProfile.smokingPreference === targetProfile.smokingPreference ||
      userProfile.smokingPreference === 'NO_PREFERENCE' ||
      targetProfile.smokingPreference === 'NO_PREFERENCE'
    ) {
      lifestyleScore += 25;
    }
    lifestyleFactors += 25;

    // Pet compatibility
    if (
      userProfile.petPreference === targetProfile.petPreference ||
      userProfile.petPreference === 'NO_PREFERENCE' ||
      targetProfile.petPreference === 'NO_PREFERENCE'
    ) {
      lifestyleScore += 25;
    }
    lifestyleFactors += 25;

    // Cleanliness compatibility
    if (
      userProfile.cleanlinessLevel === targetProfile.cleanlinessLevel ||
      userProfile.cleanlinessLevel === 'NO_PREFERENCE' ||
      targetProfile.cleanlinessLevel === 'NO_PREFERENCE'
    ) {
      lifestyleScore += 25;
    }
    lifestyleFactors += 25;

    // Social compatibility
    if (
      userProfile.socialLevel === targetProfile.socialLevel ||
      userProfile.socialLevel === 'NO_PREFERENCE' ||
      targetProfile.socialLevel === 'NO_PREFERENCE'
    ) {
      lifestyleScore += 25;
    }
    lifestyleFactors += 25;

    score += (lifestyleScore / lifestyleFactors) * 100 * 0.25;
    totalFactors += 0.25;

    // Interest compatibility (20% weight)
    const commonInterests = userProfile.interests.filter((interest) =>
      targetProfile.interests.includes(interest),
    );
    if (commonInterests.length > 0) {
      const allInterests = [
        ...new Set([...userProfile.interests, ...targetProfile.interests]),
      ];
      const interestScore =
        (commonInterests.length / allInterests.length) * 100;
      score += interestScore * 0.2;
    }
    totalFactors += 0.2;

    // Normalize score
    const finalScore = Math.round(score / totalFactors);

    return {
      compatibilityScore: finalScore,
      breakdown: {
        budgetCompatible: budgetOverlap > 0,
        locationMatch: commonCities.length > 0,
        commonCities,
        commonInterests,
        lifestyleMatch: {
          smoking:
            userProfile.smokingPreference === targetProfile.smokingPreference,
          pets: userProfile.petPreference === targetProfile.petPreference,
          cleanliness:
            userProfile.cleanlinessLevel === targetProfile.cleanlinessLevel,
          social: userProfile.socialLevel === targetProfile.socialLevel,
        },
      },
    };
  }

  async getRecommendations(userId: string, limit = 10) {
    const userProfile = await this.prisma.roommateProfile.findUnique({
      where: { userId },
    });

    if (!userProfile) {
      throw new NotFoundException('Your roommate profile not found');
    }

    // Get all other profiles
    const allProfiles = await this.prisma.roommateProfile.findMany({
      where: {
        userId: { not: userId },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
            createdAt: true,
          },
        },
      },
    });

    // Calculate compatibility scores for all profiles
    const profilesWithScores = await Promise.all(
      allProfiles.map(async (profile) => {
        const compatibility = await this.getCompatibilityScore(
          userId,
          profile.id,
        );
        return {
          ...profile,
          compatibilityScore: compatibility.compatibilityScore,
          compatibilityBreakdown: compatibility.breakdown,
        };
      }),
    );

    // Sort by compatibility score and return top matches
    const recommendations = profilesWithScores
      .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
      .slice(0, limit);

    return {
      data: recommendations,
      userProfile,
      total: recommendations.length,
    };
  }
}
