import { IsOptional, IsString, IsNumber, IsEnum, Min, Max, IsArray } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum SortBy {
    RECENCY = 'recency',
    PRICE_LOW_TO_HIGH = 'price_asc',
    PRICE_HIGH_TO_LOW = 'price_desc',
    PROXIMITY = 'proximity'
}

export enum PropertyTypeFilter {
    STUDIO = 'STUDIO',
    APARTMENT = 'APARTMENT',
    HOUSE = 'HOUSE',
    CONDO = 'CONDO',
    TOWNHOUSE = 'TOWNHOUSE',
    DUPLEX = 'DUPLEX',
    BASEMENT_SUITE = 'BASEMENT_SUITE',
    COTTAGE = 'COTTAGE',
    COMMERCIAL = 'COMMERCIAL',
    OTHER = 'OTHER'
}

export class ExploreListingsDto {
    @ApiPropertyOptional({
        description: 'Search keywords for title, description, or address',
        example: 'modern studio downtown'
    })
    @IsOptional()
    @IsString()
    @Transform(({ value }) => value?.trim())
    search?: string;

    @ApiPropertyOptional({
        description: 'Property types to filter by',
        enum: PropertyTypeFilter,
        isArray: true,
        example: ['STUDIO', 'APARTMENT']
    })
    @IsOptional()
    @IsArray()
    @IsEnum(PropertyTypeFilter, { each: true })
    @Transform(({ value }) => Array.isArray(value) ? value : [value])
    propertyTypes?: PropertyTypeFilter[];

    @ApiPropertyOptional({
        description: 'Minimum price filter (in CAD)',
        example: 1000,
        minimum: 0
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    minPrice?: number;

    @ApiPropertyOptional({
        description: 'Maximum price filter (in CAD)',
        example: 5000,
        minimum: 0
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    maxPrice?: number;

    @ApiPropertyOptional({
        description: 'Minimum number of bedrooms',
        example: 1,
        minimum: 0,
        maximum: 10
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    @Max(10)
    minBedrooms?: number;

    @ApiPropertyOptional({
        description: 'Maximum number of bedrooms',
        example: 3,
        minimum: 0,
        maximum: 10
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    @Max(10)
    maxBedrooms?: number;

    @ApiPropertyOptional({
        description: 'Minimum number of bathrooms',
        example: 1,
        minimum: 0,
        maximum: 10
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    @Max(10)
    minBathrooms?: number;

    @ApiPropertyOptional({
        description: 'Maximum number of bathrooms',
        example: 2,
        minimum: 0,
        maximum: 10
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    @Max(10)
    maxBathrooms?: number;

    @ApiPropertyOptional({
        description: 'City filter',
        example: 'Toronto'
    })
    @IsOptional()
    @IsString()
    @Transform(({ value }) => value?.trim())
    city?: string;

    @ApiPropertyOptional({
        description: 'Province filter (Canadian provinces)',
        example: 'ON'
    })
    @IsOptional()
    @IsString()
    @Transform(({ value }) => value?.trim()?.toUpperCase())
    province?: string;

    @ApiPropertyOptional({
        description: 'Filter furnished properties only',
        example: true
    })
    @IsOptional()
    @Transform(({ value }) => {
        if (value === 'true') return true;
        if (value === 'false') return false;
        return value;
    })
    furnished?: boolean;

    @ApiPropertyOptional({
        description: 'Latitude for proximity-based search',
        example: 43.653226,
        minimum: -90,
        maximum: 90
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(-90)
    @Max(90)
    lat?: number;

    @ApiPropertyOptional({
        description: 'Longitude for proximity-based search',
        example: -79.383184,
        minimum: -180,
        maximum: 180
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(-180)
    @Max(180)
    lng?: number;

    @ApiPropertyOptional({
        description: 'Search radius in kilometers (only used with lat/lng)',
        example: 10,
        minimum: 1,
        maximum: 100
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    @Max(100)
    radius?: number;

    @ApiPropertyOptional({
        description: 'Sort order for results',
        enum: SortBy,
        example: SortBy.RECENCY,
        default: SortBy.RECENCY
    })
    @IsOptional()
    @IsEnum(SortBy)
    sortBy?: SortBy = SortBy.RECENCY;

    @ApiPropertyOptional({
        description: 'Page number for pagination',
        example: 1,
        minimum: 1,
        default: 1
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({
        description: 'Number of listings per page',
        example: 20,
        minimum: 1,
        maximum: 100,
        default: 20
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    @Max(100)
    limit?: number = 20;
}

export class ExploreListingsResponseDto {
    @ApiPropertyOptional({
        description: 'Array of listings matching the filters'
    })
    results: ListingWithDistanceDto[];

    @ApiPropertyOptional({
        description: 'Total number of matched listings',
        example: 150
    })
    total: number;

    @ApiPropertyOptional({
        description: 'Current page number',
        example: 1
    })
    page: number;

    @ApiPropertyOptional({
        description: 'Number of listings per page',
        example: 20
    })
    limit: number;

    @ApiPropertyOptional({
        description: 'Total number of pages available',
        example: 8
    })
    totalPages: number;

    @ApiPropertyOptional({
        description: 'Whether location-based sorting was applied',
        example: true
    })
    locationBasedSorting: boolean;

    @ApiPropertyOptional({
        description: 'Coordinates used for proximity calculations',
        example: { lat: 43.653226, lng: -79.383184 }
    })
    searchCenter?: {
        lat: number;
        lng: number;
        source: 'provided' | 'ip' | null;
    };
}

export class ListingWithDistanceDto {
    id: string;
    title: string;
    description: string;
    price: number;
    currency: string;
    propertyType: string;
    bedrooms: number;
    bathrooms: number;
    furnished: boolean;
    address: string;
    city: string;
    province?: string;
    country: string;
    latitude: number;
    longitude: number;
    images: string[];
    isActive: boolean;
    isAvailable: boolean;
    createdAt: Date;
    updatedAt: Date;

    // Optional distance field when location-based search is used
    distance?: number; // in kilometers

    // Basic user info (public)
    user: {
        id: string;
        firstName: string;
        lastName: string;
        avatar?: string;
    };
}