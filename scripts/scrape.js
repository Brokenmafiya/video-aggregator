require('dotenv').config();
const cheerio = require('cheerio');
const { createClient } = require('@libsql/client');

const db = createClient({
    url: process.env.TURSO_DATABASE_URL || 'file:videos.db',
    authToken: process.env.TURSO_AUTH_TOKEN,
});

async function initDb() {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS videos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        thumbnail_url TEXT,
        embed_url TEXT NOT NULL,
        duration TEXT,
        views INTEGER DEFAULT 0,
        tags TEXT DEFAULT '',
        description TEXT DEFAULT '',
        likes INTEGER DEFAULT 0,
        dislikes INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
}

// ─── Predefined sites with known structures ───
const SITES = {
    desisexyvideos: {
        name: 'DesiSexyVideos',
        base: 'https://desisexyvideos.com',
        listingUrls: [
            '/',
            '/videos/?tag=desi-mms',
            '/videos/?tag=indian-homemade-sex',
            '/videos/?tag=desi-viral-video',
            '/videos/?tag=bhabhi-sex-video',
            '/videos/?tag=college-girl-sex-video',
            '/videos/?tag=desi-lesbian-sex',
            '/videos/?tag=big-indian-boobs',
            '/videos/?tag=aunty-sex-video',
            '/videos/?tag=indian-blowjob-video',
            '/videos/?tag=hardcore-sex-video'
        ],
        videoLinkPattern: '/video/',
        pagePattern: (url, page) => {
            if (page === 1) return url;
            if (url.includes('?')) return `${url}&page=${page}`;
            return `${url}page/${page}/`;
        },
    },
    masahub: {
        name: 'MasaHub',
        base: 'https://masahub.com',
        listingUrls: ['/', '/category/indian-mms/', '/category/desi-sex/', '/category/leaked-mms/'],
        videoLinkPattern: '/video/',
        pagePattern: (url, page) => page === 1 ? url : `${url}page/${page}/`,
    },
    desixx: {
        name: 'DesiXX',
        base: 'https://desixx.net',
        listingUrls: ['/'],
        videoLinkPattern: '/video/',
        pagePattern: (url, page) => page === 1 ? url : `${url}page/${page}/`,
    },
    indianporn: {
        name: 'IndianPorn',
        base: 'https://www.indianporn.xxx',
        listingUrls: ['/', '/categories/mms/', '/categories/homemade/'],
        videoLinkPattern: '/video/',
        pagePattern: (url, page) => page === 1 ? url : `${url}?page=${page}`,
    },
    desiporn: {
        name: 'DesiPorn',
        base: 'https://desiporn.tube',
        listingUrls: ['/'],
        videoLinkPattern: '/video/',
        pagePattern: (url, page) => page === 1 ? url : `${url}page/${page}/`,
    },
    fsicomics: {
        name: 'FSIComics',
        base: 'https://fsicomics.com',
        listingUrls: ['/'],
        videoLinkPattern: '/video/',
        pagePattern: (url, page) => page === 1 ? url : `${url}page/${page}/`,
    },
    xxxvideolink: {
        name: 'XXXVideo.link',
        base: 'https://xxxvideo.link',
        listingUrls: [
            '/en/categories/indian/',
            '/en/content/desi/',
            '/en/content/bhabhi/',
            '/en/content/aunty/',
            '/en/content/indian wife/',
            '/en/content/hindi/',
        ],
        videoLinkPattern: '/en/vus/',
        pagePattern: (url, page) => page === 1 ? url : `${url}${page}/`,
    },
    indianxxxbf: {
        name: 'IndianXXXBF',
        base: 'https://www.indianxxxbf.com',
        listingUrls: [
            '/',
            '/category/indian-mms/',
            '/category/desi-porn-videos/',
            '/category/bhabhi-porn/',
            '/category/indian-aunty-sex/',
            '/category/bollywood-scandals/',
            '/category/aunty-sex/',
            '/category/bangla-sex/',
            '/category/bhabhi-sex/',
            '/category/bihari-sex-videos/',
            '/category/dehati-xxx/',
            '/category/desi-sex/',
            '/category/family-sex/',
            '/category/group-sex/',
            '/category/gujarati-sex/',
            '/category/hindi-sex/',
            '/category/kannada-sex-videos/',
            '/category/malayalam-sex/',
            '/category/marathi-sex/',
            '/category/odia-sex-video/',
            '/category/pakistani-sex/',
            '/category/punjabi-sex-video/',
            '/category/tamil-sex-videos/',
            '/category/telugu-porn/',
        ],
        videoLinkPattern: 'indianxxxbf.com/',
        // Pagination is /page/N/
        pagePattern: (url, page) => page === 1 ? url : `${url}page/${page}/`,
        selector: '.videos-list article h2 a, .videos-list article > a'
    },
    pkpornhub: {
        name: 'PKpornhub',
        base: 'https://pkpornhub.com',
        listingUrls: ['/', '/posts/type/video/all/new'],
        videoLinkPattern: '/post/',
        pagePattern: (url, page) => page === 1 ? url : `${url}?page=${page}`,
    },
};

async function fetchPage(url) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
        const res = await fetch(url, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml',
                'Accept-Language': 'en-US,en;q=0.9',
            }
        });
        clearTimeout(timeout);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
    } catch (err) {
        clearTimeout(timeout);
        throw err;
    }
}

function parseDuration(input) {
    if (!input) return '0:00';

    // ISO duration format (PT1748S, PT29M10S, etc.)
    const isoMatch = input.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (isoMatch) {
        let h = parseInt(isoMatch[1] || '0');
        let m = parseInt(isoMatch[2] || '0');
        let s = parseInt(isoMatch[3] || '0');
        if (h === 0 && m === 0 && s > 59) {
            h = Math.floor(s / 3600);
            m = Math.floor((s % 3600) / 60);
            s = s % 60;
        }
        if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        return `${m}:${String(s).padStart(2, '0')}`;
    }

    // HH:MM:SS or MM:SS format
    const timeMatch = input.match(/(\d+):(\d+)(?::(\d+))?/);
    if (timeMatch) {
        if (timeMatch[3]) return `${parseInt(timeMatch[1])}:${timeMatch[2]}:${timeMatch[3]}`;
        return `${parseInt(timeMatch[1])}:${timeMatch[2]}`;
    }

    // Just plain seconds
    const secMatch = input.match(/^(\d+)$/);
    if (secMatch) {
        const totalSec = parseInt(secMatch[1]);
        const m = Math.floor(totalSec / 60);
        const s = totalSec % 60;
        return `${m}:${String(s).padStart(2, '0')}`;
    }

    return '0:00';
}

function makeSlug(text) {
    return text.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .substring(0, 80)
        .replace(/^-|-$/g, '');
}

function extractSlug(url) {
    const parts = url.replace(/\/$/, '').split('/');
    let slug = parts[parts.length - 1];
    // Remove query params and .html
    slug = slug.split('?')[0].replace('.html', '');
    return slug || makeSlug(url);
}

// ─── Generic video page scraper ───
async function scrapeVideoPage(videoUrl, siteBase) {
    try {
        const html = await fetchPage(videoUrl);
        const $ = cheerio.load(html);

        // Extract JSON-LD
        let jsonLd = null;
        $('script[type="application/ld+json"]').each((_, el) => {
            try {
                const data = JSON.parse($(el).html());
                if (data['@type'] === 'VideoObject') jsonLd = data;
            } catch { }
        });

        // Title
        const title = jsonLd?.name ||
            $('meta[property="og:title"]').attr('content') ||
            $('h1').first().text().trim() ||
            $('title').text().trim();

        if (!title || title.length < 3) return null;

        // Thumbnail
        const thumbnail = jsonLd?.thumbnailUrl ||
            $('meta[property="og:image"]').attr('content') ||
            $('video').attr('poster') ||
            $('img.video-thumbnail, img.player-thumb').attr('src') ||
            '';

        // Description
        const description = (jsonLd?.description ||
            $('meta[property="og:description"]').attr('content') ||
            $('meta[name="description"]').attr('content') ||
            '').substring(0, 500);

        // Duration
        const duration = parseDuration(
            jsonLd?.duration ||
            $('meta[property="video:duration"]').attr('content') ||
            $('.duration, .video-duration, [class*=duration]').first().text().trim()
        );

        // Slug
        const slug = extractSlug(videoUrl);

        // ─── Find embed/stream URL ───
        let embedUrl = '';

        // Method 1: Stream proxy pattern
        const streamMatch = html.match(/\/stream\/(\d+)\//);
        if (streamMatch) {
            embedUrl = `${siteBase}/stream/${streamMatch[1]}/`;
        }

        // Method 2: video source tags
        if (!embedUrl) {
            const videoSrc = $('video source[type="video/mp4"]').attr('src') ||
                $('video source').first().attr('src') ||
                $('video').attr('src');
            if (videoSrc) {
                embedUrl = videoSrc.startsWith('http') ? videoSrc : `${siteBase}${videoSrc}`;
            }
        }

        // Method 3: JSON-LD contentUrl
        if (!embedUrl && jsonLd?.contentUrl) {
            embedUrl = jsonLd.contentUrl;
        }

        // Method 4: Direct MP4 links in scripts/page
        if (!embedUrl) {
            const mp4Match = html.match(/(?:src|source|file|url)\s*[:=]\s*['"]?(https?:\/\/[^\s"'<>]+\.mp4[^"'<>\s]*)/i);
            if (mp4Match) embedUrl = mp4Match[1];
        }

        // Method 4.5: Inertia.js data-page extraction (PKpornhub pattern)
        let inertiaData = null;
        if (!embedUrl) {
            const inertiaMatch = html.match(/data-page="([^"]+)"/);
            if (inertiaMatch) {
                try {
                    const dataStr = inertiaMatch[1].replace(/&quot;/g, '"');
                    const data = JSON.parse(dataStr);
                    // On listing pages it might be in props.videos.data or props.posts.data (handled in Listing scraper)
                    // On single pages it might be props.post, props.video, or props.posts.data[0]
                    inertiaData = data.props.post || data.props.video || (data.props.posts?.data ? data.props.posts.data[0] : null);
                    if (inertiaData && inertiaData.media_url) {
                        embedUrl = inertiaData.media_url;
                    }
                } catch (e) { }
            }
        }

        // ─── Extract metadata from Inertia if available ───
        let finalTitle = title;
        let finalDescription = description;
        const extractedTags = new Set();

        if (inertiaData) {
            finalTitle = inertiaData.title || title;
            finalDescription = (inertiaData.description || description).substring(0, 500);
            if (inertiaData.tags && Array.isArray(inertiaData.tags)) {
                inertiaData.tags.forEach(t => {
                    const tag = t.name?.toLowerCase();
                    if (tag && tag.length < 30) extractedTags.add(tag);
                });
            }
        }

        // Method 5: General MP4 pattern
        if (!embedUrl) {
            const mp4General = html.match(/https?:\/\/[^\s"'<>]+\.mp4/i);
            if (mp4General) embedUrl = mp4General[0];
        }

        // Method 6: iframe embed
        if (!embedUrl) {
            const iframe = $('iframe[src*="embed"], iframe[src*="player"]').attr('src');
            if (iframe) embedUrl = iframe.startsWith('http') ? iframe : `${siteBase}${iframe}`;
        }

        // Method 7: canonical link as embed (for sites like xxxvideo.link where video is JS-loaded)
        if (!embedUrl) {
            const canonical = $('link[rel="canonical"]').attr('href');
            if (canonical && canonical.includes('/vu/')) {
                embedUrl = canonical;
            }
        }

        // Method 8: Use the video page URL itself as embed (last resort for JS-rendered players)
        if (!embedUrl) {
            // Convert /vus/ to /vu/ if applicable (xxxvideo.link pattern)
            if (videoUrl.includes('/vus/')) {
                embedUrl = videoUrl.replace('/vus/', '/vu/').split('?')[0];
            }
        }

        // Method 9: IndianXXXBF specific Base64 extraction
        if (!embedUrl || embedUrl.includes('player-x.php?q=')) {
            const playerUrl = embedUrl || $('iframe[src*="player-x.php?q="]').attr('src');
            if (playerUrl && playerUrl.includes('q=')) {
                try {
                    const b64 = playerUrl.split('q=')[1].split('&')[0];
                    const decoded = Buffer.from(decodeURIComponent(b64), 'base64').toString('utf-8');
                    const mp4Match = decoded.match(/src=["'](https?:\/\/[^"']+\.mp4)/i);
                    if (mp4Match) embedUrl = mp4Match[1];
                } catch (e) {
                    console.warn(`  ⚠ Failed to decode player-x URL: ${playerUrl}`);
                }
            }
        }

        if (!embedUrl) {
            console.warn(`  ⚠ No video source: ${videoUrl}`);
            return null;
        }

        // ─── Extract tags from HTML if not already high-quality from Inertia ───
        if (extractedTags.size < 3) {
            $('a[href*="/tag/"], a[href*="/category/"], a[href*="/tags/"]').each((_, el) => {
                const text = $(el).text().trim();
                if (text && text.length > 1 && text.length < 30) {
                    extractedTags.add(text.toLowerCase());
                }
            });

            // Meta keywords
            const keywords = $('meta[name="keywords"]').attr('content');
            if (keywords) {
                keywords.split(',').forEach(k => {
                    const tag = k.trim().toLowerCase();
                    if (tag && tag.length < 30) extractedTags.add(tag);
                });
            }

            // JSON-LD keywords
            if (jsonLd?.keywords) {
                const kw = Array.isArray(jsonLd.keywords) ? jsonLd.keywords : jsonLd.keywords.split(',');
                kw.forEach(k => {
                    const tag = k.trim().toLowerCase();
                    if (tag && tag.length < 30) extractedTags.add(tag);
                });
            }
        }

        const tags = Array.from(extractedTags).slice(0, 15).join(', ');

        return { title: finalTitle, slug, thumbnail_url: thumbnail, embed_url: embedUrl, duration, tags, description: finalDescription };
    } catch (err) {
        console.error(`  ✗ Error: ${videoUrl}: ${err.message}`);
        return null;
    }
}

// ─── Generic listing page scraper ───
async function scrapeListingPage(pageUrl, siteBase, videoPattern, selector) {
    console.log(`\n📄 Listing: ${pageUrl}`);
    try {
        const html = await fetchPage(pageUrl);
        const $ = cheerio.load(html);
        const videoUrls = new Set();

        const findLinks = (container) => {
            container.each((_, el) => {
                let href = $(el).attr('href');
                if (href && href.includes(videoPattern)) {
                    const fullUrl = href.startsWith('http') ? href : `${siteBase}${href}`;
                    videoUrls.add(fullUrl);
                }
            });
        };

        if (selector) {
            findLinks($(selector));
        } else {
            // Fallback to pattern matching all links
            findLinks($(`a[href*="${videoPattern}"]`));
        }

        // Special check for Inertia.js data-page listings (PKpornhub)
        if (videoUrls.size === 0) {
            const inertiaMatch = html.match(/data-page="([^"]+)"/);
            if (inertiaMatch) {
                try {
                    const dataStr = inertiaMatch[1].replace(/&quot;/g, '"');
                    const data = JSON.parse(dataStr);
                    const list = data.props.videos?.data || data.props.posts?.data || [];
                    list.forEach(item => {
                        if (item.url && item.url.includes(videoPattern)) {
                            videoUrls.add(item.url);
                        } else if (item.slug && item.type === 'video') {
                            videoUrls.add(`${siteBase}/post/${item.slug}`);
                        }
                    });
                } catch (e) { }
            }
        }

        console.log(`  Found ${videoUrls.size} video links`);
        return Array.from(videoUrls);
    } catch (err) {
        console.error(`  ✗ Listing error: ${err.message}`);
        return [];
    }
}

// ─── Send to our API ───
async function sendToApi(videoData) {
    try {
        const apiKey = process.env.SCRAPER_KEY || 'super-secret-scraper-token-123';
        const response = await fetch('http://localhost:3000/api/ingest', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey
            },
            body: JSON.stringify(videoData)
        });

        if (response.ok) {
            return true;
        } else {
            const err = await response.json();
            console.error(`    ✗ API Error: ${response.status} - ${err.error}`);
            return false;
        }
    } catch (e) {
        console.error(`    ✗ Fetch Error: ${e.message}`);
        return false;
    }
}

// ─── Scrape a whole site ───
async function scrapeSite(siteKey, maxPages = 2) {
    const site = SITES[siteKey];
    if (!site) {
        console.error(`Unknown site: ${siteKey}. Available: ${Object.keys(SITES).join(', ')}`);
        return;
    }

    console.log(`\n${'═'.repeat(50)}`);
    console.log(`🌐 ${site.name} (${site.base})`);
    console.log(`${'═'.repeat(50)}`);

    let added = 0, skipped = 0, failed = 0;

    for (const listingPath of site.listingUrls) {
        for (let page = 1; page <= maxPages; page++) {
            const fullListingUrl = site.pagePattern(`${site.base}${listingPath}`, page);
            const videoUrls = await scrapeListingPage(fullListingUrl, site.base, site.videoLinkPattern, site.selector);

            for (const url of videoUrls) {
                const slug = extractSlug(url);
                const existingResult = await db.execute({
                    sql: 'SELECT id FROM videos WHERE slug = ?',
                    args: [slug]
                });
                if (existingResult.rows.length > 0) { skipped++; continue; }

                console.log(`  → ${slug}`);
                const video = await scrapeVideoPage(url, site.base);
                if (video) {
                    const success = await sendToApi(video);
                    if (success) {
                        added++;
                        console.log(`    ✓ ${video.title.substring(0, 55)}...`);
                    } else {
                        failed++;
                    }
                } else {
                    failed++;
                }

                // Polite delay
                await new Promise(r => setTimeout(r, 400));
            }
        }
    }

    console.log(`\n✅ ${site.name}: Added ${added}, Skipped ${skipped}, Failed ${failed}`);
    return added;
}

// ─── Main ───
async function main() {
    const args = process.argv.slice(2);
    const mode = args[0] || 'all';

    console.log('🎬 Multi-Site Video Scraper');
    console.log('===========================\n');

    await initDb();

    if (mode === 'single') {
        const url = args[1];
        if (!url) { console.error('Usage: node scrape.js single <video_url>'); return; }
        const video = await scrapeVideoPage(url, new URL(url).origin);
        if (video) {
            const success = await sendToApi(video);
            if (success) console.log(`✓ Added: ${video.title}`);
        }
    } else if (mode === 'site') {
        const siteKey = args[1];
        const maxPages = parseInt(args[2] || '2');
        await scrapeSite(siteKey, maxPages);
    } else if (mode === 'listing') {
        const target = args[1];
        const maxPages = parseInt(args[2] || '1');
        const base = new URL(target).origin;
        let added = 0;

        for (let page = 1; page <= maxPages; page++) {
            const pageUrl = page === 1 ? target : `${target}page/${page}/`;
            const videoUrls = await scrapeListingPage(pageUrl, base, '/video/');

            for (const url of videoUrls) {
                const slug = extractSlug(url);
                const existingResult = await db.execute({
                    sql: 'SELECT id FROM videos WHERE slug = ?',
                    args: [slug]
                });
                if (existingResult.rows.length > 0) continue;

                const video = await scrapeVideoPage(url, base);
                if (video) {
                    const success = await sendToApi(video);
                    if (success) added++;
                }
                await new Promise(r => setTimeout(r, 400));
            }
        }
        console.log(`\n✅ Added ${added} videos`);
    } else if (mode === 'all') {
        const maxPages = parseInt(args[1] || '2');
        let totalAdded = 0;
        for (const key of Object.keys(SITES)) {
            try {
                const added = await scrapeSite(key, maxPages);
                totalAdded += (added || 0);
            } catch (err) {
                console.error(`  ✗ ${key} failed: ${err.message}`);
            }
        }
        console.log(`\n🎉 Grand total: ${totalAdded} new videos added`);
    }

    const countResult = await db.execute('SELECT COUNT(*) as c FROM videos');
    console.log(`\n📊 Total videos in database: ${countResult.rows[0].c}`);
}

main().catch(console.error);
