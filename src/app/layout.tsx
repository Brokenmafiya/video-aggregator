import './globals.css';
import type { Metadata } from 'next';
import { SpeedInsights } from '@vercel/speed-insights/next';

const SITE_NAME = 'xxxmms';
const SITE_URL = 'https://xxxmms.vercel.app';
const SITE_DESC = 'Watch free desi MMS videos, Indian sex scandals, bhabhi porn, aunty videos & leaked amateur clips. 2000+ videos streamed from external sources. Updated daily.';

export const metadata: Metadata = {
    metadataBase: new URL(SITE_URL),
    title: {
        default: `${SITE_NAME} - Free Desi MMS Videos, Indian Sex Scandals & Hot Porn 2026`,
        template: `%s | ${SITE_NAME}`,
    },
    description: SITE_DESC,
    keywords: [
        'desi mms', 'indian sex videos', 'desi porn', 'bhabhi sex',
        'aunty sex videos', 'indian amateur porn', 'desi sex scandals',
        'leaked mms', 'indian xxx', 'desi sexy videos', 'hindi sex',
        'indian couple sex', 'desi blowjob', 'bhabhi mms', 'indian homemade porn',
        'desi threesome', 'college girl sex', 'tamil sex videos', 'bengali sex',
        'marathi sex', 'mallu sex', 'punjabi sex', 'gujarati sex', 'odia sex',
        'xxxmms', 'free indian porn', 'desi gf mms', 'indian sex tube',
        'desi boobs', 'indian pussy', 'desi fucking videos',
    ],
    openGraph: {
        type: 'website',
        siteName: SITE_NAME,
        title: `${SITE_NAME} - Free Desi MMS Videos & Indian Porn`,
        description: SITE_DESC,
        url: SITE_URL,
        locale: 'en_US',
    },
    twitter: {
        card: 'summary_large_image',
        title: `${SITE_NAME} - Free Desi MMS Videos & Indian Porn`,
        description: SITE_DESC,
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
    alternates: {
        canonical: SITE_URL,
    },
    verification: {
        // Add your Google Search Console verification code here
        // google: 'your-verification-code',
    },
    other: {
        'rating': 'adult',
        'RATING': 'RTA-5042-1996-1400-1577-RTA',
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
            </head>
            <body className="bg-bg-primary text-text-primary font-outfit antialiased">
                {children}
                <SpeedInsights />
            </body>
        </html>
    );
}
