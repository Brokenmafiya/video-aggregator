import Link from 'next/link';

interface VideoCardProps {
    video: {
        title: string;
        slug: string;
        thumbnail_url: string;
        duration: string;
        views: number;
        tags?: string;
    };
    compact?: boolean;
}

export default function VideoCard({ video, compact = false }: VideoCardProps) {
    // Fallback for empty thumbnails
    const thumbnailUrl = video.thumbnail_url || '/api/placeholder/400/225';

    if (compact) {
        return (
            <Link href={`/watch/${video.slug}`} className="group flex gap-3 hover:bg-white/5 rounded-lg p-1 transition-colors">
                <div className="relative w-32 sm:w-40 min-w-[8rem] sm:min-w-[10rem] aspect-video rounded-lg overflow-hidden bg-[hsl(240,10%,12%)] flex-shrink-0">
                    <img
                        src={thumbnailUrl}
                        alt={video.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                    />
                    <span className="absolute bottom-1 right-1 bg-black/80 text-[10px] text-white px-1.5 py-0.5 rounded font-mono">
                        {video.duration}
                    </span>
                </div>
                <div className="flex-1 min-w-0 py-0.5">
                    <h4 className="text-xs sm:text-sm font-medium text-white/90 line-clamp-2 group-hover:text-[hsl(265,89%,66%)] transition-colors leading-snug">
                        {video.title}
                    </h4>
                    <span className="text-[10px] text-white/30 mt-1 block">
                        {video.views.toLocaleString()} views
                    </span>
                </div>
            </Link>
        );
    }

    return (
        <Link href={`/watch/${video.slug}`} className="group block">
            {/* Thumbnail with hover zoom */}
            <div className="relative aspect-video rounded-lg overflow-hidden bg-[hsl(240,10%,12%)] mb-2">
                <img
                    src={thumbnailUrl}
                    alt={video.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                />

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

                {/* Play button on hover */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[hsl(265,89%,66%)]/80 backdrop-blur-sm flex items-center justify-center shadow-lg shadow-[hsl(265,89%,66%)]/30">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                        </svg>
                    </div>
                </div>

                {/* Duration badge */}
                <span className="absolute bottom-1.5 right-1.5 bg-black/80 text-[10px] sm:text-xs text-white px-1.5 py-0.5 rounded font-mono">
                    {video.duration}
                </span>

                {/* HD badge (optional visual flair) */}
                <span className="absolute top-1.5 left-1.5 bg-[hsl(265,89%,66%)]/80 text-[8px] text-white px-1 py-0.5 rounded font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    HD
                </span>
            </div>

            {/* Title */}
            <h3 className="text-xs sm:text-sm font-medium text-white/85 line-clamp-2 group-hover:text-[hsl(265,89%,66%)] transition-colors leading-snug">
                {video.title}
            </h3>

            {/* Meta */}
            <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] sm:text-xs text-white/30">{video.views.toLocaleString()} views</span>
            </div>
        </Link>
    );
}
