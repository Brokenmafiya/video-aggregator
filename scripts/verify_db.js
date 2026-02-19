/* eslint-disable @typescript-eslint/no-require-imports */
require('dotenv').config();
const { createClient } = require('@libsql/client');

const db = createClient({
    url: process.env.TURSO_DATABASE_URL || 'file:videos.db',
    authToken: process.env.TURSO_AUTH_TOKEN,
});

async function main() {
    try {
        console.log('Connecting to:', process.env.TURSO_DATABASE_URL ? 'Turso Remote' : 'Local File');
        const result = await db.execute('SELECT id, title, slug, created_at FROM videos ORDER BY id DESC LIMIT 5');
        console.log('\n--- Recent Videos ---');
        result.rows.forEach(row => {
            console.log(`[${row.id}] ${row.title} (${row.created_at})`);
        });
    } catch (err) {
        console.error('Error:', err);
    }
}

main();
