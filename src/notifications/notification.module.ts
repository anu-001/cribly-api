import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NotificationService } from './notification.service';
import { EmailTemplateService } from './services/email-template.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [ConfigModule, PrismaModule],
  providers: [NotificationService, EmailTemplateService],
  exports: [NotificationService, EmailTemplateService],
})
export class NotificationModule {}
