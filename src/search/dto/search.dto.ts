import {
  IsOptional,
  IsString,
  IsNumber,
  IsEnum,
  IsArray,
  IsBoolean,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum SortBy {
  RELEVANCE = 'relevance',
  NEWEST = 'newest',
  PRICE_ASC = 'price_asc',
  PRICE_DESC = 'price_desc',
}

export class SearchQueryDto {
  @ApiProperty({
    description: 'Text query for full-text search',
    required: false,
  })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiProperty({
    description: 'Comma-separated list of city or province filters',
    required: false,
  })
  @IsOptional()
  @IsString()
  locations?: string;

  @ApiProperty({ description: 'Minimum price filter', required: false })
  @IsOptional()
  @IsNumber()
  minPrice?: number;

  @ApiProperty({ description: 'Maximum price filter', required: false })
  @IsOptional()
  @IsNumber()
  maxPrice?: number;

  @ApiProperty({
    description: 'Array of tags or features to filter (e.g., pet-friendly)',
    required: false,
  })
  @IsOptional()
  @IsArray()
  tags?: string[];

  @ApiProperty({ description: 'Latitude for radius search', required: false })
  @IsOptional()
  latitude?: number;

  @ApiProperty({ description: 'Longitude for radius search', required: false })
  @IsOptional()
  longitude?: number;

  @ApiProperty({
    description: 'Radius in kilometers for location search',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  radiusKm?: number;

  @ApiProperty({ description: 'Sort by option', required: false, enum: SortBy })
  @IsOptional()
  @IsEnum(SortBy)
  sortBy?: SortBy = SortBy.RELEVANCE;

  @ApiProperty({ description: 'Page number', required: false })
  @IsOptional()
  @IsNumber()
  page?: number = 1;

  @ApiProperty({ description: 'Items per page', required: false })
  @IsOptional()
  @IsNumber()
  limit?: number = 20;

  @ApiProperty({
    description: 'If true, only show verified listings',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  verifiedOnly?: boolean = false;
}
