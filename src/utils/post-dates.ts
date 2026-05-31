// Synchronous post modified-date loader for use at Astro build time
// (the sitemap serialize callback only sees item.url, so we precompute a
// pathname -> modified-date map the same way getGlossaryTermMap does).

import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import { getPostUrl } from './url.ts'

const CONTENT_DIRS = [
  path.resolve(process.cwd(), 'src/content/blog'),
  path.resolve(process.cwd(), 'src/content/tunes'),
]

export type PostModifiedDateMap = Record<string, string>

// Collect every .md/.mdx file, supporting both flat files (`slug.mdx`) and
// directory-based entries (`slug/index.mdx`).
function collectContentFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return []

  const files: string[] = []
  for (const dirent of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, dirent.name)
    if (dirent.isDirectory()) {
      for (const ext of ['index.mdx', 'index.md']) {
        const indexPath = path.join(fullPath, ext)
        if (fs.existsSync(indexPath)) files.push(indexPath)
      }
    } else if (dirent.name.endsWith('.mdx') || dirent.name.endsWith('.md')) {
      files.push(fullPath)
    }
  }
  return files
}

function toDate(value: unknown): Date | null {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value as string)
  return Number.isNaN(date.getTime()) ? null : date
}

export function getPostModifiedDateMap(): PostModifiedDateMap {
  const map: PostModifiedDateMap = {}

  for (const dir of CONTENT_DIRS) {
    for (const file of collectContentFiles(dir)) {
      const { data } = matter(fs.readFileSync(file, 'utf8'))
      if (data?.draft) continue

      const title: string | undefined = data.title
      const pubDate = toDate(data.pubDate ?? data.date)
      if (!title || !pubDate) continue

      // Match the route built in src/pages/[year]/[month]/[day]/[slug].astro
      const pathname = getPostUrl(pubDate, title)
      const modified = toDate(data.lastModified) ?? toDate(data.updatedDate) ?? pubDate
      map[pathname] = modified.toISOString()
    }
  }

  return map
}
