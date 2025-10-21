import {
  Controller,
  Get,
  Post,
  Put,
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
  ApiQuery,
} from '@nestjs/swagger';
import { MatchService } from './match.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateMatchDto, UpdateMatchStatusDto } from './dto/match.dto';
import { SUCCESS_MESSAGES } from '../common/constants/app.constants';

@ApiTags('Matches')
@ApiBearerAuth('JWT-auth')
@Controller('matches')
@UseGuards(JwtAuthGuard)
export class MatchController {
  constructor(private readonly matchService: MatchService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create Match Request',
    description: 'Send a match request to a property listing owner.',
  })
  @ApiBody({ type: CreateMatchDto })
  @ApiResponse({
    status: 201,
    description: 'Match request created successfully',
    schema: {
      example: {
        match: {
          id: 'uuid-string',
          status: 'PENDING',
          listing: {
            id: 'listing-uuid',
            title: 'Beautiful Apartment',
          },
          requester: {
            id: 'user-uuid',
            firstName: 'John',
          },
          createdAt: '2024-01-01T00:00:00.000Z',
        },
        message: 'Match request sent successfully',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid match request' })
  @ApiResponse({ status: 409, description: 'Match request already exists' })
  async createMatch(
    @CurrentUser() user: any,
    @Body() createMatchDto: CreateMatchDto,
  ) {
    const match = await this.matchService.createMatch(user.id, createMatchDto);

    return {
      match,
      message: SUCCESS_MESSAGES.MATCH_CREATED,
    };
  }

  @Get('sent')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get Sent Match Requests',
    description:
      'Retrieve all match requests sent by the current user with pagination.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 20)',
  })
  @ApiResponse({
    status: 200,
    description: 'Sent matches retrieved successfully',
    schema: {
      example: {
        matches: [
          {
            id: 'uuid-string',
            status: 'PENDING',
            listing: {
              id: 'listing-uuid',
              title: 'Beautiful Apartment',
              images: ['image1.jpg'],
            },
            owner: {
              id: 'owner-uuid',
              firstName: 'Jane',
            },
            createdAt: '2024-01-01T00:00:00.000Z',
          },
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 15,
          pages: 1,
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getSentMatches(
    @CurrentUser() user: any,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.matchService.getSentMatches(user.id, page, limit);
  }

  @Get('received')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get Received Match Requests',
    description:
      'Retrieve all match requests received by the current user (as a listing owner) with pagination.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 20)',
  })
  @ApiResponse({
    status: 200,
    description: 'Received matches retrieved successfully',
    schema: {
      example: {
        matches: [
          {
            id: 'uuid-string',
            status: 'PENDING',
            listing: {
              id: 'listing-uuid',
              title: 'My Apartment Listing',
              images: ['image1.jpg'],
            },
            requester: {
              id: 'requester-uuid',
              firstName: 'John',
              avatar: 'profile.jpg',
            },
            createdAt: '2024-01-01T00:00:00.000Z',
          },
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 8,
          pages: 1,
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getReceivedMatches(
    @CurrentUser() user: any,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.matchService.getReceivedMatches(user.id, page, limit);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get Match by ID',
    description:
      'Retrieve detailed information about a specific match request.',
  })
  @ApiParam({ name: 'id', description: 'Match ID', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Match details retrieved successfully',
    schema: {
      example: {
        id: 'uuid-string',
        status: 'PENDING',
        listing: {
          id: 'listing-uuid',
          title: 'Beautiful Apartment',
          description: 'A lovely 2BR apartment',
          price: 2500,
          images: ['image1.jpg', 'image2.jpg'],
          location: {
            address: '123 Main St',
            city: 'New York',
            latitude: 40.7128,
            longitude: -74.006,
          },
        },
        requester: {
          id: 'requester-uuid',
          firstName: 'John',
          lastName: 'Doe',
          avatar: 'profile.jpg',
        },
        owner: {
          id: 'owner-uuid',
          firstName: 'Jane',
          lastName: 'Smith',
        },
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Match not found' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Not authorized to view this match',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMatchById(@Param('id') matchId: string, @CurrentUser() user: any) {
    return this.matchService.getMatchById(matchId, user.id);
  }

  @Put(':id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update Match Status',
    description:
      'Accept or reject a match request. Only the listing owner can update match status.',
  })
  @ApiParam({ name: 'id', description: 'Match ID', type: 'string' })
  @ApiBody({ type: UpdateMatchStatusDto })
  @ApiResponse({
    status: 200,
    description: 'Match status updated successfully',
    schema: {
      example: {
        match: {
          id: 'uuid-string',
          status: 'ACCEPTED',
          listing: {
            id: 'listing-uuid',
            title: 'Beautiful Apartment',
          },
          requester: {
            id: 'requester-uuid',
            firstName: 'John',
          },
          updatedAt: '2024-01-01T00:30:00.000Z',
        },
        message: 'Match request accepted successfully',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid status update' })
  @ApiResponse({ status: 404, description: 'Match not found' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only listing owner can update status',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateMatchStatus(
    @Param('id') matchId: string,
    @CurrentUser() user: any,
    @Body() updateMatchStatusDto: UpdateMatchStatusDto,
  ) {
    const match = await this.matchService.updateMatchStatus(
      matchId,
      user.id,
      updateMatchStatusDto,
    );

    const message =
      updateMatchStatusDto.status === 'ACCEPTED'
        ? SUCCESS_MESSAGES.MATCH_ACCEPTED
        : SUCCESS_MESSAGES.MATCH_REJECTED;

    return {
      match,
      message,
    };
  }
}
