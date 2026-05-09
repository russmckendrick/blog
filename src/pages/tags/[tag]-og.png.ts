import type { APIRoute, InferGetStaticPropsType } from 'astro'
import { getCollection } from 'astro:content'
import OG from '../../components/OpenGraph/OG'
import { PNG } from '../../components/OpenGraph/createImage'
import { getTagMetadata, normalizeTagSlug } from '../../utils/tags'
import path from 'node:path'
import fs from 'node:fs'
import crypto from 'node:crypto'

export async function getStaticPaths() {
  const posts = (await getCollection('blog'))
    .filter((post) => import.meta.env.DEV || !post.data.draft)

  const allTags = new Set<string>()
  for (const post of posts) {
    for (const tag of post.data.tags || []) {
      allTags.add(normalizeTagSlug(tag))
    }
  }

  return Array.from(allTags).map((tag) => {
    const metadata = getTagMetadata(tag)
    const tagPosts = posts.filter((post) =>
      (post.data.tags || []).map((t) => normalizeTagSlug(t)).includes(tag)
    )
    const description =
      `Posts tagged ${metadata.title.replace(/\s*[\p{Emoji}]+/gu, '').trim()} on russ.cloud - ${tagPosts.length} post${
        tagPosts.length !== 1 ? 's' : ''
      } and counting.`
    return {
      params: { tag },
      props: {
        title: metadata.title,
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
  hash.update(JSON.stringify({ kind: 'tag', title, description }))
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
