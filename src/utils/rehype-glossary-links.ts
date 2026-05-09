// Rehype plugin: auto-link the first occurrence of any glossary term in
// blog post body text. Skips code, headings, existing anchors, and asides.

import { visit, SKIP } from 'unist-util-visit'
import type { Root, Element, Text } from 'hast'
import type { GlossaryTermMap } from './glossary-terms'

export interface RehypeGlossaryLinksOptions {
  termMap: GlossaryTermMap
}

const SKIP_TAGS = new Set([
  'a', 'code', 'pre', 'kbd', 'samp',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'aside', 'script', 'style', 'noscript',
  'figcaption', 'sup', 'sub'
])

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function buildMatcher(termMap: GlossaryTermMap): RegExp | null {
  const keys = Object.keys(termMap)
  if (keys.length === 0) return null
  // Longest first so multi-word terms beat their substrings.
  const sorted = [...keys].sort((a, b) => b.length - a.length).map(escapeRegex)
  return new RegExp(`\\b(${sorted.join('|')})\\b`, 'gi')
}

export function rehypeGlossaryLinks(options: RehypeGlossaryLinksOptions) {
  const { termMap } = options
  const matcher = buildMatcher(termMap)

  return function transformer(tree: Root) {
    if (!matcher) return
    const linkRegex = matcher
    const linkedIds = new Set<string>()

    visit(tree, (node, index, parent) => {
      if (node.type === 'element') {
        const el = node as Element
        if (SKIP_TAGS.has(el.tagName)) return SKIP
      }

      if (node.type !== 'text' || !parent || typeof index !== 'number') return
      const textNode = node as Text
      const value = textNode.value
      if (!value || !value.trim()) return

      linkRegex.lastIndex = 0
      const newChildren: Array<Text | Element> = []
      let cursor = 0
      let mutated = false
      let match: RegExpExecArray | null

      while ((match = linkRegex.exec(value)) !== null) {
        const term = match[1]
        const key = term.toLowerCase()
        const record = termMap[key]
        if (!record) continue
        if (linkedIds.has(record.id)) continue

        const start = match.index
        const end = start + term.length

        if (start > cursor) {
          newChildren.push({ type: 'text', value: value.slice(cursor, start) })
        }

        newChildren.push({
          type: 'element',
          tagName: 'a',
          properties: {
            href: `/glossary/${record.id}/`,
            class: 'glossary-link',
            'data-glossary-term': record.id
          },
          children: [{ type: 'text', value: term }]
        })

        linkedIds.add(record.id)
        mutated = true
        cursor = end
      }

      if (!mutated) return

      if (cursor < value.length) {
        newChildren.push({ type: 'text', value: value.slice(cursor) })
      }

      // Replace the text node with our new children
      const parentChildren = parent.children as Array<Text | Element>
      parentChildren.splice(index, 1, ...newChildren)
      // Skip the inserted nodes so we don't recurse into the newly created <a>
      return [SKIP, index + newChildren.length]
    })
  }
}
