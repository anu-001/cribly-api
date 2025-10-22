import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { EmailTemplateService } from './services/email-template.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [ConfigModule, PrismaModule],
  controllers: [NotificationController],
  providers: [NotificationService, EmailTemplateService],
  exports: [NotificationService, EmailTemplateService],
})
export class NotificationModule {}
