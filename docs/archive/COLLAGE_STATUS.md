# Tunes Cover Collage Generation - Status & TODO

## 🎉 Integration Complete!

The collage generator has been successfully integrated into the `npm run tunes` workflow. All new tunes posts will automatically generate custom cover collages.

## What Works ✅

The torn strip collage generator is production-ready with the following behaviour:

- **Native cover size** – renders directly to 1400×800 PNG (no post-scale).
- **Original artwork** – zero tinting or colour manipulation beyond edge guards.
- **Single use per album** – slugified filenames prevent duplicate strips even when the source folder contains near-identical files.
- **Dynamic strip widths** – adapts to album count (2-3 → 400-650px, 4-5 → 280-480px, 6-8 → 180-340px, 9+ → 120-260px).
- **Torn-edge mask & mild rotation** – SVG displacement + ±4° rotation gives the handmade look.
- **High-overlap layout** – 80-100px overlap for sparse sets, 60px for denser ones.
- **Seam guard** – only fills genuinely empty edge pixels with blended colour; real artwork is left untouched.
- **Deterministic randomness** – seed derived from post date keeps re-runs stable while still varying between posts.

## Current Status ⚙️

**End-to-end pipeline hardened**

- Oversized canvas padding is proportional to output size (30%), keeping rotations inside safe bounds, then crops back to 1400×800.
- After rotation each strip is re-centred against a reference X origin, so coverage is symmetric without zooming a single album.
- We scan the oversized layout and pick the strip window that fully spans the crop width; no smeared fallback fills are required.
- Output is composed into a raw buffer then saved once, avoiding Sharp’s “dimensions mismatch” error on rotated assets.
- Edge guard now only touches columns that were actually uncovered; for darker samples it blends with the overall palette to avoid washed edges.
- Slug-based dedupe guarantees each distinct album appears once even when filenames differ only by punctuation or case.
- Final alpha/edge brightness audit on the regenerated set reports min alpha = 255 and zero pure-black edge pixels.

### Regression Checks Required

1. Re-run the difficult posts (2023-06-05, 2023-05-29) via `scripts/test-edge-coverage.js` and manually inspect for any transparent or black pixels at the edges.
2. Optional: add a pixel-scan smoke test that fails if any fully transparent or pure black pixels remain along the crop boundaries.

## What Needs To Be Done 🔧

### Immediate Work

All legacy edge issues resolved. Suggested follow-ups:

1. **Automated guardrails**
   - Add a tiny pixel-scan helper (see ad-hoc script) so CI can fail fast on transparency/black-edge regressions.
   - Optionally retry with a new seed when the guard fails to keep automation hands-off.

2. **Developer ergonomics**
   - Expose `width/height` overrides in CLI (currently hard-coded) for future layouts.
   - Consider a `--preview` flag that writes debug PNGs alongside logs.

3. **Fallback ideas (only if regression resurfaces)**
   - Render at 2× and downscale.
   - Inflate strip widths/overlaps even further.
   - Drop rotation entirely.
   - Increase padding/canvas size to 2400×1260 and crop centre.

### Integration Tasks 📦

1. **Integrate into `npm run tunes` workflow**
   - ✅ Completed: Modified `scripts/generate-tunes-post.js`
   - ✅ Completed: `createStripCollage()` now called after downloading album images
   - ✅ Completed: Cover auto-generated for each new tunes post with date-based seed

2. **Update all existing posts**
   - ✅ Completed: regenerated every `tunes-cover-*.png` at 1400×800 with new pipeline.
   - Run pixel-scan guard (once added) before committing future batches.

3. **Add to documentation**
   - ✅ Completed: Documented in `CLAUDE.md` under "Tunes Blog Post Generator" section
   - ✅ Completed: Added "Cover Collage Generation" subsection with full details
   - ✅ Completed: Updated "What It Does" workflow with collage generation step
   - ✅ Completed: Updated "Output Structure" with cover file location
   - ✅ Completed: Added `scripts/strip-collage.js` to "Key Files" list

## Files Involved 📁

### Production Scripts (Keep)
- `scripts/strip-collage.js` - Core collage library (9.0K)
- `scripts/generate-covers-batch.js` - Batch generation for all posts (3.0K)

### Test Scripts (Clean up when done)
- `scripts/test-edge-coverage.js` - Tests first/last 10 posts

### Output
- `src/assets/{date}-listened-to-this-week/tunes-cover-{date}-listened-to-this-week.png`
- 1400×800 PNG, one per tunes post (126 total ≈ 50 MB)

## Recommended Next Steps

1. Add edge-scan guard (or document a manual checklist) so CI/tunes job can fail fast if edges regress.
2. Integrate the collage call into `npm run tunes` and update the docs (`TUNES_README.md`, `CLAUDE.md`).
3. Wire the regeneration script into a cron/CI task so refreshed posts get covers automatically.

## User Feedback History

- ✅ NO tinting (was too strong at 20-40%)
- ✅ NO duplicates (each album once)
- ✅ Dynamic widths for fewer albums
- ✅ Vertical strips (not horizontal)
- ✅ Edge bleed fixed & full library regenerated

## Key Constraint

User requirement: **No background (black or transparent) visible at 1400×800**

Validated via raw pixel scan across the full catalogue. Continue to enforce during future runs.
