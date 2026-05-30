# Scripts Reference

Reference for the repository's `scripts/` directory, including runnable scripts, supporting configuration, templates, generated caches, and internal helper modules.

## Package Script Entry Points

These are the scripts exposed through `package.json` and intended for regular use:

| Command | Entry point | Purpose |
|---------|-------------|---------|
| `pnpm run post` | `scripts/new-post.js` | Create a new blog post and optionally generate an AI cover |
| `pnpm run tunes` | `scripts/generate-tunes-post.js` | Generate the weekly tunes post from Last.fm data |
| `pnpm run wrapped` | `scripts/generate-year-wrapped.js` | Generate the annual wrapped post |
| `pnpm run backfill-tunes-images` | `scripts/backfill-tunes-images.js` | Backfill older weekly tunes artwork and repair resolvable russ.fm links from local `collection.json` |
| `pnpm run medium` | `scripts/publish-to-medium.js` | Publish an existing post to Medium |
| `pnpm run reading` | `scripts/fetch-reading-list.js` | Fetch bookmarks from Instapaper into `src/data/reading.json` |
| `pnpm run optimize` | `scripts/optimize-images.js` | Optimize source and public image assets |
| `pnpm run analyze-links` | `scripts/analyze-internal-links.js` | Audit internal linking between posts |
| `pnpm run extract-colors` | `scripts/extract-hero-colors.js` | Rebuild `src/data/hero-colors.json` from hero images |
| `pnpm run cache-link-previews` | `scripts/cache-link-preview-images.js` | Download and cache OG images for `LinkPreview` embeds |
| `pnpm run refresh-link-previews` | `scripts/cache-link-preview-images.js --refresh-stale` | Refresh stale cached OG images |
| `pnpm run cache-reading-images` | `scripts/cache-reading-images.js` | Download and cache OG images for reading list cards |
| `pnpm run refresh-reading-images` | `scripts/cache-reading-images.js --refresh-stale` | Refresh stale cached reading list OG images |
| `pnpm run prebuild` | (see below) | Prepare image metadata before production builds |

## Top-Level Scripts

### Content And Publishing

| File | Status | Notes |
|------|--------|-------|
| `scripts/new-post.js` | primary | Interactive blog post creator used by `pnpm run post` |
| `scripts/generate-tunes-post.js` | primary | Weekly tunes orchestrator; uses Last.fm, collection metadata, AI research, templates, and cover generation |
| `scripts/generate-year-wrapped.js` | primary | Year-end wrapped orchestrator with statistics, charts, and cover generation |
| `scripts/backfill-tunes-images.js` | manual/maintenance | Uses local `collection.json` to download missing older tunes album/artist artwork, generate compact album and artist galleries for no-gallery weekly posts, and repair resolvable russ.fm links across weekly tunes posts |
| `scripts/publish-to-medium.js` | primary | Medium publishing CLI with optional Gist extraction for code blocks |
| `scripts/fetch-reading-list.js` | primary | Fetches bookmarks from Instapaper API and writes `src/data/reading.json` |
| `scripts/build-tunes-index.js` | primary | Parses each weekly tunes post's "Top Albums" section and writes a sorted album/artist index to `src/data/tunes-index.json` - powers the `/tunes/artist/*` and `/tunes/album/*` programmatic SEO pages. The index includes matching local artist/album image paths from `public/assets/`, preserving the real filename casing, and merges album variants that share the same artist/title or russ.fm album slug. Runs as part of `pnpm run prebuild` and after every `pnpm run tunes`. |

### Image And Asset Pipelines

| File | Status | Notes |
|------|--------|-------|
| `scripts/optimize-images.js` | primary | Optimizes files in `src/assets/` and `public/assets/`, optionally for a single path |
| `scripts/extract-hero-colors.js` | primary | Extracts dominant colors from hero images for gradient backgrounds |
| `scripts/cache-link-preview-images.js` | primary | Scans MDX for `<LinkPreview>` usage and caches OG images locally |
| `scripts/cache-reading-images.js` | primary | Fetches OG images and metadata (title, description) for reading list bookmarks and caches them locally; downloaded images are re-encoded to JPEG via `sharp` so they are compatible with Cloudflare image transformations regardless of source format |
| `scripts/fal-cover-generator.js` | manual | AI blog cover generator used by `new-post.js` and manual cover generation flows |
| `scripts/regenerate-cover.js` | manual | Regenerate a blog cover for an existing MDX post |
| `scripts/fal-tunes-cover.js` | manual/internal | AI tunes cover generator; reads each album cover and weaves them into one cohesive scene; saves full and `-small` cover images |
| `scripts/fal-tunes-artists.js` | manual/internal | AI tunes artist group-portrait generator; composes the week's artist photos into one photorealistic group photo; saves full and `-small` images |
| `scripts/regenerate-tunes-cover.js` | manual | Regenerate one weekly tunes image (header cover or artist portrait) without changing MDX frontmatter |
| `scripts/wrapped-cover-generator.js` | internal | AI-assisted wrapped cover compositor |
| `scripts/bulk-listen.js` | manual | Run the tunes cover generator over a date range of weekly tunes folders |

### Analysis, Migration, And Admin

| File | Status | Notes |
|------|--------|-------|
| `scripts/analyze-internal-links.js` | primary | SEO-focused internal link analysis for orphan and low-link posts |
| `scripts/generate-llms-markdown.js` | primary | Postbuild: emits plain-markdown twins of every post under `dist/` and a `dist/llms.txt` index for AI agents. Invoked automatically by `pnpm run build`. |
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

### `scripts/fal-tunes-cover.js`

```bash
node scripts/fal-tunes-cover.js --help
```

Use this for direct tunes cover generation. The script reads the ~5-6 strongest album covers, describes the visual contents of each one, then designs a single cohesive, photorealistic scene that weaves recognisable elements from all of them into one shared world (illustrated cover motifs are reimagined as real, physical, photographable things). The negatives applied are text, grid/montage layouts, and non-photographic styles (illustration, painting, cartoon); otherwise the art director has creative freedom.

Options:
- `--output=<path>` writes that file and the matching `-small` derivative
- `--debug`, `-d` enables verbose input selection and prompt output
- `--lane=<name>` / `--style=<name>` are deprecated and silently ignored (kept so older commands still run)

Example:
```bash
node scripts/fal-tunes-cover.js --input=public/assets/2026-04-20-listened-to-this-week/albums --output=/tmp/tunes-cover.png --debug
```

### `scripts/fal-tunes-artists.js`

```bash
node scripts/fal-tunes-artists.js --help
```

Use this for direct artist group-portrait generation. The script takes the week's downloaded artist photos (input order = play rank), describes each person to aid likeness, then designs one cohesive setting where they are photographed together and renders a single photorealistic 16:9 group portrait with every artist recognisable and appearing exactly once. It reuses the cover pipeline's upload/save/JSON helpers and the same FAL model env vars.

Options:
- `--output=<path>` writes that file and the matching `-small` derivative
- `--width=<px>` / `--height=<px>` set the `-small` dimensions (default 1400×800)
- `--seed=<number>` sets a deterministic seed
- `--debug`, `-d` enables verbose input selection, brief, and prompt output

The number of artists is capped by `TUNES_ARTIST_PORTRAIT_INPUTS` (default 6). Requires `FAL_KEY`; uses `OPENAI_API_KEY` when present, otherwise falls back to a deterministic studio brief. The weekly `pnpm run tunes` flow calls this generator (best-effort) and writes the portrait to `public/assets/<week>/tunes-artists-<week>.png`, then embeds it in the post body above the Top Artists/Albums lists; because it is a body image it lives under `public/assets/` (referenced by a `/assets/...` path), not `src/assets/` like the hero cover.

Example:
```bash
node scripts/fal-tunes-artists.js --input=public/assets/2026-04-20-listened-to-this-week/artists --output=/tmp/tunes-artists.png --debug
```

### `scripts/regenerate-tunes-cover.js`

```bash
node scripts/regenerate-tunes-cover.js [--type=header|artist] [--week=YYYY-MM-DD] [options]
```

Regenerates an image for an older weekly tunes post without changing its MDX. It can make either the **header** album-cover scene (`scripts/fal-tunes-cover.js`) or an **artist** group portrait (`scripts/fal-tunes-artists.js`). When `--type` or `--week` is omitted, the script prompts for them interactively. If `--output` is omitted, the default week asset is written — `src/assets/<week>/tunes-cover-<week>.png` for the header (hero), or `public/assets/<week>/tunes-artists-<week>.png` for the artist portrait (body image); if `--output` is supplied, the script writes there instead. In both cases it writes a full image plus the matching `-small` image.

Options:
- `--type=<kind>` selects `header` or `artist`; `--header` / `--artist` are shorthands
- `--week=<date>` selects a weekly post, for example `2026-04-20`
- `--output=<path>` writes a test image outside the normal asset path
- `--debug`, `-d` enables verbose output
- `--lane=<name>` / `--style=<name>` are deprecated and silently ignored

### `scripts/bulk-listen.js`

```bash
node scripts/bulk-listen.js --from=YYYY-MM-DD --to=YYYY-MM-DD [options]
```

Options:
- `--lane=<name>` / `--style=<name>` are deprecated and silently ignored by the cover generator
- `--debug`, `-d` enable debug output for the cover generator
- `--dry-run`, `-n` preview work without generating files
- `--help`, `-h` show usage

### `scripts/backfill-tunes-images.js`

```bash
# Preview older image/section backfill and all weekly link repairs
pnpm run backfill-tunes-images --dry-run --older

# Preview one post, useful for checking specific missing links
pnpm run backfill-tunes-images --dry-run --file=src/content/tunes/2023-06-26-listened-to-this-week.mdx

# Repair only resolvable Top Artists / Top Albums links
pnpm run backfill-tunes-images --links-only
```

Options:
- `--dry-run` previews MDX edits and downloads without writing files
- `--older` targets no-gallery weekly posts for image/section backfill (default)
- `--all` checks assets across all weekly tunes posts
- `--file=<path>` limits both image backfill and link repair to one weekly MDX file
- `--from=YYYY-MM-DD` / `--to=YYYY-MM-DD` limits the selected date range
- `--assets-only` downloads missing assets without editing MDX
- `--links-only` repairs links without downloading assets or generating galleries
- `--no-link-repair` skips list link repair while still backfilling images/galleries

The script reads the existing local `collection.json`; it does not refresh the collection cache. By default, link repair scans every weekly tunes post, while image and generated-gallery backfill only touches older posts without existing `LightGallery` blocks. The generated album gallery is inserted near the top of the post, and the generated artist gallery is appended near the bottom.

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
| `scripts/tunes-cover-blocklist.js` | Manual list of album covers to keep out of cover-art source images (still shown in the post) |
| `scripts/tunes-template.mdx` | MDX scaffold for weekly tunes posts |
| `scripts/year-wrapped-template.mdx` | MDX scaffold for wrapped posts |
| `scripts/fal-cover-config.json` | Prompt/model configuration for AI blog cover generation |
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
| `scripts/lib/content-generator.js` | AI writing pipeline for tunes and wrapped sections; normalises each section's headings (collapses doubled markers like `### ###` to a single `###`) before embedding images |
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
