import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class VerificationCallbackDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Verification token from initiate response',
  })
  @IsUUID()
  @IsNotEmpty()
  verificationToken: string;

  @ApiProperty({
    example: true,
    description: 'Whether verification was successful',
  })
  @IsBoolean()
  @IsNotEmpty()
  success: boolean;

  @ApiProperty({
    example: {
      firstName: 'John',
      lastName: 'Doe',
      dateOfBirth: '1990-01-01',
      documentNumber: 'ABC123456',
    },
    description: 'Extracted document data (if successful)',
    required: false,
  })
  @IsObject()
  @IsOptional()
  documentData?: Record<string, any>;

  @ApiProperty({
    example: 'https://s3.amazonaws.com/face-image.jpg',
    description: 'URL to captured face image',
    required: false,
  })
  @IsString()
  @IsOptional()
  faceImageUrl?: string;

  @ApiProperty({
    example: 'Document expired',
    description: 'Reason for verification failure',
    required: false,
  })
  @IsString()
  @IsOptional()
  failureReason?: string;
}
