import { ApiProperty } from '@nestjs/swagger';

export class InitiateVerificationResponseDto {
  @ApiProperty({
    example:
      'https://idv-provider.com/session?token=550e8400-e29b-41d4-a716-446655440000',
    description:
      'URL to redirect user to for identity verification (expires in 2 hours)',
  })
  verificationUrl: string | null;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Unique verification token',
  })
  verificationToken: string;

  @ApiProperty({
    example: '2025-10-22T12:30:00Z',
    description: 'Token expiration timestamp',
  })
  expiresAt: string;

  @ApiProperty({
    example: 2,
    description: 'Remaining attempts today',
  })
  remainingAttempts: number;
}
