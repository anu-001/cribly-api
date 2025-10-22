import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({
    description: 'User unique identifier',
    example: 'clx1234567890',
  })
  id: string;

  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'First name',
    example: 'John',
  })
  firstName: string;

  @ApiProperty({
    description: 'Last name',
    example: 'Doe',
  })
  lastName: string;

  @ApiPropertyOptional({
    description: 'Phone number',
    example: '+1234567890',
  })
  phoneNumber?: string;

  @ApiPropertyOptional({
    description: 'Profile avatar URL',
    example: 'https://example.com/avatar.jpg',
  })
  avatarUrl?: string;

  @ApiPropertyOptional({
    description: 'User bio or description',
    example: 'Looking for a clean and quiet roommate',
  })
  bio?: string;

  @ApiProperty({
    description: 'User role',
    example: 'USER',
    enum: ['USER', 'AGENT', 'ADMIN'],
  })
  role: string;

  @ApiProperty({
    description: 'Email verification status',
    example: 'VERIFIED',
    enum: ['UNVERIFIED', 'PENDING', 'VERIFIED', 'FAILED'],
  })
  verificationStatus: string;

  @ApiPropertyOptional({
    description: 'Date of birth',
    example: '1995-05-15T00:00:00.000Z',
  })
  dateOfBirth?: Date;

  @ApiProperty({
    description: 'Account creation timestamp',
    example: '2025-10-22T02:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2025-10-22T02:00:00.000Z',
  })
  updatedAt: Date;
}
