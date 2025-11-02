# Tunes Post Migration Script

Migrates existing tunes posts from the old gallery format to the new integrated image/link format.

## What It Does

The migration script transforms posts from this format:

```mdx
<LightGallery (artist gallery at top) />

## Album Title by Artist 🎸

### Section 1
Content...

### Section 2
Content...

## Top Artists (Week XX)
...

<LightGallery (album gallery at bottom) />
```

To this new integrated format:

```mdx
## Album Title by Artist 🎸

<Img src="/assets/.../albums/Album.jpg" />

### Section 1
Content...

<Img src="/assets/.../artists/Artist.jpg" />

### Section 2
Content...

- View Album on [russ.fm](link)
- View Artist on [russ.fm](link)

---

## Top Artists (Week XX)
...
```

## Changes Made

1. **Removes LightGallery Components**
   - Extracts image paths before removal
   - Removes both artist (top) and album (bottom) galleries

2. **Integrates Album Images**
   - Adds `<Img>` component with album cover after H2 header
   - Uses paths from original gallery

3. **Integrates Artist Images**
   - Adds `<Img>` component with artist photo after middle H3 header
   - Calculates middle position based on number of H3 sections

4. **Adds russ.fm Links**
   - Extracts links from "Top Albums" section
   - Adds two bullet points at end of each album section:
     - `- View {Album} on [russ.fm](link)`
     - `- View {Artist} on [russ.fm](link)`

5. **Adds Visual Separator**
   - Inserts horizontal rule (`---`) before "Top Artists" section

## Usage

### Process All Files

#### Dry Run (Recommended First)

```bash
node scripts/migrate-tunes-to-integrated-format.js --dry-run
```

This will:
- Process all `.mdx` files in `src/content/tunes/`
- Show what would change
- **NOT modify any files**

#### Live Run

```bash
node scripts/migrate-tunes-to-integrated-format.js
```

This will:
- Process all `.mdx` files in `src/content/tunes/`
- Modify files in place
- Show progress for each file

### Process Single File

#### Dry Run

```bash
node scripts/migrate-tunes-to-integrated-format.js src/content/tunes/2024-12-30-listened-to-this-week.mdx --dry-run
```

#### Live Run

```bash
node scripts/migrate-tunes-to-integrated-format.js src/content/tunes/2024-12-30-listened-to-this-week.mdx
```

You can also use relative paths:
```bash
node scripts/migrate-tunes-to-integrated-format.js ../src/content/tunes/2024-12-30-listened-to-this-week.mdx
```

## Output

### Bulk Processing

```
🎵 Tunes Migration Script
==================================================
Mode: DRY RUN (no changes)
Target: All files in src/content/tunes
==================================================

Found 123 MDX files to process

Processing: 2024-12-30-listened-to-this-week.mdx
  ✅ Migrated successfully

Processing: 2024-12-23-listened-to-this-week.mdx
  ✓ No changes needed

==================================================
Migration Summary:
  Processed: 100
  Skipped: 23
  Total: 123
==================================================
```

### Single File Processing

```
🎵 Tunes Migration Script
==================================================
Mode: LIVE (will modify files)
Target: Single file - 2024-12-30-listened-to-this-week.mdx
==================================================

Found 1 MDX file(s) to process

Processing: 2024-12-30-listened-to-this-week.mdx
  ✅ Migrated successfully

==================================================
Migration Summary:
  Processed: 1
  Skipped: 0
  Total: 1
==================================================
```

## Safety Features

- **Dry run mode** - Test before making changes
- **Preserves original content** - Only modifies specific sections
- **Error handling** - Continues processing even if one file fails
- **Date extraction** - Safely extracts date from filename
- **Fallback paths** - Constructs image paths if not found in galleries
- **Idempotent** - Safe to run multiple times, won't duplicate images/links
- **Graceful degradation** - Handles missing images and links without errors

## What Gets Preserved

- ✅ Frontmatter (unchanged)
- ✅ NoteCallout component
- ✅ All H2/H3 headers and emojis
- ✅ All content text
- ✅ Top Artists/Albums sections
- ✅ Existing links in Top Albums section

## What Gets Removed

- ❌ LightGallery components (replaced with integrated images)

## What Gets Added

- ✅ `<Img>` components for albums (after H2)
- ✅ `<Img>` components for artists (after middle H3)
- ✅ russ.fm links at end of each album section
- ✅ Horizontal rule before Top Artists

## Before Running

1. **Backup your files** (recommended)
   ```bash
   cp -r src/content/tunes src/content/tunes.backup
   ```

2. **Run dry run first**
   ```bash
   node scripts/migrate-tunes-to-integrated-format.js --dry-run
   ```

3. **Check a few migrated files manually**

4. **Run live migration**
   ```bash
   node scripts/migrate-tunes-to-integrated-format.js
   ```

## Troubleshooting

### Images not found
- Script will construct expected paths as fallback
- Check that images exist in `/assets/{date}-listened-to-this-week/`

### Links not extracted
- Ensure "Top Albums" section exists
- Links should follow format: `[Album](link) by [Artist](link)`

### H3 placement issues
- Script calculates middle position automatically
- For 3 H3s: artist image after 2nd
- For 4 H3s: artist image after 2nd
- For 5 H3s: artist image after 3rd

## Rollback

If you need to rollback:

```bash
# If you made a backup
rm -rf src/content/tunes
mv src/content/tunes.backup src/content/tunes

# Or use git
git checkout src/content/tunes/
```

## Technical Details

- **Language**: Node.js ES modules
- **Dependencies**: None (uses native fs/path)
- **File Pattern**: `*.mdx` in `src/content/tunes/`
- **Date Extraction**: Regex pattern `YYYY-MM-DD` from filename
- **Image Matching**: Fuzzy matching with normalization (handles spaces, slashes, apostrophes)

## Example Transformation

**Before:**
```mdx
<LightGallery layout={{ imgs: [{ src: "/assets/2024-12-30.../artists/Pink-Floyd.jpg" }] }} />

## Wish You Were Here by Pink Floyd 🎸

### The Heart of the Album 🎤
Content...

### Recording Journey 🎶
Content...

## Top Albums (Week 51)
- [Wish You Were Here](https://www.russ.fm/albums/wish-you-were-here-9180570/) by [Pink Floyd](https://www.russ.fm/artist/pink-floyd/)

<LightGallery layout={{ imgs: [{ src: "/assets/.../albums/Wish-You-Were-Here.jpg" }] }} />
```

**After:**
```mdx
## Wish You Were Here by Pink Floyd 🎸

<Img src="/assets/2024-12-30.../albums/Wish-You-Were-Here.jpg" alt="Wish You Were Here by Pink Floyd" />

### The Heart of the Album 🎤
Content...

<Img src="/assets/2024-12-30.../artists/Pink-Floyd.jpg" alt="Pink Floyd" />

### Recording Journey 🎶
Content...

- View Wish You Were Here on [russ.fm](https://www.russ.fm/albums/wish-you-were-here-9180570/)
- View Pink Floyd on [russ.fm](https://www.russ.fm/artist/pink-floyd/)

---

## Top Albums (Week 51)
- [Wish You Were Here](https://www.russ.fm/albums/wish-you-were-here-9180570/) by [Pink Floyd](https://www.russ.fm/artist/pink-floyd/)
```
