import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    const baseUrl = 'https://Mmsbpxxx.xyz';

    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/api/', '/add'],
        },
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}
