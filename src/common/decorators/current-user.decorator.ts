import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorator to extract current user from request
 * @param data - Optional property name to extract from user object
 * @example
 * @Get('profile')
 * getProfile(@CurrentUser() user: User) { ... }
 * 
 * @Get('user-id')
 * getUserId(@CurrentUser('id') userId: string) { ... }
 */
export const CurrentUser = createParamDecorator(
    (data: string | undefined, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        const user = request.user;

        return data ? user?.[data] : user;
    },
);
