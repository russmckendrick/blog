#!/usr/bin/env python3
"""
Fix broken image URLs by renaming files with special characters to match URL-friendly versions.
Reads broken URLs from tmp/broken-images.txt and renames matching files in public/assets.
"""

import os
import re
from pathlib import Path
from difflib import SequenceMatcher
from urllib.parse import urlparse
import argparse


def get_similarity(a, b):
    """Calculate similarity ratio between two strings."""
    return SequenceMatcher(None, a.lower(), b.lower()).ratio()


def extract_path_from_url(url):
    """Extract the file path from the URL, relative to public/assets."""
    # Remove domain and leading /assets/
    url = url.strip()

    # Handle both russ.cloud and www.russ.cloud
    url = re.sub(r'^https?://(www\.)?russ\.cloud/assets/', '', url)

    return url


def find_best_match(expected_filename, directory):
    """Find the best matching file in the directory using fuzzy matching."""
    if not directory.exists():
        return None, 0.0

    best_match = None
    best_score = 0.0
    expected_base = expected_filename.rsplit('.', 1)[0]  # Remove extension
    expected_ext = expected_filename.rsplit('.', 1)[1] if '.' in expected_filename else ''

    for file in directory.iterdir():
        if file.is_file():
            # Only compare files with the same extension
            if file.suffix.lower() == f'.{expected_ext}'.lower():
                score = get_similarity(expected_base, file.stem)
                if score > best_score:
                    best_score = score
                    best_match = file

    return best_match, best_score


def rename_file_and_meta(old_path, new_path, dry_run=False):
    """Rename a file and its .meta companion if it exists."""
    changes = []

    # Rename main file
    if old_path.exists():
        if dry_run:
            changes.append(f"WOULD RENAME: {old_path} -> {new_path}")
        else:
            old_path.rename(new_path)
            changes.append(f"RENAMED: {old_path} -> {new_path}")

    # Rename .meta file if it exists
    old_meta = Path(str(old_path) + '.meta')
    new_meta = Path(str(new_path) + '.meta')

    if old_meta.exists():
        if dry_run:
            changes.append(f"WOULD RENAME: {old_meta} -> {new_meta}")
        else:
            old_meta.rename(new_meta)
            changes.append(f"RENAMED: {old_meta} -> {new_meta}")

    return changes


def main():
    parser = argparse.ArgumentParser(description='Fix broken image URLs by renaming files')
    parser.add_argument('--dry-run', action='store_true', help='Show what would be renamed without making changes')
    parser.add_argument('--threshold', type=float, default=0.7, help='Similarity threshold for matching (default: 0.7)')
    args = parser.parse_args()

    base_dir = Path(__file__).parent
    broken_images_file = base_dir / 'tmp' / 'broken-images.txt'
    missing_files_log = base_dir / 'tmp' / 'missing-files.txt'
    public_assets = base_dir / 'public' / 'assets'

    if not broken_images_file.exists():
        print(f"ERROR: {broken_images_file} not found")
        return 1

    # Read broken URLs
    with open(broken_images_file, 'r') as f:
        urls = [line.strip() for line in f if line.strip()]

    print(f"Found {len(urls)} broken image URLs")
    print(f"Similarity threshold: {args.threshold}")
    print(f"Mode: {'DRY RUN' if args.dry_run else 'LIVE'}")
    print("-" * 80)

    renamed_count = 0
    missing_files = []

    for url in urls:
        # Extract the expected path
        relative_path = extract_path_from_url(url)
        expected_file = public_assets / relative_path

        # If the file already exists with the correct name, skip it
        if expected_file.exists():
            print(f"✓ ALREADY CORRECT: {relative_path}")
            continue

        # Find the directory and expected filename
        directory = expected_file.parent
        expected_filename = expected_file.name

        # Find best matching file
        best_match, score = find_best_match(expected_filename, directory)

        if best_match and score >= args.threshold:
            print(f"\n📁 {relative_path}")
            print(f"   Found match: {best_match.name} (similarity: {score:.2%})")

            # Rename the file
            changes = rename_file_and_meta(best_match, expected_file, dry_run=args.dry_run)
            for change in changes:
                print(f"   {change}")

            renamed_count += 1
        else:
            print(f"\n❌ NO MATCH: {relative_path}")
            if best_match:
                print(f"   Best candidate: {best_match.name} (similarity: {score:.2%}, below threshold)")
            else:
                print(f"   Directory not found: {directory}")
            missing_files.append(url)

    # Write missing files to log
    if missing_files:
        with open(missing_files_log, 'w') as f:
            f.write('\n'.join(missing_files) + '\n')
        print(f"\n📝 Written {len(missing_files)} missing files to {missing_files_log}")

    print("\n" + "=" * 80)
    print(f"Summary:")
    print(f"  - Total URLs processed: {len(urls)}")
    print(f"  - Files renamed: {renamed_count}")
    print(f"  - Missing/no match: {len(missing_files)}")

    if args.dry_run:
        print(f"\n⚠️  This was a DRY RUN. Run without --dry-run to apply changes.")

    return 0


if __name__ == '__main__':
    exit(main())
