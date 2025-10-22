import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';
import { VirusScannerService } from './virus-scanner.service';
import { S3Provider } from './config/s3.provider';

@Module({
  imports: [ConfigModule],
  controllers: [UploadsController],
  providers: [S3Provider, VirusScannerService, UploadsService],
  exports: [UploadsService],
})
export class UploadsModule {}
