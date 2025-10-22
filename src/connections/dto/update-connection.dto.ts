import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { ConnectionStatus } from '@prisma/client';

export class UpdateConnectionDto {
  @ApiProperty({
    description: 'Connection status',
    enum: ['ACCEPTED', 'DECLINED'],
    example: 'ACCEPTED',
  })
  @IsEnum(['ACCEPTED', 'DECLINED'])
  status: 'ACCEPTED' | 'DECLINED';

  @ApiPropertyOptional({
    description: 'Optional reason for declining (min 10 characters)',
    example: 'Not interested at this time',
    minLength: 10,
  })
  @IsOptional()
  @IsString()
  @MinLength(10)
  declineReason?: string;
}
