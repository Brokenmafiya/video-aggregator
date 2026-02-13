import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import VideoCard from '@/components/VideoCard';
import Pagination from '@/components/Pagination';
import { searchVideos } from '@/lib/videos';

export const dynamic = 'force-dynamic';

interface PageProps {
    searchParams: Promise<{ q?: string; page?: string }>;
}

export default async function SearchPage({ searchParams }: PageProps) {
    const sp = await searchParams;
    const query = sp.q || '';
    const page = parseInt(sp.page || '1');
    const perPage = 24;

    const { videos, total } = query ? searchVideos(query, page, perPage) : { videos: [], total: 0 };
    const totalPages = Math.ceil(total / perPage);

    return (
        <main className="min-h-screen bg-[hsl(240,10%,4%)]">
            <Navbar />

            <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-8">
                <div className="mb-6">
                    {query ? (
                        <>
                            <div className="flex items-center gap-2">
                                <span className="text-white/30 text-sm">Results for:</span>
                                <h1 className="text-xl sm:text-2xl font-bold text-white">"{query}"</h1>
                            </div>
                            <p className="text-sm text-white/30 mt-1">{total} videos found</p>
                        </>
                    ) : (
                        <h1 className="text-xl sm:text-2xl font-bold text-white">Search</h1>
                    )}
                </div>

                {videos.length === 0 ? (
                    <div className="text-center py-16 text-white/30">
                        {query ? `No results for "${query}"` : 'Enter a search term to find videos'}
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                            {videos.map(v => <VideoCard key={v.slug} video={v} />)}
                        </div>
                        <Pagination currentPage={page} totalPages={totalPages} baseUrl="/search" extraParams={`q=${encodeURIComponent(query)}`} />
                    </>
                )}
            </div>

            <Footer />
        </main>
    );
}
