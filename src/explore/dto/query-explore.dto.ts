import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsOptional,
  IsString,
  IsNumber,
  IsEnum,
  Min,
  Max,
} from 'class-validator';
import { PropertyType, Cleanliness } from '@prisma/client';

export enum ExploreType {
  PROPERTY = 'property',
  ROOMMATE = 'roommate',
  ALL = 'all',
}

export class QueryExploreDto {
  // Type filter
  @ApiPropertyOptional({
    description: 'Type of results to return',
    enum: ExploreType,
    example: ExploreType.ALL,
    default: ExploreType.ALL,
  })
  @IsOptional()
  @IsEnum(ExploreType)
  type?: ExploreType;

  // Common filters
  @ApiPropertyOptional({
    description: 'Text search across listings and profiles',
    example: 'downtown apartment',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Latitude for geospatial search',
    example: 43.6532,
    minimum: -90,
    maximum: 90,
  })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  @Type(() => Number)
  latitude?: number;

  @ApiPropertyOptional({
    description: 'Longitude for geospatial search',
    example: -79.3832,
    minimum: -180,
    maximum: 180,
  })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  @Type(() => Number)
  longitude?: number;

  @ApiPropertyOptional({
    description: 'Radius in kilometers for geospatial search',
    example: 10,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  radiusKm?: number;

  // Listing-specific filters
  @ApiPropertyOptional({
    description: 'Minimum price for property listings',
    example: 1000,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  minPrice?: number;

  @ApiPropertyOptional({
    description: 'Maximum price for property listings',
    example: 3000,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  maxPrice?: number;

  @ApiPropertyOptional({
    description: 'Property type for listings',
    enum: PropertyType,
    example: PropertyType.APARTMENT,
  })
  @IsOptional()
  @IsEnum(PropertyType)
  propertyType?: PropertyType;

  @ApiPropertyOptional({
    description: 'Minimum number of bedrooms',
    example: 2,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  bedrooms?: number;

  // Roommate-specific filters
  @ApiPropertyOptional({
    description: 'Minimum budget for roommate profiles',
    example: 800,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  minBudget?: number;

  @ApiPropertyOptional({
    description: 'Maximum budget for roommate profiles',
    example: 2000,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  maxBudget?: number;

  @ApiPropertyOptional({
    description: 'Cleanliness preference for roommate profiles',
    enum: Cleanliness,
    example: Cleanliness.TIDY,
  })
  @IsOptional()
  @IsEnum(Cleanliness)
  cleanliness?: Cleanliness;

  @ApiPropertyOptional({
    description: 'City for location-based filtering',
    example: 'Toronto',
  })
  @IsOptional()
  @IsString()
  city?: string;

  // Sorting
  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['newest', 'price_asc', 'price_desc', 'recommended', 'proximity'],
    example: 'recommended',
    default: 'recommended',
  })
  @IsOptional()
  @IsString()
  sortBy?: 'newest' | 'price_asc' | 'price_desc' | 'recommended' | 'proximity';

  // Pagination
  @ApiPropertyOptional({
    description: 'Page number',
    example: 1,
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 20,
    minimum: 1,
    maximum: 100,
    default: 20,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number;
}
