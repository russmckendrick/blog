/**
 * Hero Image Color Utilities
 *
 * Provides functions to retrieve and use extracted color palettes for hero image gradients.
 */

// Import generated color data (will be created at build time)
// @ts-ignore - File is generated at build time
import heroColorsData from '../data/hero-colors.json';

export interface HeroColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  tertiary?: string;
  primaryDark: string;
  secondaryDark: string;
  accentDark: string;
  tertiaryDark?: string;
}

// Default brand gradient (blue theme) - used as fallback
export const DEFAULT_HERO_COLORS: HeroColorPalette = {
  primary: '#3B82F6',      // blue-500
  secondary: '#1E40AF',    // blue-800
  accent: '#60A5FA',       // blue-400
  tertiary: '#1E3A8A',     // blue-900
  primaryDark: '#1E3A5F',  // darkened blue
  secondaryDark: '#0F172A', // slate-900
  accentDark: '#2563EB',   // blue-600
  tertiaryDark: '#0F172A'  // slate-900
};

/**
 * Extract image key from various path formats
 * Handles both Astro-processed paths and source paths
 */
function extractImageKey(imagePath: string): string {
  // Handle various path formats:
  // - /_astro/blog-cover-2024-09-15-post.DxB3k9_Z.png (Astro processed)
  // - /src/assets/2025-01-01-post/cover.jpg (source)
  // - src/assets/2025-01-01-post/cover.jpg (relative)

  let key = imagePath
    // Remove leading protocol/domain if present
    .replace(/^https?:\/\/[^/]+/, '')
    // Remove leading src/assets/ or /src/assets/
    .replace(/^\/?src\/assets\//, '')
    // Remove /_astro/ prefix
    .replace(/^\/_astro\//, '')
    // Remove Astro hash - matches .XXXXXXXX. pattern before extension
    .replace(/\.[A-Za-z0-9_-]{6,}\.(png|jpg|jpeg|webp|avif)$/i, '.$1');

  return key;
}

/**
 * Get color palette for a hero image
 *
 * @param imagePath - The path to the hero image (can be string or Astro image import)
 * @returns HeroColorPalette with primary, secondary, accent colors for light and dark modes
 */
export function getHeroColors(
  imagePath: string | { src: string } | undefined
): HeroColorPalette {
  if (!imagePath) return DEFAULT_HERO_COLORS;

  const path = typeof imagePath === 'string' ? imagePath : imagePath.src;
  const key = extractImageKey(path);

  // Direct lookup
  const colors = (heroColorsData as Record<string, HeroColorPalette>)[key];
  if (colors) return colors;

  // Extract just the filename without extension for fuzzy matching
  const keyFilename = (key.split('/').pop() || '').replace(/\.\w+$/, '');

  // Try matching against all entries
  const entries = Object.entries(heroColorsData as Record<string, HeroColorPalette>);
  for (const [cachedKey, cachedColors] of entries) {
    // Check if the JSON key contains our processed filename
    // e.g., cachedKey: "2024-09-15-.../blog-cover-2024-09-15-...png"
    // keyFilename: "blog-cover-2024-09-15-..."
    if (cachedKey.includes(keyFilename)) {
      return cachedColors;
    }

    // Also check if filenames match exactly (without path)
    const cachedFilename = (cachedKey.split('/').pop() || '').replace(/\.\w+$/, '');
    if (keyFilename && cachedFilename && keyFilename === cachedFilename) {
      return cachedColors;
    }
  }

  return DEFAULT_HERO_COLORS;
}

/**
 * Generate inline style object with CSS custom properties for gradient
 *
 * @param colors - The color palette to use
 * @returns Object with CSS custom property key-value pairs
 */
export function getGradientStyles(colors: HeroColorPalette): Record<string, string> {
  return {
    '--gradient-primary': colors.primary,
    '--gradient-secondary': colors.secondary,
    '--gradient-accent': colors.accent,
    '--gradient-tertiary': colors.tertiary || colors.secondary,
    '--gradient-primary-dark': colors.primaryDark,
    '--gradient-secondary-dark': colors.secondaryDark,
    '--gradient-accent-dark': colors.accentDark,
    '--gradient-tertiary-dark': colors.tertiaryDark || colors.secondaryDark,
  };
}

/**
 * Convert gradient styles object to inline style string
 *
 * @param styles - The styles object from getGradientStyles
 * @returns CSS inline style string
 */
export function gradientStylesToString(styles: Record<string, string>): string {
  return Object.entries(styles)
    .map(([key, value]) => `${key}:${value}`)
    .join(';');
}
