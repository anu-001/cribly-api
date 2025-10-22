import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsOptional, IsString } from 'class-validator';

export class AddFavoriteDto {
  @ApiProperty({
    description: 'Listing ID to add to favorites',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  listingId: string;

  @ApiPropertyOptional({
    description: 'Optional personal notes about the listing',
    example: 'Great location, close to work',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
