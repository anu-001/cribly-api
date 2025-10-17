import { Injectable, Logger } from '@nestjs/common';
import * as geoip from 'geoip-lite';

export interface LocationCoordinates {
    lat: number;
    lng: number;
    source: 'provided' | 'ip' | null;
}

@Injectable()
export class GeolocationService {
    private readonly logger = new Logger(GeolocationService.name);

    /**
     * Get coordinates from IP address using geoip-lite
     */
    getLocationFromIP(ipAddress: string): LocationCoordinates | null {
        try {
            // Skip localhost and private IPs
            if (this.isLocalOrPrivateIP(ipAddress)) {
                this.logger.debug(`Skipping local/private IP: ${ipAddress}`);
                return null;
            }

            const geoData = geoip.lookup(ipAddress);

            if (geoData && geoData.ll && geoData.ll.length === 2) {
                const [lat, lng] = geoData.ll;

                this.logger.debug(`IP ${ipAddress} located at: ${lat}, ${lng} (${geoData.city}, ${geoData.region}, ${geoData.country})`);

                return {
                    lat,
                    lng,
                    source: 'ip'
                };
            }

            this.logger.debug(`No location found for IP: ${ipAddress}`);
            return null;
        } catch (error) {
            this.logger.error(`Error getting location from IP ${ipAddress}:`, error);
            return null;
        }
    }

    /**
     * Extract real IP address from request, considering proxies and load balancers
     */
    extractIPFromRequest(request: any): string | null {
        try {
            // Check various headers for the real IP
            const forwarded = request.headers['x-forwarded-for'];
            const realIP = request.headers['x-real-ip'];
            const clientIP = request.headers['x-client-ip'];
            const cfConnectingIP = request.headers['cf-connecting-ip']; // Cloudflare
            const socketIP = request.connection?.remoteAddress || request.socket?.remoteAddress;

            // Priority order for IP extraction
            let ip = null;

            if (cfConnectingIP) {
                ip = cfConnectingIP;
            } else if (realIP) {
                ip = realIP;
            } else if (forwarded) {
                // x-forwarded-for can contain multiple IPs, get the first one
                ip = forwarded.split(',')[0].trim();
            } else if (clientIP) {
                ip = clientIP;
            } else if (socketIP) {
                ip = socketIP;
            }

            // Clean up IPv6 mapped IPv4 addresses
            if (ip && ip.startsWith('::ffff:')) {
                ip = ip.substring(7);
            }

            this.logger.debug(`Extracted IP: ${ip} from request`);
            return ip;
        } catch (error) {
            this.logger.error('Error extracting IP from request:', error);
            return null;
        }
    }

    /**
     * Calculate distance between two points using Haversine formula
     */
    calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
        const R = 6371; // Earth's radius in kilometers
        const dLat = this.toRadians(lat2 - lat1);
        const dLng = this.toRadians(lng2 - lng1);

        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c; // Distance in kilometers
    }

    /**
     * Validate coordinates
     */
    validateCoordinates(lat: number, lng: number): boolean {
        return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
    }

    /**
     * Check if IP is local or private
     */
    private isLocalOrPrivateIP(ip: string): boolean {
        if (!ip) return true;

        // Localhost
        if (ip === '127.0.0.1' || ip === '::1' || ip === 'localhost') {
            return true;
        }

        // Private IP ranges
        const privateRanges = [
            /^10\./,                    // 10.0.0.0/8
            /^192\.168\./,              // 192.168.0.0/16
            /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // 172.16.0.0/12
            /^169\.254\./,              // 169.254.0.0/16 (link-local)
            /^fc00:/,                   // IPv6 unique local
            /^fe80:/                    // IPv6 link-local
        ];

        return privateRanges.some(range => range.test(ip));
    }

    /**
     * Convert degrees to radians
     */
    private toRadians(degrees: number): number {
        return degrees * (Math.PI / 180);
    }
}