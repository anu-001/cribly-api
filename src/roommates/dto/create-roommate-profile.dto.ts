import {
  IsString,
  IsNumber,
  IsArray,
  IsOptional,
  IsBoolean,
  IsEnum,
  Min,
  Max,
  Length,
  IsDateString
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  NON_BINARY = 'NON_BINARY',
  PREFER_NOT_TO_SAY = 'PREFER_NOT_TO_SAY',
}

export enum SmokingPreference {
  SMOKER = 'SMOKER',
  NON_SMOKER = 'NON_SMOKER',
  OCCASIONAL = 'OCCASIONAL',
  NO_PREFERENCE = 'NO_PREFERENCE',
}

export enum PetPreference {
  LOVES_PETS = 'LOVES_PETS',
  NO_PETS = 'NO_PETS',
  SMALL_PETS_ONLY = 'SMALL_PETS_ONLY',
  NO_PREFERENCE = 'NO_PREFERENCE',
}

export enum CleanlinessLevel {
  VERY_CLEAN = 'VERY_CLEAN',
  MODERATELY_CLEAN = 'MODERATELY_CLEAN',
  RELAXED = 'RELAXED',
  NO_PREFERENCE = 'NO_PREFERENCE',
}

export enum SocialLevel {
  VERY_SOCIAL = 'VERY_SOCIAL',
  MODERATELY_SOCIAL = 'MODERATELY_SOCIAL',
  PREFER_QUIET = 'PREFER_QUIET',
  NO_PREFERENCE = 'NO_PREFERENCE',
}

export class CreateRoommateProfileDto {
  @ApiProperty({ description: 'Brief bio about the person' })
  @IsString()
  @Length(10, 500, { message: 'Bio must be between 10 and 500 characters' })
  bio: string;

  @ApiProperty({ description: 'Age of the person' })
  @IsNumber()
  @Min(18, { message: 'Must be at least 18 years old' })
  @Max(99, { message: 'Age must be less than 100' })
  age: number;

  @ApiProperty({ enum: Gender, description: 'Gender identity' })
  @IsEnum(Gender)
  gender: Gender;

  @ApiProperty({ description: 'Occupation/job title' })
  @IsString()
  @Length(2, 100, { message: 'Occupation must be between 2 and 100 characters' })
  occupation: string;

  @ApiPropertyOptional({ description: 'Array of interests/hobbies' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  interests?: string[];

  @ApiProperty({ description: 'Budget range for accommodation (CAD per month)' })
  @IsNumber()
  @Min(200, { message: 'Budget must be at least $200 CAD' })
  @Max(5000, { message: 'Budget must be less than $5000 CAD' })
  budgetMin: number;

  @ApiProperty({ description: 'Maximum budget for accommodation (CAD per month)' })
  @IsNumber()
  @Min(200, { message: 'Budget must be at least $200 CAD' })
  @Max(5000, { message: 'Budget must be less than $5000 CAD' })
  budgetMax: number;

  @ApiProperty({ description: 'Preferred cities for accommodation' })
  @IsArray()
  @IsString({ each: true })
  preferredCities: string[];

  @ApiProperty({ enum: SmokingPreference, description: 'Smoking preference' })
  @IsEnum(SmokingPreference)
  smokingPreference: SmokingPreference;

  @ApiProperty({ enum: PetPreference, description: 'Pet preference' })
  @IsEnum(PetPreference)
  petPreference: PetPreference;

  @ApiProperty({ enum: CleanlinessLevel, description: 'Cleanliness level preference' })
  @IsEnum(CleanlinessLevel)
  cleanlinessLevel: CleanlinessLevel;

  @ApiProperty({ enum: SocialLevel, description: 'Social interaction preference' })
  @IsEnum(SocialLevel)
  socialLevel: SocialLevel;

  @ApiPropertyOptional({ description: 'Whether person has pets' })
  @IsOptional()
  @IsBoolean()
  hasPets?: boolean;

  @ApiPropertyOptional({ description: 'Whether person smokes' })
  @IsOptional()
  @IsBoolean()
  isSmoke?: boolean;

  @ApiPropertyOptional({ description: 'Preferred move-in date' })
  @IsOptional()
  @IsDateString()
  preferredMoveInDate?: string;

  @ApiPropertyOptional({ description: 'Additional notes or requirements' })
  @IsOptional()
  @IsString()
  @Length(0, 500, { message: 'Additional notes must be less than 500 characters' })
  additionalNotes?: string;
}