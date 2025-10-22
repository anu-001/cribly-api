import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class CreateConnectionDto {
  @ApiPropertyOptional({
    description:
      'Target user ID for roommate connections. Either targetId or listingId must be provided.',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  @ValidateIf((o) => !o.listingId)
  targetId?: string;

  @ApiPropertyOptional({
    description:
      'Listing ID for property inquiries. Either targetId or listingId must be provided.',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  @ValidateIf((o) => !o.targetId)
  listingId?: string;

  @ApiPropertyOptional({
    description: 'Optional introduction message (min 10 characters)',
    example:
      'Hi! I am interested in your listing and would like to know more details.',
    minLength: 10,
  })
  @IsOptional()
  @IsString()
  @MinLength(10)
  message?: string;
}
