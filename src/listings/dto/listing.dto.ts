import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsArray,
  ArrayMaxSize,
  Min,
  Max,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

// Canadian/North American Property Types
export enum PropertyType {
  HOUSE = 'HOUSE',
  CONDO = 'CONDO',
  APARTMENT = 'APARTMENT',
  TOWNHOUSE = 'TOWNHOUSE',
  DUPLEX = 'DUPLEX',
  TRIPLEX = 'TRIPLEX',
  BASEMENT_SUITE = 'BASEMENT_SUITE',
  LOFT = 'LOFT',
  STUDIO = 'STUDIO',
  ROOM = 'ROOM', // Room rental common in Canadian cities
  COTTAGE = 'COTTAGE', // Summer cottages popular in Canada
  MOBILE_HOME = 'MOBILE_HOME',
  COMMERCIAL = 'COMMERCIAL',
  OTHER = 'OTHER',
}

export class CreateListingDto {
  @ApiProperty({
    description: 'Title of the property listing',
    example: 'Beautiful 2BR Apartment in Downtown',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Detailed description of the property',
    example:
      'A lovely 2-bedroom apartment with modern amenities, close to public transport and shopping centers.',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'Monthly rent price',
    example: 2500,
    type: Number,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({
    description: 'Currency code for the price (Canadian Dollar default)',
    example: 'CAD',
    type: String,
    required: false,
    default: 'CAD',
  })
  @IsString()
  @IsOptional()
  currency?: string = 'CAD';

  @ApiProperty({
    description: 'Type of property',
    example: 'APARTMENT',
    enum: PropertyType,
    type: String,
  })
  @IsEnum(PropertyType)
  propertyType: PropertyType;

  @ApiProperty({
    description: 'Number of bedrooms',
    example: 2,
    type: Number,
    required: false,
    minimum: 0,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  bedrooms?: number;

  @ApiProperty({
    description: 'Number of bathrooms (supports half bathrooms, e.g., 2.5)',
    example: 2.5,
    type: Number,
    required: false,
    minimum: 0,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  bathrooms?: number;

  @ApiProperty({
    description: 'Area in square feet',
    example: 1200,
    type: Number,
    required: false,
    minimum: 0,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  sqft?: number;

  @ApiProperty({
    description: 'Whether the property is furnished',
    example: true,
    type: Boolean,
    required: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  furnished?: boolean = false;

  @ApiProperty({
    description: 'Street address of the property',
    example: '123 King Street West, Unit 801',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({
    description: 'City where the property is located',
    example: 'Toronto',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiProperty({
    description: 'Canadian province (e.g., ON, BC, QC)',
    example: 'ON',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  province?: string;

  @ApiProperty({
    description: 'US State (for American listings)',
    example: 'NY',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiProperty({
    description: 'Canadian postal code (A1A 1A1 format)',
    example: 'M5V 3A8',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  postalCode?: string;

  @ApiProperty({
    description: 'US ZIP code (for American listings)',
    example: '10001',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  zipCode?: string;

  @ApiProperty({
    description: 'Country (Canada default for North American market)',
    example: 'CA',
    type: String,
    required: false,
    default: 'CA',
  })
  @IsString()
  @IsOptional()
  country?: string = 'CA';

  @ApiProperty({
    description: 'Latitude coordinate of the property location',
    example: 40.7128,
    type: Number,
    minimum: -90,
    maximum: 90,
  })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({
    description: 'Longitude coordinate of the property location',
    example: -79.3832,
    type: Number,
    minimum: -180,
    maximum: 180,
  })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  // Canadian-specific property features
  @ApiProperty({
    description: 'Year the property was built',
    example: 2015,
    type: Number,
    required: false,
    minimum: 1800,
  })
  @IsNumber()
  @IsOptional()
  @Min(1800)
  yearBuilt?: number;

  @ApiProperty({
    description: 'Number of parking spots',
    example: 1,
    type: Number,
    required: false,
    minimum: 0,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  parkingSpots?: number;

  @ApiProperty({
    description: 'Heating type (important for Canadian climate)',
    example: 'Central heating',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  heating?: string;

  @ApiProperty({
    description: 'Cooling/Air conditioning type',
    example: 'Central air',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  cooling?: string;

  @ApiProperty({
    description: 'Utilities included in rent',
    example: ['heat', 'hydro', 'internet'],
    type: [String],
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  utilities?: string[];

  @ApiProperty({
    description: 'Pet policy',
    example: 'Cats allowed, no dogs',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  petPolicy?: string;

  @ApiProperty({
    description: 'Smoking allowed',
    example: false,
    type: Boolean,
    required: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  smokingPolicy?: boolean = false;

  @ApiProperty({
    description: 'Array of image URLs for the property',
    example: [
      'https://cloudinary.com/image1.jpg',
      'https://cloudinary.com/image2.jpg',
    ],
    type: [String],
    required: false,
    maxItems: 10,
  })
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(10)
  @IsOptional()
  images?: string[] = [];
}

export class UpdateListingDto {
  @ApiProperty({
    description: 'Title of the property listing',
    example: 'Updated Beautiful 2BR Apartment in Downtown',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({
    description: 'Detailed description of the property',
    example: 'An updated lovely 2-bedroom apartment with modern amenities.',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Monthly rent price',
    example: 2600,
    type: Number,
    minimum: 0,
    required: false,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

  @ApiProperty({
    description: 'Currency code for the price',
    example: 'USD',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiProperty({
    description: 'Type of property',
    example: 'APARTMENT',
    enum: PropertyType,
    type: String,
    required: false,
  })
  @IsEnum(PropertyType)
  @IsOptional()
  propertyType?: PropertyType;

  @IsNumber()
  @IsOptional()
  @Min(0)
  bedrooms?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  bathrooms?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  area?: number;

  @IsBoolean()
  @IsOptional()
  furnished?: boolean;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  state?: string;

  @IsString()
  @IsOptional()
  country?: string;

  @IsNumber()
  @Min(-90)
  @Max(90)
  @IsOptional()
  latitude?: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  @IsOptional()
  longitude?: number;

  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(10)
  @IsOptional()
  images?: string[];

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsBoolean()
  @IsOptional()
  isAvailable?: boolean;
}

export class ListingFilterDto {
  @ApiProperty({
    description: 'Search term to filter by title or description',
    example: 'apartment downtown',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiProperty({
    description: 'Filter by city',
    example: 'New York',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiProperty({
    description: 'Filter by country',
    example: 'USA',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiProperty({
    description: 'Filter by property type',
    example: 'APARTMENT',
    enum: PropertyType,
    type: String,
    required: false,
  })
  @IsEnum(PropertyType)
  @IsOptional()
  propertyType?: PropertyType;

  @ApiProperty({
    description: 'Minimum price filter',
    example: 1000,
    type: Number,
    minimum: 0,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  minPrice?: number;

  @ApiProperty({
    description: 'Maximum price filter',
    example: 5000,
    type: Number,
    minimum: 0,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  maxPrice?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  bedrooms?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  bathrooms?: number;

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  furnished?: boolean;

  @ApiProperty({
    description: 'Latitude for location-based search',
    example: 40.7128,
    type: Number,
    minimum: -90,
    maximum: 90,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiProperty({
    description: 'Longitude for location-based search',
    example: -74.006,
    type: Number,
    minimum: -180,
    maximum: 180,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiProperty({
    description: 'Search radius in kilometers (used with latitude/longitude)',
    example: 25,
    type: Number,
    minimum: 1,
    maximum: 200,
    default: 50,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(200)
  radius?: number = 50; // in kilometers

  @ApiProperty({
    description: 'Page number for pagination',
    example: 1,
    type: Number,
    minimum: 1,
    default: 1,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: 'Number of items per page',
    example: 20,
    type: Number,
    minimum: 1,
    maximum: 100,
    default: 20,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiProperty({
    description: 'Field to sort by',
    example: 'price',
    enum: ['price', 'createdAt', 'updatedAt', 'distance'],
    default: 'createdAt',
    required: false,
  })
  @IsString()
  @IsOptional()
  sortBy?: 'price' | 'createdAt' | 'updatedAt' | 'distance' = 'createdAt';

  @ApiProperty({
    description: 'Sort order',
    example: 'asc',
    enum: ['asc', 'desc'],
    default: 'desc',
    required: false,
  })
  @IsString()
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
