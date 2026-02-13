import Link from 'next/link';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    baseUrl: string;
    extraParams?: string;
}

export default function Pagination({ currentPage, totalPages, baseUrl, extraParams = '' }: PaginationProps) {
    if (totalPages <= 1) return null;

    const pages: (number | '...')[] = [];
    const delta = 2;

    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
            pages.push(i);
        } else if (pages[pages.length - 1] !== '...') {
            pages.push('...');
        }
    }

    const buildUrl = (page: number) => {
        const params = new URLSearchParams(extraParams);
        params.set('page', String(page));
        return `${baseUrl}?${params.toString()}`;
    };

    return (
        <nav className="flex items-center justify-center gap-1 mt-8 flex-wrap" aria-label="Pagination">
            {/* Prev */}
            {currentPage > 1 ? (
                <Link href={buildUrl(currentPage - 1)} className="px-3 py-1.5 text-xs text-white/50 hover:text-white bg-white/5 hover:bg-white/10 rounded transition-all">
                    ← Prev
                </Link>
            ) : (
                <span className="px-3 py-1.5 text-xs text-white/15 bg-white/[0.02] rounded cursor-not-allowed">← Prev</span>
            )}

            {/* Page Numbers */}
            {pages.map((p, i) =>
                p === '...' ? (
                    <span key={`dots-${i}`} className="px-2 py-1.5 text-xs text-white/20">...</span>
                ) : (
                    <Link
                        key={p}
                        href={buildUrl(p)}
                        className={`px-3 py-1.5 text-xs rounded transition-all ${p === currentPage
                                ? 'bg-[hsl(265,89%,66%)] text-white font-bold'
                                : 'text-white/50 hover:text-white bg-white/5 hover:bg-white/10'
                            }`}
                    >
                        {p}
                    </Link>
                )
            )}

            {/* Next */}
            {currentPage < totalPages ? (
                <Link href={buildUrl(currentPage + 1)} className="px-3 py-1.5 text-xs text-white/50 hover:text-white bg-white/5 hover:bg-white/10 rounded transition-all">
                    Next →
                </Link>
            ) : (
                <span className="px-3 py-1.5 text-xs text-white/15 bg-white/[0.02] rounded cursor-not-allowed">Next →</span>
            )}
        </nav>
    );
}
