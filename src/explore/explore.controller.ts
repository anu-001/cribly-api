import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ExploreService } from './explore.service';
import { QueryExploreDto } from './dto';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('explore')
@Controller('api/v1/explore')
export class ExploreController {
  constructor(private readonly exploreService: ExploreService) {}

  @Get()
  @Public()
  @ApiOperation({
    summary: 'Unified discovery endpoint (public)',
    description:
      'Search both property listings and roommate profiles in a single request. Supports filtering, sorting, and geospatial search.',
  })
  @ApiResponse({
    status: 200,
    description: 'Unified search results with pagination',
    schema: {
      example: {
        success: true,
        data: [
          {
            type: 'property',
            item: {
              id: 'uuid',
              title: 'Modern 2BR Apartment',
              price: 2000,
              city: 'Toronto',
              bedrooms: 2,
              owner: {
                firstName: 'John',
                lastName: 'Doe',
                verificationStatus: 'VERIFIED',
              },
            },
            score: 85,
            distance_km: 2.5,
          },
          {
            type: 'roommate',
            item: {
              id: 'uuid',
              bio: 'Looking for a clean roommate...',
              minBudget: 800,
              maxBudget: 1500,
              user: {
                firstName: 'Jane',
                lastName: 'Smith',
                verificationStatus: 'VERIFIED',
              },
            },
            score: 78,
          },
        ],
        meta: {
          total: 145,
          page: 1,
          limit: 20,
          totalPages: 8,
        },
      },
    },
  })
  discover(@Query() queryDto: QueryExploreDto) {
    return this.exploreService.discover(queryDto);
  }
}
