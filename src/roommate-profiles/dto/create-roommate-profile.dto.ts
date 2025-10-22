import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsBoolean,
  IsArray,
  IsEnum,
  IsDateString,
  IsOptional,
  MinLength,
  Min,
  IsNotEmpty,
  ArrayMinSize,
} from 'class-validator';
import { Cleanliness, PropertyType } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreateRoommateProfileDto {
  // Basic Info
  @ApiProperty({
    description: 'Bio/introduction (minimum 50 characters)',
    example:
      'I am a software engineer looking for a roommate in downtown Toronto. I enjoy hiking, reading, and cooking. Looking for someone clean and respectful.',
    minLength: 50,
  })
  @IsString()
  @MinLength(50, { message: 'Bio must be at least 50 characters long' })
  @IsNotEmpty()
  bio: string;

  @ApiProperty({
    description: 'Occupation/job title',
    example: 'Software Engineer',
  })
  @IsString()
  @IsNotEmpty()
  occupation: string;

  @ApiPropertyOptional({
    description: 'Employer/company name',
    example: 'Tech Corp Inc.',
  })
  @IsString()
  @IsOptional()
  employer?: string;

  @ApiPropertyOptional({
    description: 'Age range',
    example: '25-30',
  })
  @IsString()
  @IsOptional()
  ageRange?: string;

  // Budget & Timing
  @ApiProperty({
    description: 'Minimum monthly budget',
    example: 800,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  minBudget: number;

  @ApiProperty({
    description: 'Maximum monthly budget (must be >= minBudget)',
    example: 1500,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  maxBudget: number;

  @ApiProperty({
    description: 'Preferred move-in date (ISO 8601 format)',
    example: '2025-12-01T00:00:00.000Z',
  })
  @IsDateString()
  preferredMoveInDate: string;

  @ApiProperty({
    description: 'Preferred lease term in months',
    example: 12,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  leaseTerm: number;

  // Lifestyle
  @ApiProperty({
    description: 'Whether you smoke',
    example: false,
    default: false,
  })
  @IsBoolean()
  smoker: boolean;

  @ApiProperty({
    description: 'Whether you have pets',
    example: true,
    default: false,
  })
  @IsBoolean()
  hasPets: boolean;

  @ApiPropertyOptional({
    description: 'Types of pets you have',
    example: ['dog', 'cat'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  petTypes?: string[];

  @ApiProperty({
    description: 'Cleanliness level',
    enum: Cleanliness,
    example: Cleanliness.TIDY,
    default: Cleanliness.AVERAGE,
  })
  @IsEnum(Cleanliness)
  cleanliness: Cleanliness;

  @ApiPropertyOptional({
    description: 'Sleep schedule preference',
    example: 'early_bird',
    enum: ['early_bird', 'night_owl', 'flexible'],
  })
  @IsString()
  @IsOptional()
  sleepSchedule?: string;

  // Social
  @ApiPropertyOptional({
    description: 'Frequency of having guests over',
    example: 'sometimes',
    enum: ['never', 'rarely', 'sometimes', 'often'],
  })
  @IsString()
  @IsOptional()
  guestsFrequency?: string;

  @ApiProperty({
    description: 'Whether you work from home',
    example: true,
    default: false,
  })
  @IsBoolean()
  workFromHome: boolean;

  @ApiPropertyOptional({
    description: 'Social level',
    example: 'ambivert',
    enum: ['introverted', 'ambivert', 'extroverted'],
  })
  @IsString()
  @IsOptional()
  socialLevel?: string;

  // Preferences
  @ApiPropertyOptional({
    description: 'Preferred roommate gender(s)',
    example: ['male', 'female', 'no-preference'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  preferredGender?: string[];

  @ApiPropertyOptional({
    description: 'Preferred property types',
    example: [PropertyType.APARTMENT, PropertyType.CONDO],
    enum: PropertyType,
    isArray: true,
  })
  @IsArray()
  @IsEnum(PropertyType, { each: true })
  @IsOptional()
  preferredPropertyTypes?: PropertyType[];

  @ApiProperty({
    description: 'Preferred cities',
    example: ['Toronto', 'Mississauga'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1, { message: 'At least one preferred city is required' })
  preferredCities: string[];

  @ApiPropertyOptional({
    description: 'Preferred neighborhoods',
    example: ['Downtown', 'Midtown'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  preferredNeighborhoods?: string[];

  @ApiPropertyOptional({
    description: 'Preferred amenities',
    example: ['gym', 'parking', 'laundry'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  preferredAmenities?: string[];

  @ApiPropertyOptional({
    description: 'Deal breakers',
    example: ['smoking', 'pets'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  dealBreakers?: string[];

  // Personal
  @ApiPropertyOptional({
    description: 'Interests and hobbies',
    example: ['reading', 'hiking', 'cooking'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  interests?: string[];

  @ApiPropertyOptional({
    description: 'Languages spoken',
    example: ['English', 'French'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  languages?: string[];

  @ApiPropertyOptional({
    description: 'Hobbies',
    example: ['photography', 'gaming'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  hobbies?: string[];

  // Status
  @ApiProperty({
    description: 'Whether profile is active',
    example: true,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({
    description: 'Whether user has a listing',
    example: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  hasListing?: boolean;
}
