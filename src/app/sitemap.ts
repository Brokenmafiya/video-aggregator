import { MetadataRoute } from 'next';
import { getVideos, getAllTags } from '@/lib/videos';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://xxxmms.vercel.app';

    // Get all videos
    const videos = await getVideos();
    const tags = await getAllTags();

    const videoUrls = videos.map((video) => ({
        url: `${baseUrl}/watch/${video.slug}`,
        lastModified: new Date(video.created_at || Date.now()),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
    }));

    const tagUrls = tags.map((t) => ({
        url: `${baseUrl}/tag/${encodeURIComponent(t.tag)}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
    }));

    return [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1,
        },
        {
            url: `${baseUrl}/search`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.8,
        },
        ...videoUrls,
        ...tagUrls,
    ];
}
