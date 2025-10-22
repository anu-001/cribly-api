import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ListingsService } from './listings.service';
import { CreateListingDto, UpdateListingDto, QueryListingDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { VerifiedUserGuard } from '../common/guards/verified-user.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('listings')
@Controller('listings')
export class ListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  /**
   * Create a new listing
   * Requires verified user
   */
  @Post()
  @UseGuards(JwtAuthGuard, VerifiedUserGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a new property listing',
    description:
      'Create a new property listing. Requires verified user status.',
  })
  @ApiResponse({
    status: 201,
    description: 'Listing created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input or missing required fields',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User must be verified',
  })
  async create(
    @Body() createListingDto: CreateListingDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.listingsService.create(createListingDto, userId);
  }

  /**
   * Get all listings with filters and pagination
   * Public access
   */
  @Get()
  @Public()
  @ApiOperation({
    summary: 'Get all listings',
    description:
      'Search and filter property listings with pagination. Supports text search, price range, property type, location, and geospatial filtering.',
  })
  @ApiResponse({
    status: 200,
    description: 'Listings retrieved successfully',
  })
  async findAll(@Query() queryDto: QueryListingDto) {
    return this.listingsService.findAll(queryDto);
  }

  /**
   * Get current user's listings
   */
  @Get('my/all')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get my listings',
    description:
      'Retrieve all listings created by the current user with pagination',
  })
  @ApiResponse({
    status: 200,
    description: 'User listings retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getMyListings(
    @CurrentUser('id') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.listingsService.getMyListings(userId, page, limit);
  }

  /**
   * Get a single listing by ID
   * Public access
   * Increments view count
   */
  @Get(':id')
  @Public()
  @ApiOperation({
    summary: 'Get listing by ID',
    description: 'Retrieve a single listing by its ID. Increments view count.',
  })
  @ApiResponse({
    status: 200,
    description: 'Listing retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Listing not found',
  })
  async findOne(@Param('id') id: string) {
    return this.listingsService.findOne(id);
  }

  /**
   * Update a listing
   * Only owner can update
   */
  @Put(':id')
  @UseGuards(JwtAuthGuard, VerifiedUserGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update a listing',
    description:
      'Update a property listing. Only the owner can update their listing. Requires verified user status.',
  })
  @ApiResponse({
    status: 200,
    description: 'Listing updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Not the listing owner or user not verified',
  })
  @ApiResponse({
    status: 404,
    description: 'Listing not found',
  })
  async update(
    @Param('id') id: string,
    @Body() updateListingDto: UpdateListingDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.listingsService.update(id, updateListingDto, userId);
  }

  /**
   * Delete a listing (soft delete)
   * Only owner can delete
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Delete a listing',
    description:
      'Soft delete a property listing. Only the owner can delete their listing.',
  })
  @ApiResponse({
    status: 200,
    description: 'Listing deleted successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Not the listing owner',
  })
  @ApiResponse({
    status: 404,
    description: 'Listing not found',
  })
  async remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.listingsService.remove(id, userId);
  }
}
