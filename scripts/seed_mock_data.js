const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '..', 'videos.db'));

const TITLES = [
    "Exclusive Leaked MMS of Desi College Girl",
    "Homemade Sex Tape with Hindi Audio",
    "Village Bhabhi Bathing Video Hidden Cam",
    "Cute Indian Couple First Night Romance",
    "Bangalore IT Couple Private Bedroom Video",
    "Delhi Metro Girl Viral MMS Leaked",
    "Hostel Girls Changing Room Hidden Camera",
    "Desi Maid Caught Stealing Then Fucked",
    "Indian Saree Bhabhi Hardcore Sex",
    "Padosan Aunty Ki Chudai Jab Pati Bahar Tha",
    "Real Indian Ex-Girlfriend Revenge Porn",
    "Hot Desi Model Nude Photoshoot BTS",
    "Bhojpuri Actress MMS Scandal Video",
    "Pakistani Girl Blowjob Video Viral",
    "Desi School Teacher Student Sex Tape",
    "Indian Webcam Model Striptease Show",
    "Mumbai Call Girl Full Service Video",
    "Rural India Outdoor Sex Fields",
    "Desi Lesbian Girls Kissing and Fingering",
    "Step Mom Seducing Son Hindi Audio"
];

const TAGS = [
    "desi mms", "leaked", "homemade", "hidden cam", "college girl",
    "bhabhi", "aunty", "indian", "hindi audio", "scandal",
    "viral", "private", "couple", "teen", "student",
    "amateur", "hardcore", "romantic", "short hair", "big boobs"
];

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function generateVideo(index) {
    const baseTitle = getRandomItem(TITLES);
    const title = `${baseTitle} ${index + 1}`;
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    // Generate realistic duration
    const min = getRandomInt(0, 20);
    const sec = getRandomInt(0, 59);
    const duration = `${min}:${String(sec).padStart(2, '0')}`;

    // Pick 3-6 random tags
    const numTags = getRandomInt(3, 6);
    const videoTags = new Set();
    while (videoTags.size < numTags) {
        videoTags.add(getRandomItem(TAGS));
    }

    // Views
    const views = getRandomInt(1000, 500000);
    const likes = getRandomInt(10, 5000);
    const dislikes = getRandomInt(0, 500);

    return {
        title,
        slug,
        thumbnail_url: `https://loremflickr.com/640/360/girl,sexy,model?lock=${index}`,
        embed_url: 'https://desisexyvideos.com/stream/12345/', // Placeholder stream, won't play but UI will work
        duration,
        views,
        tags: Array.from(videoTags).join(', '),
        description: `This is a randomly generated description for ${title}. It features popular tags like ${Array.from(videoTags).join(', ')}.`,
        likes,
        dislikes
    };
}

const insertStmt = db.prepare(`
  INSERT OR IGNORE INTO videos (title, slug, thumbnail_url, embed_url, duration, views, tags, description, likes, dislikes)
  VALUES (@title, @slug, @thumbnail_url, @embed_url, @duration, @views, @tags, @description, @likes, @dislikes)
`);

console.log('Generating mock data...');

let added = 0;
// Generate 150 videos
for (let i = 0; i < 150; i++) {
    try {
        const video = generateVideo(i);
        insertStmt.run(video);
        added++;
        if (i % 20 === 0) console.log(`  Generated ${i} videos...`);
    } catch (e) {
        // Ignore dupes
    }
}

console.log(`\n✅ Added ${added} mock videos to database.`);
const total = db.prepare('SELECT COUNT(*) as c FROM videos').get();
console.log(`📊 Total videos now: ${total.c}`);
