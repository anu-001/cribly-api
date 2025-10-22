import {
  Controller,
  Get,
  Post,
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
import { FavoritesService } from './favorites.service';
import { AddFavoriteDto, QueryFavoritesDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('favorites')
@Controller('favorites')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Post()
  @ApiOperation({
    summary: 'Add listing to favorites',
    description:
      'Bookmark a property listing. Listing must be active and not deleted.',
  })
  @ApiResponse({
    status: 201,
    description: 'Listing added to favorites successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid listing ID',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'Listing not found or not active',
  })
  @ApiResponse({
    status: 409,
    description: 'Listing already in favorites',
  })
  addFavorite(
    @CurrentUser('id') userId: string,
    @Body() addFavoriteDto: AddFavoriteDto,
  ) {
    return this.favoritesService.addFavorite(userId, addFavoriteDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get user favorites',
    description:
      'Retrieve all favorited listings for the current user with pagination. Includes full listing details and owner information.',
  })
  @ApiResponse({
    status: 200,
    description: 'Favorites retrieved successfully with pagination metadata',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  getFavorites(
    @CurrentUser('id') userId: string,
    @Query() query: QueryFavoritesDto,
  ) {
    return this.favoritesService.getFavorites(userId, query);
  }

  @Get('count')
  @ApiOperation({
    summary: 'Get favorites count',
    description: 'Get the total number of favorites for the current user',
  })
  @ApiResponse({
    status: 200,
    description: 'Favorites count retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  getFavoritesCount(@CurrentUser('id') userId: string) {
    return this.favoritesService.getFavoritesCount(userId);
  }

  @Get(':listingId/status')
  @ApiOperation({
    summary: 'Check if listing is favorited',
    description:
      'Check whether a specific listing is in the current user favorites',
  })
  @ApiResponse({
    status: 200,
    description: 'Favorite status retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  isFavorited(
    @CurrentUser('id') userId: string,
    @Param('listingId') listingId: string,
  ) {
    return this.favoritesService.isFavorited(userId, listingId);
  }

  @Delete(':listingId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Remove listing from favorites',
    description: 'Remove a property listing from user favorites',
  })
  @ApiResponse({
    status: 200,
    description: 'Listing removed from favorites successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'Favorite not found',
  })
  removeFavorite(
    @CurrentUser('id') userId: string,
    @Param('listingId') listingId: string,
  ) {
    return this.favoritesService.removeFavorite(userId, listingId);
  }
}
