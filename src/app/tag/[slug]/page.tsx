import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import VideoCard from '@/components/VideoCard';
import Pagination from '@/components/Pagination';
import { getVideosByTag } from '@/lib/videos';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

interface PageProps {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const tag = decodeURIComponent(slug);
    const title = `${tag} Videos - Free ${tag} Porn & MMS`;
    const description = `Watch free ${tag.toLowerCase()} videos and MMS. Best collection of ${tag.toLowerCase()} porn clips updated daily at xxxmms.`;
    return {
        title,
        description,
        keywords: [tag.toLowerCase(), `${tag.toLowerCase()} sex`, `${tag.toLowerCase()} videos`, 'desi mms', 'indian porn', 'xxxmms'],
        alternates: { canonical: `https://xxxmms.vercel.app/tag/${encodeURIComponent(tag)}` },
    };
}

export default async function TagPage({ params, searchParams }: PageProps) {
    const { slug } = await params;
    const sp = await searchParams;
    const page = parseInt(sp.page || '1');
    const perPage = 24;
    const tag = decodeURIComponent(slug);

    const { videos, total } = await getVideosByTag(tag, page, perPage);
    const totalPages = Math.ceil(total / perPage);

    return (
        <main className="min-h-screen bg-[hsl(240,10%,4%)]">
            <Navbar />

            <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-8">
                <div className="mb-6">
                    <div className="flex items-center gap-2">
                        <span className="text-white/30 text-sm">Tag:</span>
                        <h1 className="text-2xl sm:text-3xl font-bold text-white">{tag}</h1>
                    </div>
                    <p className="text-sm text-white/30 mt-1">{total} videos</p>
                </div>

                {videos.length === 0 ? (
                    <div className="text-center py-16 text-white/30">No videos with this tag</div>
                ) : (
                    <>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                            {videos.map(v => <VideoCard key={v.slug} video={v} />)}
                        </div>
                        <Pagination currentPage={page} totalPages={totalPages} baseUrl={`/tag/${encodeURIComponent(tag)}`} />
                    </>
                )}
            </div>

            <Footer />
        </main>
    );
}
