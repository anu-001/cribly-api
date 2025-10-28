import { Module } from '@nestjs/common';
import { VerificationController } from './verification.controller';
import { VerificationService } from './verification.service';
import { QRVerificationController } from './qr-verification.controller';
import { QRVerificationService } from './qr-verification.service';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisModule } from '../redis/redis.module';
import { EmailModule } from '../email/email.module';
import { InternalVerificationService } from './internal-verification.service';

@Module({
  imports: [PrismaModule, RedisModule, EmailModule],
  controllers: [VerificationController, QRVerificationController],
  providers: [VerificationService, QRVerificationService, InternalVerificationService],
  exports: [VerificationService, QRVerificationService, InternalVerificationService],
})
export class VerificationModule {}
