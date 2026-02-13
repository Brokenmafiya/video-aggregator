import { NextRequest, NextResponse } from 'next/server';
import { likeVideo, dislikeVideo, getVideoBySlug } from '@/lib/videos';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
    const rateLimit = checkRateLimit(request, 'vote');
    if (rateLimit) return rateLimit;

    try {
        const { slug, action } = await request.json();

        if (!slug || !['like', 'dislike'].includes(action)) {
            return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
        }

        const video = getVideoBySlug(slug);
        if (!video) {
            return NextResponse.json({ error: 'Video not found' }, { status: 404 });
        }

        if (action === 'like') {
            likeVideo(slug);
        } else {
            dislikeVideo(slug);
        }

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
