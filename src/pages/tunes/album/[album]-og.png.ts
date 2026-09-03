import type { APIRoute, InferGetStaticPropsType } from 'astro'
import OG from '../../../components/OpenGraph/OG'
import TunesRecord, { artDigest } from '../../../components/OpenGraph/TunesRecord'
import { PNG } from '../../../components/OpenGraph/createImage'
import { sectionCover } from '../../../components/OpenGraph/sectionCover'
import { tunesIndex } from '../../../utils/tunes-index'
import path from 'node:path'
import fs from 'node:fs'
import crypto from 'node:crypto'

export async function getStaticPaths() {
  const artistImages = new Map(
    tunesIndex.artists.map((artist) => [artist.slug, artist.image])
  )

  return tunesIndex.albums.map((album) => {
    const featuredCount = album.posts.length
    const posts = `${featuredCount} weekly post${featuredCount !== 1 ? 's' : ''}`
    const description =
      `${album.name} by ${album.artist} · featured in ${posts} on russ.cloud.`
    return {
      params: { album: album.slug },
      props: {
        title: `${album.name} - ${album.artist}`,
        description,
        name: album.name,
        artist: album.artist,
        // The sleeve carries the album art; the record label falls back to it
        // when the artist has no portrait of their own.
        artPath: album.image,
        labelPath: artistImages.get(album.artistSlug) ?? null,
        meta: [posts, 'Listened to This Week']
      }
    }
  })
}

type Props = InferGetStaticPropsType<typeof getStaticPaths>

const CACHE_DIR = path.join(process.cwd(), 'node_modules/.cache/og-images')
if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true })

const SECTION = sectionCover('tunes-album')

export const GET: APIRoute = async function get({ props }) {
  const { title, description, name, artist, artPath, labelPath, meta } =
    props as Props

  const hash = crypto.createHash('md5')
  hash.update('og-design:tunes-record-v2') // bump to invalidate cached renders after a redesign
  hash.update(
    JSON.stringify({
      kind: 'tunes-album',
      title,
      description,
      artist,
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
    // Albums with no art at all fall back to the shared section cover.
    const card =
      (artPath &&
        (await TunesRecord(name, {
          eyebrow: 'Album',
          artPath,
          labelPath,
          subtitle: artist,
          meta
        }))) ||
      (await OG(title, description, {
        coverImagePath: SECTION.path,
        meta: ['Album']
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
