import { createVideo } from '@/lib/videos';
import { NextResponse, NextRequest } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
    const rateLimit = checkRateLimit(request, 'ingest');
    if (rateLimit) return rateLimit;

    try {
        const body = await request.json();
        const apiKey = request.headers.get('x-api-key');

        // Authentication Check
        const serverKey = process.env.SCRAPER_KEY || 'super-secret-scraper-token-123';
        if (apiKey !== serverKey) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Basic Validation
        if (!body.title || !body.embed_url) {
            return NextResponse.json({ error: 'Title and Embed URL are required' }, { status: 400 });
        }

        // URL Whitelist Validation
        const allowedDomains = [
            'pkpornhub.com',
            'indianxxxbf.com',
            'masahub.com',
            'desisexyvideos.com',
            'xxxvideo.link',
            'stream.pkpornhub.com',
            'desixx.net',
            'indianporn.xxx',
            'desiporn.tube',
            'fsicomics.com',
            'becdn.net',
            'fry99.guru',
            'luluvid.com',
            'fsiblog.run',
            'aagmaaldload.com'
        ];

        let isAllowed = false;
        try {
            const url = new URL(body.embed_url);
            isAllowed = allowedDomains.some(domain => url.hostname.endsWith(domain));
        } catch {
            // If it's not a full URL, check if it's a relative path or has a dot (simple check)
            isAllowed = body.embed_url.includes('.mp4') || body.embed_url.includes('.webm');
        }

        if (!isAllowed) {
            return NextResponse.json({ error: 'Embed URL domain not allowed' }, { status: 403 });
        }

        // Generate slug if not provided
        const slug = body.slug || body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

        const video = {
            title: body.title,
            slug,
            thumbnail_url: body.thumbnail_url || '/api/placeholder/640x360',
            embed_url: body.embed_url,
            duration: body.duration || '00:00',
            tags: body.tags || '',
            description: body.description || '',
            views: 0
        };

        await createVideo(video);

        return NextResponse.json({ success: true, video }, { status: 201 });
    } catch (error) {
        console.error('Error adding video:', error);
        return NextResponse.json({ error: 'Failed to add video' }, { status: 500 });
    }
}
