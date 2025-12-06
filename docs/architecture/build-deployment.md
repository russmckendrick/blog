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
5.  **Build**: Run `pnpm run build` to generate the static assets and worker script.
6.  **Deploy**:
    - Uses `cloudflare/wrangler-action`.
    - Deploys to Cloudflare Workers using the API token and Account ID secrets.
7.  **Notification**: If triggered by a PR, it posts a comment with the build summary.

### Secrets Required
- `CLOUDFLARE_API_TOKEN`: Token for authenticating with Cloudflare.
- `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare Account ID.

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
