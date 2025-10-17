import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  Min,
  Max,
  IsArray,
  IsBoolean
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  Gender,
  SmokingPreference,
  PetPreference,
  CleanlinessLevel,
  SocialLevel
} from './create-roommate-profile.dto';

export enum RoommateSortBy {
  AGE = 'age',
  BUDGET = 'budget',
  CREATED_AT = 'createdAt',
  COMPATIBILITY = 'compatibility',
}

export class SearchRoommatesDto {
  @ApiPropertyOptional({ description: 'Search query for bio, occupation, or interests' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Minimum age filter' })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(18)
  ageMin?: number;

  @ApiPropertyOptional({ description: 'Maximum age filter' })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Max(99)
  ageMax?: number;

  @ApiPropertyOptional({ enum: Gender, description: 'Gender preference filter' })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional({ description: 'Minimum budget filter (CAD per month)' })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(200)
  budgetMin?: number;

  @ApiPropertyOptional({ description: 'Maximum budget filter (CAD per month)' })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Max(5000)
  budgetMax?: number;

  @ApiPropertyOptional({ description: 'City filter' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'Province filter' })
  @IsOptional()
  @IsString()
  province?: string;

  @ApiPropertyOptional({ enum: SmokingPreference, description: 'Smoking preference filter' })
  @IsOptional()
  @IsEnum(SmokingPreference)
  smokingPreference?: SmokingPreference;

  @ApiPropertyOptional({ enum: PetPreference, description: 'Pet preference filter' })
  @IsOptional()
  @IsEnum(PetPreference)
  petPreference?: PetPreference;

  @ApiPropertyOptional({ enum: CleanlinessLevel, description: 'Cleanliness level filter' })
  @IsOptional()
  @IsEnum(CleanlinessLevel)
  cleanlinessLevel?: CleanlinessLevel;

  @ApiPropertyOptional({ enum: SocialLevel, description: 'Social level filter' })
  @IsOptional()
  @IsEnum(SocialLevel)
  socialLevel?: SocialLevel;

  @ApiPropertyOptional({ description: 'Filter by interests (comma-separated)' })
  @IsOptional()
  @Transform(({ value }) => typeof value === 'string' ? value.split(',').map(s => s.trim()) : value)
  @IsArray()
  @IsString({ each: true })
  interests?: string[];

  @ApiPropertyOptional({ description: 'Filter by users with pets' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  hasPets?: boolean;

  @ApiPropertyOptional({ description: 'Filter by smokers' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isSmoke?: boolean;

  @ApiPropertyOptional({ enum: RoommateSortBy, description: 'Sort by field', default: RoommateSortBy.CREATED_AT })
  @IsOptional()
  @IsEnum(RoommateSortBy)
  sortBy?: RoommateSortBy = RoommateSortBy.CREATED_AT;

  @ApiPropertyOptional({ description: 'Sort order (asc/desc)', default: 'desc' })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';

  @ApiPropertyOptional({ description: 'Page number for pagination', default: 1 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Number of items per page (max 50)', default: 20 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number = 20;
}