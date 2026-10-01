import { getCFImageUrl, generateCFSrcSet } from './cloudflare-images'
import { CF_IMAGE_PRESETS } from '../consts'

type ImageSource = Parameters<typeof generateCFSrcSet>[0]

/**
 * Image attributes for the homepage lead cover — the page's LCP element.
 * index.astro preloads exactly these values and HomeLead renders them, so the
 * preload and the <img> can never drift apart and fetch twice.
 *
 * The cover spans the 1320px container (1240px of content at desktop gutters)
 * and the full column minus gutters below that.
 */
export function leadImageAttrs(image: ImageSource) {
	const preset = CF_IMAGE_PRESETS.hero
	return {
		src: getCFImageUrl(image, { width: 1536, quality: preset.quality, format: preset.format, fit: preset.fit }),
		srcset: generateCFSrcSet(image, preset.widths, preset.quality, preset.format),
		sizes: '(min-width: 1320px) 1240px, (min-width: 1024px) calc(100vw - 80px), (min-width: 640px) calc(100vw - 48px), calc(100vw - 32px)',
	}
}
