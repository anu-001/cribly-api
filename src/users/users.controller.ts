import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    ParseIntPipe,
    DefaultValuePipe,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiParam,
    ApiQuery,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserDto, ChangePasswordDto, UserResponseDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class UsersController {
    constructor(private usersService: UsersService) { }

    @Get('me')
    @ApiOperation({
        summary: 'Get current user profile',
        description: 'Retrieve the authenticated user\'s profile information',
    })
    @ApiResponse({
        status: 200,
        description: 'Current user profile retrieved successfully',
        type: UserResponseDto,
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized - Invalid or missing token',
    })
    @ApiResponse({
        status: 404,
        description: 'User not found',
    })
    async getMe(@CurrentUser('id') userId: string) {
        return this.usersService.findById(userId);
    }

    @Get(':id')
    @ApiOperation({
        summary: 'Get user by ID',
        description: 'Retrieve a specific user\'s public profile information',
    })
    @ApiParam({
        name: 'id',
        description: 'User unique identifier',
        example: 'clx1234567890',
    })
    @ApiResponse({
        status: 200,
        description: 'User profile retrieved successfully',
        type: UserResponseDto,
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized - Invalid or missing token',
    })
    @ApiResponse({
        status: 404,
        description: 'User not found',
    })
    async getUserById(@Param('id') userId: string) {
        return this.usersService.findById(userId);
    }

    @Get()
    @Roles('ADMIN')
    @ApiOperation({
        summary: 'Get all users (Admin only)',
        description: 'Retrieve paginated list of all users. Requires ADMIN role.',
    })
    @ApiQuery({
        name: 'page',
        required: false,
        description: 'Page number (default: 1)',
        example: 1,
    })
    @ApiQuery({
        name: 'limit',
        required: false,
        description: 'Items per page (default: 20)',
        example: 20,
    })
    @ApiResponse({
        status: 200,
        description: 'Users retrieved successfully',
        schema: {
            properties: {
                data: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/UserResponseDto' },
                },
                meta: {
                    type: 'object',
                    properties: {
                        total: { type: 'number', example: 100 },
                        page: { type: 'number', example: 1 },
                        limit: { type: 'number', example: 20 },
                        totalPages: { type: 'number', example: 5 },
                    },
                },
            },
        },
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized - Invalid or missing token',
    })
    @ApiResponse({
        status: 403,
        description: 'Forbidden - Requires ADMIN role',
    })
    async getAllUsers(
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    ) {
        return this.usersService.findAll(page, limit);
    }

    @Get('search')
    @Roles('ADMIN')
    @ApiOperation({
        summary: 'Search users (Admin only)',
        description: 'Search users by name or email. Requires ADMIN role.',
    })
    @ApiQuery({
        name: 'q',
        required: true,
        description: 'Search query (name or email)',
        example: 'john',
    })
    @ApiQuery({
        name: 'page',
        required: false,
        description: 'Page number (default: 1)',
        example: 1,
    })
    @ApiQuery({
        name: 'limit',
        required: false,
        description: 'Items per page (default: 20)',
        example: 20,
    })
    @ApiResponse({
        status: 200,
        description: 'Search results retrieved successfully',
        schema: {
            properties: {
                data: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/UserResponseDto' },
                },
                meta: {
                    type: 'object',
                    properties: {
                        total: { type: 'number', example: 10 },
                        page: { type: 'number', example: 1 },
                        limit: { type: 'number', example: 20 },
                        totalPages: { type: 'number', example: 1 },
                        query: { type: 'string', example: 'john' },
                    },
                },
            },
        },
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized - Invalid or missing token',
    })
    @ApiResponse({
        status: 403,
        description: 'Forbidden - Requires ADMIN role',
    })
    async searchUsers(
        @Query('q') query: string,
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    ) {
        return this.usersService.searchUsers(query, page, limit);
    }

    @Put('me')
    @ApiOperation({
        summary: 'Update current user profile',
        description: 'Update the authenticated user\'s profile information. Sends email notification.',
    })
    @ApiResponse({
        status: 200,
        description: 'Profile updated successfully',
        type: UserResponseDto,
    })
    @ApiResponse({
        status: 400,
        description: 'Bad Request - Invalid input data',
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized - Invalid or missing token',
    })
    @ApiResponse({
        status: 409,
        description: 'Conflict - Email already in use',
    })
    async updateProfile(
        @CurrentUser('id') userId: string,
        @Body() updateUserDto: UpdateUserDto,
    ) {
        return this.usersService.updateProfile(userId, updateUserDto);
    }

    @Post('me/change-password')
    @ApiOperation({
        summary: 'Change password',
        description: 'Change the authenticated user\'s password. Invalidates all sessions and sends email notification.',
    })
    @ApiResponse({
        status: 200,
        description: 'Password changed successfully',
        schema: {
            properties: {
                message: {
                    type: 'string',
                    example: 'Password changed successfully. Please sign in again.',
                },
            },
        },
    })
    @ApiResponse({
        status: 400,
        description: 'Bad Request - Current password is incorrect',
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized - Invalid or missing token',
    })
    async changePassword(
        @CurrentUser('id') userId: string,
        @Body() changePasswordDto: ChangePasswordDto,
    ) {
        return this.usersService.changePassword(userId, changePasswordDto);
    }

    @Delete('me')
    @ApiOperation({
        summary: 'Delete current user account',
        description: 'Soft delete the authenticated user\'s account. Sends confirmation email.',
    })
    @ApiResponse({
        status: 200,
        description: 'Account deleted successfully',
        schema: {
            properties: {
                message: { type: 'string', example: 'Account deleted successfully' },
            },
        },
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized - Invalid or missing token',
    })
    @ApiResponse({
        status: 404,
        description: 'User not found',
    })
    async deleteOwnAccount(@CurrentUser('id') userId: string) {
        return this.usersService.deleteAccount(userId, userId, 'USER');
    }

    @Delete(':id')
    @Roles('ADMIN')
    @ApiOperation({
        summary: 'Delete user account (Admin only)',
        description: 'Soft delete any user account. Requires ADMIN role. Sends confirmation email.',
    })
    @ApiParam({
        name: 'id',
        description: 'User unique identifier',
        example: 'clx1234567890',
    })
    @ApiResponse({
        status: 200,
        description: 'Account deleted successfully',
        schema: {
            properties: {
                message: { type: 'string', example: 'Account deleted successfully' },
            },
        },
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized - Invalid or missing token',
    })
    @ApiResponse({
        status: 403,
        description: 'Forbidden - Requires ADMIN role',
    })
    @ApiResponse({
        status: 404,
        description: 'User not found',
    })
    async deleteUserAccount(
        @Param('id') userId: string,
        @CurrentUser('id') requesterId: string,
        @CurrentUser('role') requesterRole: string,
    ) {
        return this.usersService.deleteAccount(userId, requesterId, requesterRole);
    }

    @Put(':id/role')
    @Roles('ADMIN')
    @ApiOperation({
        summary: 'Update user role (Admin only)',
        description: 'Update a user\'s role. Requires ADMIN role. Sends email notification.',
    })
    @ApiParam({
        name: 'id',
        description: 'User unique identifier',
        example: 'clx1234567890',
    })
    @ApiResponse({
        status: 200,
        description: 'User role updated successfully',
        schema: {
            properties: {
                id: { type: 'string', example: 'clx1234567890' },
                email: { type: 'string', example: 'john.doe@example.com' },
                firstName: { type: 'string', example: 'John' },
                lastName: { type: 'string', example: 'Doe' },
                role: { type: 'string', example: 'AGENT', enum: ['USER', 'AGENT', 'ADMIN'] },
            },
        },
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized - Invalid or missing token',
    })
    @ApiResponse({
        status: 403,
        description: 'Forbidden - Requires ADMIN role',
    })
    @ApiResponse({
        status: 404,
        description: 'User not found',
    })
    async updateUserRole(
        @Param('id') userId: string,
        @Body('role') role: 'USER' | 'AGENT' | 'ADMIN',
    ) {
        return this.usersService.updateRole(userId, role);
    }
}
