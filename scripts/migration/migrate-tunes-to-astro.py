#!/usr/bin/env python
"""
Hugo Tunes to Astro Migration Script

This script migrates weekly listening posts from Hugo format to Astro MDX format.
It handles:
- Frontmatter conversion (keeping folder basename)
- Shortcode translation (notice, gallery)
- Cover image copying from src/content/tunes/covers/
- Directory structure preservation

Usage:
    python scripts/migrate-tunes-to-astro.py <hugo-tune-folder>
    python scripts/migrate-tunes-to-astro.py src/content/tunes/2025-09-08-listened-to-this-week
    python scripts/migrate-tunes-to-astro.py src/content/tunes/202*

Author: Russ McKendrick
"""

import os
import sys
import shutil
import re
from pathlib import Path


class TunesToAstroMigrator:
    """Main migration class for converting Hugo tunes posts to Astro MDX format."""

    def __init__(self, hugo_tune_path):
        """
        Initialize the migrator with the Hugo tune directory path.

        Args:
            hugo_tune_path: Path to the Hugo tune directory (e.g., src/content/tunes/2025-09-08-listened-to-this-week)
        """
        self.hugo_tune_path = Path(hugo_tune_path)
        self.original_folder_name = self.hugo_tune_path.name

        # Extract date from folder name (YYYY-MM-DD-listened-to-this-week format)
        date_match = re.match(r'(\d{4})-(\d{2})-(\d{2})-(.+)', self.original_folder_name)
        if not date_match:
            raise ValueError(f"Tune folder name must follow format YYYY-MM-DD-title: {self.original_folder_name}")

        self.year, self.month, self.day, self.title_slug = date_match.groups()

        # Keep the original folder name as the base slug
        self.tune_slug = self.original_folder_name

        # Set up target paths
        self.astro_content_path = Path('src/content/tunes')
        self.astro_assets_path = Path('public/assets')
        self.covers_path = Path('src/content/tunes/covers')
        self.mdx_filename = f"{self.tune_slug}.mdx"
        self.asset_folder_name = self.tune_slug

    def read_hugo_tune(self):
        """
        Read the Hugo index.md file and extract frontmatter and content.

        Returns:
            tuple: (frontmatter_dict, content_string)
        """
        index_path = self.hugo_tune_path / 'index.md'
        if not index_path.exists():
            raise FileNotFoundError(f"No index.md found in {self.hugo_tune_path}")

        with open(index_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Split frontmatter and content
        if not content.startswith('---'):
            raise ValueError("Post must start with YAML frontmatter (---)")

        parts = content.split('---', 2)
        if len(parts) < 3:
            raise ValueError("Invalid frontmatter format")

        frontmatter_yaml = parts[1].strip()
        post_content = parts[2].strip()

        # Parse frontmatter (simple YAML parser for common fields)
        frontmatter = self._parse_frontmatter(frontmatter_yaml)

        return frontmatter, post_content

    def _parse_frontmatter(self, yaml_content):
        """
        Parse YAML frontmatter into a dictionary.

        Args:
            yaml_content: YAML string content

        Returns:
            dict: Parsed frontmatter
        """
        frontmatter = {}
        current_key = None
        current_list = None

        for line in yaml_content.split('\n'):
            line = line.rstrip()

            # Handle list items
            if line.startswith('  - ') or line.startswith('- '):
                if current_list is not None:
                    item = line.strip()[2:].strip('"').strip("'")
                    current_list.append(item)
                continue

            # Handle key-value pairs
            if ':' in line and not line.startswith(' '):
                current_list = None
                key, value = line.split(':', 1)
                key = key.strip()
                value = value.strip()

                if value == '':
                    # This might be a list or nested object
                    current_key = key
                    current_list = []
                    frontmatter[key] = current_list
                else:
                    # Remove quotes if present
                    value = value.strip('"').strip("'")
                    frontmatter[key] = value
                    current_key = key
            elif line.startswith('    ') and current_key:
                # Nested field (like cover.image)
                nested_line = line.strip()
                if ':' in nested_line:
                    nested_key, nested_value = nested_line.split(':', 1)
                    nested_key = nested_key.strip()
                    nested_value = nested_value.strip().strip('"').strip("'")

                    # Create nested structure
                    if not isinstance(frontmatter.get(current_key), dict):
                        frontmatter[current_key] = {}
                    frontmatter[current_key][nested_key] = nested_value

        return frontmatter

    def convert_frontmatter(self, frontmatter):
        """
        Convert Hugo frontmatter to Astro format.

        Args:
            frontmatter: Dictionary of Hugo frontmatter

        Returns:
            str: Astro-formatted frontmatter
        """
        # Build Astro frontmatter
        astro_fm = []
        astro_fm.append('---')

        # Required fields
        if 'title' in frontmatter:
            astro_fm.append(f'title: "{frontmatter["title"]}"')

        if 'description' in frontmatter:
            astro_fm.append(f'description: "{frontmatter["description"]}"')
        elif 'summary' in frontmatter:
            # Some tunes use 'summary' instead of 'description'
            astro_fm.append(f'description: "{frontmatter["summary"]}"')

        # Date - tunes schema requires pubDate (not date)
        if 'date' in frontmatter:
            astro_fm.append(f'pubDate: {frontmatter["date"]}')

        # Extract cover image filename from frontmatter
        cover_image_filename = None
        if 'cover' in frontmatter and isinstance(frontmatter['cover'], dict):
            if 'image' in frontmatter['cover']:
                # Extract filename from path like "/img/weekly-tunes-002.png"
                cover_path = frontmatter['cover']['image']
                cover_image_filename = os.path.basename(cover_path)

        # Set heroImage path - reference from covers/ directory
        if cover_image_filename:
            # Reference the image from covers/ directory (relative to the MDX file location)
            cover_image_import = f"./covers/{cover_image_filename}"
            astro_fm.append(f'heroImage: "{cover_image_import}"')
            # Store for later use in asset copying
            self.cover_filename = cover_image_filename

        # Draft status
        if 'draft' in frontmatter:
            astro_fm.append(f'draft: {frontmatter["draft"]}')

        # Tags - always include, default to empty array
        if 'tags' in frontmatter and isinstance(frontmatter['tags'], list) and frontmatter['tags']:
            astro_fm.append('tags:')
            for tag in frontmatter['tags']:
                astro_fm.append(f'  - "{tag}"')
        else:
            astro_fm.append('tags: []')

        astro_fm.append('---')

        return '\n'.join(astro_fm)

    def convert_shortcodes(self, content):
        """
        Convert Hugo shortcodes to Astro MDX components.

        Args:
            content: Post content with Hugo shortcodes

        Returns:
            str: Content with converted shortcodes
        """
        # Notice callouts: {{< notice note >}}...{{< /notice >}}
        def convert_notice(match):
            notice_type = match.group(1).strip().lower()
            notice_content = match.group(2).strip()

            # Map Hugo notice types to Astro callout components
            type_map = {
                'note': 'NoteCallout',
                'tip': 'TipCallout',
                'warning': 'WarningCallout',
                'important': 'ImportantCallout',
                'caution': 'CautionCallout',
                'info': 'InfoCallout'
            }

            component = type_map.get(notice_type, 'GeneralCallout')
            title = notice_type.capitalize()

            return f'<{component} title="{title}">\n{notice_content}\n</{component}>'

        content = re.sub(
            r'\{\{<\s*notice\s+(\w+)\s*>\}\}(.*?)\{\{<\s*/notice\s*>\}\}',
            convert_notice,
            content,
            flags=re.IGNORECASE | re.DOTALL
        )

        # Gallery shortcode: {{< gallery match="artists/*" ... >}}
        # Convert to LightGallery component
        def convert_gallery(match):
            params = match.group(1)

            # Extract the match parameter
            match_pattern = re.search(r'match="([^"]+)"', params)
            if not match_pattern:
                return f'{{/* GALLERY: {params} */}}'

            gallery_path = match_pattern.group(1)
            gallery_dir = gallery_path.rstrip('/*').rstrip('*')

            # Build the full path to the source images
            source_gallery_path = self.hugo_tune_path / gallery_dir

            # Check if directory exists
            if not source_gallery_path.exists() or not source_gallery_path.is_dir():
                return f'{{/* GALLERY: Directory not found: {gallery_dir} */}}'

            # Get all image files
            image_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
            image_files = []
            for file in sorted(source_gallery_path.glob('*')):
                if file.is_file() and file.suffix.lower() in image_extensions:
                    image_files.append(file.name)

            if not image_files:
                return f'{{/* GALLERY: No images found in {gallery_dir} */}}'

            # Build LightGallery component
            imgs_list = []
            for img_file in image_files:
                img_path = f'/assets/{self.tune_slug}/{gallery_dir}/{img_file}'
                imgs_list.append(f'      {{ src: "{img_path}" }}')

            imgs_string = ',\n'.join(imgs_list) + ','

            return f'''<LightGallery
  layout={{{{
    imgs: [
{imgs_string}
    ],
  }}}}
  options={{{{
    thumbnail: true,
  }}}}
/>'''

        content = re.sub(
            r'\{\{<\s*gallery\s+([^>]+)\s*>\}\}',
            convert_gallery,
            content,
            flags=re.IGNORECASE
        )

        # Catch any remaining unconverted shortcodes and comment them out
        content = re.sub(
            r'\{\{<\s*(\w+)([^>]*)\s*>\}\}',
            r'{/* TODO: Convert shortcode: {{\1\2}} */}',
            content
        )

        content = re.sub(
            r'\{\{<\s*/(\w+)\s*>\}\}',
            r'{/* TODO: End shortcode: {{/\1}} */}',
            content
        )

        return content

    def copy_assets(self):
        """
        Copy assets from Hugo tune folder to public/assets/{slug}/ folder.
        Cover images stay in covers/ and are referenced directly.
        Only copies gallery images (artists/ and albums/).
        """
        # Create tune-specific asset folder
        target_asset_folder = self.astro_assets_path / self.asset_folder_name
        target_asset_folder.mkdir(parents=True, exist_ok=True)

        # Note: Cover images are referenced directly from src/content/tunes/covers/
        # No need to copy them to public/assets/
        if hasattr(self, 'cover_filename') and self.cover_filename:
            cover_source = self.covers_path / self.cover_filename
            if cover_source.exists():
                print(f"  ✓ Cover image referenced from covers/: {self.cover_filename}")
            else:
                print(f"  ⚠ Warning: Cover image not found: {cover_source}")

        # Copy artists gallery if it exists
        artists_source = self.hugo_tune_path / 'artists'
        if artists_source.exists() and artists_source.is_dir():
            artists_target = target_asset_folder / 'artists'
            shutil.copytree(artists_source, artists_target, dirs_exist_ok=True)
            image_count = len([f for f in artists_target.rglob('*') if f.is_file()])
            print(f"  ✓ Copied artists gallery with {image_count} files")

        # Copy albums gallery if it exists
        albums_source = self.hugo_tune_path / 'albums'
        if albums_source.exists() and albums_source.is_dir():
            albums_target = target_asset_folder / 'albums'
            shutil.copytree(albums_source, albums_target, dirs_exist_ok=True)
            image_count = len([f for f in albums_target.rglob('*') if f.is_file()])
            print(f"  ✓ Copied albums gallery with {image_count} files")

    def write_mdx_file(self, frontmatter, content):
        """
        Write the converted MDX file to the Astro content folder.

        Args:
            frontmatter: Converted frontmatter string
            content: Converted content string
        """
        target_file = self.astro_content_path / self.mdx_filename

        # Combine frontmatter and content
        full_content = f"{frontmatter}\n\n{content}\n"

        with open(target_file, 'w', encoding='utf-8') as f:
            f.write(full_content)

        print(f"  ✓ Created MDX file: {target_file}")

    def migrate(self):
        """
        Execute the full migration process.
        """
        print(f"\n🎵 Migrating: {self.tune_slug}")
        print(f"  Date: {self.year}-{self.month}-{self.day}")

        # Read Hugo tune
        print("\n📖 Reading Hugo tune post...")
        frontmatter, content = self.read_hugo_tune()

        # Convert frontmatter
        print("🔄 Converting frontmatter...")
        astro_frontmatter = self.convert_frontmatter(frontmatter)

        # Convert shortcodes
        print("🔄 Converting shortcodes...")
        astro_content = self.convert_shortcodes(content)

        # Copy assets
        print("📦 Copying assets...")
        self.copy_assets()

        # Write MDX file
        print("💾 Writing MDX file...")
        self.write_mdx_file(astro_frontmatter, astro_content)

        print("\n✅ Migration complete!\n")


def main():
    """Main entry point for the script."""
    if len(sys.argv) < 2:
        print("Usage: python scripts/migrate-tunes-to-astro.py <hugo-tune-folder> [<hugo-tune-folder2> ...]")
        print("Example: python scripts/migrate-tunes-to-astro.py src/content/tunes/2025-09-08-listened-to-this-week")
        print("Example: python scripts/migrate-tunes-to-astro.py src/content/tunes/202*")
        sys.exit(1)

    # Get all paths from command line arguments
    hugo_tune_paths = sys.argv[1:]

    # Expand wildcards using glob
    import glob
    expanded_paths = []
    for path_pattern in hugo_tune_paths:
        matches = glob.glob(path_pattern)
        if matches:
            expanded_paths.extend(matches)
        else:
            # If no matches, check if it's a direct path
            if os.path.exists(path_pattern):
                expanded_paths.append(path_pattern)
            else:
                print(f"⚠️  Warning: No matches found for pattern: {path_pattern}")

    if not expanded_paths:
        print("❌ Error: No valid paths found")
        sys.exit(1)

    # Filter to only directories (exclude _index.md and other files)
    directories = [p for p in expanded_paths if os.path.isdir(p)]

    if not directories:
        print("❌ Error: No directories found in the provided paths")
        sys.exit(1)

    print(f"\n🎯 Found {len(directories)} tune post(s) to migrate\n")

    # Track successes and failures
    successes = []
    failures = []

    for hugo_tune_path in directories:
        try:
            migrator = TunesToAstroMigrator(hugo_tune_path)
            migrator.migrate()
            successes.append(hugo_tune_path)
        except Exception as e:
            print(f"\n❌ Migration failed for {hugo_tune_path}: {str(e)}")
            import traceback
            traceback.print_exc()
            failures.append((hugo_tune_path, str(e)))

    # Print summary
    print("\n" + "="*80)
    print("📊 Migration Summary")
    print("="*80)
    print(f"✅ Successful: {len(successes)}")
    print(f"❌ Failed: {len(failures)}")

    if failures:
        print("\n❌ Failed migrations:")
        for path, error in failures:
            print(f"  - {path}: {error}")
        sys.exit(1)


if __name__ == '__main__':
    main()
