# CDN Migration Plan: Moving Assets to Cloudflare R2

**Author**: Claude Code
**Date**: 2025-10-31
**Status**: Planning
**Target CDN URL**: https://assets.russ.cloud/
**Storage Backend**: Cloudflare R2

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Problem Analysis](#problem-analysis)
3. [Solution Architecture](#solution-architecture)
4. [Prerequisites](#prerequisites)
5. [Implementation Steps](#implementation-steps)
6. [Deployment Workflow Changes](#deployment-workflow-changes)
7. [Testing Plan](#testing-plan)
8. [Rollback Strategy](#rollback-strategy)
9. [Cost Analysis](#cost-analysis)
10. [Monitoring & Maintenance](#monitoring--maintenance)
11. [Future Optimizations](#future-optimizations)

---

## Executive Summary

This document outlines a comprehensive migration plan to move static assets from the main Cloudflare Pages deployment to a dedicated Cloudflare R2 bucket served via a custom CDN domain (`assets.russ.cloud`).

**Primary Goals**:
- Reduce build and deployment times by 80%+ (from 10+ minutes to <2 minutes)
- Decrease deployment size by separating static assets from application code
- Eliminate redundant image optimization on every build
- Improve caching and asset delivery performance

**Key Benefits**:
- Assets are built once, served forever (until updated)
- Faster deployments to Cloudflare Pages
- Better separation of concerns (code vs. assets)
- Improved caching with custom cache headers
- No egress fees with Cloudflare R2

---

## Problem Analysis

### Current State

The blog currently experiences the following issues:

1. **Long Build Times**: Every build processes and optimizes hundreds of images
   - Image optimization via Sharp: ~5-8 minutes
   - Build compression via `@playform/compress`: ~2-3 minutes
   - Total build time: 10+ minutes

2. **Large Deployment Size**: All assets are deployed with every build
   - Images in `src/assets/`: ~500MB+ (unoptimized)
   - Images in `public/assets/`: ~300MB+ (unoptimized)
   - Generated derivatives (e.g., `-card.avif`): Additional ~200MB
   - Total optimized output: ~600MB in `dist/`

3. **Redundant Processing**: Assets are re-optimized even when unchanged
   - Same images optimized on every deployment
   - No caching of optimized assets between builds
   - GitHub Actions workflow re-optimizes weekly music posts

4. **Asset Fingerprinting**: Astro generates hashed filenames for cache-busting
   - Built assets: `dist/_astro/penguin.123456.png`
   - Public assets: Remain unmodified in `dist/assets/`

### Root Cause

The current architecture tightly couples asset processing with application deployment. While Astro's build system is efficient, the volume of images (10+ years of blog posts) makes this approach unsustainable.

---

## Solution Architecture

### Target Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Build Process                            │
│  1. Astro builds application code                           │
│  2. Images processed by Sharp (src/assets → dist/_astro)   │
│  3. CSS/JS bundled and minified                             │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ├── dist/ (HTML, CSS, JS only)
                  │   ├── _astro/*.css, *.js
                  │   └── [pages]/*.html
                  │
                  └── dist/_astro/ (optimized images)
                      └── penguin.123456.png
                          ↓
                      [Upload to R2]
                          ↓
┌─────────────────────────────────────────────────────────────┐
│              Cloudflare R2 Bucket: russ-cloud-assets         │
│  📦 Stores all static assets                                │
│  🌐 Served via assets.russ.cloud                            │
│  ♾️  Permanent storage with versioning                       │
└─────────────────────────────────────────────────────────────┘
                          │
                          ↓ (Custom Domain)
┌─────────────────────────────────────────────────────────────┐
│              assets.russ.cloud                               │
│  🔗 /_astro/penguin.123456.png                              │
│  🔗 /assets/2024-01-01-post/image.jpg                       │
│  📦 Cache-Control: public, max-age=31536000, immutable      │
└─────────────────────────────────────────────────────────────┘
                          │
                          ↓
┌─────────────────────────────────────────────────────────────┐
│           Cloudflare Pages: www.russ.cloud                   │
│  📄 HTML pages reference CDN assets                          │
│  🎨 CSS/JS bundled and deployed                             │
│  ⚡ Fast deployment (no assets, <2 minutes)                 │
└─────────────────────────────────────────────────────────────┘
```

### Key Components

1. **Cloudflare R2 Bucket**: `russ-cloud-assets`
   - Object storage for all static assets
   - S3-compatible API
   - Zero egress fees

2. **Custom Domain**: `assets.russ.cloud`
   - Cloudflare DNS record pointing to R2 bucket
   - Custom cache headers
   - WAF protection available

3. **Astro Config**: `build.assetsPrefix`
   - Points all `/_astro/*` asset URLs to CDN
   - Applied during build time
   - No runtime overhead

4. **Deployment Script**: Upload assets to R2
   - Uses `rclone` for bulk uploads
   - Syncs only changed files
   - Runs after Astro build

---

## Prerequisites

### Required Tools

1. **Wrangler CLI** (already installed via `devDependencies`)
   ```bash
   npm install -g wrangler
   # or use npx wrangler
   ```

2. **rclone** (for bulk uploads)
   ```bash
   # macOS
   brew install rclone

   # Linux
   curl https://rclone.org/install.sh | sudo bash

   # Verify installation
   rclone version  # Should be v1.59 or greater
   ```

3. **Cloudflare Account**
   - Active Cloudflare account with R2 enabled
   - Domain `russ.cloud` added to Cloudflare (already done)
   - R2 subscription (Free tier available: 10GB storage, no egress fees)

### Required Secrets

Add these to your local `.env` and GitHub repository secrets:

```bash
# Cloudflare R2 Credentials
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_R2_ACCESS_KEY_ID=your_access_key
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your_secret_key

# Optional: Cloudflare API Token (for domain setup)
CLOUDFLARE_API_TOKEN=your_api_token
```

---

## Implementation Steps

### Phase 1: R2 Bucket Setup

#### Step 1.1: Create R2 Bucket

```bash
# Using Wrangler (recommended)
npx wrangler r2 bucket create russ-cloud-assets

# Or via Cloudflare Dashboard:
# 1. Go to R2 → Overview → Create bucket
# 2. Name: russ-cloud-assets
# 3. Location: Automatic (or choose closest region)
```

#### Step 1.2: Generate R2 API Tokens

```bash
# Via Cloudflare Dashboard:
# 1. R2 → Overview → Manage R2 API Tokens
# 2. Create API Token
# 3. Permissions: Object Read & Write
# 4. Apply to specific bucket: russ-cloud-assets
# 5. Save Access Key ID and Secret Access Key
```

#### Step 1.3: Configure Custom Domain

**Option A: Via Dashboard (Recommended for Production)**

1. Navigate to R2 → Buckets → `russ-cloud-assets` → Settings
2. Under **Public Access** → **Custom Domains** → Click **Connect Domain**
3. Enter: `assets.russ.cloud`
4. Cloudflare will automatically create a CNAME record
5. Wait for DNS propagation (~5-10 minutes)

**Option B: Via API (Advanced)**

```bash
# Requires Cloudflare API token with Zone Edit permissions
curl -X PUT "https://api.cloudflare.com/client/v4/zones/{zone_id}/custom_hostnames" \
  -H "Authorization: Bearer {api_token}" \
  -H "Content-Type: application/json" \
  --data '{
    "hostname": "assets.russ.cloud",
    "ssl": {
      "method": "http",
      "type": "dv"
    }
  }'
```

#### Step 1.4: Configure CORS (if needed)

```bash
# Create cors.json
cat > cors.json <<EOF
{
  "AllowedOrigins": ["https://www.russ.cloud", "https://russ.cloud"],
  "AllowedMethods": ["GET", "HEAD"],
  "AllowedHeaders": ["*"],
  "ExposeHeaders": ["ETag"],
  "MaxAgeSeconds": 3600
}
EOF

# Apply CORS settings (via Wrangler or Dashboard)
# Dashboard: R2 → Buckets → russ-cloud-assets → Settings → CORS Policy
```

#### Step 1.5: Configure rclone

```bash
# Interactive configuration
rclone config

# Follow prompts:
# n) New remote
# name> r2
# Storage> s3
# provider> Cloudflare
# env_auth> 1 (false - enter credentials manually)
# access_key_id> [paste CLOUDFLARE_R2_ACCESS_KEY_ID]
# secret_access_key> [paste CLOUDFLARE_R2_SECRET_ACCESS_KEY]
# region> auto
# endpoint> https://[account_id].r2.cloudflarestorage.com
# location_constraint> [blank]
# acl> [blank]
# Advanced config> n
# y) Yes this is OK

# Verify configuration
rclone lsd r2:
```

**Alternative: Inline Configuration (for CI/CD)**

Create a script that doesn't require `~/.config/rclone/rclone.conf`:

```bash
#!/bin/bash
# scripts/sync-to-r2.sh

rclone sync dist/_astro/ :s3,provider=Cloudflare,env_auth=false,access_key_id=${CLOUDFLARE_R2_ACCESS_KEY_ID},secret_access_key=${CLOUDFLARE_R2_SECRET_ACCESS_KEY},endpoint=https://${CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com:russ-cloud-assets/_astro/ \
  --progress \
  --checksum \
  --cache-control "public, max-age=31536000, immutable" \
  --s3-upload-cutoff 5M
```

---

### Phase 2: Astro Configuration Changes

#### Step 2.1: Update `astro.config.mjs`

Add the `build.assetsPrefix` configuration:

```javascript
// astro.config.mjs
export default defineConfig({
  site: 'https://www.russ.cloud/',

  // Add CDN configuration
  build: {
    format: 'directory',
    inlineStylesheets: 'always',

    // CDN asset prefix
    assetsPrefix: 'https://assets.russ.cloud',

    // Optional: Customize _astro directory name
    // assets: 'static'  // Changes /_astro/ to /static/
  },

  // ... rest of config
});
```

**Advanced: Per-Type CDN Configuration**

If you want to serve different asset types from different CDNs:

```javascript
build: {
  assetsPrefix: {
    'js': 'https://js.assets.russ.cloud',
    'css': 'https://css.assets.russ.cloud',
    'fallback': 'https://assets.russ.cloud'  // Required!
  }
}
```

#### Step 2.2: Update Image Optimization Script (Optional)

Since assets will be uploaded separately, consider updating `scripts/optimize-images.js` to:

1. **Skip optimization during builds** for already-optimized images
2. **Add metadata file** to track optimization status
3. **Separate optimization from deployment**

Create a new script: `scripts/optimize-and-upload.js`

```javascript
#!/usr/bin/env node
/**
 * Optimizes images and uploads them directly to R2
 * This script runs independently of Astro builds
 */

import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';

// 1. Run image optimization
console.log('🔧 Optimizing images...');
execSync('npm run optimize', { stdio: 'inherit' });

// 2. Build Astro to process src/assets
console.log('📦 Building Astro assets...');
execSync('npm run build', { stdio: 'inherit' });

// 3. Upload to R2
console.log('☁️  Uploading to R2...');
execSync('bash scripts/sync-to-r2.sh', { stdio: 'inherit' });

console.log('✨ Done!');
```

---

### Phase 3: Create Deployment Scripts

#### Step 3.1: R2 Sync Script

Create `scripts/sync-to-r2.sh`:

```bash
#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Syncing assets to Cloudflare R2...${NC}"

# Check required environment variables
if [ -z "$CLOUDFLARE_R2_ACCESS_KEY_ID" ] || [ -z "$CLOUDFLARE_R2_SECRET_ACCESS_KEY" ] || [ -z "$CLOUDFLARE_ACCOUNT_ID" ]; then
  echo -e "${RED}❌ Error: Missing required environment variables${NC}"
  echo "Please set:"
  echo "  - CLOUDFLARE_ACCOUNT_ID"
  echo "  - CLOUDFLARE_R2_ACCESS_KEY_ID"
  echo "  - CLOUDFLARE_R2_SECRET_ACCESS_KEY"
  exit 1
fi

# Check if dist/_astro exists
if [ ! -d "dist/_astro" ]; then
  echo -e "${RED}❌ Error: dist/_astro directory not found${NC}"
  echo "Please run 'npm run build' first"
  exit 1
fi

# Sync _astro directory to R2
echo -e "${YELLOW}📦 Syncing dist/_astro/ to R2...${NC}"
rclone sync dist/_astro/ \
  ":s3,provider=Cloudflare,env_auth=false,access_key_id=${CLOUDFLARE_R2_ACCESS_KEY_ID},secret_access_key=${CLOUDFLARE_R2_SECRET_ACCESS_KEY},endpoint=https://${CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com:russ-cloud-assets/_astro/" \
  --progress \
  --stats 1m \
  --checksum \
  --header "Cache-Control: public, max-age=31536000, immutable" \
  --header "Content-Type: image/jpeg" \
  --s3-upload-cutoff 5M \
  --s3-chunk-size 5M \
  --transfers 8 \
  --checkers 8

# Optional: Sync public/assets if you want to move those too
if [ -d "dist/assets" ]; then
  echo -e "${YELLOW}📦 Syncing dist/assets/ to R2...${NC}"
  rclone sync dist/assets/ \
    ":s3,provider=Cloudflare,env_auth=false,access_key_id=${CLOUDFLARE_R2_ACCESS_KEY_ID},secret_access_key=${CLOUDFLARE_R2_SECRET_ACCESS_KEY},endpoint=https://${CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com:russ-cloud-assets/assets/" \
    --progress \
    --stats 1m \
    --checksum \
    --header "Cache-Control: public, max-age=604800" \
    --s3-upload-cutoff 5M \
    --s3-chunk-size 5M \
    --transfers 8 \
    --checkers 8
fi

echo -e "${GREEN}✅ Sync complete!${NC}"
echo -e "Assets are now available at: ${GREEN}https://assets.russ.cloud/${NC}"
```

Make it executable:

```bash
chmod +x scripts/sync-to-r2.sh
```

#### Step 3.2: Add NPM Scripts

Update `package.json`:

```json
{
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "build:full": "npm run build && bash scripts/sync-to-r2.sh",
    "preview": "astro preview",
    "astro": "astro",
    "post": "node scripts/new-post.js",
    "tunes": "node scripts/generate-tunes-post.js",
    "optimize": "node scripts/optimize-images.js",
    "sync:r2": "bash scripts/sync-to-r2.sh",
    "deploy": "npm run build:full && npx wrangler pages deploy dist"
  }
}
```

---

### Phase 4: Update CI/CD Pipeline

#### Step 4.1: Add R2 Secrets to GitHub

1. Go to your repository → Settings → Secrets and variables → Actions
2. Add the following repository secrets:
   - `CLOUDFLARE_ACCOUNT_ID`
   - `CLOUDFLARE_R2_ACCESS_KEY_ID`
   - `CLOUDFLARE_R2_SECRET_ACCESS_KEY`

#### Step 4.2: Update GitHub Actions Workflow

Update `.github/workflows/weekly-tunes.yml`:

```yaml
name: Generate Weekly Listened to Blog Post

on:
  workflow_dispatch:
  schedule:
    - cron: "00 02 * * 1"

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - name: "👨‍💻 Check out code"
        uses: actions/checkout@v5

      - name: "🟢 Set up Node.js"
        uses: actions/setup-node@v5
        with:
          node-version: '20'
          cache: 'npm'

      - name: "🦾 Install dependencies"
        run: npm ci

      - name: "📦 Install rclone"
        run: |
          curl https://rclone.org/install.sh | sudo bash
          rclone version

      - name: "🏃‍♂️ Run the script to generate blog post"
        env:
          LASTFM_USER: "${{ secrets.LASTFM_USER }}"
          LASTFM_API_KEY: "${{ secrets.LASTFM_API_KEY }}"
          COLLECTION_URL: "${{ secrets.COLLECTION_URL }}"
          OPENAI_API_KEY: "${{ secrets.OPENAI_API_KEY }}"
          TAVILY_API_KEY: "${{ secrets.TAVILY_API_KEY }}"
        run: npm run tunes

      - name: "🖼️ Optimize images"
        run: |
          WEEK_FOLDER=$(ls -td src/assets/*-listened-to-this-week 2>/dev/null | head -1)
          if [ -n "$WEEK_FOLDER" ]; then
            echo "Optimizing images in $WEEK_FOLDER"
            npm run optimize "$WEEK_FOLDER"
          else
            echo "No weekly folder found to optimize"
          fi

      - name: "🏗️ Build Astro site"
        run: npm run build

      - name: "☁️ Upload assets to R2"
        env:
          CLOUDFLARE_ACCOUNT_ID: "${{ secrets.CLOUDFLARE_ACCOUNT_ID }}"
          CLOUDFLARE_R2_ACCESS_KEY_ID: "${{ secrets.CLOUDFLARE_R2_ACCESS_KEY_ID }}"
          CLOUDFLARE_R2_SECRET_ACCESS_KEY: "${{ secrets.CLOUDFLARE_R2_SECRET_ACCESS_KEY }}"
        run: bash scripts/sync-to-r2.sh

      - name: "🚨 Create Pull Request"
        uses: peter-evans/create-pull-request@v7
        with:
          token: "${{ secrets.GITHUB_TOKEN }}"
          commit-message: "🤖 Add weekly listened to blog post"
          title: "🤖 Add weekly listened to blog post"
          body: "This week, I have mostly been listening to..."
          branch: "weekly-listened-to-blog-post"
          branch-suffix: timestamp
```

#### Step 4.3: Create Main Deployment Workflow (Optional)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Cloudflare Pages

on:
  push:
    branches:
      - main
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      deployments: write

    steps:
      - name: "👨‍💻 Check out code"
        uses: actions/checkout@v5

      - name: "🟢 Set up Node.js"
        uses: actions/setup-node@v5
        with:
          node-version: '20'
          cache: 'npm'

      - name: "🦾 Install dependencies"
        run: npm ci

      - name: "📦 Install rclone"
        run: |
          curl https://rclone.org/install.sh | sudo bash
          rclone version

      - name: "🏗️ Build site"
        run: npm run build

      - name: "☁️ Upload assets to R2"
        env:
          CLOUDFLARE_ACCOUNT_ID: "${{ secrets.CLOUDFLARE_ACCOUNT_ID }}"
          CLOUDFLARE_R2_ACCESS_KEY_ID: "${{ secrets.CLOUDFLARE_R2_ACCESS_KEY_ID }}"
          CLOUDFLARE_R2_SECRET_ACCESS_KEY: "${{ secrets.CLOUDFLARE_R2_SECRET_ACCESS_KEY }}"
        run: bash scripts/sync-to-r2.sh

      - name: "🚀 Deploy to Cloudflare Pages"
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: russ-cloud
          directory: dist
          gitHubToken: ${{ secrets.GITHUB_TOKEN }}
```

---

### Phase 5: Initial Asset Upload

Before enabling the CDN in production, upload all existing assets:

```bash
# 1. Build the site to generate optimized assets
npm run build

# 2. Upload all assets to R2
npm run sync:r2

# 3. Verify assets are accessible
curl -I https://assets.russ.cloud/_astro/some-file.hash.png

# Expected: HTTP/2 200
```

---

## Deployment Workflow Changes

### Before (Current State)

```
1. Developer commits code
2. GitHub Action triggers
3. npm ci (install dependencies)
4. npm run build
   - Astro builds site (~2 min)
   - Sharp optimizes ALL images (~5-8 min)
   - @playform/compress compresses output (~2-3 min)
5. Deploy dist/ to Cloudflare Pages (~2-3 min)

Total: 10-15 minutes
```

### After (With R2 CDN)

```
1. Developer commits code
2. GitHub Action triggers
3. npm ci (install dependencies)
4. npm run build
   - Astro builds site (~2 min)
   - Sharp processes src/assets → dist/_astro (~1 min)
   - @playform/compress (images disabled) (~30s)
5. rclone sync dist/_astro to R2 (~1-2 min, only changed files)
6. Deploy dist/ to Cloudflare Pages (~1 min, much smaller)

Total: 4-6 minutes (60% reduction!)
```

### Build Size Comparison

| Component | Before | After | Savings |
|-----------|--------|-------|---------|
| HTML/CSS/JS | ~50MB | ~50MB | - |
| `/_astro/*` images | ~400MB | ❌ (on CDN) | -400MB |
| `/assets/*` images | ~200MB | ~200MB* | - |
| **Total Deploy Size** | **~650MB** | **~250MB** | **-400MB (62%)** |

\* *Optional: Can also move `/assets/*` to CDN*

---

## Testing Plan

### Phase 1: Local Testing

```bash
# 1. Build with CDN config
npm run build

# 2. Check generated HTML references CDN
grep -r "assets.russ.cloud" dist/

# Expected output:
# dist/index.html:<img src="https://assets.russ.cloud/_astro/hero.abc123.jpg">
# dist/2024/01/01/post/index.html:<link href="https://assets.russ.cloud/_astro/main.xyz789.css">

# 3. Upload to R2
npm run sync:r2

# 4. Preview site locally (with CDN)
npm run preview

# 5. Verify assets load from CDN
# Open DevTools → Network tab
# Filter by "assets.russ.cloud"
# Ensure images load successfully
```

### Phase 2: Staging Deployment

1. **Create a staging branch**:
   ```bash
   git checkout -b cdn-migration
   ```

2. **Deploy to Cloudflare Pages preview**:
   ```bash
   npx wrangler pages deploy dist --branch=cdn-migration
   ```

3. **Test checklist**:
   - [ ] Homepage loads without errors
   - [ ] Blog post images display correctly
   - [ ] Cover images render
   - [ ] LightGallery images load
   - [ ] Avatar images display
   - [ ] CSS and JS bundles load from CDN
   - [ ] Dark mode assets load correctly
   - [ ] OG images generate with correct URLs
   - [ ] RSS feed references correct image URLs

4. **Performance testing**:
   ```bash
   # Run Lighthouse audit
   npx lighthouse https://cdn-migration.russ-cloud.pages.dev --view

   # Expected improvements:
   # - Faster Time to First Byte (TTFB) for images
   # - Better caching scores
   # - Improved LCP (Largest Contentful Paint)
   ```

### Phase 3: Canary Deployment

1. **Deploy to production with feature flag**:
   ```javascript
   // astro.config.mjs
   const USE_CDN = process.env.USE_CDN === 'true';

   export default defineConfig({
     build: {
       assetsPrefix: USE_CDN ? 'https://assets.russ.cloud' : undefined
     }
   });
   ```

2. **Monitor for 24-48 hours**:
   - Check Cloudflare Analytics for 404s
   - Monitor R2 bandwidth usage
   - Review user-reported issues

3. **Verify CDN caching**:
   ```bash
   curl -I https://assets.russ.cloud/_astro/image.abc123.jpg

   # Check headers:
   # Cache-Control: public, max-age=31536000, immutable
   # CF-Cache-Status: HIT (after first request)
   ```

---

## Rollback Strategy

### Quick Rollback (Emergency)

If issues arise in production:

```bash
# 1. Disable CDN in Astro config
# astro.config.mjs: Comment out build.assetsPrefix

# 2. Rebuild without CDN
npm run build

# 3. Deploy immediately
npx wrangler pages deploy dist

# Estimated rollback time: 5-7 minutes
```

### Rollback Checklist

- [ ] Comment out `build.assetsPrefix` in `astro.config.mjs`
- [ ] Rebuild site: `npm run build`
- [ ] Re-enable image compression: `Image: true` in `@playform/compress`
- [ ] Deploy to Cloudflare Pages
- [ ] Verify assets load from main domain
- [ ] Monitor for resolution of issues

### Data Retention

- **Keep R2 bucket intact** during rollback
- Assets remain accessible at `assets.russ.cloud`
- Can re-enable CDN once issues resolved
- No data loss risk

---

## Cost Analysis

### Current Costs (Cloudflare Pages)

| Item | Cost |
|------|------|
| Cloudflare Pages | **Free** (Free tier: Unlimited requests, 500 builds/month) |
| Bandwidth (Cloudflare) | **Free** (Unlimited) |
| Build minutes | **Free** (500 builds × 15 min = 7,500 min/month) |
| **Total** | **$0/month** |

**Pain Point**: Long build times (not cost, but time investment)

---

### Proposed Costs (Pages + R2)

| Item | Cost | Notes |
|------|------|-------|
| **Cloudflare Pages** | **Free** | Unlimited requests |
| **R2 Storage** | **$0.015/GB/month** | First 10GB free |
| **R2 Class A Operations** | **$4.50/million** | Uploads, lists (rare) |
| **R2 Class B Operations** | **$0.36/million** | Downloads from R2 to Pages |
| **R2 Egress** | **Free** | No egress fees via Cloudflare CDN |

#### Estimated Monthly Costs

Assumptions:
- Total assets: ~600MB (~0.6GB)
- Monthly uploads: ~500 (weekly posts + updates)
- Monthly downloads (internal): ~10,000 (Cloudflare Pages requests to R2)
- Public requests: Served via CDN (free)

| Item | Calculation | Cost |
|------|-------------|------|
| Storage | 0.6GB × $0.015 | **Free** (under 10GB) |
| Class A Ops | 500 / 1,000,000 × $4.50 | **$0.002** |
| Class B Ops | 10,000 / 1,000,000 × $0.36 | **$0.004** |
| **Total** | | **~$0.01/month** |

**Effective Cost**: **Free** (under R2 free tier limits)

---

### Cost Savings: Time = Money

| Metric | Before | After | Savings |
|--------|--------|-------|---------|
| Build time | 15 min | 5 min | **10 min/build** |
| Builds/month | ~20 | ~20 | - |
| **Time saved** | - | - | **200 min/month (3.3 hrs)** |
| Developer time saved (@ $100/hr) | - | - | **$330/month** |

**ROI**: Infinite (free solution, saves developer time)

---

## Monitoring & Maintenance

### Cloudflare Analytics

Monitor the following metrics:

1. **R2 Storage Metrics**:
   - Navigate to: R2 → `russ-cloud-assets` → Metrics
   - Track: Storage usage, request count, data transfer

2. **Custom Domain Analytics**:
   - Navigate to: DNS → Analytics → `assets.russ.cloud`
   - Track: Request count, cache hit ratio, error rates

3. **Set Up Alerts**:
   ```bash
   # Via Cloudflare Dashboard:
   # Account Home → Notifications → Add
   # Alert Type: R2 bucket usage threshold
   # Threshold: 8GB (80% of free tier)
   ```

### Health Checks

Create a simple monitoring script:

```bash
#!/bin/bash
# scripts/health-check-cdn.sh

# Test CDN availability
STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://assets.russ.cloud/_astro/health.txt)

if [ "$STATUS" -eq 200 ]; then
  echo "✅ CDN is healthy"
  exit 0
else
  echo "❌ CDN returned $STATUS"
  exit 1
fi
```

Add a health check file:

```bash
# Create a test file in public/
echo "OK" > public/_astro/health.txt
```

### Maintenance Tasks

| Task | Frequency | Command |
|------|-----------|---------|
| Check R2 storage usage | Weekly | Check Cloudflare Dashboard |
| Review orphaned assets | Monthly | `rclone lsl r2:russ-cloud-assets` |
| Purge old assets | Quarterly | Manual review + delete |
| Update rclone | Quarterly | `brew upgrade rclone` |
| Review cache hit ratio | Monthly | Cloudflare Analytics |

---

## Future Optimizations

### Phase 2: Image CDN with Transformations

Consider using Cloudflare Images for on-the-fly transformations:

```javascript
// Replace static images with dynamic URLs
// Before: <img src="/_astro/hero.abc123.jpg">
// After:  <img src="https://assets.russ.cloud/cdn-cgi/image/width=800,format=auto/hero.jpg">
```

**Benefits**:
- Automatic format conversion (WebP, AVIF)
- Responsive image variants
- No build-time image processing

**Cost**: Cloudflare Images - $5/month (up to 100k images)

---

### Phase 3: Move `public/assets` to CDN

Currently, `public/assets/` files are not processed by Astro and remain in `dist/assets/`.

**Migration Path**:

1. Update all MDX files referencing `/assets/` to use CDN URL
2. Upload `public/assets/` to R2
3. Use URL rewrite or symlink for backward compatibility

**Script**:

```bash
# Sync public assets to R2
rclone sync public/assets/ r2:russ-cloud-assets/assets/

# Update astro.config.mjs to rewrite /assets/ URLs
# Or: Add Cloudflare Worker to redirect /assets/* to CDN
```

---

### Phase 4: Asset Versioning & Rollbacks

Implement versioned asset deployments:

```bash
# Upload to versioned directory
rclone sync dist/_astro/ r2:russ-cloud-assets/v2025-10-31/_astro/

# Update Astro config to point to specific version
build: {
  assetsPrefix: 'https://assets.russ.cloud/v2025-10-31'
}

# Easy rollback: Change version in config and redeploy
```

---

## Conclusion

This migration plan provides a comprehensive path to:

1. ✅ Reduce build times by 60% (from ~15min to ~5min)
2. ✅ Decrease deployment size by 62% (from ~650MB to ~250MB)
3. ✅ Eliminate redundant image optimization
4. ✅ Improve caching and performance
5. ✅ Maintain zero-cost infrastructure

**Recommended Timeline**:

- **Week 1**: Setup R2 bucket, configure custom domain, test rclone
- **Week 2**: Update Astro config, create deployment scripts, test locally
- **Week 3**: Deploy to staging, run comprehensive tests
- **Week 4**: Canary deployment, monitor for 48 hours, full rollout

**Next Steps**:

1. Review this plan with stakeholders
2. Create R2 bucket and configure `assets.russ.cloud`
3. Test asset upload/download workflow
4. Update Astro configuration
5. Run staging deployment
6. Monitor and deploy to production

---

## Appendices

### Appendix A: Useful Commands

```bash
# Check R2 bucket contents
rclone lsd r2:

# List files in bucket
rclone lsl r2:russ-cloud-assets/_astro/

# Check file on CDN
curl -I https://assets.russ.cloud/_astro/image.abc123.jpg

# Dry-run sync (see what would be uploaded)
rclone sync dist/_astro/ r2:russ-cloud-assets/_astro/ --dry-run

# Force upload all files
rclone copy dist/_astro/ r2:russ-cloud-assets/_astro/ --progress

# Delete orphaned assets
rclone delete r2:russ-cloud-assets/_astro/ --min-age 90d
```

### Appendix B: Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| 404 on CDN assets | Assets not uploaded | Run `npm run sync:r2` |
| CORS errors | Missing CORS config | Add allowed origins in R2 settings |
| Slow uploads | Large file size | Check rclone `--transfers` and `--checkers` |
| Cache not working | Missing headers | Verify `Cache-Control` in rclone command |
| Custom domain not resolving | DNS not propagated | Wait 5-10 minutes, check Cloudflare DNS |

### Appendix C: References

- [Astro Assets Documentation](https://docs.astro.build/en/guides/images/)
- [Astro `build.assetsPrefix` Reference](https://docs.astro.build/en/reference/configuration-reference/#buildassetsprefix)
- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
- [rclone Cloudflare R2 Setup](https://developers.cloudflare.com/r2/examples/rclone/)
- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)

---

**Document Version**: 1.0
**Last Updated**: 2025-10-31
**Maintained By**: Claude Code
