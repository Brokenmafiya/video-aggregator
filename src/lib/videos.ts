import db from './db';

export interface Video {
    id?: number;
    title: string;
    slug: string;
    thumbnail_url: string;
    embed_url: string;
    duration: string;
    views: number;
    likes: number;
    dislikes: number;
    tags: string;
    description: string;
    created_at?: string;
}

// ─── Basic Queries ───

export function getVideos(): Video[] {
    return db.prepare('SELECT * FROM videos ORDER BY created_at DESC').all() as Video[];
}

export function getVideoBySlug(slug: string): Video | undefined {
    return db.prepare('SELECT * FROM videos WHERE slug = ?').get(slug) as Video | undefined;
}

export function createVideo(video: Partial<Video>) {
    const stmt = db.prepare(`
        INSERT INTO videos (title, slug, thumbnail_url, embed_url, duration, tags, description)
        VALUES (@title, @slug, @thumbnail_url, @embed_url, @duration, @tags, @description)
    `);
    return stmt.run(video);
}

export function incrementViews(slug: string) {
    db.prepare('UPDATE videos SET views = views + 1 WHERE slug = ?').run(slug);
}

// ─── Pagination ───

export function getVideosPaginated(page: number, perPage: number = 24, sort: string = 'newest'): { videos: Video[]; total: number } {
    const offset = (page - 1) * perPage;

    let orderBy = 'created_at DESC';
    if (sort === 'popular') orderBy = 'views DESC';
    if (sort === 'longest') orderBy = "CAST(REPLACE(REPLACE(duration, ':', ''), ' ', '') AS INTEGER) DESC";

    const videos = db.prepare(`SELECT * FROM videos ORDER BY ${orderBy} LIMIT ? OFFSET ?`).all(perPage, offset) as Video[];
    const total = (db.prepare('SELECT COUNT(*) as count FROM videos').get() as { count: number }).count;

    return { videos, total };
}

// ─── Search ───

export function searchVideos(query: string, page: number = 1, perPage: number = 24): { videos: Video[]; total: number } {
    const offset = (page - 1) * perPage;
    const like = `%${query}%`;

    const videos = db.prepare(`
        SELECT * FROM videos
        WHERE title LIKE ? OR tags LIKE ? OR description LIKE ?
        ORDER BY views DESC
        LIMIT ? OFFSET ?
    `).all(like, like, like, perPage, offset) as Video[];

    const total = (db.prepare(`
        SELECT COUNT(*) as count FROM videos
        WHERE title LIKE ? OR tags LIKE ? OR description LIKE ?
    `).get(like, like, like) as { count: number }).count;

    return { videos, total };
}

// ─── Tags ───

export function getVideosByTag(tag: string, page: number = 1, perPage: number = 24): { videos: Video[]; total: number } {
    const offset = (page - 1) * perPage;
    const like = `%${tag}%`;

    const videos = db.prepare('SELECT * FROM videos WHERE tags LIKE ? ORDER BY created_at DESC LIMIT ? OFFSET ?')
        .all(like, perPage, offset) as Video[];
    const total = (db.prepare('SELECT COUNT(*) as count FROM videos WHERE tags LIKE ?').get(like) as { count: number }).count;

    return { videos, total };
}

export function getRelatedVideos(slug: string, tags: string[], limit: number = 10): Video[] {
    if (tags.length === 0) {
        return db.prepare('SELECT * FROM videos WHERE slug != ? ORDER BY views DESC LIMIT ?').all(slug, limit) as Video[];
    }

    // Build weighted scoring query: for each tag, if it matches, add 1 to the score
    const conditions = tags.map(() => 'WHEN tags LIKE ? THEN 1').join(' ');
    const sql = `
        SELECT *, 
        (${tags.map(() => 'CASE WHEN tags LIKE ? THEN 1 ELSE 0 END').join(' + ')}) as score
        FROM videos 
        WHERE slug != ? 
        ORDER BY score DESC, views DESC 
        LIMIT ?
    `;

    const params = [...tags.map(t => `%${t}%`), slug, limit];
    return db.prepare(sql).all(...params) as Video[];
}

export function getAllTags(): { tag: string; count: number }[] {
    const videos = db.prepare('SELECT tags FROM videos WHERE tags IS NOT NULL AND tags != ""').all() as { tags: string }[];
    const tagMap = new Map<string, number>();

    for (const v of videos) {
        const tags = v.tags.split(',').map(t => t.trim()).filter(Boolean);
        for (const tag of tags) {
            tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
        }
    }

    return Array.from(tagMap.entries())
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count);
}

// ─── Categories ───

const CATEGORIES = [
    { name: 'Indian', slug: 'indian', keywords: ['indian', 'desi', 'hindi'] },
    { name: 'Bhabhi', slug: 'bhabhi', keywords: ['bhabhi'] },
    { name: 'Aunty', slug: 'aunty', keywords: ['aunty', 'auntie'] },
    { name: 'College', slug: 'college', keywords: ['college', 'student', 'young'] },
    { name: 'Couple', slug: 'couple', keywords: ['couple', 'lover', 'boyfriend', 'girlfriend'] },
    { name: 'Blowjob', slug: 'blowjob', keywords: ['blowjob', 'bj', 'lund chusna', 'lund chus'] },
    { name: 'Hardcore', slug: 'hardcore', keywords: ['hardcore', 'hard', 'chudai'] },
    { name: 'Homemade', slug: 'homemade', keywords: ['homemade', 'selfie', 'mms'] },
    { name: 'Threesome', slug: 'threesome', keywords: ['threesome', '3some'] },
    { name: 'Big Boobs', slug: 'big-boobs', keywords: ['big boobs', 'bade boobs', 'big tits'] },
];

export function getCategories(): { name: string; slug: string; count: number }[] {
    return CATEGORIES.map(cat => {
        const conditions = cat.keywords.map(() => `(title LIKE ? OR tags LIKE ?)`).join(' OR ');
        const values = cat.keywords.flatMap(k => [`%${k}%`, `%${k}%`]);
        const result = db.prepare(`SELECT COUNT(*) as count FROM videos WHERE ${conditions}`).get(...values) as { count: number };
        return { name: cat.name, slug: cat.slug, count: result.count };
    }).filter(c => c.count > 0);
}

export function getVideosByCategory(categorySlug: string, page: number = 1, perPage: number = 24): { videos: Video[]; total: number; categoryName: string } {
    const cat = CATEGORIES.find(c => c.slug === categorySlug);
    if (!cat) return { videos: [], total: 0, categoryName: '' };

    const offset = (page - 1) * perPage;
    const conditions = cat.keywords.map(() => `(title LIKE ? OR tags LIKE ?)`).join(' OR ');
    const values = cat.keywords.flatMap(k => [`%${k}%`, `%${k}%`]);

    const videos = db.prepare(`SELECT * FROM videos WHERE ${conditions} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
        .all(...values, perPage, offset) as Video[];
    const total = (db.prepare(`SELECT COUNT(*) as count FROM videos WHERE ${conditions}`).get(...values) as { count: number }).count;

    return { videos, total, categoryName: cat.name };
}

// ─── Likes ───

export function likeVideo(slug: string) {
    db.prepare('UPDATE videos SET likes = likes + 1 WHERE slug = ?').run(slug);
}

export function dislikeVideo(slug: string) {
    db.prepare('UPDATE videos SET dislikes = dislikes + 1 WHERE slug = ?').run(slug);
}
