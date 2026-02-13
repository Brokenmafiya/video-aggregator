"use client";

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import { useRouter } from 'next/navigation';

export default function AddVideoPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        embed_url: '',
        thumbnail_url: '',
        duration: '',
        key: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/ingest', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': formData.key
                },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                router.push('/');
                router.refresh();
            } else {
                alert('Failed to add video');
            }
        } catch (error) {
            console.error(error);
            alert('An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <main className="min-h-screen bg-bg-primary">
            <Navbar />

            <div className="max-w-lg mx-auto px-4 py-8 sm:py-12">
                <h1 className="text-2xl sm:text-3xl font-bold mb-6">Add Video</h1>

                <form onSubmit={handleSubmit} className="space-y-4 bg-bg-card p-4 sm:p-6 rounded-xl border border-white/5">
                    <div>
                        <label className="block text-xs font-medium mb-1.5 text-text-secondary">Title</label>
                        <input
                            type="text"
                            name="title"
                            required
                            value={formData.title}
                            onChange={handleChange}
                            className="w-full bg-bg-secondary border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all"
                            placeholder="Video title"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium mb-1.5 text-text-secondary">Embed / Stream URL</label>
                        <input
                            type="url"
                            name="embed_url"
                            required
                            value={formData.embed_url}
                            onChange={handleChange}
                            className="w-full bg-bg-secondary border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all"
                            placeholder="https://..."
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium mb-1.5 text-text-secondary">Thumbnail URL</label>
                            <input
                                type="url"
                                name="thumbnail_url"
                                value={formData.thumbnail_url}
                                onChange={handleChange}
                                className="w-full bg-bg-secondary border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all"
                                placeholder="https://..."
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium mb-1.5 text-text-secondary">Duration</label>
                            <input
                                type="text"
                                name="duration"
                                value={formData.duration}
                                onChange={handleChange}
                                className="w-full bg-bg-secondary border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all"
                                placeholder="10:24"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium mb-1.5 text-text-secondary">Contributor Secret (Required)</label>
                        <input
                            type="password"
                            name="key"
                            required
                            value={formData.key}
                            onChange={handleChange}
                            className="w-full bg-bg-secondary border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all"
                            placeholder="Enter secret key..."
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-accent hover:bg-accent/80 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-all text-sm"
                    >
                        {loading ? 'Adding...' : 'Add Video'}
                    </button>
                </form>
            </div>
        </main>
    );
}
