"use client";

import { useState } from 'react';

interface VideoActionsProps {
    slug: string;
    likes: number;
    dislikes: number;
}

export default function VideoActions({ slug, likes: initialLikes, dislikes: initialDislikes }: VideoActionsProps) {
    const [likes, setLikes] = useState(initialLikes);
    const [dislikes, setDislikes] = useState(initialDislikes);
    const [voted, setVoted] = useState<'like' | 'dislike' | null>(null);
    const [copied, setCopied] = useState(false);

    const handleVote = async (action: 'like' | 'dislike') => {
        if (voted) return;
        setVoted(action);
        if (action === 'like') setLikes(l => l + 1);
        else setDislikes(d => d + 1);

        try {
            await fetch('/api/vote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ slug, action }),
            });
        } catch { }
    };

    const handleShare = async () => {
        const url = window.location.href;
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback
            const input = document.createElement('input');
            input.value = url;
            document.body.appendChild(input);
            input.select();
            document.execCommand('copy');
            document.body.removeChild(input);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const total = likes + dislikes;
    const likePercent = total > 0 ? (likes / total) * 100 : 50;

    return (
        <div className="flex items-center gap-2">
            {/* Like / Dislike */}
            <div className="flex items-center bg-white/5 rounded-lg overflow-hidden">
                <button
                    onClick={() => handleVote('like')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs transition-all ${voted === 'like' ? 'text-green-400 bg-green-500/10' : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                        }`}
                >
                    <svg className="w-3.5 h-3.5" fill={voted === 'like' ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.25c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 0 1 2.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 0 0 .322-1.672V3a.75.75 0 0 1 .75-.75 2.25 2.25 0 0 1 2.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282m0 0h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 0 1-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 0 0-1.423-.23H5.904m10.598-9.75H14.25M5.904 18.5c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 0 1-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 9.953 4.167 9.5 5 9.5h1.053c.472 0 .745.556.5.96a8.958 8.958 0 0 0-1.302 4.665c0 1.194.232 2.333.654 3.375Z" />
                    </svg>
                    <span className="font-medium">{likes}</span>
                </button>

                {/* Progress bar divider */}
                <div className="w-px h-6 bg-white/10 relative">
                    <div
                        className="absolute bottom-0 left-0 w-full bg-green-400/50"
                        style={{ height: `${likePercent}%` }}
                    />
                </div>

                <button
                    onClick={() => handleVote('dislike')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs transition-all ${voted === 'dislike' ? 'text-red-400 bg-red-500/10' : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                        }`}
                >
                    <svg className="w-3.5 h-3.5 rotate-180" fill={voted === 'dislike' ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.25c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 0 1 2.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 0 0 .322-1.672V3a.75.75 0 0 1 .75-.75 2.25 2.25 0 0 1 2.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282m0 0h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 0 1-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 0 0-1.423-.23H5.904m10.598-9.75H14.25M5.904 18.5c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 0 1-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 9.953 4.167 9.5 5 9.5h1.053c.472 0 .745.556.5.96a8.958 8.958 0 0 0-1.302 4.665c0 1.194.232 2.333.654 3.375Z" />
                    </svg>
                    <span className="font-medium">{dislikes}</span>
                </button>
            </div>

            {/* Share */}
            <button
                onClick={handleShare}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-white/50 hover:text-white/80 transition-all"
            >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
                </svg>
                <span className="font-medium">{copied ? 'Copied!' : 'Share'}</span>
            </button>
        </div>
    );
}
