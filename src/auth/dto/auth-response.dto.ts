import { ApiProperty } from '@nestjs/swagger';

export class AuthResponseDto {
    @ApiProperty({
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        description: 'JWT access token (15 minutes expiry)',
    })
    accessToken: string;

    @ApiProperty({
        example: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            email: 'john.doe@example.com',
            firstName: 'John',
            lastName: 'Doe',
            role: 'USER',
            verificationStatus: 'UNVERIFIED',
        },
        description: 'User profile information',
    })
    user: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: string;
        verificationStatus: string;
        avatarUrl?: string;
    };
}
