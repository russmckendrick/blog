# Build Optimization Guide

## Problem Analysis

The Cloudflare Pages native build was taking **over 20 minutes** and timing out. Analysis revealed:

- **9,320 image operations** during each build
- Only **173 source images**, but Astro generates ~53 variations per image
- Each image is processed into multiple formats (webp, avif, png) and sizes
- No caching between builds, so every image is reprocessed every time
- Total build log: 2MB, 15,270 lines

### Build Timeline Breakdown

```
09:32:07 - Build starts
09:32:46 - Static routes generation begins
09:49:13 - Image processing completes (14+ minutes!)
09:51:37 - Build timeout
```

## Solution: GitHub Actions with Smart Caching

The new workflow (`.github/workflows/deploy.yml`) implements:

### 1. **Astro Build Cache** (Primary Optimization)
Caches processed images in `node_modules/.astro/` directory:
- First build: ~20 minutes (processes all images)
- Subsequent builds: ~2-5 minutes (only new/changed images)
- Cache key based on `src/**` and `public/**` file hashes
- Restores partial cache even if files changed

### 2. **npm Dependency Cache**
Uses `actions/setup-node@v4` built-in caching:
- Caches `node_modules/` based on `package-lock.json`
- Reduces `npm ci` time from 50s to ~10s

### 3. **Direct Cloudflare Pages Deployment**
Uses Wrangler CLI instead of Cloudflare's build system:
- Full control over build environment
- Better caching support
- More detailed build logs
- Can run builds in parallel for different branches

## Setup Instructions

### 1. Get Cloudflare Credentials

You need two values from your Cloudflare account:

**Cloudflare API Token:**
1. Go to: https://dash.cloudflare.com/profile/api-tokens
2. Click "Create Token"
3. Use the "Edit Cloudflare Workers" template
4. Add additional permission: "Cloudflare Pages - Edit"
5. Include your account under "Account Resources"
6. Create token and copy it

**Cloudflare Account ID:**
1. Go to: https://dash.cloudflare.com/
2. Select your website
3. Scroll down on the Overview page
4. Find "Account ID" in the right sidebar
5. Copy the ID

### 2. Add GitHub Secrets

Add these secrets to your repository:

1. Go to: `https://github.com/YOUR_USERNAME/YOUR_REPO/settings/secrets/actions`
2. Click "New repository secret"
3. Add each secret:

| Secret Name | Value | Where to Get |
|------------|-------|--------------|
| `CLOUDFLARE_API_TOKEN` | Your API token | From step 1 above |
| `CLOUDFLARE_ACCOUNT_ID` | Your account ID | From step 1 above |

### 3. Update Cloudflare Pages Settings

Since you're now deploying via GitHub Actions:

1. Go to: https://dash.cloudflare.com/ → Workers & Pages
2. Select your site (`russ-cloud`)
3. Go to Settings → Builds & deployments
4. **Disable automatic deployments** (optional but recommended)
   - This prevents Cloudflare from trying to build alongside GitHub Actions
   - Or leave enabled and GitHub Actions will be faster

### 4. Verify Deployment

1. Push to `main` branch or create a PR
2. Watch the Actions tab: `https://github.com/YOUR_USERNAME/YOUR_REPO/actions`
3. First build will take ~20 minutes (establishing cache)
4. Subsequent builds should take ~2-5 minutes

## Performance Comparison

| Build System | First Build | Subsequent Builds | Caching | Timeout |
|--------------|-------------|-------------------|---------|---------|
| **Cloudflare Native** | 20+ min | 20+ min | ❌ None | ✅ Enforced (30min) |
| **GitHub Actions** | ~20 min | ~2-5 min | ✅ Smart cache | ✅ Configurable |

## Build Cache Strategy

The workflow uses a smart caching strategy:

```yaml
key: astro-build-${{ hashFiles('src/**', 'public/**') }}
restore-keys: |
  astro-build-
```

**How it works:**
- **Exact match:** If no files changed, uses complete cache → Build in ~2 min
- **Partial match:** If some files changed, uses partial cache → Build in ~5 min
- **No match:** If everything changed, rebuilds all → Build in ~20 min

**What triggers cache invalidation:**
- ✅ Changed blog posts (only regenerates affected images)
- ✅ New images (only processes new images)
- ✅ Modified components (rebuilds pages, uses cached images)
- ❌ Changed dependencies (cache still valid)
- ❌ Changed config (cache still valid unless affects image processing)

## Maintenance

### Clearing the Cache

If you need to force a complete rebuild:

1. Go to: `https://github.com/YOUR_USERNAME/YOUR_REPO/actions/caches`
2. Delete caches matching `astro-build-*`
3. Next build will regenerate everything

### Monitoring Build Performance

Check build summaries in GitHub Actions:
- Build directory size
- Number of files generated
- Time breakdown for each step

### Troubleshooting

**Build still slow after first run:**
- Check if cache is being restored (look for "Cache restored" in logs)
- Verify cache key is stable (shouldn't change on every build)
- Check if image source files are changing between builds

**Deployment fails:**
- Verify Cloudflare secrets are correct
- Check Cloudflare Pages project name matches (`russ-cloud`)
- Ensure API token has correct permissions

**Out of disk space:**
- GitHub Actions runners have 14GB disk space
- Cached data counts toward this limit
- May need to reduce cache size or clear old caches

## Advanced Optimizations (Future)

Consider these if builds are still too slow:

1. **Pre-optimize images before commit:**
   ```bash
   npm run optimize src/assets/
   ```
   This reduces the number of operations Astro needs to perform.

2. **Reduce responsive image sizes:**
   Edit `astro.config.mjs` to limit the number of sizes generated.

3. **Use external image CDN:**
   Store images on Cloudflare Images or similar CDN to bypass build-time processing.

4. **Parallel builds:**
   Split build into multiple jobs (HTML + images separately).

5. **Incremental builds:**
   Use Astro's experimental incremental build feature (when available).

## Additional Resources

- [Astro Build Performance](https://docs.astro.build/en/guides/performance/)
- [GitHub Actions Caching](https://docs.github.com/en/actions/using-workflows/caching-dependencies-to-speed-up-workflows)
- [Cloudflare Pages Deployment](https://developers.cloudflare.com/pages/how-to/use-direct-upload-with-continuous-integration/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)
