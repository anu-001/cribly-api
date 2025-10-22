import { Module } from '@nestjs/common';
import { ExploreController } from './explore.controller';
import { ExploreService } from './explore.service';
import { ListingsModule } from '../listings/listings.module';
import { RoommateProfilesModule } from '../roommate-profiles/roommate-profiles.module';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [ListingsModule, RoommateProfilesModule, RedisModule],
  controllers: [ExploreController],
  providers: [ExploreService],
  exports: [ExploreService],
})
export class ExploreModule {}
