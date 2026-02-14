import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    const baseUrl = 'https://lumina-tube.vercel.app'; // Change this to your domain

    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/api/', '/add'],
        },
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}
