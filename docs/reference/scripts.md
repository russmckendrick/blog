# Scripts Reference

Reference for the repository's `scripts/` directory, including runnable scripts, supporting configuration, templates, generated caches, and internal helper modules.

## Package Script Entry Points

These are the scripts exposed through `package.json` and intended for regular use:

| Command | Entry point | Purpose |
|---------|-------------|---------|
| `pnpm run post` | `scripts/new-post.js` | Create a new blog post and optionally generate an AI cover |
| `pnpm run tunes` | `scripts/generate-tunes-post.js` | Generate the weekly tunes post from Last.fm data |
| `pnpm run wrapped` | `scripts/generate-year-wrapped.js` | Generate the annual wrapped post |
| `pnpm run medium` | `scripts/publish-to-medium.js` | Publish an existing post to Medium |
| `pnpm run optimize` | `scripts/optimize-images.js` | Optimize source and public image assets |
| `pnpm run analyze-links` | `scripts/analyze-internal-links.js` | Audit internal linking between posts |
| `pnpm run extract-colors` | `scripts/extract-hero-colors.js` | Rebuild `src/data/hero-colors.json` from hero images |
| `pnpm run cache-link-previews` | `scripts/cache-link-preview-images.js` | Download and cache OG images for `LinkPreview` embeds |
| `pnpm run refresh-link-previews` | `scripts/cache-link-preview-images.js --refresh-stale` | Refresh stale cached OG images |
| `pnpm run prebuild` | `pnpm run extract-colors && node scripts/cache-link-preview-images.js` | Prepare image metadata before production builds |

## Top-Level Scripts

### Content And Publishing

| File | Status | Notes |
|------|--------|-------|
| `scripts/new-post.js` | primary | Interactive blog post creator used by `pnpm run post` |
| `scripts/generate-tunes-post.js` | primary | Weekly tunes orchestrator; uses Last.fm, collection metadata, AI research, templates, and cover generation |
| `scripts/generate-year-wrapped.js` | primary | Year-end wrapped orchestrator with statistics, charts, and cover generation |
| `scripts/publish-to-medium.js` | primary | Medium publishing CLI with optional Gist extraction for code blocks |

### Image And Asset Pipelines

| File | Status | Notes |
|------|--------|-------|
| `scripts/optimize-images.js` | primary | Optimizes files in `src/assets/` and `public/assets/`, optionally for a single path |
| `scripts/extract-hero-colors.js` | primary | Extracts dominant colors from hero images for gradient backgrounds |
| `scripts/cache-link-preview-images.js` | primary | Scans MDX for `<LinkPreview>` usage and caches OG images locally |
| `scripts/fal-cover-generator.js` | manual | AI blog cover generator used by `new-post.js` and manual cover generation flows |
| `scripts/regenerate-cover.js` | manual | Regenerate a blog cover for an existing MDX post |
| `scripts/fal-collage.js` | manual/internal | FAL-based tunes collage generator with multiple composition strategies |
| `scripts/strip-collage.js` | internal/manual | Deterministic strip-collage generator used for tunes and wrapped covers |
| `scripts/wrapped-cover-generator.js` | internal | AI-assisted wrapped cover compositor |
| `scripts/generate-covers-batch.js` | manual | Batch-generate strip collages for existing tunes asset folders |
| `scripts/bulk-listen.js` | manual | Run `fal-collage.js` over a date range of weekly tunes folders |

### Analysis, Migration, And Admin

| File | Status | Notes |
|------|--------|-------|
| `scripts/analyze-internal-links.js` | primary | SEO-focused internal link analysis for orphan and low-link posts |
| `scripts/migrate-tunes-lightgallery.js` | migration | One-off migration from paired `<Img>` usage to `LightGallery` |
| `scripts/migrate-tunes-to-integrated-format.js` | migration | One-off migration from gallery-based tunes posts to integrated image/link format |
| `scripts/test-cloudflare-token.sh` | manual/admin | Verifies Cloudflare Pages token and account access |

## Manual Script Usage

These scripts are not exposed as `pnpm run` commands but are kept in the repository for maintenance or batch operations.

### `scripts/regenerate-cover.js`

```bash
node scripts/regenerate-cover.js <filename.mdx> ["scenario"] [options]
```

Options:
- `--no-interactive`, `-y` skip prompt review
- `--debug`, `-d` enable debug logging
- `--help`, `-h` show usage

### `scripts/fal-cover-generator.js`

```bash
node scripts/fal-cover-generator.js --help
```

Use this for direct AI cover generation outside the `new-post` workflow.

### `scripts/fal-collage.js`

```bash
node scripts/fal-collage.js --help
```

Use this for direct FAL-based tunes collage generation and strategy testing.

### `scripts/bulk-listen.js`

```bash
node scripts/bulk-listen.js --from=YYYY-MM-DD --to=YYYY-MM-DD [options]
```

Options:
- `--debug`, `-d` enable debug output for `fal-collage.js`
- `--dry-run`, `-n` preview work without generating files
- `--help`, `-h` show usage

### `scripts/generate-covers-batch.js`

```bash
node scripts/generate-covers-batch.js [batch-number]
```

Runs strip-collage generation over existing tunes folders in `public/assets/`.

### `scripts/migrate-tunes-lightgallery.js`

```bash
node scripts/migrate-tunes-lightgallery.js
```

Legacy migration script for older tunes posts stored as flat `.mdx` files.

### `scripts/migrate-tunes-to-integrated-format.js`

```bash
node scripts/migrate-tunes-to-integrated-format.js [path/to/file.mdx] [--dry-run]
```

Migration-only script for historical tunes content.

### `scripts/test-cloudflare-token.sh`

```bash
./scripts/test-cloudflare-token.sh <token> <account-id>
```

Checks token validity and account access for Cloudflare Pages workflows.

## Supporting Configuration And Templates

| File | Purpose |
|------|---------|
| `scripts/tunes-config.yaml` | Main configuration for weekly and wrapped tunes generation |
| `scripts/tunes-template.mdx` | MDX scaffold for weekly tunes posts |
| `scripts/year-wrapped-template.mdx` | MDX scaffold for wrapped posts |
| `scripts/fal-cover-config.json` | Prompt/model configuration for AI blog cover generation |
| `scripts/fal-collage-config.json` | Prompt/model/strategy configuration for FAL tunes collages |
| `scripts/SEARCH_INTEGRATION.md` | Internal design note for the tunes research agent/search-provider architecture |

## Generated Caches And Local Artifacts

| Path | Purpose |
|------|---------|
| `scripts/.research-cache/` | Cached AI research results for tunes generation |
| `scripts/.research-cache/.gitignore` | Keeps the cache directory in git without committing cache payloads |
| `scripts/.classification-cache/` | Cached album classification results |
| `scripts/.classification-cache/.gitignore` | Keeps the cache directory in git without committing cache payloads |
| `scripts/.year-wrapped-cache-YYYY.json` | Cached yearly wrapped source data per year |
| `scripts/.DS_Store` | Local macOS Finder metadata; not part of the application |

## `scripts/lib/` Modules

These modules support the top-level CLIs and are not intended to be run directly.

| File | Role |
|------|------|
| `scripts/lib/album-classifier.js` | Classifies albums using collection metadata and LLM fallback |
| `scripts/lib/blog-post-renderer.js` | Renders generated tunes content into MDX templates |
| `scripts/lib/collection-manager.js` | Fetches and normalizes collection data from `russ.fm` |
| `scripts/lib/config-loader.js` | Loads and validates tunes generator configuration |
| `scripts/lib/content-generator.js` | AI writing pipeline for tunes and wrapped sections |
| `scripts/lib/exa-tool.js` | Exa search integration for research agents |
| `scripts/lib/github-gist-client.js` | GitHub Gist publishing for Medium exports |
| `scripts/lib/image-handler.js` | Downloads, stores, and organizes album/artist images |
| `scripts/lib/lastfm-client.js` | Last.fm client for weekly listening data |
| `scripts/lib/lastfm-year-client.js` | Last.fm client for annual wrapped data |
| `scripts/lib/mdx-to-medium.js` | Converts blog MDX into Medium-compatible HTML/markdown |
| `scripts/lib/medium-client.js` | Medium API wrapper |
| `scripts/lib/perplexity-tool.js` | Perplexity search integration for music research |
| `scripts/lib/question-composer.js` | Builds contextual research questions for the tunes pipeline |
| `scripts/lib/search-cache.js` | Shared filesystem cache for research/classification results |
| `scripts/lib/svg-chart-generator.js` | Generates SVG charts for wrapped posts |
| `scripts/lib/text-utils.js` | Shared normalization, lookup, and text helper functions |
| `scripts/lib/year-stats-calculator.js` | Computes annual wrapped insights and derived metrics |

## Related Docs

- [Creating Posts](../guides/creating-posts.md)
- [Tunes Generator](../guides/tunes-generator.md)
- [Medium Publisher](../guides/medium-publisher.md)
- [Image Delivery](../architecture/image-delivery.md)
- [Build & Deployment](../architecture/build-deployment.md)
