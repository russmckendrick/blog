# Build & Deployment

This project uses [GitHub Actions](https://github.com/features/actions) for CI/CD, handling both the production deployment of the blog and the automated generation of weekly music posts.

## Production Deployment

**Workflow File**: `.github/workflows/deploy.yml`

This workflow handles building the Astro site and deploying it to Cloudflare Workers.

### Triggers
- **Push** to the `main` branch.
- **Pull Request** targeting the `main` branch.

### Process
1.  **Setup**: Check out code, setup PNPM, and setup Node.js v20.
2.  **Dependencies**: Install dependencies using `pnpm install --frozen-lockfile`.
3.  **Audit**: Run `pnpm audit` to check for security vulnerabilities.
4.  **Cache**: Restore `node_modules/.cache` to speed up builds (specifically for OpenGraph image generation).
5.  **Build**: Run `pnpm run build` which includes:
    - `prebuild`: Extract hero colors, cache LinkPreview images, fetch reading list, and cache up to 10 new reading list OG images
    - `astro build`: Generate static assets and worker script
6.  **Deploy**:
    - Uses `cloudflare/wrangler-action`.
    - Deploys to Cloudflare Workers using the API token and Account ID secrets.
7.  **Notification**: If triggered by a PR, it posts a comment with the build summary.

### Secrets Required
- `CLOUDFLARE_API_TOKEN`: Token for authenticating with Cloudflare.
- `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare Account ID.
- `INSTAPAPER_CONSUMER_KEY` / `INSTAPAPER_CONSUMER_SECRET` / `INSTAPAPER_USERNAME` / `INSTAPAPER_PASSWORD`: For fetching the reading list during prebuild.

---

## Weekly Tunes Generation

**Workflow File**: `.github/workflows/weekly-tunes.yml`

This workflow automates the creation of the "Weekly Listened To" blog posts by aggregating data from Last.fm and other sources.

### Triggers
- **Schedule**: Mondays at 02:00 UTC (`00 02 * * 1`).
- **Manual**: Can be triggered manually via standard `workflow_dispatch`.

### Process
1.  **Setup**: Check out code, setup PNPM, and setup Node.js v20.
2.  **Cache**: Restore `scripts/.research-cache` to reuse AI research results for albums (saving API costs).
3.  **Generation**:
    - Runs `pnpm run tunes`.
    - Queries Last.fm for the previous week's top albums.
    - Uses Perplexity/Exa/Tavily/OpenAI to fetch album descriptions, genres, and context.
    - Generates a new MDX blog post.
4.  **Optimization**: Runs `pnpm run optimize` on the generated images for the week.
5.  **Pull Request**:
    - Creates a new branch `weekly-listened-to-blog-post`.
    - Generates a PR summary with stats (artist/album count) and a list of top albums.
    - Opens a PR for review and merging.

### Secrets Required
- `LASTFM_USER` / `LASTFM_API_KEY`: For fetching listening history.
- `OPENAI_API_KEY`: For generating content.
- `PERPLEXITY_API_KEY` / `EXA_API_KEY` / `TAVILY_API_KEY`: For researching album details.
- `FAL_KEY`: For generating or processing images (if applicable).
- `COLLECTION_URL`: (Optional) For linking to a personal collection.

---

## Link Preview Image Refresh

**Workflow File**: `.github/workflows/refresh-link-previews.yml`

This workflow refreshes cached Open Graph images for `<LinkPreview>` components to ensure they stay up to date.

### Triggers
- **Schedule**: Sundays at 06:00 UTC (`0 6 * * 0`).
- **Manual**: Can be triggered manually via `workflow_dispatch` with optional `force` parameter.

### Process
1.  **Setup**: Check out code, setup PNPM, and setup Node.js v20.
2.  **Dependencies**: Install dependencies using `pnpm install --frozen-lockfile`.
3.  **Refresh**:
    - Runs `node scripts/cache-link-preview-images.js --refresh-stale`.
    - Re-downloads OG images older than 7 days.
    - If `force` input is true, re-downloads all images.
4.  **Commit**: If changes detected, commits updated images and manifest to `main`.

### Files Updated
- `public/assets/link-previews/*.jpg` - Cached OG images
- `src/data/link-preview-cache.json` - URL-to-path manifest

### Notes
- Images are committed to the repo, not stored in Actions cache
- This ensures images are always available during builds without network dependency
- Manual trigger with `force: true` re-downloads all images regardless of age

---

## Reading List Image Refresh

**Workflow File**: `.github/workflows/refresh-reading-images.yml`

This workflow refreshes cached Open Graph images for reading list cards, ensuring new bookmarks get images and stale ones are updated.

### Triggers
- **Schedule**: Sundays at 07:00 UTC (`0 7 * * 0`), one hour after link preview refresh.
- **Manual**: Can be triggered manually via `workflow_dispatch` with optional `force` parameter.

### Process
1.  **Setup**: Check out code, setup PNPM, and setup Node.js v22.
2.  **Dependencies**: Install dependencies using `pnpm install --frozen-lockfile`.
3.  **Fetch Reading List**: Runs `node scripts/fetch-reading-list.js` to sync the latest bookmarks from Instapaper.
4.  **Refresh**:
    - Runs `node scripts/cache-reading-images.js --refresh-stale`.
    - Re-downloads OG images older than 7 days.
    - If `force` input is true, re-downloads all images.
5.  **Commit**: If changes detected, commits updated images and manifest to `main`.

### Files Updated
- `public/assets/reading-previews/*.jpg` - Cached OG images
- `src/data/reading-image-cache.json` - URL-to-path manifest (includes `localImage`, `originalImage`, `imageType`, `title`, `description`, `imageAlt`, and `fetchedAt` per entry)

### Secrets Required
- `INSTAPAPER_CONSUMER_KEY` / `INSTAPAPER_CONSUMER_SECRET` / `INSTAPAPER_USERNAME` / `INSTAPAPER_PASSWORD`: For fetching bookmarks.

### Notes
- Images are committed to the repo, same as link preview images
- During regular builds, `prebuild` only caches up to 10 new uncached URLs (`--limit 10`) to keep build times short
- The weekly workflow handles the full refresh
- The `--limit` flag filters to uncached URLs first, then caps at N, so existing images are never re-fetched
