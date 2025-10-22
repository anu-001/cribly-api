import { ApiProperty } from '@nestjs/swagger';
import { VerificationStatus } from '@prisma/client';

export class VerificationStatusResponseDto {
  @ApiProperty({
    enum: VerificationStatus,
    example: VerificationStatus.PENDING,
    description: 'Current verification status',
  })
  status: VerificationStatus;

  @ApiProperty({
    example: '2025-10-22T10:00:00Z',
    description: 'When verification was last attempted',
    required: false,
  })
  lastAttemptAt?: string;

  @ApiProperty({
    example: '2025-10-22T12:00:00Z',
    description: 'When verification was completed',
    required: false,
  })
  completedAt?: string;

  @ApiProperty({
    example: 'Document quality too low',
    description: 'Reason for verification failure',
    required: false,
  })
  failureReason?: string;

  @ApiProperty({
    example: 2,
    description: 'Remaining verification attempts today',
  })
  remainingAttempts: number;
}
