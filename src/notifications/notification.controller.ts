import {
    Controller,
    Get,
    Post,
    Body,
    UseGuards,
    Param,
    HttpCode,
    HttpStatus,
    Query,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiBody,
    ApiParam,
    ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { NotificationService } from './notification.service';
import {
    CreateNotificationDto,
    RegisterDeviceTokenDto,
    MarkNotificationsReadDto,
} from './dto/notification.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { Prisma } from '@prisma/client';

// Minimal authenticated user shape provided by the auth guard
type AuthUser = { id: string; email?: string; roles?: string[] };

@ApiTags('Notifications')
@Controller('api/v1/notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class NotificationController {
    constructor(private readonly notificationService: NotificationService) { }

    @Get()
    @ApiOperation({
        summary: 'Get User Notifications',
        description: 'Retrieve paginated notifications for the authenticated user.',
    })
    @ApiQuery({ name: 'page', required: false, description: 'Page number' })
    @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
    @ApiResponse({
        status: 200,
        description: 'Notifications retrieved',
        schema: {
            example: {
                notifications: [
                    {
                        id: 'n_01',
                        title: 'New Match Request',
                        body: 'Someone requested to match your listing',
                        type: 'MATCH_REQUEST',
                        createdAt: '2025-10-20T12:00:00Z',
                    },
                ],
                total: 1,
            },
        },
    })
    async getNotifications(
        @CurrentUser() user: AuthUser,
        @Query('page') page?: number,
        @Query('limit') limit?: number,
    ) {
        return this.notificationService.getUserNotifications(user.id, page, limit);
    }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({
        summary: 'Send Notification (Admin)',
        description: 'Send a push/email notification to a user (admin only).',
    })
    @ApiBody({ type: CreateNotificationDto })
    @ApiResponse({
        status: 201,
        description: 'Notification sent',
        schema: {
            example: { success: true, message: 'Notification sent successfully' },
        },
    })
    @ApiResponse({ status: 403, description: 'Admin access required' })
    async sendNotification(@Body() dto: CreateNotificationDto) {
        // Use sendPushNotification for push; service also supports email via templates
        return this.notificationService.sendPushNotification(
            dto.userId,
            dto.title,
            dto.body,
            (dto.data as unknown) as Prisma.InputJsonValue,
        );
    }

    @Post('mark-read')
    @ApiOperation({
        summary: 'Mark Notifications Read',
        description:
            'Mark a list of notifications as read for the authenticated user.',
    })
    @ApiBody({ type: MarkNotificationsReadDto })
    @ApiResponse({
        status: 200,
        description: 'Notifications marked as read',
        schema: { example: { success: true, updated: 2 } },
    })
    async markAsRead(
        @CurrentUser() user: AuthUser,
        @Body() dto: MarkNotificationsReadDto,
    ) {
        const results: unknown[] = [];
        for (const id of dto.notificationIds) {
            const res = await this.notificationService.markNotificationAsRead(
                id,
                user.id,
            );
            results.push(res);
        }

        return { success: true, updated: results.length };
    }

    @Post('device/register')
    @ApiOperation({
        summary: 'Register Device Token',
        description: 'Register a device token for push notifications.',
    })
    @ApiBody({ type: RegisterDeviceTokenDto })
    @ApiResponse({
        status: 201,
        description: 'Device token registered',
        schema: { example: { success: true } },
    })
    async registerDeviceToken(
        @CurrentUser() user: AuthUser,
        @Body() dto: RegisterDeviceTokenDto,
    ) {
        return this.notificationService.registerDeviceToken(
            user.id,
            dto.token,
            dto.platform,
        );
    }

    @Post('device/remove/:token')
    @ApiOperation({
        summary: 'Remove Device Token',
        description: 'Remove a registered device token.',
    })
    @ApiParam({ name: 'token', description: 'Device token to remove' })
    @ApiResponse({
        status: 200,
        description: 'Device token removed',
        schema: { example: { success: true } },
    })
    async removeDeviceToken(@Param('token') token: string) {
        return this.notificationService.removeDeviceToken(token);
    }
}
