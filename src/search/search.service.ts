import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { Prisma } from '@prisma/client';
import { SearchQueryDto, SortBy } from './dto/search.dto';

@Injectable()
export class SearchService {
    private readonly logger = new Logger(SearchService.name);

    constructor(private prisma: PrismaService) { }

    /**
     * Build a Prisma where clause for listings based on query parameters
     */
    private buildListingFilters(query: SearchQueryDto): Prisma.ListingWhereInput {
        const where: Prisma.ListingWhereInput = { isActive: true };

        if (query.locations) {
            const list = query.locations.split(',').map((s) => s.trim());
            where.OR = list.map((loc) => ({
                OR: [
                    { city: { equals: loc, mode: 'insensitive' } },
                    { province: { equals: loc, mode: 'insensitive' } },
                ],
            }));
        }

        if (query.minPrice || query.maxPrice) {
            where.price = {} as Prisma.FloatFilter;
            if (query.minPrice) (where.price as Prisma.FloatFilter).gte = query.minPrice;
            if (query.maxPrice) (where.price as Prisma.FloatFilter).lte = query.maxPrice;
        }

        return where;
    }

    /**
     * Radius filter using PostGIS/ST_DistanceSphere. Expects 'listings' table to have latitude/longitude columns.
     */
    private async applyRadiusFilter(
        listingIds: string[],
        latitude: number,
        longitude: number,
        radiusKm: number,
    ) {
        if (!latitude || !longitude || !radiusKm) return listingIds;

        const radiusMeters = radiusKm * 1000;

        const rawQuery = `
            SELECT id FROM listings
            WHERE id = ANY($1::text[])
            AND ST_DistanceSphere(ST_MakePoint(longitude, latitude), ST_MakePoint($2, $3)) <= $4
        `;

        try {
            const result: Array<{ id: string }> = await this.prisma.$queryRawUnsafe(
                rawQuery,
                listingIds,
                longitude,
                latitude,
                radiusMeters,
            );

            return result.map((r) => r.id);
        } catch (error) {
            this.logger.warn('Radius filter failed, returning original set', error);
            return listingIds;
        }
    }

    /**
     * Listing search: full-text (Postgres) + filters + radius + pagination
     */
    async searchListings(query: SearchQueryDto) {
        const page = query.page || 1;
        const limit = query.limit || 20;
        const offset = (page - 1) * limit;

        const where = this.buildListingFilters(query);

        if (query.q) {
            const sanitized = query.q.replace(/'/g, "''");
            const ftQuery = `to_tsquery('english', '${sanitized}:*')`;
            const raw = `
                SELECT id, ts_rank(search_vector, ${ftQuery}) AS rank
                FROM listings
                WHERE search_vector @@ ${ftQuery}
                ORDER BY rank DESC
                LIMIT ${limit}
                OFFSET ${offset}
            `;

            const rows: Array<{ id: string }> = await this.prisma.$queryRawUnsafe(raw);
            const ids = rows.map((r) => r.id);

            const filteredIds = query.latitude && query.longitude && query.radiusKm
                ? await this.applyRadiusFilter(ids, query.latitude, query.longitude, query.radiusKm)
                : ids;

            const listings = await this.prisma.listing.findMany({
                where: { id: { in: filteredIds }, ...where },
                include: {
                    listingImages: true,
                    user: { select: { id: true, firstName: true, avatar: true } },
                },
            });

            return {
                results: listings,
                pagination: {
                    page,
                    limit,
                    total: filteredIds.length,
                    totalPages: Math.ceil(filteredIds.length / limit),
                },
            };
        }

        const listings = await this.prisma.listing.findMany({
            where,
            include: {
                listingImages: true,
                user: { select: { id: true, firstName: true, avatar: true } },
            },
            skip: offset,
            take: limit,
            orderBy: query.sortBy === SortBy.NEWEST ? { createdAt: 'desc' } : undefined,
        });

        return {
            results: listings,
            pagination: {
                page,
                limit,
                total: listings.length,
                totalPages: Math.ceil(listings.length / limit),
            },
        };
    }

    /**
     * Roommate search: similar structure but searches roommate profiles
     */
    async searchRoommates(query: SearchQueryDto) {
        const page = query.page || 1;
        const limit = query.limit || 20;
        const offset = (page - 1) * limit;

        const where: Prisma.RoommateProfileWhereInput = {};

        if (query.q) {
            const sanitized = query.q.replace(/'/g, "''");
            const ftQuery = `to_tsquery('english', '${sanitized}:*')`;
            const raw = `
                SELECT id, ts_rank(search_vector, ${ftQuery}) AS rank
                FROM roommate_profiles
                WHERE search_vector @@ ${ftQuery}
                ORDER BY rank DESC
                LIMIT ${limit}
                OFFSET ${offset}
            `;

            const rows: Array<{ id: string }> = await this.prisma.$queryRawUnsafe(raw);
            const ids = rows.map((r) => r.id);

            const profiles = await this.prisma.roommateProfile.findMany({ where: { id: { in: ids } } });

            return {
                results: profiles,
                pagination: {
                    page,
                    limit,
                    total: ids.length,
                    totalPages: Math.ceil(ids.length / limit),
                },
            };
        }

        const profiles = await this.prisma.roommateProfile.findMany({
            where,
            skip: offset,
            take: limit,
        });

        return {
            results: profiles,
            pagination: {
                page,
                limit,
                total: profiles.length,
                totalPages: Math.ceil(profiles.length / limit),
            },
        };
    }
}
