import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import VideoCard from '@/components/VideoCard';
import VideoActions from '@/components/VideoActions';
import AdBanner from '@/components/AdBanner';
import { getVideoBySlug, incrementViews, getRelatedVideos } from '@/lib/videos';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';

interface PageProps {
    params: Promise<{ slug: string }>;
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const video = await getVideoBySlug(slug);
    if (!video) return { title: 'Video Not Found' };

    const tags = (video.tags || '').split(',').map(t => t.trim()).filter(Boolean);
    const title = `${video.title} - Watch Free Desi MMS`;
    const description = video.description || `Watch ${video.title} for free. ${video.duration || ''} duration. HD quality desi MMS video. Stream online now at xxxmms.`;

    return {
        title,
        description,
        keywords: [
            ...tags,
            'desi mms', 'indian sex video', 'watch online', 'free porn',
            'desi porn', 'indian amateur', slug.replace(/-/g, ' '),
        ],
        openGraph: {
            type: 'video.other',
            title,
            description,
            url: `https://xxxmms.vercel.app/watch/${slug}`,
            images: video.thumbnail_url ? [{ url: video.thumbnail_url, width: 640, height: 480, alt: video.title }] : [],
            videos: video.embed_url ? [{ url: video.embed_url }] : [],
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: video.thumbnail_url ? [video.thumbnail_url] : [],
        },
        alternates: {
            canonical: `https://xxxmms.vercel.app/watch/${slug}`,
        },
    };
}

export default async function VideoPage({ params }: PageProps) {
    const { slug } = await params;
    const video = await getVideoBySlug(slug);

    if (!video) notFound();

    await incrementViews(slug);

    const isDirectVideo = video.embed_url.endsWith('.mp4') ||
        video.embed_url.endsWith('.webm') ||
        video.embed_url.includes('/stream/');

    // Parse tags
    const tags = (video.tags || '').split(',').map(t => t.trim()).filter(Boolean);

    // Related videos (Optimized SQL query)
    const related = await getRelatedVideos(slug, tags, 10);

    // JSON-LD Structured Data
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'VideoObject',
        name: video.title,
        description: video.description || `Watch ${video.title} for free at xxxmms`,
        thumbnailUrl: video.thumbnail_url || '',
        uploadDate: video.created_at || new Date().toISOString(),
        duration: video.duration ? `PT${video.duration.replace(':', 'M').replace(':', 'S')}` : undefined,
        contentUrl: video.embed_url,
        embedUrl: video.embed_url,
        interactionStatistic: {
            '@type': 'InteractionCounter',
            interactionType: 'https://schema.org/WatchAction',
            userInteractionCount: video.views,
        },
        publisher: {
            '@type': 'Organization',
            name: 'xxxmms',
            url: 'https://xxxmms.vercel.app',
        },
    };

    return (
        <main className="min-h-screen bg-[hsl(240,10%,4%)]">
            <Navbar />

            {/* JSON-LD Structured Data */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-6">
                <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
                    {/* Main Content */}
                    <div className="flex-1 min-w-0">
                        {/* Player */}
                        <div className="relative w-full aspect-video bg-black rounded-lg sm:rounded-xl overflow-hidden shadow-2xl shadow-black/50">
                            {isDirectVideo ? (
                                <video
                                    src={video.embed_url}
                                    className="absolute inset-0 w-full h-full"
                                    controls
                                    autoPlay={false}
                                    poster={video.thumbnail_url}
                                    playsInline
                                    preload="metadata"
                                    controlsList="nodownload"
                                />
                            ) : (
                                <div className={`absolute inset-0 w-full h-full overflow-hidden ${video.embed_url.includes('xxxvideo.link') ? 'bg-black' : ''}`}>
                                    <iframe
                                        src={video.embed_url}
                                        className={`absolute w-full h-full ${video.embed_url.includes('xxxvideo.link')
                                            ? 'scale-[1.3] origin-top translate-y-[-50px] sm:translate-y-[-60px]'
                                            : ''
                                            }`}
                                        frameBorder="0"
                                        allowFullScreen
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        sandbox="allow-scripts allow-same-origin allow-forms allow-presentation"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Below Player Ad */}
                        <div className="mt-3">
                            <AdBanner slot="player-below" />
                        </div>

                        {/* Video Info */}
                        <div className="mt-3 sm:mt-4 space-y-3">
                            <h1 className="text-base sm:text-xl md:text-2xl font-bold text-white leading-snug">
                                {video.title}
                            </h1>

                            {/* Meta row */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div className="flex items-center gap-3 text-xs sm:text-sm text-white/30">
                                    <span>{video.views.toLocaleString()} views</span>
                                    <span>•</span>
                                    <span>{video.duration}</span>
                                </div>

                                {/* Like/Dislike/Share */}
                                <VideoActions slug={slug} likes={video.likes} dislikes={video.dislikes} />
                            </div>

                            {/* Tags */}
                            {tags.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                    {tags.map(tag => (
                                        <Link
                                            key={tag}
                                            href={`/tag/${encodeURIComponent(tag)}`}
                                            className="px-2.5 py-1 bg-white/5 hover:bg-[hsl(265,89%,66%)]/20 border border-white/5 hover:border-[hsl(265,89%,66%)]/30 rounded text-[10px] sm:text-xs text-white/40 hover:text-[hsl(265,89%,66%)] transition-all"
                                        >
                                            #{tag}
                                        </Link>
                                    ))}
                                </div>
                            )}

                            {/* Description */}
                            {video.description && (
                                <div className="mt-3 p-3 bg-white/[0.03] rounded-lg border border-white/5">
                                    <p className="text-xs text-white/35 leading-relaxed">{video.description}</p>
                                </div>
                            )}
                        </div>

                        {/* Related on mobile */}
                        <div className="lg:hidden mt-8">
                            <h3 className="text-sm font-bold text-white mb-3">Related Videos</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {related.slice(0, 6).map(v => <VideoCard key={v.slug} video={v} />)}
                            </div>
                        </div>
                    </div>

                    {/* Desktop Sidebar */}
                    <div className="hidden lg:block w-80 xl:w-96 flex-shrink-0">
                        {/* Sidebar Ad */}
                        <div className="mb-4">
                            <AdBanner slot="sidebar" />
                        </div>

                        <h3 className="text-xs font-bold uppercase tracking-widest text-white/30 mb-3">Related Videos</h3>
                        <div className="space-y-3">
                            {related.slice(0, 5).map(v => <VideoCard key={v.slug} video={v} compact />)}

                            {/* Mid-sidebar Ad */}
                            <div className="py-2">
                                <AdBanner slot="sidebar" />
                            </div>

                            {related.slice(5).map(v => <VideoCard key={v.slug} video={v} compact />)}
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Sticky Ad */}
            <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40">
                <AdBanner slot="mobile-sticky" />
            </div>

            <Footer />
        </main>
    );
}
