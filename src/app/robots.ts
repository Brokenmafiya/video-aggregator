import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    const baseUrl = 'https://xxxmms.vercel.app';

    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/api/', '/add'],
        },
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}
