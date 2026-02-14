# 🎬 Lumina - Video Aggregator

A full-featured, modern video aggregation platform built with Next.js 16 and Turso (Cloud SQLite). Designed for serverless deployment with support for 2,000+ videos, real-time scraping, and premium tube-site aesthetics.

![Next.js](https://img.shields.io/badge/Next.js-16.1.6-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react)
![Turso](https://img.shields.io/badge/Turso-Cloud_SQLite-00D1B2?style=flat-square)
![Vercel](https://img.shields.io/badge/Vercel-Deploy-black?style=flat-square&logo=vercel)

## ✨ Features

- **🎥 Multi-Source Scraper**: Automated video ingestion from 9+ adult content sites
- **☁️ Cloud Native**: Powered by Turso for serverless SQLite (Vercel compatible)
- **🔍 Advanced Search**: Full-text search across titles, tags, and descriptions
- **🏷️ Smart Categories**: Dynamic categorization with 10+ predefined categories
- **💙 Like/Dislike System**: Optimistic UI with vote tracking
- **📱 Responsive Design**: Mobile-first with glassmorphic UI elements
- **🛡️ Security Hardened**: Rate limiting, SQL injection protection, XSS prevention
- **📊 2,146 Videos**: Pre-scraped library with direct MP4 playback

## 🚀 Quick Deploy

### Vercel (Recommended)

1. **Fork or Clone**:
   ```bash
   git clone https://github.com/Brokenmafiya/video-aggregator.git
   cd video-aggregator
   ```

2. **Create Turso Database**:
   ```bash
   # Install Turso CLI
   curl -sSfL https://get.tur.so/install.sh | bash
   
   # Create database
   turso db create video-aggregator
   
   # Get credentials
   turso db show video-aggregator --url
   turso db tokens create video-aggregator
   ```

3. **Deploy to Vercel**:
   - Import project at [vercel.com/new](https://vercel.com/new)
   - Add environment variables:
     - `TURSO_DATABASE_URL`: Your Turso database URL
     - `TURSO_AUTH_TOKEN`: Your Turso auth token
     - `SCRAPER_KEY`: Any secret string (e.g., `super-secret-scraper-token-123`)
   - Deploy!

## 🛠️ Local Development

### Prerequisites

- Node.js 20+
- npm or pnpm

### Installation

1. **Clone & Install**:
   ```bash
   git clone https://github.com/Brokenmafiya/video-aggregator.git
   cd video-aggregator
   npm install
   ```

2. **Environment Setup**:
   Create `.env` file:
   ```env
   SCRAPER_KEY=super-secret-scraper-token-123
   # Optional: For cloud database
   TURSO_DATABASE_URL=libsql://your-db.turso.io
   TURSO_AUTH_TOKEN=your-token-here
   ```

3. **Database Initialization** (Local Only):
   ```bash
   node scripts/init-db.js
   ```

4. **Start Development Server**:
   ```bash
   npm run dev
   ```

5. **Open Browser**:
   Navigate to `http://localhost:3000`

## 📦 Database Options

### Option 1: Local SQLite (Development)

```bash
# Database automatically created at: ./videos.db
# No credentials needed
npm run dev
```

### Option 2: Turso Cloud (Production)

```bash
# 1. Sign up at https://turso.tech
# 2. Create database
turso db create video-aggregator

# 3. Get URL
turso db show video-aggregator --url

# 4. Create token
turso db tokens create video-aggregator

# 5. Add to .env
TURSO_DATABASE_URL=libsql://your-database-name.turso.io
TURSO_AUTH_TOKEN=your-actual-token-here
```

### Migrating Existing Data to Turso

```bash
# If you have local videos.db, sync to cloud:
node scripts/migrate-to-turso.js
```

## 🕷️ Content Scraper

### Supported Sites

The scraper extracts videos from:
- DesiSexyVideos
- MasaHub
- DesiXX
- IndianPorn
- DesiPorn
- FSIComics
- XXXVideo.link
- IndianXXXBF
- PKpornhub

### Usage

```bash
# Scrape all sites (2 pages each)
node scripts/scrape.js all

# Scrape specific site
node scripts/scrape.js site indianxxxbf 5

# Scrape single video URL
node scripts/scrape.js single https://example.com/video/123

# Scrape listing page
node scripts/scrape.js listing https://example.com/category/desi 3
```

**Note**: The scraper uses the `/api/ingest` endpoint, which requires the `SCRAPER_KEY` to be set.

## 🏗️ Project Structure

```
video-aggregator/
├── src/
│   ├── app/              # Next.js 16 App Router
│   │   ├── page.tsx      # Homepage (paginated grid)
│   │   ├── watch/[slug]/ # Video player page
│   │   ├── search/       # Search results
│   │   ├── tag/[slug]/   # Tag-filtered videos
│   │   ├── category/     # Category pages
│   │   ├── add/          # Manual video submission
│   │   └── api/          # API routes
│   │       ├── ingest/   # Video ingestion (authenticated)
│   │       ├── vote/     # Like/Dislike endpoint
│   │       └── placeholder/ # Dynamic thumbnail placeholders
│   ├── components/       # Reusable UI components
│   │   ├── Navbar.tsx
│   │   ├── Footer.tsx
│   │   ├── VideoCard.tsx
│   │   └── VideoActions.tsx
│   └── lib/
│       ├── db.ts         # Turso/SQLite client
│       ├── videos.ts     # Video data layer (async)
│       └── rate-limit.ts # Rate limiting middleware
├── scripts/
│   ├── scrape.js         # Multi-site scraper
│   ├── migrate-to-turso.js # Local → Cloud migration
│   └── init-db.js        # Database initialization
└── public/               # Static assets
```

## 🔐 Security Features

- **SQL Injection Protection**: 100% parameterized queries
- **Rate Limiting**: In-memory rate limiter (10 votes/min, 60 ingests/min)
- **XSS Prevention**: React auto-escaping + CSP headers
- **API Authentication**: Secret key validation for scraper
- **Domain Whitelisting**: Only approved embed sources

## 🚢 Deployment Options

### Vercel (Serverless)
✅ **Best for**: Zero-config, auto-scaling
- Auto-deploys from GitHub
- Built-in CDN
- Free tier: 100GB bandwidth
- **⚠️ Note**: Vercel/Netlify ToS prohibits adult content. Use at your own risk or for testing. For strict compliance, use offshore hosting.

### VPS (DigitalOcean, AWS, Linode)
✅ **Best for**: Full control, persistent storage
```bash
# Clone on VPS
git clone https://github.com/yourusername/video-aggregator.git
cd video-aggregator

# Install dependencies
npm install

# Build production
npm run build

# Start with PM2
npm install -g pm2
pm2 start npm --name "video-aggregator" -- start
```

### Docker
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 📊 Database Schema

```sql
CREATE TABLE videos (
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

CREATE INDEX idx_videos_created_at ON videos(created_at);
CREATE INDEX idx_videos_views ON videos(views);
```

## 🎨 Customization

### Branding
Edit `src/components/Navbar.tsx` and `src/components/Footer.tsx`:
- Change site name from "Lumina"
- Update logo/favicon in `/public`

### Categories
Modify `src/lib/videos.ts` → `CATEGORIES` array:
```typescript
const CATEGORIES = [
    { name: 'Your Category', slug: 'your-category', keywords: ['keyword1', 'keyword2'] },
];
```

### Ad Integration
Edit `src/components/AdBanner.tsx` to add your ad network tags (ExoClick, TrafficJunky, etc.)

## 📝 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `TURSO_DATABASE_URL` | Production | Turso database URL (e.g., `libsql://db.turso.io`) |
| `TURSO_AUTH_TOKEN` | Production | Turso authentication token |
| `SCRAPER_KEY` | Yes | Secret key for `/api/ingest` endpoint |

## 🐛 Troubleshooting

### Build Errors
```bash
# Clear cache and rebuild
rm -rf .next
npm run build
```

### Database Connection Issues
```bash
# Verify Turso credentials
turso db show your-database --url
turso db tokens create your-database

# Test locally first
# Remove TURSO_* variables from .env to use local SQLite
```

### Vercel 500 Errors
- Verify environment variables are set in Vercel dashboard
- Check build logs for missing dependencies
- Ensure `TURSO_DATABASE_URL` starts with `libsql://`

## 📄 License

MIT License - Feel free to use for personal or commercial projects.

## 🙏 Credits

Built with:
- [Next.js](https://nextjs.org/)
- [Turso](https://turso.tech/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Lucide Icons](https://lucide.dev/)

---

**⚠️ Disclaimer**: This is a content aggregation platform. All videos are streamed from external sources. We do not host any content.
