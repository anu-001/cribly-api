import { Module } from '@nestjs/common';
import { ListingService } from './listing.service';
import { ListingController } from './listing.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { GeolocationService } from '../common/services/geolocation.service';

@Module({
    imports: [PrismaModule],
    controllers: [ListingController],
    providers: [ListingService, GeolocationService],
    exports: [ListingService],
})
export class ListingModule { }