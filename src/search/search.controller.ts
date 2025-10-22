import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { SearchService } from './search.service';
import { SearchQueryDto } from './dto/search.dto';

@ApiTags('Search')
  @Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('listings')
  @ApiOperation({
    summary: 'Search Listings',
    description: 'Full-text and radius search for property listings.',
  })
  @ApiQuery({
    name: 'query',
    required: false,
    description: 'Search keywords',
  })
  @ApiQuery({
    name: 'latitude',
    required: false,
    description: 'Latitude for radius search',
  })
  @ApiQuery({
    name: 'longitude',
    required: false,
    description: 'Longitude for radius search',
  })
  @ApiQuery({
    name: 'radius',
    required: false,
    description: 'Radius in kilometers',
  })
  @ApiResponse({
    status: 200,
    description: 'Listings matching query',
    schema: {
      example: {
        listings: [
          {
            id: 'lst_01',
            title: 'Cozy 1BR near park',
            price: 1200,
            city: 'Toronto',
          },
        ],
        total: 1,
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid search parameters' })
  async searchListings(@Query() query: SearchQueryDto) {
    return this.searchService.searchListings(query);
  }

  @Get('roommates')
  @ApiOperation({
    summary: 'Search Roommates',
    description: 'Search roommate profiles with filters and radius.',
  })
  @ApiQuery({
    name: 'query',
    required: false,
    description: 'Search keywords',
  })
  @ApiQuery({ name: 'city', required: false, description: 'City filter' })
  @ApiQuery({
    name: 'radius',
    required: false,
    description: 'Radius in kilometers',
  })
  @ApiResponse({
    status: 200,
    description: 'Roommate profiles matching query',
    schema: {
      example: {
        results: [
          { id: 'rp_01', firstName: 'Alex', age: 27, city: 'Vancouver' },
        ],
        total: 1,
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid search parameters' })
  async searchRoommates(@Query() query: SearchQueryDto) {
    return this.searchService.searchRoommates(query);
  }
}
