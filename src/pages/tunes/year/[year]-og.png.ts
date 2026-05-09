import type { APIRoute, InferGetStaticPropsType } from 'astro'
import { getCollection } from 'astro:content'
import OG from '../../../components/OpenGraph/OG'
import { PNG } from '../../../components/OpenGraph/createImage'
import path from 'node:path'
import fs from 'node:fs'
import crypto from 'node:crypto'

export async function getStaticPaths() {
  const tunes = (await getCollection('tunes'))
    .filter((tune) => import.meta.env.DEV || !tune.data.draft)

  const counts = new Map<number, number>()
  for (const tune of tunes) {
    const year = tune.data.pubDate.getFullYear()
    counts.set(year, (counts.get(year) || 0) + 1)
  }

  return Array.from(counts.entries()).map(([year, count]) => ({
    params: { year: String(year) },
    props: {
      title: `Tunes ${year}`,
      description: `${count} weekly Listened to This Week post${count !== 1 ? 's' : ''} from ${year} on russ.cloud.`
    }
  }))
}

type Props = InferGetStaticPropsType<typeof getStaticPaths>

const CACHE_DIR = path.join(process.cwd(), 'node_modules/.cache/og-images')
if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true })

export const GET: APIRoute = async function get({ props }) {
  const { title, description } = props as Props

  const hash = crypto.createHash('md5')
  hash.update(JSON.stringify({ kind: 'tunes-year', title, description }))
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
