import { createClient } from '@libsql/client';

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

const isProd = process.env.NODE_ENV === 'production';

if (!url && isProd) {
    throw new Error('❌ DEPLOYMENT ERROR: TURSO_DATABASE_URL is missing in Vercel Environment Variables. Please add it to your project settings.');
}

const db = createClient({
    url: url || 'file:videos.db',
    authToken: authToken,
});

export default db;
