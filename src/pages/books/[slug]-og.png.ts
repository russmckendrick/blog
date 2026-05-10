import type { APIRoute, InferGetStaticPropsType } from 'astro'
import { getCollection } from 'astro:content'
import OG from '../../components/OpenGraph/OG'
import { PNG } from '../../components/OpenGraph/createImage'
import path from 'node:path'
import fs from 'node:fs'
import crypto from 'node:crypto'

const MAX_DESCRIPTION_LENGTH = 160

function truncate(value: string, max = MAX_DESCRIPTION_LENGTH): string {
  if (value.length <= max) return value
  return value.slice(0, max - 1).trimEnd() + '…'
}

export async function getStaticPaths() {
  const entries = (await getCollection('books'))
    .filter((entry) => import.meta.env.DEV || !entry.data.draft)

  return entries.map((entry) => ({
    params: { slug: entry.id },
    props: {
      title: entry.data.title,
      description: truncate(entry.data.description)
    }
  }))
}

type Props = InferGetStaticPropsType<typeof getStaticPaths>

const CACHE_DIR = path.join(process.cwd(), 'node_modules/.cache/og-images')
if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true })

export const GET: APIRoute = async function get({ props }) {
  const { title, description } = props as Props

  const hash = crypto.createHash('md5')
  hash.update(JSON.stringify({ kind: 'book', title, description }))
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
