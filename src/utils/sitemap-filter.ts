// Sitemap inclusion policy, evaluated at Astro config-load time (the
// @astrojs/sitemap `filter` callback only sees the page URL, so anything
// data-driven has to be resolved synchronously here, the same way
// post-dates.ts and glossary-terms.ts do).
//
// Why a policy at all: before this existed the sitemap listed ~2,200 URLs and
// 70% of them were tunes album/artist browse pages. Search Console had marked
// ~970 URLs "Discovered/Crawled - currently not indexed", almost all of them
// those pages, and over a year they earned 5 clicks between them. The sitemap
// is a recommendation list, so it should recommend the pages worth indexing:
// posts, hubs, glossary, books, and only the tunes browse pages with enough
// appearances to say something. Everything excluded here still builds, still
// renders, and is still reachable by internal links - it is just not pushed.

import fs from 'node:fs'
import path from 'node:path'

/** An album page needs this many featuring posts to be listed. */
export const SITEMAP_ALBUM_MIN_POSTS = 3
/** An artist page needs this many featuring posts to be listed. */
export const SITEMAP_ARTIST_MIN_POSTS = 2

/** Paths that are never listed, matched as a pathname prefix. */
const EXCLUDED_PREFIXES = ['/draft/', '/avatars/', '/search/']

// Pagination pages end in a 1-3 digit page number: /page/2/, /tags/docker/2/,
// /2024/page/3/, /tunes/page/4/, /tunes/artist/kate-bush/2/, /reading/page/2/.
// Year hubs (/2024/, /tunes/year/2024/) are four digits and stay in. The year
// route also emits a bare /2024/page/ as its page 1, a duplicate of /2024/.
const PAGINATION_RE = /(\/\d{1,3}|\/page)\/$/

interface TunesIndexCounts {
  albums: Record<string, number>
  artists: Record<string, number>
}

let cachedCounts: TunesIndexCounts | null = null

function loadTunesCounts(): TunesIndexCounts {
  if (cachedCounts) return cachedCounts
  const counts: TunesIndexCounts = { albums: {}, artists: {} }
  const indexPath = path.resolve(process.cwd(), 'src/data/tunes-index.json')
  if (fs.existsSync(indexPath)) {
    const index = JSON.parse(fs.readFileSync(indexPath, 'utf8')) as {
      albums?: { slug: string; posts?: unknown[] }[]
      artists?: { slug: string; postCount?: number; posts?: unknown[] }[]
    }
    for (const album of index.albums ?? []) {
      counts.albums[album.slug] = album.posts?.length ?? 0
    }
    for (const artist of index.artists ?? []) {
      counts.artists[artist.slug] = artist.postCount ?? artist.posts?.length ?? 0
    }
  }
  cachedCounts = counts
  return counts
}

/**
 * Decide whether a built page URL belongs in the sitemap.
 * Accepts the absolute URL string @astrojs/sitemap passes to `filter`.
 */
export function shouldIncludeInSitemap(url: string): boolean {
  const { pathname } = new URL(url)

  if (EXCLUDED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return false
  if (PAGINATION_RE.test(pathname)) return false

  const album = pathname.match(/^\/tunes\/album\/([^/]+)\/$/)
  if (album) {
    return (loadTunesCounts().albums[album[1]] ?? 0) >= SITEMAP_ALBUM_MIN_POSTS
  }

  const artist = pathname.match(/^\/tunes\/artist\/([^/]+)\/$/)
  if (artist) {
    return (loadTunesCounts().artists[artist[1]] ?? 0) >= SITEMAP_ARTIST_MIN_POSTS
  }

  return true
}
