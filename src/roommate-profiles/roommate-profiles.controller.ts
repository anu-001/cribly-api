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
import { RoommateProfilesService } from './roommate-profiles.service';
import {
  CreateRoommateProfileDto,
  UpdateRoommateProfileDto,
  QueryRoommateProfileDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { VerifiedUserGuard } from '../common/guards/verified-user.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('roommate-profiles')
@Controller('api/v1/roommate-profiles')
export class RoommateProfilesController {
  constructor(
    private readonly roommateProfilesService: RoommateProfilesService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, VerifiedUserGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create roommate profile (verified users only)' })
  @ApiResponse({
    status: 201,
    description: 'Roommate profile created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input or budget validation failed',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - user not verified',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - profile already exists',
  })
  create(
    @Body() createDto: CreateRoommateProfileDto,
    @CurrentUser() user: any,
  ) {
    return this.roommateProfilesService.create(createDto, user.sub);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all active roommate profiles (public)' })
  @ApiResponse({
    status: 200,
    description: 'List of roommate profiles with pagination',
  })
  findAll(@Query() queryDto: QueryRoommateProfileDto) {
    return this.roommateProfilesService.findAll(queryDto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user roommate profile' })
  @ApiResponse({ status: 200, description: 'Current user roommate profile' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  getMyProfile(@CurrentUser() user: any) {
    return this.roommateProfilesService.getMyProfile(user.sub);
  }

  @Get(':userId')
  @Public()
  @ApiOperation({ summary: 'Get roommate profile by user ID (public)' })
  @ApiResponse({ status: 200, description: 'Roommate profile details' })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  findOne(@Param('userId') userId: string) {
    return this.roommateProfilesService.findOne(userId);
  }

  @Put('me')
  @UseGuards(JwtAuthGuard, VerifiedUserGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current user roommate profile' })
  @ApiResponse({
    status: 200,
    description: 'Roommate profile updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input or budget validation failed',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - user not verified or not owner',
  })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  updateMyProfile(
    @Body() updateDto: UpdateRoommateProfileDto,
    @CurrentUser() user: any,
  ) {
    return this.roommateProfilesService.update(user.sub, updateDto, user.sub);
  }

  @Delete('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete current user roommate profile' })
  @ApiResponse({
    status: 200,
    description: 'Roommate profile deleted successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not owner' })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  remove(@CurrentUser() user: any) {
    return this.roommateProfilesService.remove(user.sub, user.sub);
  }
}
