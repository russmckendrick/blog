import type { APIRoute, InferGetStaticPropsType } from 'astro'
import OG from '../../../components/OpenGraph/OG'
import TunesRecord, { artDigest } from '../../../components/OpenGraph/TunesRecord'
import { PNG } from '../../../components/OpenGraph/createImage'
import { sectionCover } from '../../../components/OpenGraph/sectionCover'
import { tunesIndex } from '../../../utils/tunes-index'
import path from 'node:path'
import fs from 'node:fs'
import crypto from 'node:crypto'

/**
 * The cover that goes on the record label for an artist: whichever of their
 * albums has turned up in most weekly posts. Ties break on slug so the choice
 * is stable across builds — otherwise the card silently changes whenever the
 * index is regenerated in a different order.
 */
function labelAlbum(artistSlug: string): string | null {
  const candidates = tunesIndex.albums.filter(
    (album) => album.artistSlug === artistSlug && album.image
  )
  if (candidates.length === 0) return null
  candidates.sort(
    (a, b) => b.posts.length - a.posts.length || a.slug.localeCompare(b.slug)
  )
  return candidates[0].image
}

export async function getStaticPaths() {
  return tunesIndex.artists.map((artist) => {
    const posts = `${artist.postCount} weekly post${artist.postCount !== 1 ? 's' : ''}`
    const albums = `${artist.albumCount} album${artist.albumCount !== 1 ? 's' : ''}`
    const description =
      `${artist.name} appears in ${artist.postCount} weekly Listened to This Week post${
        artist.postCount !== 1 ? 's' : ''
      } across ${albums} on russ.cloud.`
    return {
      params: { artist: artist.slug },
      props: {
        title: artist.name,
        description,
        // The sleeve carries the artist portrait; the record label carries the
        // album of theirs that has been in rotation most.
        artPath: artist.image,
        labelPath: labelAlbum(artist.slug),
        subtitle: `${albums} in rotation`,
        meta: [posts, 'Listened to This Week']
      }
    }
  })
}

type Props = InferGetStaticPropsType<typeof getStaticPaths>

const CACHE_DIR = path.join(process.cwd(), 'node_modules/.cache/og-images')
if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true })

const SECTION = sectionCover('tunes-artist')

export const GET: APIRoute = async function get({ props }) {
  const { title, description, artPath, labelPath, subtitle, meta } =
    props as Props

  const hash = crypto.createHash('md5')
  hash.update('og-design:tunes-record-v1') // bump to invalidate cached renders after a redesign
  hash.update(
    JSON.stringify({
      kind: 'tunes-artist',
      title,
      description,
      subtitle,
      meta,
      art: artPath ? artDigest([artPath, labelPath]) : SECTION.digest
    })
  )
  const digest = hash.digest('hex')
  const cacheFile = path.join(CACHE_DIR, `${digest}.png`)

  let pngBuffer: Buffer
  if (fs.existsSync(cacheFile)) {
    pngBuffer = fs.readFileSync(cacheFile)
  } else {
    // Artists with no portrait fall back to the shared section cover.
    const card =
      (artPath &&
        (await TunesRecord(title, {
          eyebrow: 'Artist',
          artPath,
          labelPath,
          subtitle,
          meta
        }))) ||
      (await OG(title, description, {
        coverImagePath: SECTION.path,
        meta: ['Artist']
      }))

    pngBuffer = await PNG(card)
    fs.writeFileSync(cacheFile, pngBuffer)
  }

  return new Response(new Uint8Array(pngBuffer), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable'
    }
  })
}
