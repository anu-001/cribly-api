import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsOptional,
  IsNumber,
  IsString,
  IsEnum,
  IsBoolean,
  Min,
  Max,
  IsDateString,
} from 'class-validator';
import { Cleanliness } from '@prisma/client';

export class QueryRoommateProfileDto {
  // Budget filters
  @ApiPropertyOptional({
    description: 'Minimum budget',
    example: 500,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  minBudget?: number;

  @ApiPropertyOptional({
    description: 'Maximum budget',
    example: 2000,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  maxBudget?: number;

  // Move-in date filter
  @ApiPropertyOptional({
    description: 'Earliest move-in date',
    example: '2025-11-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  moveInDateFrom?: string;

  @ApiPropertyOptional({
    description: 'Latest move-in date',
    example: '2026-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  moveInDateTo?: string;

  // Location filter
  @ApiPropertyOptional({
    description: 'Filter by preferred city',
    example: 'Toronto',
  })
  @IsOptional()
  @IsString()
  city?: string;

  // Lifestyle filters
  @ApiPropertyOptional({
    description: 'Filter by cleanliness level',
    enum: Cleanliness,
    example: Cleanliness.TIDY,
  })
  @IsOptional()
  @IsEnum(Cleanliness)
  cleanliness?: Cleanliness;

  @ApiPropertyOptional({
    description: 'Filter by smoking preference',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  smoker?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by pet ownership',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  hasPets?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by work from home status',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  workFromHome?: boolean;

  // Active profiles only
  @ApiPropertyOptional({
    description: 'Filter by active status (default: true)',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;

  // Sorting
  @ApiPropertyOptional({
    description: 'Sort by field',
    enum: ['newest', 'budget_asc', 'budget_desc', 'move_in_date'],
    example: 'newest',
    default: 'newest',
  })
  @IsOptional()
  @IsString()
  sortBy?: 'newest' | 'budget_asc' | 'budget_desc' | 'move_in_date';

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
