import { Controller, Get, Query } from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchQueryDto } from './dto/search.dto';

@Controller('api/v1/search')
export class SearchController {
    constructor(private readonly searchService: SearchService) { }

    @Get('listings')
    async searchListings(@Query() query: SearchQueryDto) {
        return this.searchService.searchListings(query);
    }

    @Get('roommates')
    async searchRoommates(@Query() query: SearchQueryDto) {
        return this.searchService.searchRoommates(query);
    }
}
