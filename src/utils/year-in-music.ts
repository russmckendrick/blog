import type { ImageMetadata } from 'astro'

// Year in Music artwork straight from src/assets, independent of the post.
// `pnpm run wrapped -- --year=YYYY --cover-only` writes the cover without the
// post (e.g. for the year in progress); the tunes year pages use this to show
// it anyway. The -small copies are excluded so they are never bundled.
const covers = import.meta.glob<ImageMetadata>(
  ['/src/assets/*-year-in-music/wrapped-cover-*.png', '!/src/assets/*-year-in-music/wrapped-cover-*-small.png'],
  { eager: true, import: 'default' }
)

export function getYearInMusicCover(year: number): ImageMetadata | undefined {
  return covers[`/src/assets/${year}-year-in-music/wrapped-cover-${year}.png`]
}
