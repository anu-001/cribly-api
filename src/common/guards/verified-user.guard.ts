import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { VerificationStatus } from '@prisma/client';

@Injectable()
export class VerifiedUserGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    if (user.verificationStatus !== VerificationStatus.VERIFIED) {
      throw new ForbiddenException(
        'Identity verification required. Please complete the verification process to access this feature.',
      );
    }

    return true;
  }
}
