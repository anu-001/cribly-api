import { Injectable } from '@nestjs/common';
import { ListingsService } from '../listings/listings.service';
import { RoommateProfilesService } from '../roommate-profiles/roommate-profiles.service';
import { RedisService } from '../redis/redis.service';
import { QueryExploreDto, ExploreType } from './dto';
import { QueryListingDto } from '../listings/dto';
import { QueryRoommateProfileDto } from '../roommate-profiles/dto';

interface ExploreResult {
  type: 'property' | 'roommate';
  item: any;
  score: number;
  distance_km?: number;
}

@Injectable()
export class ExploreService {
  private readonly CACHE_TTL = 300; // 5 minutes
  private readonly CACHE_PREFIX = 'explore:';

  constructor(
    private readonly listingsService: ListingsService,
    private readonly roommateProfilesService: RoommateProfilesService,
    private readonly redisService: RedisService,
  ) {}

  /**
   * Unified discovery endpoint - searches both listings and roommate profiles
   */
  async discover(queryDto: QueryExploreDto) {
    const {
      type = ExploreType.ALL,
      page = 1,
      limit = 20,
      sortBy = 'recommended',
    } = queryDto;

    // Generate cache key
    const cacheKey = `${this.CACHE_PREFIX}${JSON.stringify(queryDto)}`;

    // Check cache
    const cached = await this.redisService.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    let results: ExploreResult[] = [];

    // Search based on type filter
    if (type === ExploreType.PROPERTY || type === ExploreType.ALL) {
      const listings = await this.searchListings(queryDto);
      results = results.concat(listings);
    }

    if (type === ExploreType.ROOMMATE || type === ExploreType.ALL) {
      const profiles = await this.searchProfiles(queryDto);
      results = results.concat(profiles);
    }

    // Apply sorting
    results = this.sortResults(results, sortBy);

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedResults = results.slice(startIndex, endIndex);

    // Calculate pagination metadata
    const total = results.length;
    const totalPages = Math.ceil(total / limit);

    const response = {
      data: paginatedResults,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };

    // Cache the result
    await this.redisService.set(
      cacheKey,
      JSON.stringify(response),
      this.CACHE_TTL,
    );

    return response;
  }

  /**
   * Search property listings
   */
  private async searchListings(
    queryDto: QueryExploreDto,
  ): Promise<ExploreResult[]> {
    // Map explore DTO to listings DTO
    const listingsQuery: QueryListingDto = {
      search: queryDto.search,
      minPrice: queryDto.minPrice,
      maxPrice: queryDto.maxPrice,
      propertyType: queryDto.propertyType,
      minBedrooms: queryDto.bedrooms,
      city: queryDto.city,
      latitude: queryDto.latitude,
      longitude: queryDto.longitude,
      radiusKm: queryDto.radiusKm,
      sortBy: 'newest', // We'll apply sorting later
      page: 1,
      limit: 1000, // Get all for merging
    };

    const { data: listings } = await this.listingsService.findAll(
      listingsQuery,
    );

    // Transform to ExploreResult with scoring
    return listings.map((listing: any) => ({
      type: 'property' as const,
      item: listing,
      score: this.calculateListingScore(listing),
      distance_km: listing.distance_km,
    }));
  }

  /**
   * Search roommate profiles
   */
  private async searchProfiles(
    queryDto: QueryExploreDto,
  ): Promise<ExploreResult[]> {
    // Map explore DTO to roommate profiles DTO
    const profilesQuery: QueryRoommateProfileDto = {
      minBudget: queryDto.minBudget,
      maxBudget: queryDto.maxBudget,
      cleanliness: queryDto.cleanliness,
      city: queryDto.city,
      isActive: true,
      sortBy: 'newest', // We'll apply sorting later
      page: 1,
      limit: 1000, // Get all for merging
    };

    const { data: profiles } =
      await this.roommateProfilesService.findAll(profilesQuery);

    // Transform to ExploreResult with scoring
    return profiles.map((profile: any) => {
      const result: ExploreResult = {
        type: 'roommate' as const,
        item: profile,
        score: this.calculateProfileScore(profile),
      };

      // Calculate distance if coordinates provided
      if (
        queryDto.latitude !== undefined &&
        queryDto.longitude !== undefined &&
        profile.preferredCities &&
        profile.preferredCities.length > 0
      ) {
        // For roommate profiles, we can't calculate exact distance
        // but we can check if preferred cities match
        if (queryDto.city && profile.preferredCities.includes(queryDto.city)) {
          result.distance_km = 0; // Same city
        }
      }

      return result;
    });
  }

  /**
   * Calculate recommendation score for property listing
   * Base score: 50
   * +10 if verified owner
   * +5 if featured (future feature)
   * +10 for recent listings (< 7 days)
   * +15 for high view count (> 100)
   */
  private calculateListingScore(listing: any): number {
    let score = 50; // Base score

    // Verified owner bonus
    if (listing.owner?.verificationStatus === 'VERIFIED') {
      score += 10;
    }

    // Recent listing bonus (< 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    if (new Date(listing.createdAt) > sevenDaysAgo) {
      score += 10;
    }

    // High view count bonus (> 100 views)
    if (listing.viewCount > 100) {
      score += 15;
    }

    // Published listing bonus
    if (listing.publishedAt) {
      score += 5;
    }

    return score;
  }

  /**
   * Calculate recommendation score for roommate profile
   * Budget compatibility: ±20 points
   * Lifestyle match: +10 per matching preference
   * Location overlap: +15 points
   * Recent activity: +10 points
   */
  private calculateProfileScore(profile: any): number {
    let score = 50; // Base score

    // Verified user bonus
    if (profile.user?.verificationStatus === 'VERIFIED') {
      score += 20;
    }

    // Recent profile bonus (< 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    if (new Date(profile.createdAt) > sevenDaysAgo) {
      score += 10;
    }

    // Active profile bonus
    if (profile.isActive) {
      score += 5;
    }

    // Has listing bonus (shows they're also a landlord)
    if (profile.hasListing) {
      score += 5;
    }

    // Complete profile bonus (has interests, languages, etc.)
    if (profile.interests && profile.interests.length > 0) {
      score += 5;
    }
    if (profile.languages && profile.languages.length > 0) {
      score += 5;
    }

    return score;
  }

  /**
   * Sort results based on sort strategy
   */
  private sortResults(
    results: ExploreResult[],
    sortBy: string,
  ): ExploreResult[] {
    switch (sortBy) {
      case 'newest':
        return results.sort(
          (a, b) =>
            new Date(b.item.createdAt).getTime() -
            new Date(a.item.createdAt).getTime(),
        );

      case 'price_asc':
        return results.sort((a, b) => {
          const priceA = this.getItemPrice(a);
          const priceB = this.getItemPrice(b);
          return priceA - priceB;
        });

      case 'price_desc':
        return results.sort((a, b) => {
          const priceA = this.getItemPrice(a);
          const priceB = this.getItemPrice(b);
          return priceB - priceA;
        });

      case 'proximity':
        return results.sort((a, b) => {
          const distA = a.distance_km ?? Infinity;
          const distB = b.distance_km ?? Infinity;
          return distA - distB;
        });

      case 'recommended':
      default:
        return results.sort((a, b) => b.score - a.score);
    }
  }

  /**
   * Get price from item (listing or profile)
   */
  private getItemPrice(result: ExploreResult): number {
    if (result.type === 'property') {
      return result.item.price ? Number(result.item.price) : Infinity;
    } else {
      // For roommate profiles, use average of min/max budget
      const minBudget = result.item.minBudget
        ? Number(result.item.minBudget)
        : 0;
      const maxBudget = result.item.maxBudget
        ? Number(result.item.maxBudget)
        : 0;
      return (minBudget + maxBudget) / 2;
    }
  }
}
