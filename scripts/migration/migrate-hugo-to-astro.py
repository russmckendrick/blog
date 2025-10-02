#!/usr/bin/env python
"""
Hugo to Astro Blog Post Migration Script

This script migrates blog posts from Hugo format to Astro MDX format.
It handles:
- Frontmatter conversion
- Shortcode translation
- Asset copying and renaming
- Directory structure creation

Usage:
    python scripts/migrate-hugo-to-astro.py <hugo-post-folder>
    python scripts/migrate-hugo-to-astro.py hugo-posts/2024-04-02-updating-my-dotfiles

Author: Russ McKendrick
"""

import os
import sys
import shutil
import re
from pathlib import Path
from datetime import datetime


class HugoToAstroMigrator:
    """Main migration class for converting Hugo posts to Astro MDX format."""

    def __init__(self, hugo_post_path):
        """
        Initialize the migrator with the Hugo post directory path.

        Args:
            hugo_post_path: Path to the Hugo post directory (e.g., hugo-posts/2024-04-02-updating-my-dotfiles)
        """
        self.hugo_post_path = Path(hugo_post_path)
        self.original_folder_name = self.hugo_post_path.name

        # Extract date from folder name (YYYY-MM-DD or YYYY-MM-DD_ format with underscores)
        # Support both hyphens and underscores as separators
        date_match = re.match(r'(\d{4})-(\d{2})-(\d{2})[-_](.+)', self.original_folder_name)
        if not date_match:
            raise ValueError(f"Post folder name must follow format YYYY-MM-DD-title or YYYY-MM-DD_title: {self.original_folder_name}")

        self.year, self.month, self.day, self.title_slug = date_match.groups()

        # Normalize slug to use hyphens (convert underscores to hyphens)
        self.post_slug = f"{self.year}-{self.month}-{self.day}-{self.title_slug.replace('_', '-')}"

        # Set up target paths
        self.astro_content_path = Path('src/content/blog')
        self.astro_assets_path = Path('public/assets')
        self.hugo_posts_img_path = Path('hugo-posts/img')
        self.mdx_filename = f"{self.post_slug}.mdx"
        self.asset_folder_name = self.post_slug

    def read_hugo_post(self):
        """
        Read the Hugo index.md file and extract frontmatter and content.

        Returns:
            tuple: (frontmatter_dict, content_string)
        """
        index_path = self.hugo_post_path / 'index.md'
        if not index_path.exists():
            raise FileNotFoundError(f"No index.md found in {self.hugo_post_path}")

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

        # Date (use 'date' field)
        if 'date' in frontmatter:
            astro_fm.append(f'date: {frontmatter["date"]}')
        elif 'pubDate' in frontmatter:
            astro_fm.append(f'date: {frontmatter["pubDate"]}')

        # Cover image - use public URL path inside post folder
        # The image will be copied to public/assets/{slug}/
        cover_image_path = f"/assets/{self.post_slug}/blog-cover-{self.post_slug}.png"
        astro_fm.append(f'cover:')
        astro_fm.append(f'  image: "{cover_image_path}"')

        # Draft status
        if 'draft' in frontmatter:
            astro_fm.append(f'draft: {frontmatter["draft"]}')

        # Show TOC
        if 'showToc' in frontmatter or 'ShowToc' in frontmatter:
            toc_value = frontmatter.get('showToc', frontmatter.get('ShowToc', 'false'))
            astro_fm.append(f'showToc: {toc_value}')

        # Tags
        if 'tags' in frontmatter and isinstance(frontmatter['tags'], list):
            astro_fm.append('tags:')
            for tag in frontmatter['tags']:
                astro_fm.append(f'  - "{tag}"')

        # Aliases (if present)
        if 'aliases' in frontmatter and isinstance(frontmatter['aliases'], list):
            astro_fm.append('aliases:')
            for alias in frontmatter['aliases']:
                astro_fm.append(f'  - "{alias}"')

        astro_fm.append('---')

        return '\n'.join(astro_fm)

    def convert_shortcodes(self, content):
        """
        Convert Hugo shortcodes to Astro MDX components or comments.

        Args:
            content: Post content with Hugo shortcodes

        Returns:
            str: Content with converted shortcodes
        """
        # IMPORTANT: Process paired shortcodes (with closing tags) FIRST
        # before processing single shortcodes

        # Notice callouts: {{< notice type >}}...{{< /notice >}}
        # or {{< notice type "Custom Title" >}}...{{< /notice >}}
        def convert_notice(match):
            full_params = match.group(1).strip()
            notice_content = match.group(2).strip()

            # Extract type and optional custom title
            # Pattern: type or type "title"
            param_match = re.match(r'(\w+)(?:\s+"([^"]+)")?', full_params)
            if param_match:
                notice_type = param_match.group(1).lower()
                custom_title = param_match.group(2)
            else:
                notice_type = full_params.lower()
                custom_title = None

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
            title = custom_title or notice_type.capitalize()

            return f'<{component} title="{title}">\n{notice_content}\n</{component}>'

        content = re.sub(
            r'\{\{<\s*notice\s+([^>]+)>\}\}(.*?)\{\{<\s*/notice\s*>\}\}',
            convert_notice,
            content,
            flags=re.IGNORECASE | re.DOTALL
        )

        # Chat message shortcode: {<< chat-message position="left" avatar="..." >...{<< /chat-message >
        def convert_chat_message(match):
            params = match.group(1)
            message_content = match.group(2)

            # Handle both = and == in Hugo shortcodes
            position_match = re.search(r'position=+\"([^"]+)\"', params)
            avatar_match = re.search(r'avatar=+\"([^"]+)\"', params)

            props = []
            if position_match:
                props.append(f'position="{position_match.group(1)}"')
            if avatar_match:
                props.append(f'avatar="{avatar_match.group(1)}"')

            return f'<ChatMessage {" ".join(props)}>\n{message_content}\n</ChatMessage>'

        content = re.sub(
            r'\{\{<\s*chat-message\s+([^>]+)\s*>\}\}(.*?)\{\{<\s*/chat-message\s*>\}\}',
            convert_chat_message,
            content,
            flags=re.IGNORECASE | re.DOTALL
        )

        # Terminal shortcode - convert to code fence with frame="terminal"
        # {{< terminal title="..." >}}```lang\ncode\n```{{< /terminal >}}
        def convert_terminal(match):
            params = match.group(1)
            code_content = match.group(2).strip()

            # Strip <br /> tags from code content
            code_content = re.sub(r'<br\s*/?>(?:\s*)?', '', code_content, flags=re.IGNORECASE)

            # Extract title if present
            title_match = re.search(r'title="([^"]+)"', params)
            title = title_match.group(1) if title_match else None

            # Extract existing language from code fence if present
            code_fence_match = re.match(r'```(\w+)?\n(.*?)\n```', code_content, re.DOTALL)
            if code_fence_match:
                existing_lang = code_fence_match.group(1) or 'bash'
                actual_code = code_fence_match.group(2)
            else:
                # No code fence, wrap it
                existing_lang = 'bash'
                actual_code = code_content

            # Build new code fence with frame="terminal"
            if title:
                return f'```{existing_lang} frame="terminal" title="{title}"\n{actual_code}\n```\n'
            else:
                return f'```{existing_lang} frame="terminal"\n{actual_code}\n```\n'

        content = re.sub(
            r'\{\{<\s*terminal\s+([^>]*)\s*>\}\}(.*?)\{\{<\s*/terminal\s*>\}\}(?:<br\s*/?>\s*)?',
            convert_terminal,
            content,
            flags=re.IGNORECASE | re.DOTALL
        )

        # IDE shortcode - convert to code fence with frame="code"
        # {{< ide title="..." lang="..." >}}```lang {linenos=true}\ncode\n```{{< /ide >}}
        def convert_ide(match):
            params = match.group(1)
            code_content = match.group(2).strip()

            # Strip <br /> tags from code content
            code_content = re.sub(r'<br\s*/?>(?:\s*)?', '', code_content, flags=re.IGNORECASE)

            # Extract parameters
            title_match = re.search(r'title="([^"]+)"', params)
            lang_match = re.search(r'lang="([^"]+)"', params)

            title = title_match.group(1) if title_match else None
            lang = lang_match.group(1).lower() if lang_match else None

            # Extract existing language and linenos from code fence if present
            code_fence_match = re.match(r'```(\w+)?(?:\s+\{linenos=true\})?\n(.*?)\n```', code_content, re.DOTALL)
            if code_fence_match:
                existing_lang = code_fence_match.group(1)
                actual_code = code_fence_match.group(2)
                has_linenos = '{linenos=true}' in code_content
            else:
                # No code fence, wrap it
                existing_lang = None
                actual_code = code_content
                has_linenos = False

            # Determine final language
            final_lang = lang or existing_lang or 'text'

            # Determine final title
            if title:
                final_title = f"{title} ({final_lang.upper()})"
            else:
                final_title = final_lang.capitalize()

            # Build new code fence with frame="code"
            fence_parts = [f'```{final_lang}', 'frame="code"', f'title="{final_title}"']
            if has_linenos:
                fence_parts.append('showLineNumbers')

            fence_header = ' '.join(fence_parts)
            return f'{fence_header}\n{actual_code}\n```\n'

        content = re.sub(
            r'\{\{<\s*ide\s+([^>]*)\s*>\}\}(.*?)\{\{<\s*/ide\s*>\}\}(?:<br\s*/?>\s*)?',
            convert_ide,
            content,
            flags=re.IGNORECASE | re.DOTALL
        )

        # RawHTML shortcode - comment out (use MDX comments)
        content = re.sub(
            r'\{\{<\s*rawHTML\s*>\}\}(.*?)\{\{<\s*/rawHTML\s*>\}\}',
            r'{/* RAW HTML START */}\n\1\n{/* RAW HTML END */}',
            content,
            flags=re.IGNORECASE | re.DOTALL
        )

        # NOW process single shortcodes (without closing tags)

        # YouTube shortcode: {<< youtube VIDEO_ID >
        content = re.sub(
            r'\{\{<\s*youtube\s+([^\s>]+)\s*>\}\}',
            r'<YouTube id="\1" />',
            content,
            flags=re.IGNORECASE
        )

        # Audio shortcode: {<< audio mp3="..." ogg="..." >
        def convert_audio(match):
            params = match.group(1)
            mp3_match = re.search(r'mp3="([^"]+)"', params)
            ogg_match = re.search(r'ogg="([^"]+)"', params)
            wav_match = re.search(r'wav="([^"]+)"', params)

            props = []
            if mp3_match:
                props.append(f'mp3="{mp3_match.group(1)}"')
            if ogg_match:
                props.append(f'ogg="{ogg_match.group(1)}"')
            if wav_match:
                props.append(f'wav="{wav_match.group(1)}"')

            return f'<Audio {" ".join(props)} />'

        content = re.sub(
            r'\{\{<\s*audio\s+([^>]+)\s*>\}\}',
            convert_audio,
            content,
            flags=re.IGNORECASE
        )

        # Apple Music shortcode: {<< applemusic url="..." >
        content = re.sub(
            r'\{\{<\s*applemusic\s+url="([^"]+)"\s*>\}\}',
            r'<AppleMusic url="\1" />',
            content,
            flags=re.IGNORECASE
        )

        # Giphy shortcode: {<< giphy "ID" >
        content = re.sub(
            r'\{\{<\s*giphy\s+"([^"]+)"\s*>\}\}',
            r'<Giphy id="\1" />',
            content,
            flags=re.IGNORECASE
        )

        # Reddit shortcode: {{< reddit url="..." >}} or {{< reddit url="..." height="..." >}}
        def convert_reddit(match):
            url = match.group(1)
            height = match.group(2) if len(match.groups()) > 1 and match.group(2) else None
            if height:
                return f'<Reddit url="{url}" height="{height}" />'
            else:
                return f'<Reddit url="{url}" />'

        content = re.sub(
            r'\{\{<\s*reddit\s+url="([^"]+)"(?:\s+height="([^"]+)")?\s*>\}\}',
            convert_reddit,
            content,
            flags=re.IGNORECASE
        )

        # X/Twitter shortcode: {{< x user="..." id="..." >}}
        content = re.sub(
            r'\{\{<\s*x\s+user="([^"]+)"\s+id="([^"]+)"\s*>\}\}',
            r'https://x.com/\1/status/\2',
            content,
            flags=re.IGNORECASE
        )

        # Terminal shortcode: {{< terminal title="..." >}} - just remove it, the code block follows
        content = re.sub(
            r'\{\{<\s*terminal\s+title="[^"]*"\s*>\}\}',
            r'',
            content,
            flags=re.IGNORECASE
        )

        # Terminal closing tag: {{< /terminal >}}
        content = re.sub(
            r'\{\{<\s*/terminal\s*>\}\}',
            r'',
            content,
            flags=re.IGNORECASE
        )

        # Center shortcode: {{< center >}}...{{< /center >}} - remove the wrapper
        content = re.sub(
            r'\{\{<\s*center\s*>\}\}',
            r'',
            content,
            flags=re.IGNORECASE
        )
        content = re.sub(
            r'\{\{<\s*/center\s*>\}\}',
            r'',
            content,
            flags=re.IGNORECASE
        )

        # Old gallery shortcode: {{< oldgallery >}} - convert to comment
        content = re.sub(
            r'\{\{<\s*oldgallery\s*>\}\}',
            r'{/* Old gallery removed - please add images manually if needed */}',
            content,
            flags=re.IGNORECASE
        )

        # Random album shortcode: {{< random-album >}} - convert to comment
        content = re.sub(
            r'\{\{<\s*random-album\s*>\}\}',
            r'{/* Random album component - implement if needed */}',
            content,
            flags=re.IGNORECASE
        )

        # Gallery shortcode: {{< gallery match="images/path/*" ... >}}
        def convert_gallery(match):
            params = match.group(1)

            # Extract the match parameter (the path pattern)
            match_pattern = re.search(r'match="([^"]+)"', params)
            if not match_pattern:
                return f'{{/* GALLERY: {params} */}}'

            gallery_path = match_pattern.group(1)

            # Remove the wildcard (* or *.png, etc.) from the path
            gallery_dir = gallery_path.rstrip('/*').rstrip('*')

            # Build the full path to the source images
            source_gallery_path = self.hugo_post_path / gallery_dir

            # Check if the directory exists
            if not source_gallery_path.exists() or not source_gallery_path.is_dir():
                return f'{{/* GALLERY: Directory not found: {gallery_dir} */}}'

            # Get all image files from the directory
            image_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
            image_files = []
            for file in sorted(source_gallery_path.glob('*')):
                if file.is_file() and file.suffix.lower() in image_extensions:
                    image_files.append(file.name)

            if not image_files:
                return f'{{/* GALLERY: No images found in {gallery_dir} */}}'

            # Build the LightGallery component
            imgs_list = []
            for img_file in image_files:
                img_path = f'/assets/{self.post_slug}/{gallery_dir}/{img_file}'
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
            r'\{\{<\s*gallery\s+([^>]+)\s*>\}\}(?:<br>)?',
            convert_gallery,
            content,
            flags=re.IGNORECASE
        )

        # LinkPreview: {{< linkpreview "url" >}} or {{< linkpreview "url" "noimage" >}}
        content = re.sub(
            r'\{\{<\s*linkpreview\s+"([^"]+)"(?:\s+"[^"]*")?\s*>\}\}',
            r'<LinkPreview id="\1" />',
            content,
            flags=re.IGNORECASE
        )

        # Instagram: {{< instagram "url" >}} or {{< instagram POST_ID >}}
        def convert_instagram(match):
            instagram_id = match.group(1)
            # If it's a full URL, use it; otherwise construct the URL
            if instagram_id.startswith('http'):
                return f'<Instagram permalink="{instagram_id}" />'
            else:
                # It's just an ID, need to construct URL
                return f'<Instagram permalink="https://www.instagram.com/reel/{instagram_id}/" />'

        content = re.sub(
            r'\{\{<\s*instagram\s+"?([^"\s>]+)"?\s*>\}\}',
            convert_instagram,
            content,
            flags=re.IGNORECASE
        )

        # Img shortcode: {{< img src="..." alt="..." >}} or {{img src="..." alt="..." }}
        def convert_img(match):
            params = match.group(1)

            # Extract parameters
            src_match = re.search(r'src="([^"]+)"', params)
            alt_match = re.search(r'alt="([^"]+)"', params)
            width_match = re.search(r'width="([^"]+)"', params)
            link_match = re.search(r'link="([^"]+)"', params)
            zoom_match = re.search(r'zoom="([^"]+)"', params)

            props = []
            if src_match:
                props.append(f'src="{src_match.group(1)}"')
            if alt_match:
                props.append(f'alt="{alt_match.group(1)}"')
            if width_match:
                props.append(f'width="{width_match.group(1)}"')
            if link_match:
                props.append(f'link="{link_match.group(1)}"')
            if zoom_match:
                props.append(f'zoom={{{zoom_match.group(1)}}}')

            return f'<Img {" ".join(props)} />'

        content = re.sub(
            r'\{\{<?\s*img\s+([^>]+)\s*>?\}\}',
            convert_img,
            content,
            flags=re.IGNORECASE
        )

        # [code] shortcode: [code gutter="false"]...[/code] → ```text frame="terminal"
        def convert_code_block(match):
            # match.group(1) = code content
            code_content = match.group(1)
            return f'```text frame="terminal"\n{code_content}\n```'

        content = re.sub(
            r'\[code[^\]]*\]\s*\n?(.*?)\n?\[/code\]',
            convert_code_block,
            content,
            flags=re.DOTALL
        )

        # Catch any remaining unconverted shortcodes and comment them out (MDX style)
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

        # Fix malformed self-closing tags in HTML
        # Pattern: <img .../ attr="..."> should be <img ... attr="..." />
        # This handles cases like: <img src="..." class="foo"/ alt="bar">
        content = re.sub(
            r'(<(?:img|br|hr|input|meta|link)\b[^>]*?)(/)\s+([a-zA-Z])',
            r'\1 \3',
            content,
            flags=re.IGNORECASE
        )

        # Ensure self-closing tags are properly closed: <img ... > becomes <img ... />
        # Only for void elements (img, br, hr, input, meta, link)
        content = re.sub(
            r'(<(?:img|br|hr|input|meta|link)\b[^>]*?)(?<!/)>',
            r'\1 />',
            content,
            flags=re.IGNORECASE
        )

        # Convert markdown images with /img/ paths to Img components
        content = self._convert_img_references(content)

        # Fix relative asset paths in content
        content = self._fix_asset_paths(content)

        # Escape curly braces in markdown link URLs to prevent MDX from treating them as JS expressions
        content = self._escape_curly_braces_in_urls(content)

        # Fix MDX-specific issues (must be done after shortcode conversion)
        content = self._fix_mdx_issues(content)

        return content

    def _convert_img_references(self, content):
        """
        Convert markdown image syntax with /img/ or relative paths to Img embed components.

        Examples:
        - ![alt text](/img/2014-08-10_dotfiles_1.png) → <Img src="/assets/{slug}/img/2014-08-10_dotfiles_1.png" alt="alt text" />
        - ![alt text](images/file.png) → <Img src="/assets/{slug}/images/file.png" alt="alt text" />
        """
        def convert_img(match):
            alt = match.group(1)
            img_path = match.group(2)

            # Handle /img/ paths (legacy Hugo paths)
            if img_path.startswith('/img/'):
                filename = img_path.replace('/img/', '')
                new_path = f'/assets/{self.post_slug}/img/{filename}'
            # Handle relative images/ paths
            elif img_path.startswith('images/'):
                new_path = f'/assets/{self.post_slug}/{img_path}'
            # Handle other relative paths (e.g., cover.png, file.jpg)
            elif not img_path.startswith(('http://', 'https://', '/')):
                new_path = f'/assets/{self.post_slug}/{img_path}'
            else:
                # Already absolute or external, don't convert
                return match.group(0)

            # Build Img component
            if alt:
                return f'<Img src="{new_path}" alt="{alt}" />'
            else:
                return f'<Img src="{new_path}" alt="" />'

        # Match markdown image syntax: ![alt text](path)
        content = re.sub(
            r'!\[([^\]]*)\]\(([^)]+)\)',
            convert_img,
            content
        )

        return content

    def _fix_asset_paths(self, content):
        """
        Fix relative asset paths to use absolute public URLs.

        Examples:
        - images/cursor.png → /assets/{slug}/images/cursor.png
        - file.mp3 → /assets/{slug}/file.mp3
        - avatar="images/foo.png" → avatar="/assets/{slug}/images/foo.png"
        """
        # Fix paths in component attributes (avatar, src, mp3, ogg, wav, etc.)
        def fix_component_path(match):
            attr_name = match.group(1)  # This already includes the '='
            path = match.group(2)

            # Skip if already absolute or external
            if path.startswith(('/','http://', 'https://')):
                return match.group(0)

            # Convert to absolute path
            fixed_path = f'/assets/{self.post_slug}/{path}'
            return f'{attr_name}"{fixed_path}"'  # Don't add extra '='

        # Match component attributes with relative paths
        content = re.sub(
            r'((?:avatar|src|mp3|ogg|wav|href)=)"([^/"h][^"]*)"',
            fix_component_path,
            content
        )

        return content

    def _escape_curly_braces_in_urls(self, content):
        r"""
        Escape curly braces in HTTP/HTTPS URLs to prevent MDX from treating them as JS expressions.

        MDX treats {variable} as JavaScript expressions, so URLs like:
        https://example.com/path/{subscriptionId}/resource

        Need to be escaped using HTML entities:
        https://example.com/path/&#123;subscriptionId&#125;/resource

        This applies to any http:// or https:// URLs in the content.
        """
        # First, handle markdown links [text](url)
        # Note: In this blog, URLs often appear in BOTH the display text and link target
        # Example: [https://example.com/{var}/path](https://docs.microsoft.com/...)
        def escape_markdown_link(match):
            text = match.group(1)
            url = match.group(2)
            # Escape curly braces using HTML entities in BOTH the text and URL parts
            escaped_text = text.replace('{', '&#123;').replace('}', '&#125;')
            escaped_url = url.replace('{', '&#123;').replace('}', '&#125;')
            return f'[{escaped_text}]({escaped_url})'

        # Match markdown links with http/https URLs in either text or target
        content = re.sub(
            r'\[([^\]]+)\]\((https?://[^)]+)\)',
            escape_markdown_link,
            content
        )

        # Second, handle standalone URLs (not in markdown links)
        # This is for any http/https URLs that are just in plain text
        def escape_standalone_url(match):
            url = match.group(0)
            # Escape curly braces using HTML entities
            escaped_url = url.replace('{', '&#123;').replace('}', '&#125;')
            return escaped_url

        # Match standalone http/https URLs that are NOT inside markdown links
        # We already processed markdown links, so this catches the rest
        # Match until whitespace, quote, or angle bracket
        content = re.sub(
            r'(?<!\()https?://[^\s<>"]+',
            escape_standalone_url,
            content
        )

        return content

    def _fix_mdx_issues(self, content):
        """
        Fix MDX-specific parsing issues that occur after shortcode conversion.

        Issues fixed:
        1. Wrap {{ template_var }} in backticks when not already in code blocks
        2. Escape <tag-like-text> that looks like HTML but isn't (e.g., <pending>)
        """
        # Fix {{ variable }} syntax that's not in code blocks or components
        # This handles Ansible/Jinja2 template variables in prose
        def wrap_double_braces(match):
            before = match.group(1)
            braces_content = match.group(2)

            # Don't wrap if it's already in backticks, code block, or HTML attribute
            if '`' in before[-10:] if len(before) >= 10 else False:
                return match.group(0)

            return f'{before}`{{{{ {braces_content} }}}}`'

        # Match {{ something }} that appears in regular text
        # Negative lookbehind to avoid matching in URLs or after backticks
        content = re.sub(
            r'([^`\n]*?)(\{\{\s*([^}]+)\s*\}\})',
            lambda m: f'{m.group(1)}`{m.group(2)}`' if '`' not in m.group(1)[-5:] else m.group(0),
            content
        )

        # Escape <word> patterns that look like HTML tags but aren't
        # Common patterns: <pending>, <none>, <empty>, etc.
        content = re.sub(
            r'<(pending|none|empty|null|undefined|n/a)>',
            r'`<\1>`',
            content,
            flags=re.IGNORECASE
        )

        return content

    def copy_assets(self, content=None):
        """
        Copy assets from Hugo post folder to public/assets/{slug}/ folder.
        All assets including cover go into the same post-specific folder.
        Also checks hugo-posts/img/ for legacy images matching the post pattern.

        Args:
            content: Optional content string to scan for /img/ references
        """
        # Create post-specific asset folder
        target_asset_folder = self.astro_assets_path / self.asset_folder_name
        target_asset_folder.mkdir(parents=True, exist_ok=True)

        # Copy cover image to post folder
        cover_source = self.hugo_post_path / 'cover.png'
        if cover_source.exists():
            cover_filename = f"blog-cover-{self.post_slug}.png"
            cover_target = target_asset_folder / cover_filename
            shutil.copy2(cover_source, cover_target)
            print(f"  ✓ Copied cover image: {cover_filename}")
        else:
            print(f"  ⚠ Warning: No cover.png found in {self.hugo_post_path}")

        # Copy images folder if it exists
        images_source = self.hugo_post_path / 'images'
        if images_source.exists() and images_source.is_dir():
            images_target = target_asset_folder / 'images'
            shutil.copytree(images_source, images_target, dirs_exist_ok=True)
            print(f"  ✓ Copied images folder with {len(list(images_target.rglob('*')))} files")

        # Check for images in hugo-posts/img/ folder matching this post's pattern
        # Pattern: YYYY-MM-DD_title_N.ext or YYYY-MM-DD-title_N.ext
        cover_copied_from_legacy = False
        if self.hugo_posts_img_path.exists():
            # Create search patterns for both underscore and hyphen formats
            original_pattern = self.original_folder_name.replace('-', '-', 3)  # Keep date hyphens
            search_patterns = [
                f"{self.original_folder_name}_*.*",
                f"{self.year}-{self.month}-{self.day}_{self.title_slug}_*.*"
            ]

            legacy_images = []
            for pattern in search_patterns:
                legacy_images.extend(list(self.hugo_posts_img_path.glob(pattern)))

            # Deduplicate images (same file may match multiple patterns)
            legacy_images = list(set(legacy_images))

            # Sort to ensure _0.ext is first (this will be the cover)
            legacy_images.sort()

            if legacy_images:
                print(f"  📁 Found {len(legacy_images)} legacy images in hugo-posts/img/")

                # Check if we need to use the first legacy image as cover
                # (when no cover.png exists in the post folder)
                if not cover_source.exists() and legacy_images:
                    # First image (typically _0.ext) becomes the cover
                    cover_img = legacy_images[0]
                    ext = cover_img.suffix
                    cover_filename = f"blog-cover-{self.post_slug}{ext}"
                    cover_target = target_asset_folder / cover_filename
                    shutil.copy2(cover_img, cover_target)
                    print(f"  ✓ Renamed legacy cover image: {cover_img.name} → {cover_filename}")
                    cover_copied_from_legacy = True

                    # Copy remaining images with original names
                    for img_file in legacy_images[1:]:
                        target_file = target_asset_folder / img_file.name
                        shutil.copy2(img_file, target_file)
                        print(f"  ✓ Copied legacy image: {img_file.name}")
                else:
                    # No cover needed from legacy, copy all with original names
                    for img_file in legacy_images:
                        target_file = target_asset_folder / img_file.name
                        shutil.copy2(img_file, target_file)
                        print(f"  ✓ Copied legacy image: {img_file.name}")

        # Check content for /img/ references and copy those images to img/ subdirectory
        if content and self.hugo_posts_img_path.exists():
            # Find all /img/ references in content
            img_refs = re.findall(r'/img/([^)\s"]+)', content)

            if img_refs:
                # Create img subdirectory in target asset folder
                img_subfolder = target_asset_folder / 'img'
                img_subfolder.mkdir(exist_ok=True)

                print(f"  📁 Found {len(img_refs)} /img/ references in content")
                copied_count = 0
                for img_filename in set(img_refs):  # Use set to avoid duplicates
                    source_img = self.hugo_posts_img_path / img_filename
                    if source_img.exists():
                        target_img = img_subfolder / img_filename
                        shutil.copy2(source_img, target_img)
                        print(f"  ✓ Copied /img/ reference: {img_filename}")
                        copied_count += 1
                    else:
                        print(f"  ⚠ Warning: Referenced image not found: /img/{img_filename}")

        # Copy any other image files (like cover02.png, cover03.png, etc.)
        for file in self.hugo_post_path.glob('*'):
            if file.is_file():
                ext = file.suffix.lower()
                # Images
                if ext in ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg']:
                    if file.name != 'cover.png':  # Already handled
                        target_file = target_asset_folder / file.name
                        shutil.copy2(file, target_file)
                        print(f"  ✓ Copied image: {file.name}")
                # Audio files
                elif ext in ['.mp3', '.ogg', '.wav', '.m4a']:
                    target_file = target_asset_folder / file.name
                    shutil.copy2(file, target_file)
                    print(f"  ✓ Copied audio: {file.name}")
                # Video files
                elif ext in ['.mp4', '.webm', '.mov']:
                    target_file = target_asset_folder / file.name
                    shutil.copy2(file, target_file)
                    print(f"  ✓ Copied video: {file.name}")

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
        print(f"\n🚀 Migrating: {self.post_slug}")
        print(f"  Date: {self.year}-{self.month}-{self.day}")

        # Read Hugo post
        print("\n📖 Reading Hugo post...")
        frontmatter, content = self.read_hugo_post()

        # Convert frontmatter
        print("🔄 Converting frontmatter...")
        astro_frontmatter = self.convert_frontmatter(frontmatter)

        # Convert shortcodes
        print("🔄 Converting shortcodes...")
        astro_content = self.convert_shortcodes(content)

        # Copy assets (pass content to check for /img/ references)
        print("📦 Copying assets...")
        self.copy_assets(content=astro_content)

        # Write MDX file
        print("💾 Writing MDX file...")
        self.write_mdx_file(astro_frontmatter, astro_content)

        print("\n✅ Migration complete!\n")


def main():
    """Main entry point for the script."""
    if len(sys.argv) < 2:
        print("Usage: python scripts/migrate-hugo-to-astro.py <hugo-post-folder> [<hugo-post-folder2> ...]")
        print("Example: python scripts/migrate-hugo-to-astro.py hugo-posts/2024-04-02-updating-my-dotfiles")
        print("Example: python scripts/migrate-hugo-to-astro.py hugo-posts/2024-*")
        sys.exit(1)

    # Get all paths from command line arguments (skip script name)
    hugo_post_paths = sys.argv[1:]

    # Expand wildcards using glob
    import glob
    expanded_paths = []
    for path_pattern in hugo_post_paths:
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

    # Filter to only directories
    directories = [p for p in expanded_paths if os.path.isdir(p)]

    if not directories:
        print("❌ Error: No directories found in the provided paths")
        sys.exit(1)

    print(f"\n🎯 Found {len(directories)} post(s) to migrate\n")

    # Track successes and failures
    successes = []
    failures = []

    for hugo_post_path in directories:
        try:
            migrator = HugoToAstroMigrator(hugo_post_path)
            migrator.migrate()
            successes.append(hugo_post_path)
        except Exception as e:
            print(f"\n❌ Migration failed for {hugo_post_path}: {str(e)}")
            import traceback
            traceback.print_exc()
            failures.append((hugo_post_path, str(e)))

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