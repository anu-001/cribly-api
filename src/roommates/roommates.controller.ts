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
  Request,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { RoommatesService } from './roommates.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  CreateRoommateProfileDto,
  UpdateRoommateProfileDto,
  SearchRoommatesDto,
} from './dto';

@ApiTags('Roommates')
  @Controller('roommates')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RoommatesController {
  constructor(private readonly roommatesService: RoommatesService) {}

  @Post('profile')
  @ApiOperation({
    summary: 'Create roommate profile',
    description: 'Create a new roommate profile for the authenticated user',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Roommate profile created successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data or profile already exists',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'User not authenticated',
  })
  async createProfile(
    @Request() req: any,
    @Body() createDto: CreateRoommateProfileDto,
  ) {
    return this.roommatesService.createProfile(req.user.id, createDto);
  }

  @Put('profile')
  @ApiOperation({
    summary: 'Update roommate profile',
    description: 'Update the roommate profile of the authenticated user',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Roommate profile updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Roommate profile not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async updateProfile(
    @Request() req: any,
    @Body() updateDto: UpdateRoommateProfileDto,
  ) {
    return this.roommatesService.updateProfile(req.user.id, updateDto);
  }

  @Get('profile')
  @ApiOperation({
    summary: 'Get my roommate profile',
    description: 'Get the roommate profile of the authenticated user',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Roommate profile retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Roommate profile not found',
  })
  async getMyProfile(@Request() req: any) {
    return this.roommatesService.getProfile(req.user.id);
  }

  @Get('profile/:profileId')
  @ApiOperation({
    summary: 'Get roommate profile by ID',
    description: 'Get a specific roommate profile by profile ID',
  })
  @ApiParam({
    name: 'profileId',
    description: 'The ID of the roommate profile',
    type: 'string',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Roommate profile retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Roommate profile not found',
  })
  async getProfile(@Param('profileId') profileId: string) {
    return this.roommatesService.getProfileByProfileId(profileId);
  }

  @Delete('profile')
  @ApiOperation({
    summary: 'Delete my roommate profile',
    description: 'Delete the roommate profile of the authenticated user',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Roommate profile deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Roommate profile not found',
  })
  async deleteProfile(@Request() req: any) {
    return this.roommatesService.deleteProfile(req.user.id);
  }

  @Get('search')
  @ApiOperation({
    summary: 'Search roommate profiles',
    description: 'Search and filter roommate profiles with advanced criteria',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search term for bio, occupation, or interests',
    type: 'string',
  })
  @ApiQuery({
    name: 'ageMin',
    required: false,
    description: 'Minimum age filter',
    type: 'number',
  })
  @ApiQuery({
    name: 'ageMax',
    required: false,
    description: 'Maximum age filter',
    type: 'number',
  })
  @ApiQuery({
    name: 'gender',
    required: false,
    description: 'Gender filter',
    enum: ['MALE', 'FEMALE', 'NON_BINARY', 'PREFER_NOT_TO_SAY'],
  })
  @ApiQuery({
    name: 'budgetMin',
    required: false,
    description: 'Minimum budget filter',
    type: 'number',
  })
  @ApiQuery({
    name: 'budgetMax',
    required: false,
    description: 'Maximum budget filter',
    type: 'number',
  })
  @ApiQuery({
    name: 'city',
    required: false,
    description: 'Preferred city filter',
    type: 'string',
  })
  @ApiQuery({
    name: 'smokingPreference',
    required: false,
    description: 'Smoking preference filter',
    enum: ['NO_SMOKING', 'SMOKING_OK', 'NO_PREFERENCE'],
  })
  @ApiQuery({
    name: 'petPreference',
    required: false,
    description: 'Pet preference filter',
    enum: ['NO_PETS', 'PETS_OK', 'NO_PREFERENCE'],
  })
  @ApiQuery({
    name: 'cleanlinessLevel',
    required: false,
    description: 'Cleanliness level filter',
    enum: ['VERY_CLEAN', 'MODERATELY_CLEAN', 'RELAXED', 'NO_PREFERENCE'],
  })
  @ApiQuery({
    name: 'socialLevel',
    required: false,
    description: 'Social level filter',
    enum: ['VERY_SOCIAL', 'MODERATELY_SOCIAL', 'QUIET', 'NO_PREFERENCE'],
  })
  @ApiQuery({
    name: 'interests',
    required: false,
    description: 'Interests filter (comma-separated)',
    type: 'string',
    isArray: true,
  })
  @ApiQuery({
    name: 'hasPets',
    required: false,
    description: 'Has pets filter',
    type: 'boolean',
  })
  @ApiQuery({
    name: 'isSmoke',
    required: false,
    description: 'Is smoker filter',
    type: 'boolean',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    description: 'Sort by field',
    enum: ['CREATED_AT', 'AGE', 'BUDGET'],
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    description: 'Sort order',
    enum: ['asc', 'desc'],
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number',
    type: 'number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page',
    type: 'number',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Roommate profiles retrieved successfully',
  })
  async searchRoommates(
    @Request() req: any,
    @Query() searchDto: SearchRoommatesDto,
  ) {
    return this.roommatesService.searchRoommates(searchDto, req.user.id);
  }

  @Get('compatibility/:profileId')
  @ApiOperation({
    summary: 'Get compatibility score',
    description:
      'Calculate compatibility score between authenticated user and target profile',
  })
  @ApiParam({
    name: 'profileId',
    description: 'Target roommate profile ID',
    type: 'string',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Compatibility score calculated successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User profile or target profile not found',
  })
  async getCompatibilityScore(
    @Request() req: any,
    @Param('profileId') profileId: string,
  ) {
    return this.roommatesService.getCompatibilityScore(req.user.id, profileId);
  }

  @Get('recommendations')
  @ApiOperation({
    summary: 'Get roommate recommendations',
    description:
      'Get personalized roommate recommendations based on compatibility',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Maximum number of recommendations',
    type: 'number',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Recommendations retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User roommate profile not found',
  })
  async getRecommendations(
    @Request() req: any,
    @Query('limit') limit?: number,
  ) {
    return this.roommatesService.getRecommendations(req.user.id, limit);
  }
}
