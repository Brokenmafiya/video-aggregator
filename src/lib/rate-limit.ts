import { NextRequest, NextResponse } from 'next/server';

interface RateLimit {
    count: number;
    resetTime: number;
}

const ipMap = new Map<string, RateLimit>();

// Configuration based on route type
export const RATE_LIMITS = {
    vote: { limit: 10, window: 60 * 1000 },   // 10 votes per minute per IP
    ingest: { limit: 60, window: 60 * 1000 }, // 60 ingests per minute per IP (authenticated but valid to limit)
    search: { limit: 30, window: 60 * 1000 }, // 30 searches per minute per IP
};

export function checkRateLimit(request: NextRequest, type: keyof typeof RATE_LIMITS): NextResponse | null {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const config = RATE_LIMITS[type];
    const now = Date.now();

    const record = ipMap.get(`${type}:${ip}`);

    if (record) {
        if (now > record.resetTime) {
            // Reset expired
            ipMap.set(`${type}:${ip}`, { count: 1, resetTime: now + config.window });
        } else {
            // Check limit
            if (record.count >= config.limit) {
                return NextResponse.json(
                    { error: 'Too many requests' },
                    { status: 429, headers: { 'Retry-After': Math.ceil((record.resetTime - now) / 1000).toString() } }
                );
            }
            record.count++;
        }
    } else {
        // New record
        ipMap.set(`${type}:${ip}`, { count: 1, resetTime: now + config.window });
    }

    // Cleanup old keys occasionally (simple garbage collection)
    if (Math.random() < 0.05) { // 5% chance
        for (const [key, value] of ipMap.entries()) {
            if (now > value.resetTime) ipMap.delete(key);
        }
    }

    return null;
}
