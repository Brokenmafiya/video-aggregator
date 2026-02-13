"use client";

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

const CATEGORIES = [
    { name: 'Indian', slug: 'indian' },
    { name: 'Bhabhi', slug: 'bhabhi' },
    { name: 'Aunty', slug: 'aunty' },
    { name: 'College', slug: 'college' },
    { name: 'Couple', slug: 'couple' },
    { name: 'Blowjob', slug: 'blowjob' },
    { name: 'Hardcore', slug: 'hardcore' },
    { name: 'Homemade', slug: 'homemade' },
    { name: 'Threesome', slug: 'threesome' },
    { name: 'Big Boobs', slug: 'big-boobs' },
];

export default function Navbar() {
    const router = useRouter();
    const [menuOpen, setMenuOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [query, setQuery] = useState('');
    const searchRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (searchOpen && searchRef.current) searchRef.current.focus();
    }, [searchOpen]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            router.push(`/search?q=${encodeURIComponent(query.trim())}`);
            setSearchOpen(false);
            setQuery('');
        }
    };

    return (
        <>
            {/* Main Nav */}
            <nav className="sticky top-0 z-50 bg-[hsl(240,10%,6%)]/95 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-7xl mx-auto px-3 sm:px-6">
                    {/* Top Row: Logo + Search + Menu */}
                    <div className="h-14 flex items-center justify-between gap-3">
                        {/* Hamburger (mobile) */}
                        <button
                            onClick={() => setMenuOpen(!menuOpen)}
                            className="lg:hidden flex flex-col gap-1 p-2 -ml-2"
                            aria-label="Menu"
                        >
                            <span className={`block w-5 h-0.5 bg-white/80 transition-transform ${menuOpen ? 'rotate-45 translate-y-1.5' : ''}`} />
                            <span className={`block w-5 h-0.5 bg-white/80 transition-opacity ${menuOpen ? 'opacity-0' : ''}`} />
                            <span className={`block w-5 h-0.5 bg-white/80 transition-transform ${menuOpen ? '-rotate-45 -translate-y-1.5' : ''}`} />
                        </button>

                        {/* Logo */}
                        <Link href="/" className="text-xl sm:text-2xl font-bold tracking-tight text-white hover:text-[hsl(265,89%,66%)] transition-colors shrink-0">
                            🔥 Lumina
                        </Link>

                        {/* Desktop Search */}
                        <form onSubmit={handleSearch} className="hidden sm:flex flex-1 max-w-md mx-4">
                            <div className="relative w-full">
                                <input
                                    type="text"
                                    value={query}
                                    onChange={e => setQuery(e.target.value)}
                                    placeholder="Search videos..."
                                    className="w-full h-9 bg-white/5 border border-white/10 rounded-lg pl-3 pr-10 text-sm text-white placeholder-white/30 focus:border-[hsl(265,89%,66%)] focus:ring-1 focus:ring-[hsl(265,89%,66%)] outline-none transition-all"
                                />
                                <button type="submit" className="absolute right-0 top-0 h-full px-3 text-white/40 hover:text-white transition-colors">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" />
                                    </svg>
                                </button>
                            </div>
                        </form>

                        {/* Right actions */}
                        <div className="flex items-center gap-2">
                            {/* Mobile search toggle */}
                            <button onClick={() => setSearchOpen(!searchOpen)} className="sm:hidden p-2 text-white/60 hover:text-white">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" />
                                </svg>
                            </button>
                            <Link href="/add" className="bg-[hsl(265,89%,66%)] hover:bg-[hsl(265,89%,56%)] text-white text-xs font-bold py-1.5 px-3 rounded-md transition-all">
                                + Add
                            </Link>
                        </div>
                    </div>

                    {/* Mobile Search (expandable) */}
                    {searchOpen && (
                        <form onSubmit={handleSearch} className="sm:hidden pb-3">
                            <input
                                ref={searchRef}
                                type="text"
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                placeholder="Search videos..."
                                className="w-full h-9 bg-white/5 border border-white/10 rounded-lg px-3 text-sm text-white placeholder-white/30 focus:border-[hsl(265,89%,66%)] outline-none"
                            />
                        </form>
                    )}

                    {/* Category Bar - Desktop */}
                    <div className="hidden lg:flex items-center gap-1 pb-2 overflow-x-auto scrollbar-none -mx-1">
                        {CATEGORIES.map(cat => (
                            <Link
                                key={cat.slug}
                                href={`/category/${cat.slug}`}
                                className="shrink-0 px-3 py-1 text-xs font-medium text-white/50 hover:text-white hover:bg-white/5 rounded-md transition-all"
                            >
                                {cat.name}
                            </Link>
                        ))}
                    </div>
                </div>
            </nav>

            {/* Mobile Drawer */}
            {menuOpen && (
                <div className="lg:hidden fixed inset-0 z-40" onClick={() => setMenuOpen(false)}>
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                    <div
                        className="absolute top-0 left-0 w-64 h-full bg-[hsl(240,10%,8%)] border-r border-white/5 p-4 pt-16 overflow-y-auto"
                        onClick={e => e.stopPropagation()}
                    >
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-3">Categories</h3>
                        <div className="space-y-1">
                            {CATEGORIES.map(cat => (
                                <Link
                                    key={cat.slug}
                                    href={`/category/${cat.slug}`}
                                    onClick={() => setMenuOpen(false)}
                                    className="block px-3 py-2 text-sm text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                                >
                                    {cat.name}
                                </Link>
                            ))}
                        </div>
                        <hr className="border-white/5 my-4" />
                        <Link href="/add" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm text-white/60 hover:text-white">
                            + Add Video
                        </Link>
                    </div>
                </div>
            )}
        </>
    );
}
