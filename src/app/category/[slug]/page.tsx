import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import VideoCard from '@/components/VideoCard';
import Pagination from '@/components/Pagination';
import { getVideosByCategory } from '@/lib/videos';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface PageProps {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ page?: string }>;
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
    const { slug } = await params;
    const sp = await searchParams;
    const page = parseInt(sp.page || '1');
    const perPage = 24;

    const { videos, total, categoryName } = getVideosByCategory(slug, page, perPage);
    if (!categoryName) notFound();

    const totalPages = Math.ceil(total / perPage);

    return (
        <main className="min-h-screen bg-[hsl(240,10%,4%)]">
            <Navbar />

            <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-8">
                <div className="mb-6">
                    <h1 className="text-2xl sm:text-3xl font-bold text-white">{categoryName}</h1>
                    <p className="text-sm text-white/30 mt-1">{total} videos</p>
                </div>

                {videos.length === 0 ? (
                    <div className="text-center py-16 text-white/30">No videos in this category</div>
                ) : (
                    <>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                            {videos.map(v => <VideoCard key={v.slug} video={v} />)}
                        </div>
                        <Pagination currentPage={page} totalPages={totalPages} baseUrl={`/category/${slug}`} />
                    </>
                )}
            </div>

            <Footer />
        </main>
    );
}
