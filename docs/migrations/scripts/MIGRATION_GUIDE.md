# Hugo to Astro Migration Guide

This guide explains how to use the `migrate-hugo-to-astro.py` script to migrate blog posts from Hugo format to Astro MDX format.

## Overview

The migration script automates the conversion of Hugo blog posts to Astro's content collection format. It handles:

- ✅ Frontmatter conversion (Hugo YAML → Astro frontmatter)
- ✅ Shortcode translation (Hugo → Astro MDX components)
- ✅ Asset copying and renaming
- ✅ Directory structure creation
- ✅ Cover image path updates

## Prerequisites

- Python 3.x installed
- Hugo posts in the `hugo-posts/` directory
- Posts must follow the naming convention: `YYYY-MM-DD-post-title/`
- Each post must have an `index.md` file

## Usage

### Basic Command

```bash
python scripts/migrate-hugo-to-astro.py <path-to-hugo-post-folder>
```

### Example

```bash
python scripts/migrate-hugo-to-astro.py hugo-posts/2024-04-02-updating-my-dotfiles
```

### What Happens During Migration

1. **Reads the Hugo post** from `index.md`
2. **Converts frontmatter** to Astro format
3. **Translates shortcodes** to MDX components
4. **Copies assets**:
   - `cover.png` → `src/assets/YYYY-MM-DD-post-title/YYYY-MM-DD-post-title-cover.png`
   - `images/` folder → `src/assets/YYYY-MM-DD-post-title/images/`
   - Other image files (PNG, JPG, GIF, etc.)
5. **Creates MDX file** at `src/content/blog/YYYY-MM-DD-post-title.mdx`

## Frontmatter Conversion

### Hugo Frontmatter (Before)

```yaml
---
title: "My Blog Post"
author: "Russ McKendrick"
date: 2024-04-02T07:30:00+01:00
description: "Post description here"
draft: false
showToc: true
cover:
    image: "cover.png"
    relative: true
    alt: "Cover image alt text"
tags:
  - "tag1"
  - "tag2"
---
```

### Astro Frontmatter (After)

```yaml
---
title: "My Blog Post"
description: "Post description here"
date: 2024-04-02T07:30:00+01:00
cover:
  image: "../../assets/2024-04-02-my-blog-post/2024-04-02-my-blog-post-cover.png"
draft: false
showToc: true
tags:
  - "tag1"
  - "tag2"
---
```

**Note**: The script uses `cover.image` with the full path instead of `heroImage`. You'll need to ensure your theme references `cover.image`.

## Shortcode Conversions

### Supported Conversions

The script automatically converts the following Hugo shortcodes to Astro MDX components:

#### YouTube

**Hugo:**
```markdown
{{< youtube oqUclC3gqKs >}}
```

**Astro:**
```mdx
<YouTube id="oqUclC3gqKs" />
```

#### Audio

**Hugo:**
```markdown
{{< audio mp3="/audio/file.mp3" ogg="/audio/file.ogg" >}}
```

**Astro:**
```mdx
<Audio mp3="/audio/file.mp3" ogg="/audio/file.ogg" />
```

#### Apple Music

**Hugo:**
```markdown
{{< applemusic url="https://music.apple.com/gb/album/signals-remastered/1440765198" >}}
```

**Astro:**
```mdx
<AppleMusic url="https://music.apple.com/gb/album/signals-remastered/1440765198" />
```

#### Giphy

**Hugo:**
```markdown
{{< giphy "3o7btPCcdNniyf0ArS" >}}
```

**Astro:**
```mdx
<Giphy id="3o7btPCcdNniyf0ArS" />
```

#### Reddit

**Hugo:**
```markdown
{{< reddit url="https://www.reddit.com/r/Anthropic/comments/1ntnwb8/sonnet_45_is_available_now/" >}}
```

**Astro:**
```mdx
<Reddit url="https://www.reddit.com/r/Anthropic/comments/1ntnwb8/sonnet_45_is_available_now/" />
```

#### Chat Message

**Hugo:**
```markdown
{{< chat-message position="left" avatar="https://example.com/avatar.svg" >}}
This is my message content.
{{< /chat-message >}}
```

**Astro:**
```mdx
<ChatMessage position="left" avatar="https://example.com/avatar.svg">
This is my message content.
</ChatMessage>
```

#### Notice/Callouts

**Hugo:**
```markdown
{{< notice warning >}}
This is a warning message.
{{< /notice >}}
```

**Astro:**
```mdx
<WarningCallout title="Warning">
This is a warning message.
</WarningCallout>
```

**Supported notice types:**
- `note` → `NoteCallout`
- `tip` → `TipCallout`
- `warning` → `WarningCallout`
- `important` → `ImportantCallout`
- `caution` → `CautionCallout`
- `info` → `InfoCallout`

#### LinkPreview

**Hugo:**
```markdown
{{< linkpreview "https://www.anthropic.com/news/claude-4" >}}
```

**Astro:**
```mdx
<LinkPreview id="https://www.anthropic.com/news/claude-4" />
```

#### Instagram

**Hugo:**
```markdown
{{< instagram "https://www.instagram.com/p/ABC123/" >}}
```

**Astro:**
```mdx
<Instagram permalink="https://www.instagram.com/p/ABC123/" />
```

### Shortcodes Converted to Comments

Some Hugo shortcodes don't have direct Astro equivalents and are commented out for manual conversion:

#### Terminal

**Hugo:**
```markdown
{{< terminal title="Installing Ollama" >}}
```
some code
```
{{< /terminal >}}
```

**Astro (commented):**
```markdown
{/* Terminal: Installing Ollama */}
```
some code
```
{/* /Terminal */}
```

#### IDE

**Hugo:**
```markdown
{{< ide title="" lang="JSON" >}}
```json
{ "key": "value" }
```
{{< /ide >}}
```

**Astro (commented):**
```markdown
{/* IDE: title="" lang="JSON" */}
```json
{ "key": "value" }
```
{/* /IDE */}
```

#### Gallery

**Hugo:**
```markdown
{{< gallery match="images/*" sortOrder="assc" rowHeight="200" >}}<br>
```

**Astro (commented):**
```markdown
{/* GALLERY: match="images/*" sortOrder="assc" rowHeight="200" */}
```

#### Raw HTML

**Hugo:**
```markdown
{{< rawHTML >}}
<div>Custom HTML</div>
{{< /rawHTML >}}
```

**Astro (commented):**
```markdown
{/* RAW HTML START */}
<div>Custom HTML</div>
{/* RAW HTML END */}
```

### Unknown Shortcodes

Any shortcode that the script doesn't recognize will be commented out with a TODO marker:

```markdown
{/* TODO: Convert shortcode: {{shortcode_name params}} */}
```

**Note:** The script uses MDX-style comments (`{/* */}`) instead of HTML comments (`<!-- -->`) because MDX files require JSX comment syntax.

## Post-Migration Checklist

After running the migration script, review the converted post:

1. ✅ Check that the MDX file was created in `src/content/blog/`
2. ✅ Verify assets were copied to `src/assets/YYYY-MM-DD-post-title/`
3. ✅ Review all commented shortcodes (`<!-- TODO: Convert shortcode -->`)
4. ✅ Check that images display correctly
5. ✅ Test the post in development mode: `npm run dev`
6. ✅ Verify frontmatter fields are correct
7. ✅ Update any manual shortcode conversions
8. ✅ Run `npx astro check` to validate types

## Adding New Shortcode Conversions

To add support for a new Hugo shortcode, edit the `convert_shortcodes()` method in `migrate-hugo-to-astro.py`:

### Step 1: Identify the Pattern

Find examples of the shortcode in your Hugo posts:

```bash
grep -r "{{< myshortcode" hugo-posts/
```

### Step 2: Add Conversion Logic

Add a new regex substitution in the `convert_shortcodes()` method:

```python
def convert_shortcodes(self, content):
    # ... existing conversions ...

    # MyShortcode: {{< myshortcode param="value" >}}
    content = re.sub(
        r'{{\s*<\s*myshortcode\s+param="([^"]+)"\s*>\s*}}',
        r'<MyComponent param="\1" />',
        content,
        flags=re.IGNORECASE
    )

    return content
```

### Step 3: Complex Conversions (with closing tags)

For shortcodes with opening and closing tags:

```python
def convert_my_shortcode(match):
    params = match.group(1)
    inner_content = match.group(2)

    # Extract parameters
    param_match = re.search(r'param="([^"]+)"', params)
    param_value = param_match.group(1) if param_match else ''

    return f'<MyComponent param="{param_value}">\n{inner_content}\n</MyComponent>'

content = re.sub(
    r'{{\s*<\s*myshortcode\s+([^>]+)>\s*}}(.*?){{\s*</\s*myshortcode\s*>\s*}}',
    convert_my_shortcode,
    content,
    flags=re.IGNORECASE | re.DOTALL
)
```

### Step 4: Test Your Changes

Run the migration on a test post:

```bash
python scripts/migrate-hugo-to-astro.py hugo-posts/2024-XX-XX-test-post
```

### Step 5: Document the Shortcode

Add the new shortcode conversion to this guide under "Supported Conversions".

## Regular Expression Patterns

The script uses Python's `re` module for pattern matching. Here are common patterns:

| Pattern | Description |
|---------|-------------|
| `\s*` | Zero or more whitespace characters |
| `\s+` | One or more whitespace characters |
| `[^"]+` | One or more characters that aren't quotes |
| `[^>]+` | One or more characters that aren't `>` |
| `.*?` | Non-greedy match (shortest match) |
| `(\w+)` | Capture group: word characters |
| `(?:...)` | Non-capturing group |

### Flags

- `re.IGNORECASE` - Case-insensitive matching
- `re.DOTALL` - `.` matches newlines
- `re.MULTILINE` - `^` and `$` match line boundaries

## Troubleshooting

### Script Fails with "Invalid frontmatter format"

**Cause**: The Hugo post's frontmatter is not properly formatted with `---` delimiters.

**Solution**: Check that `index.md` starts with `---` and has a closing `---`.

### Cover Image Not Found

**Cause**: The Hugo post doesn't have a `cover.png` file.

**Solution**: Either add a `cover.png` to the Hugo post folder or manually update the frontmatter after migration.

### Shortcodes Not Converting

**Cause**: The regex pattern doesn't match the shortcode format.

**Solution**:
1. Check the exact format in your Hugo post
2. Update the regex pattern in `convert_shortcodes()`
3. Consider adding a custom conversion (see "Adding New Shortcode Conversions")

### Date Not Extracted from Folder Name

**Cause**: Folder name doesn't follow `YYYY-MM-DD-title` format.

**Solution**: Rename the Hugo post folder to match the required format.

### Assets Not Copying

**Cause**: Permissions issue or path doesn't exist.

**Solution**: Check that you have write permissions for `src/assets/` and `src/content/blog/`.

## Batch Migration

To migrate multiple posts at once, use a bash script:

```bash
#!/bin/bash
for dir in hugo-posts/2024-*; do
    echo "Migrating $dir..."
    python scripts/migrate-hugo-to-astro.py "$dir"
done
```

Or use a Python script:

```python
import os
import subprocess

hugo_posts_dir = 'hugo-posts'
for folder in os.listdir(hugo_posts_dir):
    if folder.startswith('2024-'):
        path = os.path.join(hugo_posts_dir, folder)
        print(f"Migrating {folder}...")
        subprocess.run(['python', 'scripts/migrate-hugo-to-astro.py', path])
```

## Reference

- **Hugo Shortcodes**: [Hugo Shortcode Documentation](https://gohugo.io/content-management/shortcodes/)
- **Astro Content Collections**: [Astro Docs](https://docs.astro.build/en/guides/content-collections/)
- **MDX Components**: [MDX Documentation](https://mdxjs.com/)
- **Python re module**: [Python Regular Expressions](https://docs.python.org/3/library/re.html)

## Support

If you encounter issues:

1. Check the script output for specific error messages
2. Review the "Troubleshooting" section above
3. Inspect the Hugo post's `index.md` for unusual formatting
4. Test with a simple post first before batch migration
5. Check that all required Astro components exist in `src/components/embeds/`

## Version History

- **v1.0** (2025-09-30): Initial release
  - Frontmatter conversion
  - Basic shortcode support (YouTube, Audio, AppleMusic, Giphy, Reddit, ChatMessage, Notices)
  - Asset copying with renaming
  - Comments for unsupported shortcodes