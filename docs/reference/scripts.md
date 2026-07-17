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
| `pnpm run extract-colors` | `scripts/extract-hero-colors.js` | Rebuild `src/data/hero-colors.json` from hero images (still part of prebuild; pages no longer render gradients from it) |
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
| `scripts/extract-hero-colors.js` | primary | Extracts dominant colors from hero images into `src/data/hero-colors.json`; still wired into `pnpm run prebuild`, though the tag/year hub pages no longer render gradient headers from the data |
| `scripts/cache-link-preview-images.js` | primary | Scans MDX for `<LinkPreview>` usage and caches OG images locally |
| `scripts/cache-reading-images.js` | primary | Fetches OG images and metadata (title, description) for reading list bookmarks and caches them locally; downloaded images are re-encoded to JPEG via `sharp` so they are compatible with Cloudflare image transformations regardless of source format |
| `scripts/fal-cover-generator.js` | manual | AI blog cover generator used by `new-post.js` and manual cover generation flows |
| `scripts/regenerate-cover.js` | manual | Regenerate a blog cover for an existing MDX post |
| `scripts/fal-tunes-cover.js` | manual/internal | AI tunes cover generator; reads each album cover and weaves them into one cohesive scene in the week's rotating creative-direction lane (photo or print media); saves full and `-small` cover images plus a `.json` run sidecar |
| `scripts/fal-tunes-artists.js` | manual/internal | AI tunes artist group-portrait generator; composes the week's artist photos into one photorealistic group photo with rotating shoot grammar and colour treatment; saves full and `-small` images plus a `.json` run sidecar |
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

Use this for direct tunes cover generation. The script reads the ~7-8 strongest album covers, describes the visual contents of each one, then designs a single cohesive scene that weaves recognisable elements from all of them into one shared world — rendered in that week's **creative-direction lane**. Lanes are defined in `scripts/lib/tunes-lanes.js` (6 photographic and 6 print/illustration, including analog rehearsal-room documentary, long-exposure light photography, and retro science-fiction paperback painting) and rotate deterministically from the post-date seed, so consecutive weeks land in genuinely different media, compositions, and palettes instead of converging on one photoreal formula. The art-brief and final image prompt are softened for safety: youthful figures are recast as adults/statues and sensitive motifs (gore, body horror, medical/foetal imagery, blank eyes, nudity) are reinterpreted abstractly, so the scene stays evocative without tripping image-model moderators. Text and grid/montage negatives always apply; photo lanes additionally ban illustration looks while print lanes ban photoreal/3D looks, and every lane bans the old posed-ensemble/props-on-plinths/giant-sculpture formula. Recent weekly concepts (from `scripts/.tunes-image-history.json`) are passed to the art director as do-not-repeat instructions.

The image calls are delegated to swappable backends in `scripts/lib/image-backends/`. The **compose** backend comes from the lane (print lanes prefer `nano-banana`, which follows style-first prompting more faithfully), falling back to `settings.cover_backend` in `scripts/tunes-config.yaml`. Some print lanes then run an optional **restyle** stage (`recraft-i2i` or `ideogram-remix`) over the composed image to lock the medium in, with conservative strengths so the album motifs stay recognisable. The restyle prompt repeats the full lane treatment — composition, palette, negative terms, anti-cliché rules, and no-text instruction — so the second pass cannot flatten away those constraints. Recraft prompts that would exceed its 1,000-character API limit are rebuilt in a compact form that retains those constraints but omits the redundant per-source motif list; a restyle failure logs a warning and ships the composed image. Disable restyling with `--no-restyle` or `settings.cover_restyle: off`.

Input selection ranks every candidate using play rank, colour, contrast, and full-height text-likelihood rather than automatically admitting the first seven albums. Strongly text-heavy sleeves are held behind cleaner alternatives and remain available only as fallbacks for weeks with very few covers. Known repeat offenders can also be excluded in `scripts/tunes-cover-blocklist.js` without removing them from the post itself.

If the primary backend refuses on a content-policy violation, the generator first retries with alternate album inputs, then drops to a fallback backend rather than failing the whole post. The fallback precedence is explicit option → env `TUNES_COVER_FALLBACK_BACKEND` → the lane's compose stage → `settings.cover_fallback_backend`; when unset it defaults to `nano-banana` (the more permissive backend) while `gpt-image-2` is primary, and is disabled with `none` or when it would equal the primary. This matters because GPT Image 2 moderates real-person likenesses more strictly than nano-banana, so weeks with portrait-heavy covers degrade gracefully instead of breaking.

Every run writes a JSON sidecar (`<output>.json`) with the lane, brief, and exact prompts next to the PNGs, so past images stay auditable without `--debug` scraping.

Options:
- `--output=<path>` writes that file, the matching `-small` derivative, and a `.json` run sidecar
- `--lane=<id>` forces a lane (`--style` is an alias; env `TUNES_COVER_LANE`); `auto` means weekly rotation
- `--list-lanes` prints the lane catalogue and exits
- `--no-restyle` skips the lane's optional restyle stage
- `--record` appends the run to `scripts/.tunes-image-history.json` (the weekly generator records automatically; manual runs opt in)
- `--debug`, `-d` enables verbose input selection and prompt output

Example:
```bash
node scripts/fal-tunes-cover.js --input=public/assets/2026-04-20-listened-to-this-week/albums --output=/tmp/tunes-cover.png --debug
```

### `scripts/fal-tunes-artists.js`

```bash
node scripts/fal-tunes-artists.js --help
```

Use this for direct artist group-portrait generation. The script uploads the week's top downloaded artist photos (input order = play rank) as casting options, has OpenAI describe each, **cast** the most interesting subset, and author the full scene for that week (location, composition, lens, lighting, styling), then renders a single photorealistic 16:9 group photo of just the cast — keeping the group intimate rather than cramming in every band member. Each week leans into a different **shoot grammar** (candid mid-action, walking shot, over-the-shoulder backstage, silhouette against stage backlight, fisheye huddle — most entries explicitly not a publicity lineup) and a different **colour treatment** (natural daylight, Kodachrome, cross-process, overcast pastel, punchy editorial, black-and-white film grain), both chosen deterministically from the seed via `scripts/lib/tunes-lanes.js`. Recent shoot concepts are passed as do-not-repeat instructions, and each run writes a `.json` sidecar with the brief and prompt. It reuses the cover pipeline's upload/save/JSON helpers and the same FAL model env vars.

Options:
- `--output=<path>` writes that file, the matching `-small` derivative, and a `.json` run sidecar
- `--width=<px>` / `--height=<px>` set the `-small` dimensions (default 1400×800)
- `--seed=<number>` sets a deterministic seed
- `--record` appends the run to `scripts/.tunes-image-history.json` (the weekly generator records automatically; manual runs opt in)
- `--debug`, `-d` enables verbose input selection, brief, and prompt output

The casting pool is set by `settings.artist_portrait_candidates` (defaults to 12 when unset, env `TUNES_ARTIST_PORTRAIT_CANDIDATES`) and the AI features exactly `settings.artist_portrait_inputs` of them (set to 4 in config — small casts keep faces large and likenesses faithful; code default 6 when unset, env `TUNES_ARTIST_PORTRAIT_INPUTS`) — only the cast is rendered, so a few band photos no longer crowd the frame. The run's `.json` sidecar is mirrored into `src/assets/<week>/` (never next to the portrait in `public/`, which deploys verbatim). Requires `FAL_KEY`; uses `OPENAI_API_KEY` when present, otherwise falls back to a deterministic seed-varied brief (no casting). The actual image call is delegated to a swappable backend in `scripts/lib/image-backends/` (`gpt-image-2` or `nano-banana`), chosen by `settings.artist_portrait_backend` in `scripts/tunes-config.yaml`; unknown/missing falls back to `nano-banana`. The weekly `pnpm run tunes` flow calls this generator (best-effort) and writes the portrait to `public/assets/<week>/tunes-artists-<week>.png`, then embeds it in the post body above the Top Artists/Albums lists; because it is a body image it lives under `public/assets/` (referenced by a `/assets/...` path), not `src/assets/` like the hero cover.

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
- `--lane=<id>` (header only) forces a creative-direction lane instead of the week's rotation; `--style` is an alias
- `--no-restyle` (header only) skips the lane's optional restyle stage
- `--record` appends the run to `scripts/.tunes-image-history.json` (off by default here so regenerating old weeks does not pollute the do-not-repeat memory)
- `--output=<path>` writes a test image outside the normal asset path
- `--debug`, `-d` enables verbose output

### `scripts/bulk-listen.js`

```bash
node scripts/bulk-listen.js --from=YYYY-MM-DD --to=YYYY-MM-DD [options]
```

Options:
- `--lane=<id>` forces one creative-direction lane for every week; `auto` (default) uses each week's deterministic rotation (the post-date seed is passed through, so bulk runs match what the weekly generator would pick). `--style` is an alias.
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
| `scripts/lib/fal-content-policy.js` | Dependency-free `isContentPolicyViolation()` helper shared by the cover/artist generators and the image backends (avoids an import cycle) |
| `scripts/lib/image-backends/index.js` | Registry of generic, swappable image-generation backends (`{ id, label, generate, maxInputImages }`); `getBackend()` / `normalizeBackendId()`. Shared by both the cover header and the artist portrait |
| `scripts/lib/image-backends/nano-banana.js` | Generic FAL `nano-banana-2/edit` image backend (env: `NANO_BANANA_MODEL`, `NANO_BANANA_FALLBACK_MODEL`) |
| `scripts/lib/image-backends/gpt-image-2.js` | Generic OpenAI `gpt-image-2/edit` image backend via fal (env: `GPT_IMAGE_2_MODEL`, `GPT_IMAGE_2_SIZE`, `GPT_IMAGE_2_QUALITY`) |
| `scripts/lib/image-backends/ideogram-remix.js` | Single-image FAL `ideogram/v3/remix` restyle backend for print lanes (env: `IDEOGRAM_REMIX_MODEL`). Its `strength` is the weight of the INPUT image — higher preserves more source |
| `scripts/lib/image-backends/recraft-i2i.js` | Single-image FAL `recraft/v3/image-to-image` restyle backend for print lanes (env: `RECRAFT_I2I_MODEL`). Its `strength` is the amount of CHANGE — the opposite of Ideogram's |
| `scripts/lib/tunes-lanes.js` | Weekly creative-direction lanes for the cover (photo + print media) plus the deterministic rotation helpers (`pickLane`, `pickLightingDirection`, `pickShootDirection`, `pickColourTreatment`, `epochShuffledPick`) shared by both image generators |
| `scripts/lib/tunes-image-history.js` | Rolling record of weekly image runs in `scripts/.tunes-image-history.json` (committed, capped) plus per-run `.json` sidecars; feeds do-not-repeat concepts back to the art director |
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
