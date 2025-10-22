import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class SigninDto {
    @ApiProperty({
        example: 'john.doe@example.com',
        description: 'User email address',
    })
    @IsEmail({}, { message: 'Please provide a valid email address' })
    email: string;

    @ApiProperty({
        example: 'SecureP@ss123',
        description: 'User password',
    })
    @IsString()
    password: string;
}
