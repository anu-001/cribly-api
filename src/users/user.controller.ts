import {
  Controller,
  Get,
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
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import {
  UpdateUserDto,
  UpdateLocationDto,
  UserFilterDto,
} from './dto/user.dto';
import { SUCCESS_MESSAGES } from '../common/constants/app.constants';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  @ApiOperation({
    summary: 'Get Current User Profile',
    description:
      "Retrieve the authenticated user's complete profile information.",
  })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    schema: {
      example: {
        id: 'uuid-string',
        email: 'john.doe@example.com',
        firstName: 'John',
        lastName: 'Doe',
        avatar: 'https://cloudinary.com/image.jpg',
        bio: 'Property enthusiast',
        phone: '+1234567890',
        location: {
          latitude: 40.7128,
          longitude: -74.006,
          address: 'New York, NY',
        },
        isVerified: true,
        createdAt: '2024-01-01T00:00:00.000Z',
      },
    },
  })
  async getCurrentUser(@CurrentUser() user: any) {
    return this.userService.findById(user.id);
  }

  @Get('profile/:id')
  @ApiOperation({
    summary: 'Get User Profile by ID',
    description: "Retrieve another user's public profile information.",
  })
  @ApiParam({ name: 'id', description: 'User ID', example: 'uuid-string' })
  @ApiResponse({ status: 200, description: 'User profile found' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserProfile(@Param('id') id: string) {
    return this.userService.findById(id);
  }

  @Put('profile')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update User Profile',
    description: "Update the authenticated user's profile information.",
  })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully',
    schema: {
      example: {
        user: {
          id: 'uuid-string',
          email: 'john.doe@example.com',
          firstName: 'John',
          lastName: 'Doe',
          avatar: 'https://cloudinary.com/new-image.jpg',
          bio: 'Updated bio',
        },
        message: 'Profile updated successfully',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async updateProfile(
    @CurrentUser() user: any,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const updatedUser = await this.userService.updateProfile(
      user.id,
      updateUserDto,
    );

    return {
      user: updatedUser,
      message: SUCCESS_MESSAGES.USER_UPDATED,
    };
  }

  @Put('location')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update User Location',
    description:
      "Update the user's current location for geolocation-based features.",
  })
  @ApiBody({ type: UpdateLocationDto })
  @ApiResponse({
    status: 200,
    description: 'Location updated successfully',
    schema: {
      example: {
        user: {
          id: 'uuid-string',
          location: {
            latitude: 40.7128,
            longitude: -74.006,
            address: 'New York, NY',
          },
        },
        message: 'Location updated successfully',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid location data' })
  async updateLocation(
    @CurrentUser() user: any,
    @Body() updateLocationDto: UpdateLocationDto,
  ) {
    const updatedUser = await this.userService.updateLocation(
      user.id,
      updateLocationDto,
    );

    return {
      user: updatedUser,
      message: 'Location updated successfully',
    };
  }

  @Get('nearby')
  @ApiOperation({
    summary: 'Find Nearby Users',
    description: 'Find users within a specified radius based on location.',
  })
  @ApiQuery({
    name: 'latitude',
    description: 'User latitude',
    example: 40.7128,
  })
  @ApiQuery({
    name: 'longitude',
    description: 'User longitude',
    example: -74.006,
  })
  @ApiQuery({
    name: 'radius',
    description: 'Search radius in km',
    example: 50,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Nearby users found',
    schema: {
      example: {
        users: [
          {
            id: 'uuid-string',
            firstName: 'Jane',
            lastName: 'Smith',
            avatar: 'https://cloudinary.com/avatar.jpg',
            distance: 2.5,
          },
        ],
        total: 1,
      },
    },
  })
  async findNearbyUsers(@Query() userFilterDto: UserFilterDto) {
    return this.userService.findNearbyUsers(userFilterDto);
  }

  @Get('search')
  @ApiOperation({
    summary: 'Search Users',
    description: 'Search users with filters and location-based criteria.',
  })
  @ApiQuery({ name: 'query', description: 'Search query', required: false })
  @ApiQuery({ name: 'latitude', description: 'User latitude', required: false })
  @ApiQuery({
    name: 'longitude',
    description: 'User longitude',
    required: false,
  })
  @ApiResponse({ status: 200, description: 'Search results returned' })
  async searchUsers(@Query() userFilterDto: UserFilterDto) {
    return this.userService.findNearbyUsers(userFilterDto);
  }

  @Delete('account')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete User Account',
    description: 'Permanently delete the user account and all associated data.',
  })
  @ApiResponse({ status: 200, description: 'Account deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async deleteAccount(@CurrentUser() user: any) {
    return this.userService.deleteAccount(user.id);
  }
}
