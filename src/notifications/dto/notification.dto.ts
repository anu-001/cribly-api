import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsObject,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum NotificationType {
  MATCH_REQUEST = 'MATCH_REQUEST', // Someone wants to match with your listing
  MATCH_ACCEPTED = 'MATCH_ACCEPTED', // Your match request was accepted
  MATCH_REJECTED = 'MATCH_REJECTED', // Your match request was rejected
  NEW_MESSAGE = 'NEW_MESSAGE', // New message in conversation
  LISTING_EXPIRED = 'LISTING_EXPIRED', // Your listing is about to expire
  LISTING_FEATURED = 'LISTING_FEATURED', // Your listing was featured
  SYSTEM_UPDATE = 'SYSTEM_UPDATE', // System maintenance or updates
  WELCOME = 'WELCOME', // Welcome message for new users
  REMINDER = 'REMINDER', // Various reminders
}

export class CreateNotificationDto {
  @ApiProperty({
    description: 'Notification title',
    example: 'New Match Request',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Notification body/message',
    example: 'Someone is interested in your property listing!',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  body: string;

  @ApiProperty({
    description: 'Type of notification',
    example: 'MATCH_REQUEST',
    enum: NotificationType,
    type: String,
  })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({
    description: 'ID of the user to notify',
    example: 'cuid-user-id',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: 'Additional notification data (optional)',
    example: { listingId: 'cuid-listing-id', matchId: 'cuid-match-id' },
    type: Object,
    required: false,
  })
  @IsObject()
  @IsOptional()
  data?: Record<string, unknown>;

  @ApiProperty({
    description: 'Optional image URL for rich notifications',
    example: 'https://cloudinary.com/notification-image.jpg',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  imageUrl?: string;
}

export class RegisterDeviceTokenDto {
  @ApiProperty({
    description: 'FCM device token for push notifications',
    example: 'firebase-device-token-string',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({
    description: 'Device platform',
    example: 'IOS',
    enum: ['IOS', 'ANDROID', 'WEB'],
    type: String,
  })
  @IsEnum(['IOS', 'ANDROID', 'WEB'])
  platform: 'IOS' | 'ANDROID' | 'WEB';

  @ApiProperty({
    description: 'App version for compatibility tracking',
    example: '1.0.0',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  appVersion?: string;
}

export class MarkNotificationsReadDto {
  @ApiProperty({
    description: 'Array of notification IDs to mark as read',
    example: ['cuid-notification-1', 'cuid-notification-2'],
    type: [String],
  })
  @IsString({ each: true })
  notificationIds: string[];
}
