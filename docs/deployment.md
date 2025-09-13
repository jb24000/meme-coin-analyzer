# 🚀 Deployment Guide

This guide covers deploying the Meme Coin Analyzer to various hosting platforms, from simple static hosting to full-stack deployments with database integration.

## 📋 Deployment Options Comparison

| Platform | Cost | Complexity | Best For | Database | API Keys |
|----------|------|------------|----------|----------|----------|
| GitHub Pages | Free | ⭐ | Open source projects | ❌ | Client-side only |
| Vercel | Free tier | ⭐⭐ | Professional apps | ✅ | Server-side |
| Netlify | Free tier | ⭐⭐ | Static + functions | ✅ | Server-side |
| Railway | $5/month | ⭐⭐ | Full-stack apps | ✅ | Server-side |
| Heroku | $7/month | ⭐⭐⭐ | Traditional hosting | ✅ | Server-side |
| AWS/GCP | Variable | ⭐⭐⭐⭐ | Enterprise scale | ✅ | Server-side |

## 🌐 Static Hosting (Recommended for MVP)

### GitHub Pages
Perfect for open-source projects and quick demos.

```bash
# 1. Create repository
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/username/meme-coin-analyzer.git
git push -u origin main

# 2. Enable GitHub Pages
# Go to Settings → Pages → Source: Deploy from branch → main → Save
```

**Live URL**: `https://username.github.io/meme-coin-analyzer`

**Pros**: Free, automatic SSL, easy setup
**Cons**: Public repos only, no server-side API keys

### Netlify
Great for professional deployments with form handling and edge functions.

#### Option A: Git Integration
1. Connect GitHub repository to Netlify
2. Set build command: `# Leave empty for static site`
3. Set publish directory: `/` or leave empty

#### Option B: Manual Deploy
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login and deploy
netlify login
netlify deploy --prod --dir .
```

**Environment Variables Setup**:
```bash
# In Netlify dashboard: Site Settings → Environment Variables
DEXSCREENER_API_KEY=your_key_here
ETHERSCAN_API_KEY=your_key_here
TWITTER_BEARER_TOKEN=your_token_here
```

**Netlify Functions** (for API key security):
```javascript
// netlify/functions/analyze-token.js
exports.handler = async (event, context) => {
    const { contractAddress } = JSON.parse(event.body);
    
    // Server-side API calls with environment variables
    const dexData = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${contractAddress}`, {
        headers: { 'X-API-Key': process.env.DEXSCREENER_API_KEY }
    });
    
    return {
        statusCode: 200,
        body: JSON.stringify(await dexData.json())
    };
};
```

## 🔧 Full-Stack Deployment (Recommended for Production)

### Vercel + Supabase (Recommended)
Ideal combination for professional applications with database and real-time features.

#### 1. Vercel Setup
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Configure environment variables
vercel env add DEXSCREENER_API_KEY
vercel env add SUPABASE_URL
vercel env add SUPABASE_ANON_KEY
```

#### 2. Supabase Database Setup
```sql
-- Create tables for storing analysis data
CREATE TABLE coin_analyses (
    id SERIAL PRIMARY KEY,
    contract_address VARCHAR(50) UNIQUE NOT NULL,
    analysis_data JSONB NOT NULL,
    prediction_score INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE performance_tracking (
    id SERIAL PRIMARY KEY,
    contract_address VARCHAR(50) REFERENCES coin_analyses(contract_address),
    outcome VARCHAR(20) NOT NULL, -- 'success', 'failure', 'pending'
    days_since_launch INTEGER,
    market_cap VARCHAR(20),
    migration_status VARCHAR(20),
    performance_change VARCHAR(20),
    recorded_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE model_weights (
    id SERIAL PRIMARY KEY,
    factor_name VARCHAR(50) UNIQUE NOT NULL,
    weight_value DECIMAL(5,4) NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE coin_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_weights ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust based on your auth needs)
CREATE POLICY "Anyone can read analyses" ON coin_analyses FOR SELECT USING (true);
CREATE POLICY "Anyone can insert analyses" ON coin_analyses FOR INSERT WITH CHECK (true);
```

#### 3. Update Frontend for Database Integration
```javascript
// lib/supabase.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

// Save analysis to database
export async function saveAnalysis(contractAddress, analysisData, predictionScore) {
    const { data, error } = await supabase
        .from('coin_analyses')
        .insert([
            {
                contract_address: contractAddress,
                analysis_data: analysisData,
                prediction_score: predictionScore
            }
        ]);
    
    if (error) throw error;
    return data;
}

// Track performance outcome
export async function trackPerformance(contractAddress, outcomeData) {
    const { data, error } = await supabase
        .from('performance_tracking')
        .insert([
            {
                contract_address: contractAddress,
                ...outcomeData
            }
        ]);
    
    if (error) throw error;
    return data;
}
```

### Railway Deployment
Simple full-stack deployment with built-in PostgreSQL.

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and initialize
railway login
railway init

# Add PostgreSQL database
railway add postgresql

# Deploy
railway up
```

**Railway Configuration** (`railway.toml`):
```toml
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "npx http-server -p $PORT"
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
```

### Docker Deployment
For custom hosting environments or local development.

```dockerfile
# Dockerfile
FROM nginx:alpine

# Copy static files
COPY . /usr/share/nginx/html

# Copy custom nginx config
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  web:
    build: .
    ports:
      - "8080:80"
    environment:
      - DEXSCREENER_API_KEY=${DEXSCREENER_API_KEY}
      - ETHERSCAN_API_KEY=${ETHERSCAN_API_KEY}
  
  postgres:
    image: postgres:13
    environment:
      - POSTGRES_DB=meme_analyzer
      - POSTGRES_USER=analyzer
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

```bash
# Deploy with Docker
docker-compose up -d
```

## ⚙️ Environment Variables

### Client-Side Variables (Public)
```bash
# Next.js format (prefix with NEXT_PUBLIC_)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_APP_ENV=production
```

### Server-Side Variables (Private)
```bash
# API Keys (keep secret)
DEXSCREENER_API_KEY=your_key
ETHERSCAN_API_KEY=your_key
TWITTER_BEARER_TOKEN=your_token
COINGECKO_API_KEY=your_key
SUPABASE_SERVICE_KEY=your_service_key

# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Application
APP_SECRET=your_app_secret
JWT_SECRET=your_jwt_secret
```

## 🔒 Security Best Practices

### API Key Management
```javascript
// ❌ DON'T: Expose API keys in client-side code
const apiKey = 'sk-your-secret-key'; // Visible to everyone!

// ✅ DO: Use server-side endpoints
fetch('/api/analyze-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contractAddress })
});
```

### CORS Configuration
```javascript
// api/analyze-token.js
export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', 'https://your-domain.com');
    res.setHeader('Access-Control-Allow-Methods', 'POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    // Your API logic here
}
```

### Rate Limiting
```javascript
// middleware/rateLimit.js
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(10, '60 s'), // 10 requests per minute
});

export async function rateLimitMiddleware(req, res, next) {
    const { success } = await ratelimit.limit(req.ip);
    
    if (!success) {
        return res.status(429).json({ error: 'Rate limit exceeded' });
    }
    
    next();
}
```

## 📊 Monitoring & Analytics

### Performance Monitoring
```javascript
// lib/analytics.js
export function trackEvent(eventName, properties) {
    // Google Analytics 4
    if (typeof gtag !== 'undefined') {
        gtag('event', eventName, properties);
    }
    
    // Custom analytics
    fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            event: eventName,
            properties,
            timestamp: Date.now()
        })
    });
}

// Usage
trackEvent('token_analyzed', {
    contract_address: contractAddress,
    prediction_score: score,
    user_agent: navigator.userAgent
});
```

### Health Checks
```javascript
// api/health.js
export default async function handler(req, res) {
    try {
        // Check database connection
        const dbCheck = await checkDatabaseConnection();
        
        // Check external APIs
        const apiChecks = await Promise.all([
            checkDexScreener(),
            checkEtherscan(),
            checkSupabase()
        ]);
        
        res.status(200).json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            services: {
                database: dbCheck,
                dexscreener: apiChecks[0],
                etherscan: apiChecks[1],
                supabase: apiChecks[2]
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'unhealthy',
            error: error.message
        });
    }
}
```

## 🚨 Backup & Recovery

### Database Backup (Supabase)
```bash
# Automated daily backups
# Supabase handles this automatically for paid plans

# Manual backup
npx supabase db dump --db-url "your-db-url" > backup.sql
```

### Data Export/Import
```javascript
// Export user data
export async function exportUserData() {
    const analyses = JSON.parse(localStorage.getItem('memeAnalysisHistory') || '[]');
    const weights = JSON.parse(localStorage.getItem('memeModelWeights') || '{}');
    
    const exportData = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        data: { analyses, weights }
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meme-analyzer-backup-${Date.now()}.json`;
    a.click();
}
```

## 🎯 Performance Optimization

### CDN Configuration
```javascript
// next.config.js
module.exports = {
    images: {
        domains: ['assets.coingecko.com', 'dexscreener.com'],
        formats: ['image/webp', 'image/avif']
    },
    async headers() {
        return [
            {
                source: '/static/(.*)',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000, immutable'
                    }
                ]
            }
        ];
    }
};
```

### Service Worker for Offline Support
```javascript
// public/sw.js
const CACHE_NAME = 'meme-analyzer-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/styles.css',
    '/script.js'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(urlsToCache))
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                if (response) {
                    return response;
                }
                return fetch(event.request);
            })
    );
});
```

---

Choose the deployment option that best fits your needs. For beginners, start with GitHub Pages or Netlify. For production applications, use Vercel + Supabase or Railway for the best developer experience.
