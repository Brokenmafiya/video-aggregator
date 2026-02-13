import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import VideoCard from '@/components/VideoCard';
import Pagination from '@/components/Pagination';
import SortTabs from '@/components/SortTabs';
import AdBanner from '@/components/AdBanner';
import { getVideosPaginated, getCategories } from '@/lib/videos';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

interface PageProps {
    searchParams: Promise<{ page?: string; sort?: string }>;
}

export default async function Home({ searchParams }: PageProps) {
    const params = await searchParams;
    const page = parseInt(params.page || '1');
    const sort = params.sort || 'newest';
    const perPage = 24;

    const { videos, total } = await getVideosPaginated(page, perPage, sort);
    const totalPages = Math.ceil(total / perPage);

    let categories: { name: string; slug: string; count: number }[] = [];
    try { categories = await getCategories(); } catch { }

    // Split videos for in-feed ad insertion
    const firstRow = videos.slice(0, 12);
    const secondRow = videos.slice(12);

    return (
        <main className="min-h-screen bg-[hsl(240,10%,4%)]">
            <Navbar />

            {/* Top Ad Banner */}
            <div className="max-w-7xl mx-auto px-3 sm:px-6 pt-4 hidden sm:block">
                <AdBanner slot="header" />
            </div>

            {/* Hero */}
            <header className="relative py-6 sm:py-10 md:py-14 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-900/30 to-pink-900/20 opacity-40" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[hsl(240,10%,4%)]" />
                <div className="max-w-7xl mx-auto px-3 sm:px-6 relative z-10">
                    <span className="inline-block py-1 px-3 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold tracking-wider text-white/50 mb-3">
                        🔥 TRENDING
                    </span>
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2 leading-tight text-white">
                        Desi Sexy Videos
                    </h1>
                    <p className="text-sm text-white/35">
                        {total.toLocaleString()} videos • Streamed from external sources
                    </p>

                    {categories.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-5">
                            {categories.map(cat => (
                                <Link
                                    key={cat.slug}
                                    href={`/category/${cat.slug}`}
                                    className="px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/5 rounded-full text-[10px] sm:text-xs text-white/40 hover:text-white/80 transition-all"
                                >
                                    {cat.name} <span className="text-white/20">({cat.count})</span>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </header>

            {/* Content */}
            <section className="max-w-7xl mx-auto px-3 sm:px-6 pb-12">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
                    <div className="flex items-center gap-3">
                        <h2 className="text-sm sm:text-base font-bold text-white">Latest Videos</h2>
                        <span className="text-[10px] text-white/20 bg-white/5 px-2 py-0.5 rounded-full">{total}</span>
                    </div>
                    <SortTabs baseUrl="/" currentSort={sort} />
                </div>

                {videos.length === 0 ? (
                    <div className="text-center py-16 bg-[hsl(240,10%,12%)] rounded-xl border border-white/5">
                        <p className="text-white/40">No videos yet.</p>
                        <code className="block mt-3 text-xs text-white/20">node scripts/scrape.js listing https://desisexyvideos.com/ 3</code>
                    </div>
                ) : (
                    <>
                        {/* First batch of videos */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                            {firstRow.map(video => (
                                <VideoCard key={video.slug} video={video} />
                            ))}
                        </div>

                        {/* In-feed Ad (between video rows) */}
                        {secondRow.length > 0 && (
                            <div className="my-5">
                                <AdBanner slot="in-feed" />
                            </div>
                        )}

                        {/* Second batch of videos */}
                        {secondRow.length > 0 && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                                {secondRow.map(video => (
                                    <VideoCard key={video.slug} video={video} />
                                ))}
                            </div>
                        )}

                        <Pagination currentPage={page} totalPages={totalPages} baseUrl="/" extraParams={`sort=${sort}`} />
                    </>
                )}
            </section>

            {/* Footer Ad */}
            <div className="max-w-7xl mx-auto px-3 sm:px-6 pb-6 hidden sm:block">
                <AdBanner slot="footer" />
            </div>

            {/* Mobile Sticky Ad */}
            <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40">
                <AdBanner slot="mobile-sticky" />
            </div>

            <Footer />
        </main>
    );
}
