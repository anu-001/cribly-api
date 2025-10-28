import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  MinLength,
  Matches,
  IsEnum,
  IsOptional,
  IsDateString,
  IsPhoneNumber,
  MaxLength,
} from 'class-validator';
import { UserRole } from '@prisma/client';

export class SignupDto {
  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'User email address',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @ApiProperty({
    example: 'SecureP@ss123',
    description:
      'Password must be at least 10 characters with uppercase, lowercase, number, and special character',
    minLength: 10,
  })
  @IsString()
  @MinLength(10, { message: 'Password must be at least 10 characters long' })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message:
      'Password must contain uppercase, lowercase, and number or special character',
  })
  password: string;

  @ApiProperty({
    example: 'John',
    description: 'User first name',
  })
  @IsString()
  @MinLength(2)
  firstName: string;

  @ApiProperty({
    example: 'Doe',
    description: 'User last name',
  })
  @IsString()
  @MinLength(2)
  lastName: string;

  @ApiProperty({
    enum: UserRole,
    example: UserRole.USER,
    description: 'User role',
    default: UserRole.USER,
  })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @ApiProperty({
    example: '+1-613-555-0101',
    description: 'User phone number',
    required: false,
  })
  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @ApiProperty({
    example: '1995-03-15',
    description: 'User date of birth (YYYY-MM-DD format)',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  dateOfBirth?: string;

  @ApiProperty({
    example: 'Software developer looking for a clean and quiet place. Non-smoker, no pets. I enjoy hiking and photography.',
    description: 'User bio/description',
    required: false,
    maxLength: 500,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500, { message: 'Bio must be less than 500 characters' })
  bio?: string;
}
