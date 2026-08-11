import fs from 'node:fs'
import path from 'node:path'
import type { CollectionEntry } from 'astro:content'

export interface TuneCover {
	src: string
	alt: string
}

/**
 * The record covers for a tunes entry, read from `public/assets/{id}/albums/`.
 *
 * Alt text comes from the <LightGallery> entries in the post body, which already
 * name every record ("Duke by Genesis"), so the footer strip and the tunes lead
 * row describe the same image the same way the lightbox does. Covers that aren't
 * in the gallery fall back to their filename. These images are the only thing
 * naming the records in those strips - there is no adjacent text - so `alt=""`
 * would drop them for screen readers and image search alike.
 */
export function getTuneCovers(tune: CollectionEntry<'tunes'>, limit: number): TuneCover[] {
	return coversFor(tune).slice(0, limit)
}

interface TuneCoversCache {
	id: string
	covers: TuneCover[]
}

// The full list is memoised on globalThis so ~2k page renders share one readdir
// and one body scan per entry (the Footer renders on every page).
const cacheStore = globalThis as typeof globalThis & { __tuneCovers?: TuneCoversCache }

function coversFor(tune: CollectionEntry<'tunes'>): TuneCover[] {
	if (cacheStore.__tuneCovers?.id === tune.id) return cacheStore.__tuneCovers.covers

	const albumsDir = path.join(process.cwd(), 'public', 'assets', tune.id, 'albums')
	let covers: TuneCover[] = []

	if (fs.existsSync(albumsDir)) {
		const galleryAlts = galleryAltMap(tune.body ?? '')
		covers = fs.readdirSync(albumsDir)
			.filter(file => /\.(jpe?g|png|webp)$/i.test(file))
			.sort()
			.map(file => {
				const src = `/assets/${tune.id}/albums/${file}`
				return { src, alt: galleryAlts.get(src) || altFromFilename(file) }
			})
	}

	cacheStore.__tuneCovers = { id: tune.id, covers }
	return covers
}

/** src -> alt for every `{ src: "...", alt: "..." }` pair in the post body. */
function galleryAltMap(body: string): Map<string, string> {
	const alts = new Map<string, string>()
	for (const entry of body.match(/\{[^{}]*\}/g) ?? []) {
		const src = entry.match(/src:\s*["']([^"']+)["']/)?.[1]
		const alt = entry.match(/alt:\s*["']([^"']*)["']/)?.[1]
		if (src && alt) alts.set(src, alt)
	}
	return alts
}

/** "Let-Me-Come-Over-25th-Anniversary-Edition.jpg" -> "Let Me Come Over 25th Anniversary Edition". */
function altFromFilename(file: string): string {
	return file.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim()
}
