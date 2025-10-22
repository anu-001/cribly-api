import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client } from '@aws-sdk/client-s3';
import { createS3Client } from './s3.config';

export const S3_CLIENT = 'S3_CLIENT';

export const S3Provider: Provider = {
  provide: S3_CLIENT,
  useFactory: (configService: ConfigService): S3Client => {
    return createS3Client(configService);
  },
  inject: [ConfigService],
};
