import { createClient } from '@libsql/client';

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

// Validation for production
if (!url && process.env.NODE_ENV === 'production') {
    console.error('❌ CRITICAL: TURSO_DATABASE_URL is missing in production!');
}

const db = createClient({
    url: url || 'file:videos.db',
    authToken: authToken,
});

export default db;
