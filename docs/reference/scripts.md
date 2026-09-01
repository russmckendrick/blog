# Scripts Reference

Reference for the repository's `scripts/` directory, including runnable scripts, supporting configuration, templates, generated caches, and internal helper modules.

## Package Script Entry Points

These are the scripts exposed through `package.json` and intended for regular use:

| Command | Entry point | Purpose |
|---------|-------------|---------|
| `pnpm run post` | `scripts/new-post.js` | Create a new blog post scaffold with a placeholder cover |
| `pnpm run tunes` | `scripts/generate-tunes-post.js` | Generate the weekly tunes post from Last.fm data |
| `pnpm run wrapped` | `scripts/generate-year-wrapped.js` | Generate the annual wrapped post |
| `pnpm run backfill-tunes-images` | `scripts/backfill-tunes-images.js` | Backfill older weekly tunes artwork and repair resolvable russ.fm links from local `collection.json` |
| `pnpm run rebuild-artist-usage` | `scripts/rebuild-tunes-artist-usage.js` | Rebuild the committed artist reuse record from the per-week portrait sidecars |
| `pnpm run check-artist-reuse` | `scripts/check-tunes-artist-reuse.js` | Audit the artist reuse record and report any portrait repeating an artist inside the window |
| `pnpm run sync-portrait-alt` | `scripts/sync-tunes-portrait-alt.js` | Rewrite each weekly post's portrait alt text to name the artists actually cast |
| `pnpm run medium` | `scripts/publish-to-medium.js` | Publish an existing post to Medium |
| `pnpm run reading` | `scripts/fetch-reading-list.js` | Fetch bookmarks from Instapaper into `src/data/reading.json` |
| `pnpm run optimize` | `scripts/optimize-images.js` | Optimize source and public image assets |
| `pnpm run analyze-links` | `scripts/analyze-internal-links.js` | Audit internal linking between posts |
| `pnpm run extract-colors` | `scripts/extract-hero-colors.js` | Rebuild `src/data/hero-colors.json` from hero images (still part of prebuild; pages no longer render gradients from it) |
| `pnpm run generate-logo` | `scripts/generate-logo.js` | Rebake the header logo's wordmark outlines into `src/data/logo-lockup.json` and refresh the mark-only `public/favicon.svg` |
| `pnpm run cache-link-previews` | `scripts/cache-link-preview-images.js` | Download and cache OG images for `LinkPreview` embeds |
| `pnpm run refresh-link-previews` | `scripts/cache-link-preview-images.js --refresh-stale` | Refresh stale cached OG images |
| `pnpm run cache-reading-images` | `scripts/cache-reading-images.js` | Download and cache OG images for reading list cards |
| `pnpm run refresh-reading-images` | `scripts/cache-reading-images.js --refresh-stale` | Refresh stale cached reading list OG images |
| `pnpm run prebuild` | (see below) | Prepare image metadata before production builds |

## Top-Level Scripts

### Content And Publishing

| File | Status | Notes |
|------|--------|-------|
| `scripts/new-post.js` | primary | Interactive blog post creator used by `pnpm run post`; scaffolds with a placeholder cover for `generate-cover.js` to replace |
| `scripts/generate-tunes-post.js` | primary | Weekly Tunes orchestrator; uses Last.fm, collection metadata, AI research, templates, and image generation; accepts optional preconfigured `--cover-hint=<string>` and `--artist-hint=<string>` values with no interactive image-review step |
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
| `scripts/generate-logo.js` | manual | Bakes the `russ.cloud` wordmark ("russ" Poppins ExtraBold, ".cloud" Poppins Light, plus the block-cursor geometry) into SVG outline path data in `src/data/logo-lockup.json` (rendered by `src/components/layout/Logo.astro`) and refreshes the mark-only `public/favicon.svg` from `public/images/logo.svg`. Downloads the two Poppins TTFs (SIL OFL) from the google/fonts repo on first run and caches them in `node_modules/.cache/logo-poppins/`. Both outputs are committed and never hand-edited; re-run only if the wordmark design changes |
| `scripts/cache-link-preview-images.js` | primary | Scans MDX for `<LinkPreview>` usage and caches OG images locally |
| `scripts/cache-reading-images.js` | primary | Fetches OG images and metadata (title, description) for reading list bookmarks and caches them locally; downloaded images are re-encoded to JPEG via `sharp` so they are compatible with Cloudflare image transformations regardless of source format |
| `scripts/generate-cover.js` | manual | Content-driven AI blog cover generator; reads the full post (or draft text), designs a representative prompt with no imposed style, and writes the full and `-small` covers into `src/assets/<slug>/` |
| `scripts/fal-tunes-cover.js` | manual/internal | AI Tunes cover generator; summarises each selected album cover, asks AI to choose the full creative direction from those visual findings alone, and saves full and `-small` cover images plus a `.json` run sidecar |
| `scripts/fal-tunes-artists.js` | manual/internal | AI Tunes artist group-portrait generator; summarises every candidate photo, asks a separate AI stage to choose the strongest uploaded location and cast, then renders only the selected original references in that anchored setting and saves full and `-small` images plus a `.json` sidecar |
| `scripts/regenerate-tunes-cover.js` | manual | Regenerate one weekly tunes image (header cover or artist portrait) without changing MDX frontmatter |
| `scripts/rebuild-tunes-artist-usage.js` | manual/maintenance | Rebuild `scripts/.tunes-artist-usage.json` from the committed per-week portrait sidecars when the artist reuse record drifts |
| `scripts/check-tunes-artist-reuse.js` | manual/CI | Audit `scripts/.tunes-artist-usage.json` against the artist reuse rule; exits non-zero when a week repeats an artist inside the window |
| `scripts/sync-tunes-portrait-alt.js` | manual/maintenance | Rewrite the artist-portrait `alt` text in weekly posts from each week's portrait sidecar cast; run after regenerating portraits |
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

### `scripts/generate-cover.js`

```bash
node scripts/generate-cover.js <filename.mdx> [options]
node scripts/generate-cover.js --bulk [options]
node scripts/generate-cover.js --text=<file|-> --output=<path> [options]
```

Generates (or regenerates) the cover for a blog post from its actual content.
The post body is reduced to prose (frontmatter, embeds, imports, and code
fences stripped), GPT-5.4 designs an image prompt from it, and OpenAI
`gpt-image-2` (via FAL, 2560×1440 at high quality) renders the image. **No style constraints are imposed** - the
prompt model has creative freedom over style, medium, and concept, with a
default lean toward photographic realism, and nothing is appended to its
output. The only hard rules are defect guards: no text or lettering of any
kind and no text-bearing props (signs, labels, documents - any essential
one is described as blank, since image models write gibberish on anything
that usually carries text), no software interfaces, no branding real or
invented, and no watermarks. Covers are pure visual interpretation of the
post. Writes the full-size cover
plus a 1400×800 `-small` variant, and inserts a `cover:` frontmatter block if
the post lacks one.

Options:
- `--bulk[=N|all]` list the N most recent posts (default 20), interactively pick which to regenerate (`1,3,5-8` / `all`), and run each through the normal flow; one failure doesn't stop the run, and each post sees the batch's earlier prompts as do-not-repeat context so covers stay varied
- `--text=<file|->` use draft text instead of a post body (`-` = stdin); without a post file, `--output` is required
- `--prompt="..."` use a prompt verbatim and skip the LLM step
- `--hint="..."` one-line steer for the prompt model
- `--output=<path>` override the output path
- `--extract-only` print the content that would be sent to the prompt model (needs no API keys)
- `--dry-run` stop after printing the designed prompt
- `--no-interactive`, `-y` skip prompt review
- `--debug`, `-d` enable debug logging
- `--help`, `-h` show usage

Example:

```bash
node scripts/generate-cover.js 2026-07-12-a-catch-up-terminal-svg-and-token-use-v1.mdx --dry-run
```

Requires `FAL_KEY`; `OPENAI_API_KEY` is needed unless `--prompt` is given.

### `scripts/fal-tunes-cover.js`

```bash
node scripts/fal-tunes-cover.js --help
```

Use this for direct Tunes cover generation. The script selects the ~7-8 strongest album covers, then runs two deliberately separate OpenAI stages. A factual vision stage records a description, signature non-text motif, original medium, and palette for each source. A freeform art-director stage receives those summaries, an optional preconfigured author hint, and recent do-not-repeat concepts—no post content. It chooses the medium, scene, viewpoint, composition, lighting, palette, and final creative prompt without a preset style catalogue or photographic default.

The original album images remain attached to the multi-reference image call; their summaries guide the creative prompt rather than replacing the visual evidence. The prompt receives only fixed defect/safety guards after the AI-authored direction: one cohesive 16:9 composition, no grid/contact-sheet/raw-cover layout, no text or branding, safe transformation of sensitive source material, and adults only. For people depicted in a source, it is instructed to closely match their visible appearance and likeness to that reference, including recognisable facial features, hair, skin tone, clothing, and styling. Each identifiable reference person may appear only once across the composition—not again as a reflection, poster, billboard, screen, portrait, silhouette, or background figure—unless the repeated likeness is visibly intrinsic to one source cover.

Image calls are delegated to swappable backends in `scripts/lib/image-backends/`. The primary compose backend comes from `settings.cover_backend` in `scripts/tunes-config.yaml`. Composing is the only image stage; the generated image ships as-is.

Input selection ranks every candidate using play rank, colour, contrast, and full-height text-likelihood rather than automatically admitting the first seven albums. Strongly text-heavy sleeves are held behind cleaner alternatives and remain available only as fallbacks for weeks with very few covers. Known repeat offenders can also be excluded in `scripts/tunes-cover-blocklist.js` without removing them from the post itself.

If the primary backend refuses on a content-policy violation, the generator first retries with alternate album inputs, then drops to a fallback backend rather than failing the whole post. The fallback precedence is explicit option → env `TUNES_COVER_FALLBACK_BACKEND` → `settings.cover_fallback_backend`; when unset it defaults to `nano-banana` while `gpt-image-2` is primary, and is disabled with `none` or when it would equal the primary.

Every run writes a version-2 JSON sidecar (`<output>.json`) with per-cover summaries, creative direction, source-element plan, scene, palette, prompt, backend, model, and inputs, so past images stay auditable without `--debug` scraping.

Before any of that, the **artist reuse rule** thins the candidate pool: anyone cast in the previous `settings.artist_portrait_reuse_weeks` weeks (default 6, env `TUNES_ARTIST_REUSE_WEEKS`) is dropped before the art director ever sees them, using the committed `scripts/.tunes-artist-usage.json`. See [Artist Reuse Rule](../guides/tunes-generator.md#artist-reuse-rule).

Options:
- `--output=<path>` writes that file, the matching `-small` derivative, and a `.json` run sidecar
- `--date=<date>` records the run date explicitly; normally inferred from a standard Tunes input/output path
- `--hint=<string>` gives the AI art director an optional one-off steer
- `--record` appends the run to `scripts/.tunes-image-history.json` (the weekly generator records automatically; manual runs opt in)
- `--debug`, `-d` enables verbose input selection and prompt output

The two prompt stages default to `OPENAI_TUNES_COVER_MODEL` / `OPENAI_MODEL`, and can be overridden independently with `OPENAI_TUNES_COVER_SUMMARY_MODEL` and `OPENAI_TUNES_COVER_DIRECTION_MODEL`.

Example:
```bash
node scripts/fal-tunes-cover.js --input=public/assets/2026-04-20-listened-to-this-week/albums --output=/tmp/tunes-cover.png --debug
```

### `scripts/fal-tunes-artists.js`

```bash
node scripts/fal-tunes-artists.js --help
```

Use this for direct artist group-portrait generation. It mirrors the cover architecture with two deliberately separate OpenAI stages. A factual vision stage records the visible adults, primary subject, distinguishing appearance, wardrobe, pose, physical setting, setting strength, and photographic treatment for every candidate. A separate casting/art-direction stage receives those summaries and the original candidate photos again, plus an optional preconfigured hint and recent do-not-repeat concepts. It selects the photo with the strongest visible physical location, makes that source mandatory and first in the cast, then authors the behaviour, viewpoint, lens, composition, depth, lighting, colour treatment, styling, mood, and final prompt around that setting without seeded shoot or colour rotations.

Only the selected original photos are attached to the final multi-reference image call. A hard prompt anchor names the chosen photo as the sole location authority and permits only plausible off-frame extension of its environment—no invented, substituted, blended, or relocated scene. Fixed guardrails require exactly one adult from each attached reference, state the exact total headcount, and depict every cast member exactly once—never repeated as a reflection, mirror portrait, poster, billboard, screen, secondary image, silhouette, or background face. They also preserve likeness, prohibit extra people and averaged, beautified, de-aged, substituted, merged, or distorted faces, keep faces close and detailed, and prevent grid/montage layouts. Natural source-grounded lettering and logos on clothing, screens, signs, labels, instruments, and props are allowed, while added captions, titles, credits, borders, and watermarks remain prohibited. Sidecars record `locationSource`, `locationSetting`, `locationEvidence`, `locationReference`, and `locationInput` for debugging.

Options:
- `--output=<path>` writes that file, the matching `-small` derivative, and a `.json` run sidecar
- `--width=<px>` / `--height=<px>` set the `-small` dimensions (default 1400×800)
- `--seed=<number>` sets the image-backend seed
- `--hint=<string>` gives the artist art director an optional one-off steer
- `--reuse-weeks=<n>` overrides how many weeks an artist is benched for after being cast (`0` disables the rule)
- `--record` appends the run to `scripts/.tunes-image-history.json` (the weekly generator records automatically; manual runs opt in)
- `--debug`, `-d` enables verbose summaries, casting, art direction, and prompt output

The casting pool is set by `settings.artist_portrait_candidates` (defaults to 12 when unset, env `TUNES_ARTIST_PORTRAIT_CANDIDATES`) and the AI features up to `settings.artist_portrait_inputs` of them (set to 4 in config and capped to the available candidates). The version-2 `.json` sidecar records the factual summaries, cast, creative direction, chosen location source/setting/evidence/reference/input, and exact prompt and is mirrored into `src/assets/<week>/` rather than published beside the portrait. Requires `FAL_KEY` and, by default, `OPENAI_API_KEY`. Artist-photo research uses low reasoning effort and strict JSON Schema output with 6,000 output tokens, retrying an incomplete or empty response once at 10,000 tokens. Refusals and incomplete reasons are reported directly, and a second failure stops generation rather than passing placeholder summaries downstream. `TUNES_ARTIST_ALLOW_DEGRADED_SUMMARIES=1` explicitly opts into the older filename-based summaries, top-ranked cast, and deterministic naturalistic direction when OpenAI research is unavailable. The prompt stages can be overridden independently with `OPENAI_TUNES_ARTIST_SUMMARY_MODEL` and `OPENAI_TUNES_ARTIST_DIRECTION_MODEL`, with `OPENAI_TUNES_ARTIST_MODEL` as their shared fallback. The final image call uses the configured `settings.artist_portrait_backend` (`nano-banana-pro`, `gpt-image-2`, or `nano-banana`), defaulting to Nano Banana Pro Edit at 2K/16:9 with safety tolerance 5. Its overrides are `NANO_BANANA_PRO_MODEL`, `NANO_BANANA_PRO_FALLBACK_MODEL`, and `NANO_BANANA_PRO_SAFETY_TOLERANCE`. The weekly flow writes the portrait to `public/assets/<week>/` and embeds it above the Top Artists/Albums lists.

Example:
```bash
node scripts/fal-tunes-artists.js --input=public/assets/2026-04-20-listened-to-this-week/artists --output=/tmp/tunes-artists.png --debug
```

### `scripts/regenerate-tunes-cover.js`

```bash
node scripts/regenerate-tunes-cover.js [--type=header|artist] [--week=YYYY-MM-DD] [options]
```

Regenerates an image for an older weekly tunes post without changing its MDX. It can make either the **header** album-cover scene (`scripts/fal-tunes-cover.js`) or an **artist** group portrait (`scripts/fal-tunes-artists.js`). When `--type` or `--week` is omitted, the script prompts for them interactively; the week picker lists the most recent 20 posts. An explicit `--week` can target any matching archived Tunes folder, including weeks older than the picker list. If `--output` is omitted, the default week asset is written — `src/assets/<week>/tunes-cover-<week>.png` for the header (hero), or `public/assets/<week>/tunes-artists-<week>.png` for the artist portrait (body image); if `--output` is supplied, the script writes there instead. In both cases it writes a full image plus the matching `-small` image.

Options:
- `--type=<kind>` selects `header` or `artist`; `--header` / `--artist` are shorthands
- `--week=<date>` selects a weekly post, for example `2026-04-20`
- `--hint=<string>` gives the selected header or artist art director a one-off steer
- `--record` appends the run to `scripts/.tunes-image-history.json` (off by default here so regenerating old weeks does not pollute the do-not-repeat memory). The artist reuse record in `scripts/.tunes-artist-usage.json` is **not** tied to this flag — it follows the image, so any run that overwrites a week's real portrait updates it, while a run sent to `--output` does not
- `--output=<path>` writes a test image outside the normal asset path
- `--debug`, `-d` enables verbose output

### `scripts/sync-tunes-portrait-alt.js`

```bash
pnpm run sync-portrait-alt --dry-run
pnpm run sync-portrait-alt
```

Rewrites the `alt` text on each weekly post's artist group portrait so it names the artists actually cast, read from that week's `tunes-artists-*.json` sidecar. Only the `alt` attribute changes; `src`, placement, and every other attribute are left verbatim, and posts without a portrait are skipped.

Run it after regenerating portraits. A new cast means the old alt text describes the wrong people, and before the artist reuse rule the alt named the week's top six artists — which the rule can make flatly wrong, since a benched artist is precisely the one who is *not* in the picture. It also fills in portraits generated before the renderer set an alt at all.

Options:
- `--dry-run` reports what would change without writing
- `--from=<date>` / `--to=<date>` limit the weeks considered

### `scripts/bulk-listen.js`

```bash
node scripts/bulk-listen.js --from=YYYY-MM-DD --to=YYYY-MM-DD [options]
```

Options:
- `--hint=<string>` gives the AI art director the same optional steer for every week
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
| `scripts/.tunes-image-history.json` | Committed, capped rolling record of weekly image runs; supplies the do-not-repeat concepts fed back to the art director |
| `scripts/.tunes-artist-usage.json` | Committed map of week date to the artists cast in that week's group portrait; drives the artist reuse rule. Maintained automatically, rebuildable with `pnpm run rebuild-artist-usage` |
| `scripts/tunes-template.mdx` | MDX scaffold for weekly tunes posts |
| `scripts/year-wrapped-template.mdx` | MDX scaffold for wrapped posts |
| `scripts/SEARCH_INTEGRATION.md` | Internal design note for the tunes research agent/search-provider architecture |

## Archived Scripts

`scripts/archive/` holds retired scripts kept for reference only - they are not
maintained and their relative paths no longer resolve. The directory is listed in
`tsconfig.json`'s `exclude`, so `npx astro check` skips it - the snapshot stays
byte-exact rather than being kept lint-clean:

| File | Superseded by |
|------|---------------|
| `scripts/archive/fal-cover-generator.js` | `scripts/generate-cover.js` (content-driven, no style guardrails) |
| `scripts/archive/fal-cover-config.json` | In-script constants in `scripts/generate-cover.js` |
| `scripts/archive/regenerate-cover.js` | `scripts/generate-cover.js` run against an existing post |

## Generated Caches And Local Artifacts

| Path | Purpose |
|------|---------|
| `scripts/.research-cache/` | Cached AI research results for tunes generation |
| `scripts/.release-cache/` | Cached per-release JSON (tracklists) used to build the Release Details prompt block; 30-day TTL, disable with `ENABLE_RELEASE_CACHE=false` |
| `scripts/.research-cache/.gitignore` | Keeps the cache directory in git without committing cache payloads |
| `scripts/.classification-cache/` | Cached album classification results |
| `scripts/.classification-cache/.gitignore` | Keeps the cache directory in git without committing cache payloads |
| `scripts/.year-wrapped-cache-YYYY.json` | Cached yearly wrapped source data per year |
| `node_modules/.cache/logo-poppins/` | Poppins TTFs downloaded by `scripts/generate-logo.js` (re-fetched automatically if pruned) |
| `scripts/.DS_Store` | Local macOS Finder metadata; not part of the application |

## `scripts/lib/` Modules

These modules support the top-level CLIs and are not intended to be run directly.

| File | Role |
|------|------|
| `scripts/lib/album-classifier.js` | Classifies albums using collection metadata and LLM fallback |
| `scripts/lib/blog-post-renderer.js` | Renders generated tunes content into MDX templates |
| `scripts/lib/collection-manager.js` | Fetches and normalizes collection data from `russ.fm`, keeping each release's genres, styles, formats, labels, country, release year and per-release detail URL |
| `scripts/lib/config-loader.js` | Loads and validates tunes generator configuration |
| `scripts/lib/content-generator.js` | AI writing pipeline for tunes and wrapped sections; normalises each section's headings (collapses doubled markers like `### ###` to a single `###`) before embedding images |
| `scripts/lib/exa-tool.js` | Exa search integration for research agents |
| `scripts/lib/github-gist-client.js` | GitHub Gist publishing for Medium exports |
| `scripts/lib/fal-content-policy.js` | Dependency-free `isContentPolicyViolation()` helper shared by the cover/artist generators and the image backends (avoids an import cycle) |
| `scripts/lib/image-backends/index.js` | Registry of generic, swappable image-generation backends (`{ id, label, generate, maxInputImages }`); `getBackend()` / `normalizeBackendId()`. Shared by both the cover header and the artist portrait |
| `scripts/lib/image-backends/nano-banana.js` | Generic FAL `nano-banana-2/edit` image backend (env: `NANO_BANANA_MODEL`, `NANO_BANANA_FALLBACK_MODEL`) |
| `scripts/lib/image-backends/nano-banana-pro.js` | Generic FAL `nano-banana-pro/edit` image backend for likeness-sensitive edits (env: `NANO_BANANA_PRO_MODEL`, `NANO_BANANA_PRO_FALLBACK_MODEL`, `NANO_BANANA_PRO_SAFETY_TOLERANCE`) |
| `scripts/lib/image-backends/gpt-image-2.js` | Generic OpenAI `gpt-image-2/edit` image backend via fal (env: `GPT_IMAGE_2_MODEL`, `GPT_IMAGE_2_SIZE`, `GPT_IMAGE_2_QUALITY`) |
| `scripts/lib/tunes-cover-art-direction.js` | Factual vision summaries, freeform AI art direction, normalization/fallbacks, and final prompt guardrails for Tunes headers |
| `scripts/lib/tunes-artist-art-direction.js` | Factual artist-photo and setting summaries, strongest-location selection, anchored casting and photographic art direction, normalization/fallbacks, reference remapping, and final location/identity/duplication guardrails |
| `scripts/lib/tunes-post-context.js` | Parses and normalizes ranked artist/album lists for manual regeneration source ordering; it is not used by cover art direction |
| `scripts/lib/tunes-image-history.js` | Rolling record of weekly image runs in `scripts/.tunes-image-history.json` (committed, capped) plus per-run `.json` sidecars; feeds do-not-repeat concepts back to the art director |
| `scripts/lib/tunes-artist-usage.js` | Committed per-week record of who was cast in each artist portrait (`scripts/.tunes-artist-usage.json`); benches recently used artists before casting and relaxes least-recently-used first when a week runs thin |
| `scripts/lib/image-handler.js` | Downloads, stores, and organizes album/artist images |
| `scripts/lib/lastfm-client.js` | Last.fm client for weekly listening data |
| `scripts/lib/lastfm-year-client.js` | Last.fm client for annual wrapped data |
| `scripts/lib/mdx-to-medium.js` | Converts blog MDX into Medium-compatible HTML/markdown |
| `scripts/lib/medium-client.js` | Medium API wrapper |
| `scripts/lib/perplexity-tool.js` | Perplexity search integration for music research |
| `scripts/lib/question-composer.js` | Builds contextual research questions for the tunes pipeline; promotes the artist-type questions ahead of the era/genre ones for `various-artists` releases so they survive the eight-question cap |
| `scripts/lib/release-details.js` | Fetches the per-release JSON behind `json_detailed_release` and formats the prompt's Release Details block (labels, country, formats, Discogs link, and the tracklist with per-track performers for compilations). Best-effort, disk-cached in `scripts/.release-cache/` for 30 days |
| `scripts/lib/search-cache.js` | Shared filesystem cache for research/classification results |
| `scripts/lib/svg-chart-generator.js` | Generates SVG charts for wrapped posts |
| `scripts/lib/text-utils.js` | Shared normalization, lookup, and text helper functions. `lookupAlbumData` folds every spelling of the Various Artists credit onto itself (Last.fm says "Various Artists", the collection says "Various") and returns the full release metadata; `lookupArtistData` returns `null` for that credit so compilations never get an artist image, link or biography |
| `scripts/lib/year-stats-calculator.js` | Computes annual wrapped insights and derived metrics |

## Related Docs

- [Creating Posts](../guides/creating-posts.md)
- [Tunes Generator](../guides/tunes-generator.md)
- [Medium Publisher](../guides/medium-publisher.md)
- [Image Delivery](../architecture/image-delivery.md)
- [Build & Deployment](../architecture/build-deployment.md)
