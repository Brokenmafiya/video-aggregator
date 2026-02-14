"use client";

interface AdBannerProps {
    slot: 'header' | 'sidebar' | 'in-feed' | 'footer' | 'player-below' | 'mobile-sticky';
    className?: string;
}

/**
 * Ad Banner Component
 * 
 * Monetization Guide:
 * 1. Sign up for an ad network (e.g., ExoClick, TrafficJunky, JuicyAds).
 * 2. Create an "Ad Zone" for each size (728x90, 300x250, etc.).
 * 3. Copy the <script> or <iframe> code they give you.
 * 4. Paste it inside the matching case below.
 * 
 * Example (ExoClick):
 * if (slot === 'header') {
 *   return <script async type="application/javascript" src="https://a.magsrv.com/ad-provider.js"></script>;
 * }
 */
export default function AdBanner({ slot, className = '' }: AdBannerProps) {
    const config: Record<string, { width: string; height: string; label: string; bg: string }> = {
        'header': {
            width: 'w-full max-w-[728px]',
            height: 'h-[90px]',
            label: '728×90 — Leaderboard',
            bg: 'bg-gradient-to-r from-purple-900/10 to-pink-900/10',
        },
        'sidebar': {
            width: 'w-full',
            height: 'h-[250px]',
            label: '300×250 — Medium Rectangle',
            bg: 'bg-gradient-to-b from-purple-900/10 to-transparent',
        },
        'in-feed': {
            width: 'w-full',
            height: 'h-[100px] sm:h-[90px]',
            label: '728×90 — In-Feed',
            bg: 'bg-gradient-to-r from-blue-900/10 to-purple-900/10',
        },
        'footer': {
            width: 'w-full max-w-[728px]',
            height: 'h-[90px]',
            label: '728×90 — Footer Banner',
            bg: 'bg-gradient-to-r from-pink-900/10 to-purple-900/10',
        },
        'player-below': {
            width: 'w-full',
            height: 'h-[60px] sm:h-[90px]',
            label: '728×90 — Below Player',
            bg: 'bg-gradient-to-r from-orange-900/10 to-red-900/10',
        },
        'mobile-sticky': {
            width: 'w-full',
            height: 'h-[50px]',
            label: '320×50 — Mobile Sticky',
            bg: 'bg-gradient-to-r from-purple-900/20 to-pink-900/20',
        },
    };

    const c = config[slot] || config['header'];

    return (
        <div className={`${c.width} ${c.height} ${c.bg} mx-auto rounded-lg border border-white/5 flex items-center justify-center overflow-hidden ${className}`}>
            {/* Replace this div with actual ad code */}
            <div className="text-center">
                <p className="text-[9px] uppercase tracking-widest text-white/15 font-bold">Advertisement</p>
                <p className="text-[8px] text-white/10 mt-0.5">{c.label}</p>
            </div>
        </div>
    );
}
