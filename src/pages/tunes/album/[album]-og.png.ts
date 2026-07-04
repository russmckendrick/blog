import type { APIRoute, InferGetStaticPropsType } from 'astro'
import OG from '../../../components/OpenGraph/OG'
import { PNG } from '../../../components/OpenGraph/createImage'
import { tunesIndex } from '../../../utils/tunes-index'
import path from 'node:path'
import fs from 'node:fs'
import crypto from 'node:crypto'

export async function getStaticPaths() {
  return tunesIndex.albums.map((album) => {
    const featuredCount = album.posts.length
    const description =
      `${album.name} by ${album.artist} · featured in ${featuredCount} weekly post${
        featuredCount !== 1 ? 's' : ''
      } on russ.cloud.`
    return {
      params: { album: album.slug },
      props: {
        title: `${album.name} - ${album.artist}`,
        description
      }
    }
  })
}

type Props = InferGetStaticPropsType<typeof getStaticPaths>

const CACHE_DIR = path.join(process.cwd(), 'node_modules/.cache/og-images')
if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true })

export const GET: APIRoute = async function get({ props }) {
  const { title, description } = props as Props

  const hash = crypto.createHash('md5')
  hash.update('og-design:print-edition-v1') // bump to invalidate cached renders after a redesign
  hash.update(JSON.stringify({ kind: 'tunes-album', title, description }))
  const digest = hash.digest('hex')
  const cacheFile = path.join(CACHE_DIR, `${digest}.png`)

  let pngBuffer: Buffer
  if (fs.existsSync(cacheFile)) {
    pngBuffer = fs.readFileSync(cacheFile)
  } else {
    pngBuffer = await PNG(await OG(title, description))
    fs.writeFileSync(cacheFile, pngBuffer)
  }

  return new Response(new Uint8Array(pngBuffer), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable'
    }
  })
}
