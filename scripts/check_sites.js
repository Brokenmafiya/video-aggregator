const sites = [
    'https://desiporn.tube',
    'https://fsicomics.com',
    'https://xxxvideo.link',
    'https://www.indianxxxbf.com',
    'https://pkpornhub.com'
];

async function check(url) {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        const res = await fetch(url, {
            method: 'HEAD',
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
            signal: controller.signal
        });
        clearTimeout(timeout);
        console.log(`[${res.status}] ${url}`);
    } catch (e) {
        console.log(`[FAIL] ${url}: ${e.message}`);
    }
}

console.log('Checking sites...');
Promise.all(sites.map(check));
