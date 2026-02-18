require('dotenv').config();
const cheerio = require('cheerio');
const { createClient } = require('@libsql/client');

const db = createClient({
    url: process.env.TURSO_DATABASE_URL || 'file:videos.db',
    authToken: process.env.TURSO_AUTH_TOKEN,
});

const CONCURRENCY = 5; // Number of parallel video page scrapes

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
            '/', '/videos/?tag=desi-mms', '/videos/?tag=indian-homemade-sex',
            '/videos/?tag=desi-viral-video', '/videos/?tag=bhabhi-sex-video',
            '/videos/?tag=college-girl-sex-video', '/videos/?tag=desi-lesbian-sex',
            '/videos/?tag=big-indian-boobs', '/videos/?tag=aunty-sex-video',
            '/videos/?tag=indian-blowjob-video', '/videos/?tag=hardcore-sex-video'
        ],
        videoLinkPattern: '/video/',
        pagePattern: (url, page) => page === 1 ? url : (url.includes('?') ? `${url}&page=${page}` : `${url}page/${page}/`),
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
        listingUrls: ['/porn-comics-video/'],
        videoLinkPattern: '/',
        pagePattern: (url, page) => page === 1 ? url : `${url}page/${page}/`,
        selector: 'a.p-flink'
    },
    fsiblog: {
        name: 'FSIBlog',
        base: 'https://www.fsiblog.run',
        listingUrls: ['/'],
        videoLinkPattern: 'fsiblog.run/',
        selector: 'ul.video_list a.thumb',
        pagePattern: (url, page) => page === 1 ? url : `${url}page/${page}/`,
    },
    fry99: {
        name: 'Fry99',
        base: 'https://fry99.guru',
        listingUrls: ['/', '/category/desi-sex-mms/'],
        videoLinkPattern: '-watch/',
        pagePattern: (url, page) => page === 1 ? url : `${url}page/${page}/`,
    },
    xxxvideolink: {
        name: 'XXXVideo.link',
        base: 'https://xxxvideo.link',
        listingUrls: [
            '/en/categories/indian/', '/en/content/desi/', '/en/content/bhabhi/',
            '/en/content/aunty/', '/en/content/indian wife/', '/en/content/hindi/',
        ],
        videoLinkPattern: '/en/vus/',
        pagePattern: (url, page) => page === 1 ? url : `${url}${page}/`,
    },
    indianxxxbf: {
        name: 'IndianXXXBF',
        base: 'https://www.indianxxxbf.com',
        listingUrls: [
            '/', '/category/indian-mms/', '/category/desi-porn-videos/', '/category/bhabhi-porn/',
            '/category/indian-aunty-sex/', '/category/bollywood-scandals/', '/category/aunty-sex/',
            '/category/bangla-sex/', '/category/bhabhi-sex/', '/category/bihari-sex-videos/',
            '/category/dehati-xxx/', '/category/desi-sex/', '/category/family-sex/',
            '/category/group-sex/', '/category/gujarati-sex/', '/category/hindi-sex/',
            '/category/kannada-sex-videos/', '/category/malayalam-sex/', '/category/marathi-sex/',
            '/category/odia-sex-video/', '/category/pakistani-sex/', '/category/punjabi-sex-video/',
            '/category/tamil-sex-videos/', '/category/telugu-porn/',
        ],
        videoLinkPattern: 'indianxxxbf.com/',
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

// ─── Utility: Parallel Pool ───
async function runParallel(tasks, concurrency) {
    const results = [];
    const executing = new Set();
    for (const task of tasks) {
        const p = Promise.resolve().then(() => task());
        results.push(p);
        executing.add(p);
        const clean = () => executing.delete(p);
        p.then(clean).catch(clean);
        if (executing.size >= concurrency) {
            await Promise.race(executing);
        }
    }
    return Promise.all(results);
}

async function fetchPage(url, retries = 2) {
    for (let i = 0; i <= retries; i++) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 20000);
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
            if (res.status === 429) {
                const wait = Math.pow(2, i) * 2000;
                console.warn(`  ⚠ 429 Rate limited. Waiting ${wait}ms...`);
                await new Promise(r => setTimeout(r, wait));
                continue;
            }
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.text();
        } catch (err) {
            clearTimeout(timeout);
            if (i === retries) throw err;
            await new Promise(r => setTimeout(r, 1000 * (i + 1)));
        }
    }
}

function parseDuration(input) {
    if (!input) return '5:00';
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
    const timeMatch = input.match(/(\d+):(\d+)(?::(\d+))?/);
    if (timeMatch) {
        if (timeMatch[3]) return `${parseInt(timeMatch[1])}:${timeMatch[2]}:${timeMatch[3]}`;
        return `${parseInt(timeMatch[1])}:${timeMatch[2]}`;
    }
    return '5:00';
}

function makeSlug(text) {
    return text.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').substring(0, 80).replace(/^-|-$/g, '');
}

function extractSlug(url) {
    const parts = url.replace(/\/$/, '').split('/');
    let slug = parts[parts.length - 1].split('?')[0].replace('.html', '');
    return slug || makeSlug(url);
}

async function scrapeVideoPage(videoUrl, siteBase) {
    try {
        const html = await fetchPage(videoUrl);
        const $ = cheerio.load(html);
        let jsonLd = null;
        $('script[type="application/ld+json"]').each((_, el) => {
            try {
                const data = JSON.parse($(el).html());
                if (data['@type'] === 'VideoObject') jsonLd = data;
            } catch { }
        });

        const title = jsonLd?.name || $('meta[property="og:title"]').attr('content') || $('h1').first().text().trim() || $('title').text().trim();
        if (!title || title.length < 3) return null;

        const thumbnail = jsonLd?.thumbnailUrl || $('meta[property="og:image"]').attr('content') || $('video').attr('poster') || $('img.video-thumbnail, img.player-thumb').attr('src') || '';
        const description = (jsonLd?.description || $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content') || '').substring(0, 500);
        const duration = parseDuration(jsonLd?.duration || $('meta[property="video:duration"]').attr('content') || $('.duration, .video-duration, [class*=duration]').first().text().trim());
        const slug = extractSlug(videoUrl);

        let embedUrl = '';
        const videoSource = $('video source[type="video/mp4"]').attr('src') || $('video').attr('src');
        if (videoSource) {
            embedUrl = videoSource.startsWith('http') ? videoSource : `${siteBase}${videoSource}`;
        }

        if (!embedUrl) {
            const mp4Match = html.match(/(?:src|source|file|url)\s*[:=]\s*['"]?(https?:\/\/[^\s"'<>]+\.mp4[^"'<>\s]*)/i);
            if (mp4Match) embedUrl = mp4Match[1];

            if (!embedUrl) {
                const mp4MatchEscaped = html.match(/https?:\\\/\\\/[^"']+\.mp4/);
                if (mp4MatchEscaped) embedUrl = mp4MatchEscaped[0].replace(/\\\//g, '/');
            }
        }

        if (!embedUrl) {
            const inertiaMatch = html.match(/data-page="([^"]+)"/);
            if (inertiaMatch) {
                try {
                    const dataStr = inertiaMatch[1].replace(/&quot;/g, '"');
                    const data = JSON.parse(dataStr);
                    const inertiaData = data.props.post || data.props.video || (data.props.posts?.data ? data.props.posts.data[0] : null);
                    if (inertiaData?.media_url) embedUrl = inertiaData.media_url;
                } catch (e) { }
            }
        }

        if (!embedUrl) {
            const playerUrl = $('iframe[src*="player-x.php?q="]').attr('src');
            if (playerUrl?.includes('q=')) {
                try {
                    const b64 = playerUrl.split('q=')[1].split('&')[0];
                    const decoded = Buffer.from(decodeURIComponent(b64), 'base64').toString('utf-8');
                    const mp4 = decoded.match(/src=["'](https?:\/\/[^"']+\.mp4)/i);
                    if (mp4) embedUrl = mp4[1];
                } catch (e) { }
            }
        }

        if (!embedUrl) {
            embedUrl = $('meta[itemprop="contentURL"]').attr('content') ||
                $('meta[itemprop="embedURL"]').attr('content') ||
                $('meta[property="og:video"]').attr('content') ||
                $('meta[property="og:video:url"]').attr('content');
        }

        if (!embedUrl) {
            const iframeSrc = $('iframe[src*="luluvid"], iframe[src*="embed"], iframe.video-iframe, .video-player iframe, .responsive-player iframe').attr('src');
            if (iframeSrc) embedUrl = iframeSrc;
        }

        if (!embedUrl) {
            // Check for base64 encoded iframe param (indianxxxbf)
            $('iframe').each((_, el) => {
                const src = $(el).attr('src');
                if (src && src.includes('player-x.php?q=')) {
                    try {
                        const q = src.split('q=')[1].split('&')[0];
                        const decoded = Buffer.from(q, 'base64').toString('utf-8');
                        const match = decoded.match(/src="([^"]+)"/);
                        if (match) embedUrl = match[1];
                    } catch (e) { }
                }
            });
        }

        if (!embedUrl) {
            const canonical = $('link[rel="canonical"]').attr('href');
            if (canonical?.includes('/vu/')) embedUrl = canonical;
            else if (videoUrl.includes('/vus/')) embedUrl = videoUrl.replace('/vus/', '/vu/').split('?')[0];
        }

        if (!embedUrl) return null;

        const extractedTags = new Set();
        $('a[href*="/tag/"], a[href*="/category/"]').each((_, el) => {
            const text = $(el).text().trim().toLowerCase();
            if (text.length > 1 && text.length < 30) extractedTags.add(text);
        });

        // Auto-categorization
        const lowerTitle = title.toLowerCase();
        if (lowerTitle.includes('bhabhi')) extractedTags.add('bhabhi');
        if (lowerTitle.includes('indian')) extractedTags.add('indian');
        if (lowerTitle.includes('aunty')) extractedTags.add('aunty');
        if (lowerTitle.includes('college')) extractedTags.add('college');
        if (lowerTitle.includes('homemade')) extractedTags.add('homemade');

        return { title, slug, thumbnail_url: thumbnail, embed_url: embedUrl, duration, tags: Array.from(extractedTags).slice(0, 15).join(', '), description };
    } catch (err) {
        return null;
    }
}

async function scrapeListingPage(pageUrl, siteBase, videoPattern, selector, excludePattern) {
    try {
        const html = await fetchPage(pageUrl);
        const $ = cheerio.load(html);
        const videoUrls = new Set();
        const findLinks = (container) => {
            container.each((_, el) => {
                let href = $(el).attr('href');
                if (href && href.includes(videoPattern)) {
                    if (excludePattern && excludePattern.test(href)) return;
                    videoUrls.add(href.startsWith('http') ? href : `${siteBase}${href}`);
                }
            });
        };
        if (selector) findLinks($(selector));
        else findLinks($(`a[href*="${videoPattern}"]`));

        if (videoUrls.size === 0) {
            const inertiaMatch = html.match(/data-page="([^"]+)"/);
            if (inertiaMatch) {
                try {
                    const data = JSON.parse(inertiaMatch[1].replace(/&quot;/g, '"'));
                    const list = data.props.videos?.data || data.props.posts?.data || [];
                    list.forEach(item => {
                        if (item.url) videoUrls.add(item.url);
                        else if (item.slug && item.type === 'video') videoUrls.add(`${siteBase}/post/${item.slug}`);
                    });
                } catch (e) { }
            }
        }
        return Array.from(videoUrls);
    } catch (err) {
        return [];
    }
}

async function sendToApi(videoData) {
    try {
        const response = await fetch('http://localhost:3000/api/ingest', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.SCRAPER_KEY || 'super-secret-scraper-token-123' },
            body: JSON.stringify(videoData)
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Unknown error' }));
            console.error(`      ✗ API Error [${response.status}]: ${error.error}`);
        }
        return response.ok;
    } catch (e) {
        console.error(`      ✗ Ingest Connection Error: ${e.message}`);
        return false;
    }
}

async function scrapeSite(siteKey, maxPages = 2) {
    const site = SITES[siteKey];
    if (!site) return;
    console.log(`\n🌐 Running: ${site.name} (${maxPages} pages)`);
    let added = 0, skipped = 0, failed = 0;

    for (const listingPath of site.listingUrls) {
        for (let page = 1; page <= maxPages; page++) {
            const fullListingUrl = site.pagePattern(`${site.base}${listingPath}`, page);
            console.log(`  📄 Page ${page}: ${fullListingUrl}`);
            const videoUrls = await scrapeListingPage(
                fullListingUrl,
                site.base,
                site.videoLinkPattern,
                site.selector,
                site.excludePattern
            );
            console.log(`  Found ${videoUrls.length} links`);

            const tasks = videoUrls.map(url => async () => {
                const slug = extractSlug(url);
                const existing = await db.execute({ sql: 'SELECT id FROM videos WHERE slug = ?', args: [slug] });
                if (existing.rows.length > 0) { skipped++; return; }

                console.log(`    → ${slug}`);
                const video = await scrapeVideoPage(url, site.base);
                if (video) {
                    if (await sendToApi(video)) {
                        added++;
                        console.log(`    ✓ ${video.title.substring(0, 40)}...`);
                    } else {
                        failed++;
                    }
                } else {
                    failed++;
                    console.log(`    ✗ Failed to extract video: ${slug}`);
                }
            });

            await runParallel(tasks, CONCURRENCY);
        }
    }
    console.log(`\n✅ ${site.name}: Added ${added}, Skipped ${skipped}, Failed ${failed}`);
    return added;
}

async function main() {
    process.env.SCRAPER_KEY = process.env.SCRAPER_KEY || 'super-secret-scraper-token-123';
    await initDb();
    const args = process.argv.slice(2);
    const mode = args[0] || 'all';
    const maxPages = parseInt(args[1] || '2');

    if (mode === 'all') {
        const pages = parseInt(args[1] || '2');
        for (const key of Object.keys(SITES)) await scrapeSite(key, pages);
    } else if (mode === 'site') {
        const siteKey = args[1];
        const pages = parseInt(args[2] || '2');
        await scrapeSite(siteKey, pages);
    }
    const count = await db.execute('SELECT COUNT(*) as c FROM videos');
    console.log(`\n📊 Total videos: ${count.rows[0].c}`);
}

main().catch(console.error);
