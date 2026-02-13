import { NextRequest, NextResponse } from 'next/server';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ segments: string[] }> }
) {
    const { segments } = await params;
    const width = parseInt(segments[0]) || 400;
    const height = parseInt(segments[1]) || 225;

    // Create SVG placeholder
    const svg = `
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
            <rect width="${width}" height="${height}" fill="hsl(240, 10%, 12%)"/>
            <text 
                x="50%" 
                y="50%" 
                font-family="Arial, sans-serif" 
                font-size="20" 
                fill="rgba(255,255,255,0.3)" 
                text-anchor="middle" 
                dominant-baseline="middle"
            >
                No Thumbnail
            </text>
        </svg>
    `;

    return new NextResponse(svg, {
        headers: {
            'Content-Type': 'image/svg+xml',
            'Cache-Control': 'public, max-age=31536000, immutable',
        },
    });
}
