import type { APIRoute } from 'astro'
import OG from '../components/OpenGraph/OG'
import { PNG } from '../components/OpenGraph/createImage'
import { sectionCover } from '../components/OpenGraph/sectionCover'
import path from 'node:path'
import fs from 'node:fs'
import crypto from 'node:crypto'

const CACHE_DIR = path.join(process.cwd(), 'node_modules/.cache/og-images')
if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true })

const SECTION = sectionCover('archives')

// Unlike the other OG routes this one backs a single static page, so the title
// lives here rather than arriving through getStaticPaths props.
const TITLE = 'Archives'
const DESCRIPTION = 'Browse all posts by year'

export const GET: APIRoute = async function get() {
  const hash = crypto.createHash('md5')
  hash.update('og-design:reading-room-scrim-v3') // bump to invalidate cached renders after a redesign
  hash.update(JSON.stringify({ kind: 'archives', title: TITLE, description: DESCRIPTION, art: SECTION.digest }))
  const digest = hash.digest('hex')
  const cacheFile = path.join(CACHE_DIR, `${digest}.png`)

  let pngBuffer: Buffer
  if (fs.existsSync(cacheFile)) {
    pngBuffer = fs.readFileSync(cacheFile)
  } else {
    pngBuffer = await PNG(
      await OG(TITLE, DESCRIPTION, {
        coverImagePath: SECTION.path,
        meta: ['Archive']
      })
    )
    fs.writeFileSync(cacheFile, pngBuffer)
  }

  return new Response(new Uint8Array(pngBuffer), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable'
    }
  })
}
