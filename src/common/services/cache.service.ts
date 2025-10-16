import { Injectable, Logger } from '@nestjs/common';

interface CacheEntry {
    data: any;
    timestamp: number;
    ttl: number;
}

@Injectable()
export class CacheService {
    private readonly logger = new Logger(CacheService.name);
    private cache = new Map<string, CacheEntry>();
    private readonly maxSize = 1000; // Maximum cache entries

    /**
     * Get cached data
     */
    get(key: string): any | null {
        const entry = this.cache.get(key);

        if (!entry) {
            return null;
        }

        // Check if entry has expired
        if (Date.now() - entry.timestamp > entry.ttl * 1000) {
            this.cache.delete(key);
            return null;
        }

        return entry.data;
    }

    /**
     * Set cache data
     */
    set(key: string, data: any, ttl: number = 300): void {
        // Prevent memory leaks by limiting cache size
        if (this.cache.size >= this.maxSize) {
            this.evictOldest();
        }

        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl
        });
    }

    /**
     * Delete cached entry
     */
    delete(key: string): void {
        this.cache.delete(key);
    }

    /**
     * Clear all cache
     */
    clear(): void {
        this.cache.clear();
        this.logger.log('Cache cleared');
    }

    /**
     * Get cache stats
     */
    getStats(): { size: number; maxSize: number; hitRate?: number } {
        return {
            size: this.cache.size,
            maxSize: this.maxSize
        };
    }

    /**
     * Evict oldest entries when cache is full
     */
    private evictOldest(): void {
        let oldestKey: string | null = null;
        let oldestTime = Date.now();

        for (const [key, entry] of this.cache.entries()) {
            if (entry.timestamp < oldestTime) {
                oldestTime = entry.timestamp;
                oldestKey = key;
            }
        }

        if (oldestKey) {
            this.cache.delete(oldestKey);
        }
    }

    /**
     * Clean expired entries
     */
    cleanExpired(): void {
        const now = Date.now();
        const keysToDelete: string[] = [];

        for (const [key, entry] of this.cache.entries()) {
            if (now - entry.timestamp > entry.ttl * 1000) {
                keysToDelete.push(key);
            }
        }

        keysToDelete.forEach(key => this.cache.delete(key));

        if (keysToDelete.length > 0) {
            this.logger.debug(`Cleaned ${keysToDelete.length} expired cache entries`);
        }
    }
}