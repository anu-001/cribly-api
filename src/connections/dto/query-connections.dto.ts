import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsEnum, IsInt, Min, Max, IsIn } from 'class-validator';
import { ConnectionStatus } from '@prisma/client';

export class QueryConnectionsDto {
  @ApiPropertyOptional({
    description: 'Filter by connection status',
    enum: ConnectionStatus,
    example: 'PENDING',
  })
  @IsOptional()
  @IsEnum(ConnectionStatus)
  status?: ConnectionStatus;

  @ApiPropertyOptional({
    description:
      'Filter by connection direction: incoming (received), outgoing (sent), or all',
    enum: ['incoming', 'outgoing', 'all'],
    default: 'all',
  })
  @IsOptional()
  @IsIn(['incoming', 'outgoing', 'all'])
  direction?: 'incoming' | 'outgoing' | 'all' = 'all';

  @ApiPropertyOptional({
    description: 'Page number',
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 20;
}
