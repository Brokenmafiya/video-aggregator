require('dotenv').config();
const Database = require('better-sqlite3');
const { createClient } = require('@libsql/client');
const path = require('path');

const localDb = new Database(path.join(__dirname, '..', 'videos.db'));
const tursoUrl = process.env.TURSO_DATABASE_URL;
const tursoAuthToken = process.env.TURSO_AUTH_TOKEN;

if (!tursoUrl || !tursoAuthToken) {
    console.error('❌ Error: TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set in .env');
    process.exit(1);
}

const remoteDb = createClient({
    url: tursoUrl,
    authToken: tursoAuthToken,
});

async function migrate() {
    console.log('🚀 Starting Turso Migration...');

    try {
        // 1. Create table on Turso
        console.log('⌛ Creating table on Turso...');
        await remoteDb.execute(`
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

        // 2. Add indices
        await remoteDb.execute('CREATE INDEX IF NOT EXISTS idx_videos_created_at ON videos(created_at)');
        await remoteDb.execute('CREATE INDEX IF NOT EXISTS idx_videos_views ON videos(views)');

        // 3. Fetch local videos
        const videos = localDb.prepare('SELECT * FROM videos').all();
        console.log(`📦 Found ${videos.length} videos locally.`);

        // 4. Upload in batches (Turso has limits per request)
        const BATCH_SIZE = 50;
        for (let i = 0; i < videos.length; i += BATCH_SIZE) {
            const batch = videos.slice(i, i + BATCH_SIZE);
            console.log(`📤 Uploading batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(videos.length / BATCH_SIZE)}...`);

            // Using batch() for efficiency
            const statements = batch.map(video => ({
                sql: `INSERT OR IGNORE INTO videos (title, slug, thumbnail_url, embed_url, duration, views, tags, description, likes, dislikes, created_at)
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                args: [
                    video.title,
                    video.slug,
                    video.thumbnail_url,
                    video.embed_url,
                    video.duration,
                    video.views,
                    video.tags,
                    video.description,
                    video.likes,
                    video.dislikes,
                    video.created_at
                ]
            }));

            await remoteDb.batch(statements, "write");
        }

        console.log('✅ Migration complete! Your videos are now in the cloud.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

migrate();
