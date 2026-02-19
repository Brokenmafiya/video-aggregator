"use client";

import Link from 'next/link';

interface SortTabsProps {
    baseUrl: string;
    currentSort: string;
}

const SORTS = [
    { label: 'Latest', value: 'newest' },
    { label: 'Popular', value: 'popular' },
    { label: 'Longest', value: 'longest' },
];

export default function SortTabs({ baseUrl, currentSort }: SortTabsProps) {
    return (
        <div className="flex items-center gap-1 bg-white/[0.03] rounded-lg p-0.5 w-fit">
            {SORTS.map(s => (
                <Link
                    key={s.value}
                    href={`${baseUrl}?sort=${s.value}`}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${currentSort === s.value
                        ? 'bg-[hsl(265,89%,66%)] text-white shadow-sm'
                        : 'text-white/40 hover:text-white/70'
                        }`}
                >
                    {s.label}
                </Link>
            ))}
        </div>
    );
}
