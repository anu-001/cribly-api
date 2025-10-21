import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { ChatController } from './chat.controller';
import { ChatUploadController } from './controllers/chat-upload.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationModule } from '../notifications/notification.module';
import { CloudinaryService } from '../common/services/cloudinary.service';

@Module({
  imports: [
    PrismaModule,
    NotificationModule,
    MulterModule.register({
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
      },
    }),
  ],
  controllers: [ChatController, ChatUploadController],
  providers: [ChatService, ChatGateway, CloudinaryService],
  exports: [ChatService, ChatGateway],
})
export class ChatModule {}
