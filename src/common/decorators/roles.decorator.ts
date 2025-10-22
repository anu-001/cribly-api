import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@prisma/client';

export const ROLES_KEY = 'roles';

/**
 * Decorator to restrict access to specific user roles
 * @param roles - Array of allowed UserRole values
 * @example
 * @Roles(UserRole.ADMIN, UserRole.AGENT)
 * @Get('admin-only')
 * getAdminData() { ... }
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
