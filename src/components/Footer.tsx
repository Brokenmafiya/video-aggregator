import Link from 'next/link';
import { getAllTags, getCategories } from '@/lib/videos';

const STATIC_CATEGORIES = [
    { name: 'Indian', slug: 'indian' },
    { name: 'Bhabhi', slug: 'bhabhi' },
    { name: 'Aunty', slug: 'aunty' },
    { name: 'College', slug: 'college' },
    { name: 'Couple', slug: 'couple' },
    { name: 'Blowjob', slug: 'blowjob' },
    { name: 'Hardcore', slug: 'hardcore' },
    { name: 'Homemade', slug: 'homemade' },
];

export default function Footer() {
    let tags: { tag: string; count: number }[] = [];
    try {
        tags = getAllTags().slice(0, 20);
    } catch { }

    return (
        <footer className="bg-[hsl(240,10%,4%)] border-t border-white/5 mt-16">
            <div className="max-w-7xl mx-auto px-3 sm:px-6 py-8 sm:py-12">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8">
                    {/* About */}
                    <div className="col-span-2 sm:col-span-1">
                        <h3 className="text-lg font-bold text-white mb-3">🔥 Lumina</h3>
                        <p className="text-xs text-white/30 leading-relaxed">
                            The best desi videos aggregated from across the web. We don't host any content — all videos stream from external sources.
                        </p>
                    </div>

                    {/* Categories */}
                    <div>
                        <h4 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-3">Categories</h4>
                        <div className="space-y-1.5">
                            {STATIC_CATEGORIES.map(cat => (
                                <Link
                                    key={cat.slug}
                                    href={`/category/${cat.slug}`}
                                    className="block text-xs text-white/35 hover:text-white/80 transition-colors"
                                >
                                    {cat.name}
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Popular Tags */}
                    <div className="col-span-2 sm:col-span-1 lg:col-span-2">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-3">Popular Tags</h4>
                        <div className="flex flex-wrap gap-1.5">
                            {tags.length > 0 ? tags.map(t => (
                                <Link
                                    key={t.tag}
                                    href={`/tag/${encodeURIComponent(t.tag)}`}
                                    className="px-2 py-0.5 bg-white/5 hover:bg-white/10 rounded text-[10px] text-white/40 hover:text-white/70 transition-all"
                                >
                                    {t.tag}
                                </Link>
                            )) : (
                                <span className="text-xs text-white/20">No tags yet</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="mt-8 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] text-white/20">
                    <span>© {new Date().getFullYear()} Lumina. All rights reserved. We do not host any content.</span>
                    <div className="flex gap-4">
                        <span>18 U.S.C. 2257</span>
                        <span>DMCA</span>
                        <span>Terms</span>
                        <span>Privacy</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
