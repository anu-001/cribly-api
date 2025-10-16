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
    ApiBearerAuth,
    ApiOperation,
    ApiResponse,
    ApiBody,
    ApiParam,
    ApiQuery
} from '@nestjs/swagger';
import { ListingService } from './listing.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateListingDto, UpdateListingDto, ListingFilterDto } from './dto/listing.dto';
import { SUCCESS_MESSAGES } from '../common/constants/app.constants';

@ApiTags('Listings')
@Controller('listings')
export class ListingController {
    constructor(private readonly listingService: ListingService) { }

    @Post()
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.CREATED)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({
        summary: 'Create Property Listing',
        description: 'Create a new property listing with location, details, and images.'
    })
    @ApiBody({ type: CreateListingDto })
    @ApiResponse({
        status: 201,
        description: 'Listing created successfully',
        schema: {
            example: {
                listing: {
                    id: "uuid-string",
                    title: "Beautiful 2BR Apartment",
                    description: "Modern apartment in city center",
                    price: 250000,
                    propertyType: "APARTMENT",
                    location: {
                        latitude: 40.7128,
                        longitude: -74.0060,
                        address: "123 Main St, New York, NY"
                    },
                    images: ["https://cloudinary.com/image1.jpg"],
                    createdAt: "2024-01-01T00:00:00.000Z"
                },
                message: "Listing created successfully"
            }
        }
    })
    @ApiResponse({ status: 400, description: 'Invalid listing data' })
    @ApiResponse({ status: 401, description: 'Authentication required' })
    async createListing(
        @CurrentUser() user: any,
        @Body() createListingDto: CreateListingDto,
    ) {
        const listing = await this.listingService.create(user.id, createListingDto);

        return {
            listing,
            message: SUCCESS_MESSAGES.LISTING_CREATED,
        };
    }

    @Get()
    @ApiOperation({
        summary: 'Get All Listings',
        description: 'Retrieve paginated property listings with optional filters.'
    })
    @ApiQuery({ name: 'page', description: 'Page number', example: 1, required: false })
    @ApiQuery({ name: 'limit', description: 'Items per page', example: 20, required: false })
    @ApiQuery({ name: 'propertyType', description: 'Property type filter', required: false })
    @ApiQuery({ name: 'minPrice', description: 'Minimum price filter', required: false })
    @ApiQuery({ name: 'maxPrice', description: 'Maximum price filter', required: false })
    @ApiResponse({
        status: 200,
        description: 'Listings retrieved successfully',
        schema: {
            example: {
                listings: [
                    {
                        id: "uuid-string",
                        title: "Beautiful 2BR Apartment",
                        price: 250000,
                        propertyType: "APARTMENT",
                        location: { address: "New York, NY" },
                        images: ["https://cloudinary.com/image1.jpg"]
                    }
                ],
                total: 100,
                page: 1,
                totalPages: 5
            }
        }
    })
    async findAllListings(@Query() listingFilterDto: ListingFilterDto) {
        return this.listingService.findAll(listingFilterDto);
    }

    @Get('my-listings')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({
        summary: 'Get My Listings',
        description: 'Retrieve the current user\'s property listings.'
    })
    @ApiQuery({ name: 'page', description: 'Page number', example: 1, required: false })
    @ApiQuery({ name: 'limit', description: 'Items per page', example: 20, required: false })
    @ApiResponse({ status: 200, description: 'User listings retrieved successfully' })
    @ApiResponse({ status: 401, description: 'Authentication required' })
    async getMyListings(
        @CurrentUser() user: any,
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 20,
    ) {
        return this.listingService.findByUser(user.id, page, limit);
    }

    @Get(':id')
    @ApiOperation({
        summary: 'Get Listing by ID',
        description: 'Retrieve detailed information about a specific property listing.'
    })
    @ApiParam({ name: 'id', description: 'Listing ID', example: 'uuid-string' })
    @ApiResponse({
        status: 200,
        description: 'Listing found',
        schema: {
            example: {
                id: "uuid-string",
                title: "Beautiful 2BR Apartment",
                description: "Modern apartment with city views",
                price: 250000,
                propertyType: "APARTMENT",
                bedrooms: 2,
                bathrooms: 1,
                area: 850,
                location: {
                    latitude: 40.7128,
                    longitude: -74.0060,
                    address: "123 Main St, New York, NY"
                },
                images: ["https://cloudinary.com/image1.jpg"],
                owner: {
                    id: "owner-uuid",
                    firstName: "John",
                    lastName: "Doe"
                },
                createdAt: "2024-01-01T00:00:00.000Z"
            }
        }
    })
    @ApiResponse({ status: 404, description: 'Listing not found' })
    async getListingById(@Param('id') id: string) {
        return this.listingService.findById(id);
    }

    @Put(':id')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({
        summary: 'Update Property Listing',
        description: 'Update an existing property listing. Only the listing owner can update their listings.'
    })
    @ApiParam({ name: 'id', description: 'Listing ID', type: 'string' })
    @ApiBody({ type: UpdateListingDto })
    @ApiResponse({
        status: 200,
        description: 'Listing updated successfully',
        schema: {
            example: {
                listing: {
                    id: "uuid-string",
                    title: "Updated Beautiful 2BR Apartment",
                    description: "Updated description with new amenities",
                    price: 2600,
                    currency: "USD",
                    propertyType: "APARTMENT",
                    bedrooms: 2,
                    bathrooms: 2,
                    furnished: true,
                    location: {
                        address: "123 Main St, Updated",
                        city: "New York",
                        latitude: 40.7128,
                        longitude: -74.0060
                    },
                    images: ["updated-image1.jpg"],
                    updatedAt: "2024-01-01T12:00:00.000Z"
                },
                message: "Listing updated successfully"
            }
        }
    })
    @ApiResponse({ status: 400, description: 'Invalid listing data' })
    @ApiResponse({ status: 403, description: 'Forbidden - Not the listing owner' })
    @ApiResponse({ status: 404, description: 'Listing not found' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async updateListing(
        @Param('id') id: string,
        @CurrentUser() user: any,
        @Body() updateListingDto: UpdateListingDto,
    ) {
        const listing = await this.listingService.update(id, user.id, updateListingDto);

        return {
            listing,
            message: SUCCESS_MESSAGES.LISTING_UPDATED,
        };
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({
        summary: 'Delete Property Listing',
        description: 'Delete a property listing permanently. Only the listing owner can delete their listings.'
    })
    @ApiParam({ name: 'id', description: 'Listing ID', type: 'string' })
    @ApiResponse({
        status: 200,
        description: 'Listing deleted successfully',
        schema: {
            example: {
                message: "Listing deleted successfully"
            }
        }
    })
    @ApiResponse({ status: 403, description: 'Forbidden - Not the listing owner' })
    @ApiResponse({ status: 404, description: 'Listing not found' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async deleteListing(
        @Param('id') id: string,
        @CurrentUser() user: any,
    ) {
        return this.listingService.delete(id, user.id);
    }
}