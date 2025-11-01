import { readdirSync } from 'fs';
import { join } from 'path';
import { EXCLUDED_AVATARS } from '../consts';

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
