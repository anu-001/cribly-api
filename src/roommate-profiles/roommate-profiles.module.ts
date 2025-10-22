import { Module } from '@nestjs/common';
import { RoommateProfilesController } from './roommate-profiles.controller';
import { RoommateProfilesService } from './roommate-profiles.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [RoommateProfilesController],
  providers: [RoommateProfilesService],
  exports: [RoommateProfilesService],
})
export class RoommateProfilesModule {}
