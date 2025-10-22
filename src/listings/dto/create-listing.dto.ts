import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsArray,
  IsOptional,
  IsDateString,
  IsUUID,
  Min,
  Max,
  MinLength,
  IsDecimal,
  ArrayMinSize,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PropertyType, PropertyStatus } from '@prisma/client';

export class CreateListingDto {
  @ApiProperty({
    description: 'Listing title',
    example: 'Spacious 2BR Apartment in Downtown',
    minLength: 10,
  })
  @IsString()
  @MinLength(10)
  title: string;

  @ApiProperty({
    description: 'Detailed property description',
    example: 'Beautiful apartment with city views, modern amenities...',
    minLength: 50,
  })
  @IsString()
  @MinLength(50)
  description: string;

  @ApiProperty({
    description: 'Type of property',
    enum: PropertyType,
    example: 'APARTMENT',
  })
  @IsEnum(PropertyType)
  propertyType: PropertyType;

  @ApiPropertyOptional({
    description: 'Listing status',
    enum: PropertyStatus,
    default: 'DRAFT',
  })
  @IsOptional()
  @IsEnum(PropertyStatus)
  status?: PropertyStatus;

  @ApiPropertyOptional({
    description: 'Is property represented by an agent',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isRepresentedByAgent?: boolean;

  @ApiPropertyOptional({
    description: 'Agent ID if represented',
    example: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  representingAgentId?: string;

  @ApiProperty({
    description: 'Monthly rent price',
    example: 2500.0,
  })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({
    description: 'Currency code',
    default: 'USD',
  })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({
    description: 'Full street address',
    example: '123 Main St, Apt 4B',
  })
  @IsString()
  @MinLength(5)
  address: string;

  @ApiProperty({
    description: 'City name',
    example: 'New York',
  })
  @IsString()
  city: string;

  @ApiProperty({
    description: 'State/Province',
    example: 'NY',
  })
  @IsString()
  state: string;

  @ApiProperty({
    description: 'ZIP/Postal code',
    example: '10001',
  })
  @IsString()
  zipCode: string;

  @ApiPropertyOptional({
    description: 'Country',
    default: 'USA',
  })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({
    description: 'Latitude coordinate',
    example: 40.7128,
  })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({
    description: 'Longitude coordinate',
    example: -74.006,
  })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @ApiProperty({
    description: 'Number of bedrooms',
    example: 2,
  })
  @IsNumber()
  @Min(0)
  bedrooms: number;

  @ApiProperty({
    description: 'Number of bathrooms',
    example: 1.5,
  })
  @IsNumber()
  @Min(0)
  bathrooms: number;

  @ApiPropertyOptional({
    description: 'Square footage',
    example: 1200,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  squareFeet?: number;

  @ApiPropertyOptional({
    description: 'Is property furnished',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  furnished?: boolean;

  @ApiPropertyOptional({
    description: 'Available move-in date',
    example: '2025-11-01',
  })
  @IsOptional()
  @IsDateString()
  availableFrom?: string;

  @ApiPropertyOptional({
    description: 'Lease duration in months',
    example: 12,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  leaseDuration?: number;

  @ApiPropertyOptional({
    description: 'Security deposit amount',
    example: 2500.0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  securityDeposit?: number;

  @ApiPropertyOptional({
    description: 'Available amenities',
    example: ['gym', 'pool', 'parking', 'laundry'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenities?: string[];

  @ApiPropertyOptional({
    description: 'Included utilities',
    example: ['water', 'heat', 'internet'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  utilities?: string[];

  @ApiPropertyOptional({
    description: 'Pet policy details',
    example: 'Small dogs allowed with deposit',
  })
  @IsOptional()
  @IsString()
  petPolicy?: string;

  @ApiPropertyOptional({
    description: 'Is smoking allowed',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  smokingAllowed?: boolean;

  @ApiProperty({
    description: 'Property image URLs (minimum 1 required)',
    example: [
      'https://example.com/image1.jpg',
      'https://example.com/image2.jpg',
    ],
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one image is required' })
  @IsString({ each: true })
  imageUrls: string[];

  @ApiPropertyOptional({
    description: 'Property video URL',
    example: 'https://example.com/video.mp4',
  })
  @IsOptional()
  @IsString()
  videoUrl?: string;
}
