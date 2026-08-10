import { readdirSync } from 'fs';
import { join } from 'path';
import { EXCLUDED_AVATARS, CF_IMAGE_PRESETS } from '../consts';
import { getCFImageUrl } from './cloudflare-images';

/**
 * Get all available avatar filenames from the avatars directory
 * Automatically excludes files in the EXCLUDED_AVATARS list from consts.ts
 */
export function getAvailableAvatars(): string[] {
  try {
    const avatarsDir = join(process.cwd(), 'public', 'images', 'avatars');
    const files = readdirSync(avatarsDir);

    // Filter to only include .svg and .png files, excluding the excluded list
    return files
      .filter(file => (file.endsWith('.svg') || file.endsWith('.png')))
      .filter(file => !EXCLUDED_AVATARS.includes(file))
      .sort();
  } catch (error) {
    console.error('Error reading avatars directory:', error);
    return [];
  }
}

/**
 * Resolve an avatar path to a size-appropriate delivery URL.
 *
 * The avatar SVGs are detailed illustrations — ~90 KiB over the wire — and SVGs
 * deliberately bypass Cloudflare (see cloudflare-images.ts), so they ship at full
 * weight no matter how small they render. A 36px byline avatar was the heaviest
 * asset on a post page, competing with the LCP image for bandwidth.
 *
 * Every avatar ships with a same-name PNG twin, so swap to that and let
 * Cloudflare resize it to the box we actually draw. `fit: 'cover'` mirrors the
 * CSS `object-cover` these images are always rendered with, so framing is
 * unchanged; the source illustrations are not square.
 *
 * @param avatarPath - Path under /images/avatars/ (extension optional)
 * @param renderedSize - Largest CSS pixel size the avatar is drawn at
 */
export function getAvatarImageUrl(avatarPath: string, renderedSize: number): string {
  const pngPath = /\.(svg|png)$/i.test(avatarPath)
    ? avatarPath.replace(/\.svg$/i, '.png')
    : `${avatarPath}.png`;

  // 2x so the avatar stays crisp on high-DPI screens
  const size = renderedSize * 2;
  const preset = CF_IMAGE_PRESETS.avatar;

  return getCFImageUrl(pngPath, {
    width: size,
    height: size,
    fit: preset.fit,
    quality: preset.quality,
    format: preset.format
  });
}
