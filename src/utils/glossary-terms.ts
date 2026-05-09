// Synchronous glossary-term loader for use at Astro build time
// (rehype plugins run before content collections are available).

import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'

const GLOSSARY_DIR = path.resolve(process.cwd(), 'src/content/glossary')

export interface GlossaryTermRecord {
  id: string
  display: string
}

export type GlossaryTermMap = Record<string, GlossaryTermRecord>

function normaliseKey(value: string): string {
  return value.toLowerCase().trim()
}

export function getGlossaryTermMap(): GlossaryTermMap {
  if (!fs.existsSync(GLOSSARY_DIR)) return {}

  const files = fs
    .readdirSync(GLOSSARY_DIR)
    .filter((name) => name.endsWith('.mdx') || name.endsWith('.md'))

  const map: GlossaryTermMap = {}

  for (const file of files) {
    const fullPath = path.join(GLOSSARY_DIR, file)
    const raw = fs.readFileSync(fullPath, 'utf8')
    const { data } = matter(raw)
    if (data?.draft) continue

    const id = file.replace(/\.(mdx|md)$/, '')
    const term: string | undefined = data.term
    if (!term) continue
    const display = term

    const keys = [normaliseKey(term)]
    if (typeof data.abbreviation === 'string' && data.abbreviation.trim()) {
      keys.push(normaliseKey(data.abbreviation))
    }
    if (Array.isArray(data.aliases)) {
      for (const alias of data.aliases) {
        if (typeof alias === 'string' && alias.trim()) keys.push(normaliseKey(alias))
      }
    }

    for (const key of keys) {
      // First definition wins on collisions; deterministic by file order.
      if (!(key in map)) {
        map[key] = { id, display }
      }
    }
  }

  return map
}
