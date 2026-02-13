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

export async function getVideos(): Promise<Video[]> {
    const result = await db.execute('SELECT * FROM videos ORDER BY created_at DESC');
    return result.rows as unknown as Video[];
}

export async function getVideoBySlug(slug: string): Promise<Video | undefined> {
    const result = await db.execute({
        sql: 'SELECT * FROM videos WHERE slug = ?',
        args: [slug]
    });
    return result.rows[0] as unknown as Video | undefined;
}

export async function createVideo(video: Partial<Video>) {
    return await db.execute({
        sql: `INSERT INTO videos (title, slug, thumbnail_url, embed_url, duration, tags, description)
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [
            video.title || '',
            video.slug || '',
            video.thumbnail_url || '',
            video.embed_url || '',
            video.duration || '',
            video.tags || '',
            video.description || ''
        ]
    });
}

export async function incrementViews(slug: string) {
    await db.execute({
        sql: 'UPDATE videos SET views = views + 1 WHERE slug = ?',
        args: [slug]
    });
}

// ─── Pagination ───

export async function getVideosPaginated(page: number, perPage: number = 24, sort: string = 'newest'): Promise<{ videos: Video[]; total: number }> {
    const offset = (page - 1) * perPage;

    let orderBy = 'created_at DESC';
    if (sort === 'popular') orderBy = 'views DESC';
    if (sort === 'longest') orderBy = "CAST(REPLACE(REPLACE(duration, ':', ''), ' ', '') AS INTEGER) DESC";

    const videosResult = await db.execute({
        sql: `SELECT * FROM videos ORDER BY ${orderBy} LIMIT ? OFFSET ?`,
        args: [perPage, offset]
    });

    const countResult = await db.execute('SELECT COUNT(*) as count FROM videos');
    const total = Number(countResult.rows[0].count);

    return { videos: videosResult.rows as unknown as Video[], total };
}

// ─── Search ───

export async function searchVideos(query: string, page: number = 1, perPage: number = 24): Promise<{ videos: Video[]; total: number }> {
    const offset = (page - 1) * perPage;
    const like = `%${query}%`;

    const videosResult = await db.execute({
        sql: `
            SELECT * FROM videos
            WHERE title LIKE ? OR tags LIKE ? OR description LIKE ?
            ORDER BY views DESC
            LIMIT ? OFFSET ?
        `,
        args: [like, like, like, perPage, offset]
    });

    const countResult = await db.execute({
        sql: `
            SELECT COUNT(*) as count FROM videos
            WHERE title LIKE ? OR tags LIKE ? OR description LIKE ?
        `,
        args: [like, like, like]
    });
    const total = Number(countResult.rows[0].count);

    return { videos: videosResult.rows as unknown as Video[], total };
}

// ─── Tags ───

export async function getVideosByTag(tag: string, page: number = 1, perPage: number = 24): Promise<{ videos: Video[]; total: number }> {
    const offset = (page - 1) * perPage;
    const like = `%${tag}%`;

    const videosResult = await db.execute({
        sql: 'SELECT * FROM videos WHERE tags LIKE ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
        args: [like, perPage, offset]
    });

    const countResult = await db.execute({
        sql: 'SELECT COUNT(*) as count FROM videos WHERE tags LIKE ?',
        args: [like]
    });
    const total = Number(countResult.rows[0].count);

    return { videos: videosResult.rows as unknown as Video[], total };
}

export async function getRelatedVideos(slug: string, tags: string[], limit: number = 10): Promise<Video[]> {
    if (tags.length === 0) {
        const res = await db.execute({
            sql: 'SELECT * FROM videos WHERE slug != ? ORDER BY views DESC LIMIT ?',
            args: [slug, limit]
        });
        return res.rows as unknown as Video[];
    }

    const sql = `
        SELECT *, 
        (${tags.map(() => 'CASE WHEN tags LIKE ? THEN 1 ELSE 0 END').join(' + ')}) as score
        FROM videos 
        WHERE slug != ? 
        ORDER BY score DESC, views DESC 
        LIMIT ?
    `;

    const params = [...tags.map(t => `%${t}%`), slug, limit];
    const res = await db.execute({ sql, args: params });
    return res.rows as unknown as Video[];
}

export async function getAllTags(): Promise<{ tag: string; count: number }[]> {
    const result = await db.execute('SELECT tags FROM videos WHERE tags IS NOT NULL AND tags != ""');
    const videos = result.rows as unknown as { tags: string }[];
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

export async function getCategories(): Promise<{ name: string; slug: string; count: number }[]> {
    const categoriesWithCount = await Promise.all(CATEGORIES.map(async cat => {
        const conditions = cat.keywords.map(() => `(title LIKE ? OR tags LIKE ?)`).join(' OR ');
        const values = cat.keywords.flatMap(k => [`%${k}%`, `%${k}%`]);
        const result = await db.execute({
            sql: `SELECT COUNT(*) as count FROM videos WHERE ${conditions}`,
            args: values
        });
        return { name: cat.name, slug: cat.slug, count: Number(result.rows[0].count) };
    }));
    return categoriesWithCount.filter(c => c.count > 0);
}

export async function getVideosByCategory(categorySlug: string, page: number = 1, perPage: number = 24): Promise<{ videos: Video[]; total: number; categoryName: string }> {
    const cat = CATEGORIES.find(c => c.slug === categorySlug);
    if (!cat) return { videos: [], total: 0, categoryName: '' };

    const offset = (page - 1) * perPage;
    const conditions = cat.keywords.map(() => `(title LIKE ? OR tags LIKE ?)`).join(' OR ');
    const values = cat.keywords.flatMap(k => [`%${k}%`, `%${k}%`]);

    const videosResult = await db.execute({
        sql: `SELECT * FROM videos WHERE ${conditions} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
        args: [...values, perPage, offset]
    });

    const countResult = await db.execute({
        sql: `SELECT COUNT(*) as count FROM videos WHERE ${conditions}`,
        args: values
    });
    const total = Number(countResult.rows[0].count);

    return { videos: videosResult.rows as unknown as Video[], total, categoryName: cat.name };
}

// ─── Likes ───

export async function likeVideo(slug: string) {
    await db.execute({
        sql: 'UPDATE videos SET likes = likes + 1 WHERE slug = ?',
        args: [slug]
    });
}

export async function dislikeVideo(slug: string) {
    await db.execute({
        sql: 'UPDATE videos SET dislikes = dislikes + 1 WHERE slug = ?',
        args: [slug]
    });
}
