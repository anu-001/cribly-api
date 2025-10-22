import { ApiProperty } from '@nestjs/swagger';

export class VerificationStatsDto {
  @ApiProperty({
    description: 'Total number of users in the system',
    example: 1000,
  })
  total: number;

  @ApiProperty({
    description: 'Number of verified users',
    example: 750,
  })
  verified: number;

  @ApiProperty({
    description: 'Number of users with pending verification',
    example: 50,
  })
  pending: number;

  @ApiProperty({
    description: 'Number of users with failed verification',
    example: 100,
  })
  failed: number;

  @ApiProperty({
    description: 'Number of unverified users',
    example: 100,
  })
  unverified: number;

  @ApiProperty({
    description: 'Verification success rate as percentage',
    example: 75.0,
  })
  verificationRate: number;
}
