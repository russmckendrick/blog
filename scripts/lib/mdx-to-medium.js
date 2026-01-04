import { GitHubGistClient, markdownTableToCSV } from './github-gist-client.js'

// Callout type emoji mapping
const CALLOUT_EMOJIS = {
  NoteCallout: '📝',
  TipCallout: '💡',
  InfoCallout: 'ℹ️',
  ImportantCallout: '❗',
  CautionCallout: '⚠️',
  WarningCallout: '🚨',
  GeneralCallout: '📌'
}


// Transform YouTube component
function transformYouTube(content) {
  // Match <YouTube id="..." /> or <YouTube id="..." params="..." />
  return content.replace(/<YouTube\s+id="([^"]+)"[^/]*\/>/g, (match, id) => {
    return `\n\nhttps://www.youtube.com/watch?v=${id}\n\n`
  })
}

// Transform Instagram component
function transformInstagram(content) {
  return content.replace(/<Instagram\s+permalink="([^"]+)"[^/]*\/>/g, (match, permalink) => {
    return `\n\n${permalink}\n\n`
  })
}

// Transform LinkPreview component - just output URL for Medium's native embed
function transformLinkPreview(content) {
  return content.replace(/<LinkPreview\s+id="([^"]+)"[^/]*\/>/g, (match, url) => {
    // Medium auto-generates previews for URLs on their own line
    return `\n\n${url}\n\n`
  })
}

// Transform Mermaid diagrams (not supported by Medium)
function transformMermaid(content, canonicalUrl) {
  // Match <Mermaid code={`...`} /> or <Mermaid code={`...`} title="..." />
  return content.replace(/<Mermaid\s+code=\{`[^`]*`\}(?:\s+title="([^"]*)")?[^/]*\/>/gs, (match, title) => {
    const diagramName = title || 'diagram'
    return `\n\n> **Diagram**: ${diagramName} - [View interactive diagram](${canonicalUrl})\n\n`
  })
}

// Transform Callout components
function transformCallouts(content) {
  // Handle self-closing callouts first: <WarningCallout title="..." />
  content = content.replace(/<(\w+Callout)\s+title="([^"]*)"[^/]*\/>/g, (match, type, title) => {
    const emoji = CALLOUT_EMOJIS[type] || '📌'
    return `\n\n> ${emoji} **${title}**\n\n`
  })

  // Handle callouts with content: <WarningCallout title="...">content</WarningCallout>
  // or <NoteCallout>content</NoteCallout>
  content = content.replace(/<(\w+Callout)(?:\s+title="([^"]*)")?>([\s\S]*?)<\/\1>/g, (match, type, title, innerContent) => {
    const emoji = CALLOUT_EMOJIS[type] || '📌'
    const label = title || type.replace('Callout', '')
    const formattedContent = innerContent.trim().replace(/\n/g, '\n> ')
    return `\n\n> ${emoji} **${label}**\n> ${formattedContent}\n\n`
  })

  return content
}

// Transform Img component
function transformImg(content, blogUrl) {
  // Match <Img ... /> with any attribute order
  return content.replace(/<Img\s+([^>]*?)\/>/g, (match, attributes) => {
    // Extract src and alt from attributes
    const srcMatch = attributes.match(/src="([^"]+)"/)
    const altMatch = attributes.match(/alt="([^"]*)"/)

    if (!srcMatch) return match // No src found, leave unchanged

    const src = srcMatch[1]
    // Clean alt text - remove [noExternalIcon] markers
    const alt = altMatch ? altMatch[1].replace(/\s*\[noExternalIcon\]\s*/g, '').trim() : ''

    let absoluteSrc = src
    if (!src.startsWith('http')) {
      // Handle paths starting with /
      if (src.startsWith('/')) {
        absoluteSrc = `${blogUrl}${src}`
      } else {
        // Remove leading ./ or ../
        const cleanSrc = src.replace(/^\.\.?\/?/, '')
        absoluteSrc = `${blogUrl}/${cleanSrc}`
      }
    }
    return `\n\n![${alt}](${absoluteSrc})\n\n`
  })
}

// Transform ChatMessage component
function transformChatMessage(content) {
  // Match <ChatMessage position="left|right" avatar="...">content</ChatMessage>
  return content.replace(/<ChatMessage\s+position="([^"]*)"(?:\s+avatar="[^"]*")?>([\s\S]*?)<\/ChatMessage>/g, (match, position, innerContent) => {
    const speaker = position === 'right' ? 'Me' : 'Other'
    const formattedContent = innerContent.trim().replace(/\n/g, '\n> ')
    return `\n\n> **${speaker}:** ${formattedContent}\n\n`
  })
}

// Transform Audio component
function transformAudio(content, blogUrl) {
  // Match <Audio mp3="..." /> or wav/ogg variants
  return content.replace(/<Audio\s+(?:mp3|wav|ogg)="([^"]+)"[^/]*\/>/g, (match, src) => {
    let absoluteSrc = src
    if (!src.startsWith('http')) {
      absoluteSrc = src.startsWith('/') ? `${blogUrl}${src}` : `${blogUrl}/${src}`
    }
    return `\n\n[Listen to audio](${absoluteSrc})\n\n`
  })
}

// Transform AppleMusic component
function transformAppleMusic(content) {
  return content.replace(/<AppleMusic\s+url="([^"]+)"[^/]*\/>/g, (match, url) => {
    return `\n\n[Listen on Apple Music](${url})\n\n`
  })
}

// Transform Reddit component
function transformReddit(content) {
  return content.replace(/<Reddit\s+url="([^"]+)"[^/]*\/>/g, (match, url) => {
    return `\n\n${url}\n\n`
  })
}

// Transform Giphy component
function transformGiphy(content) {
  return content.replace(/<Giphy\s+id="([^"]+)"[^/]*\/>/g, (match, id) => {
    return `\n\n![GIF](https://media.giphy.com/media/${id}/giphy.gif)\n\n`
  })
}

// Transform LightGallery component (extract images)
function transformLightGallery(content, blogUrl) {
  // Match LightGallery with layout prop containing image sources
  return content.replace(/<LightGallery[\s\S]*?layout=\{\{[\s\S]*?imgs:\s*\[([\s\S]*?)\][\s\S]*?\}\}[\s\S]*?\/>/g, (match, imgsContent) => {
    // Extract all src values from the imgs array
    const srcMatches = imgsContent.matchAll(/src:\s*["']([^"']+)["']/g)
    const images = Array.from(srcMatches, m => m[1])

    if (images.length === 0) return ''

    return images.map(src => {
      let absoluteSrc = src
      if (!src.startsWith('http')) {
        if (src.startsWith('/')) {
          absoluteSrc = `${blogUrl}${src}`
        } else {
          absoluteSrc = `${blogUrl}/${src}`
        }
      }
      return `\n\n![Gallery image](${absoluteSrc})\n\n`
    }).join('')
  }).replace(/<LightGallery[\s\S]*?\/>/g, '') // Remove any remaining self-closing ones
}

// Transform markdown tables - use Gists if client provided, otherwise bullet lists
async function transformTables(content, gistClient = null) {
  // Match markdown tables: header row, separator row, data rows
  const tableRegex = /\n?\|(.+)\|\n\|[-:\s|]+\|\n((?:\|.+\|\n?)+)/g

  // If no gist client, use simple bullet list transformation
  if (!gistClient) {
    return content.replace(tableRegex, (match, headerRow, bodyRows) => {
      // Parse headers
      const headers = headerRow.split('|').map(h => h.trim()).filter(h => h)

      // Parse body rows
      const rows = bodyRows.trim().split('\n').map(row => {
        return row.split('|').map(cell => cell.trim()).filter(cell => cell)
      })

      // If it's a simple 2-column table, format as "Header: Value" list
      if (headers.length === 2) {
        const lines = rows.map(row => {
          const key = row[0] || ''
          const value = row[1] || ''
          return `• **${key}**: ${value}`
        })
        return `\n\n${lines.join('\n')}\n\n`
      }

      // For multi-column tables, format each row with all headers
      const lines = rows.map(row => {
        const parts = headers.map((header, i) => {
          const value = row[i] || ''
          return `**${header}**: ${value}`
        })
        return `• ${parts.join(' | ')}`
      })

      return `\n\n${lines.join('\n')}\n\n`
    })
  }

  // With gist client - create CSV gists for tables
  const matches = [...content.matchAll(tableRegex)]

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i]
    const [fullMatch, headerRow, bodyRows] = match

    try {
      // Convert to CSV
      const csv = markdownTableToCSV(headerRow, bodyRows)

      // Create gist
      const filename = `table-${i + 1}.csv`
      const { url } = await gistClient.createGist(
        filename,
        csv,
        'Table from blog post'
      )

      // Replace table with gist URL (Medium auto-embeds)
      content = content.replace(fullMatch, `\n\n${url}\n\n`)
    } catch {
      // If gist creation fails, fall back to bullet list
      const headers = headerRow.split('|').map(h => h.trim()).filter(h => h)
      const rows = bodyRows.trim().split('\n').map(row => {
        return row.split('|').map(cell => cell.trim()).filter(cell => cell)
      })

      const lines = rows.map(row => {
        const parts = headers.map((header, j) => {
          const value = row[j] || ''
          return `**${header}**: ${value}`
        })
        return `• ${parts.join(' | ')}`
      })

      content = content.replace(fullMatch, `\n\n${lines.join('\n')}\n\n`)
    }
  }

  return content
}

// Convert markdown images to absolute URLs
function convertMarkdownImages(content, blogUrl, postPath) {
  // Match ![alt](src) patterns
  return content.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, src) => {
    // Skip if already absolute
    if (src.startsWith('http')) {
      return match
    }

    // Handle relative paths from post directory
    let absoluteSrc = src
    if (src.startsWith('./') || src.startsWith('../')) {
      // For relative paths like ./cover.png or ../../assets/...
      // We need to resolve relative to the post
      const cleanSrc = src.replace(/^\.\.?\/?/, '')
      if (cleanSrc.startsWith('assets/')) {
        absoluteSrc = `${blogUrl}/${cleanSrc}`
      } else {
        // It's likely in the post's directory or a relative asset
        absoluteSrc = `${blogUrl}/assets/${cleanSrc}`
      }
    } else if (src.startsWith('/')) {
      absoluteSrc = `${blogUrl}${src}`
    } else {
      absoluteSrc = `${blogUrl}/${src}`
    }

    return `![${alt}](${absoluteSrc})`
  })
}

// Convert internal links to absolute URLs
function convertInternalLinks(content, blogUrl) {
  // Match [text](/path) patterns (internal links starting with /)
  return content.replace(/\[([^\]]+)\]\(\/([^)]+)\)/g, (match, text, path) => {
    return `[${text}](${blogUrl}/${path})`
  })
}

// Clean up extra whitespace
function cleanupWhitespace(content) {
  // Replace multiple consecutive newlines with max 2
  return content.replace(/\n{3,}/g, '\n\n').trim()
}

// Remove import statements (common in MDX)
function removeImports(content) {
  return content.replace(/^import\s+.*?;?\s*$/gm, '')
}

// Remove export statements
function removeExports(content) {
  return content.replace(/^export\s+.*?;?\s*$/gm, '')
}

// Main transformation function
export async function transformMDXToMedium(mdxContent, options = {}) {
  const {
    blogUrl = 'https://www.russ.cloud',
    canonicalUrl = blogUrl,
    postPath = '',
    gistClient = null
  } = options

  let content = mdxContent

  // Remove MDX-specific syntax
  content = removeImports(content)
  content = removeExports(content)

  // Transform all components
  content = transformYouTube(content)
  content = transformInstagram(content)
  content = transformLinkPreview(content)
  content = transformMermaid(content, canonicalUrl)
  content = transformCallouts(content)
  content = transformImg(content, blogUrl)
  content = transformChatMessage(content)
  content = transformAudio(content, blogUrl)
  content = transformAppleMusic(content)
  content = transformReddit(content)
  content = transformGiphy(content)
  content = transformLightGallery(content, blogUrl)

  // Convert relative URLs to absolute
  content = convertMarkdownImages(content, blogUrl, postPath)
  content = convertInternalLinks(content, blogUrl)

  // Transform tables (Medium doesn't support markdown tables)
  // Use Gists if client provided, otherwise convert to bullet lists
  content = await transformTables(content, gistClient)

  // Clean up
  content = cleanupWhitespace(content)

  return content
}

// Log transformation stats (for debugging)
export function getTransformationStats(original, transformed) {
  const stats = {
    youtube: (original.match(/<YouTube/g) || []).length,
    instagram: (original.match(/<Instagram/g) || []).length,
    linkPreview: (original.match(/<LinkPreview/g) || []).length,
    mermaid: (original.match(/<Mermaid/g) || []).length,
    callouts: (original.match(/<\w+Callout/g) || []).length,
    img: (original.match(/<Img/g) || []).length,
    chatMessage: (original.match(/<ChatMessage/g) || []).length,
    audio: (original.match(/<Audio/g) || []).length,
    appleMusic: (original.match(/<AppleMusic/g) || []).length,
    reddit: (original.match(/<Reddit/g) || []).length,
    giphy: (original.match(/<Giphy/g) || []).length,
    lightGallery: (original.match(/<LightGallery/g) || []).length,
    tables: (original.match(/\n\|.+\|\n\|[-:\s|]+\|/g) || []).length
  }

  return stats
}
