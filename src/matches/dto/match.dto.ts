import { IsString, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMatchDto {
    @ApiProperty({
        description: 'ID of the listing to match with',
        example: 'uuid-string-here',
        type: String
    })
    @IsString()
    @IsNotEmpty()
    listingId: string;

    @ApiProperty({
        description: 'Optional message to send with the match request',
        example: 'Hi, I\'m interested in your property!',
        type: String,
        required: false
    })
    @IsString()
    @IsOptional()
    message?: string;
}

export class UpdateMatchStatusDto {
    @ApiProperty({
        description: 'New status for the match request',
        example: 'ACCEPTED',
        enum: ['ACCEPTED', 'REJECTED'],
        type: String
    })
    @IsString()
    @IsNotEmpty()
    status: 'ACCEPTED' | 'REJECTED';
}