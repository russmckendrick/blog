#!/usr/bin/env node

import 'dotenv/config'
import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import readline from 'readline'
import matter from 'gray-matter'
import { MediumClient } from './lib/medium-client.js'
import { transformMDXToMedium, getTransformationStats } from './lib/mdx-to-medium.js'
import { GitHubGistClient } from './lib/github-gist-client.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const BLOG_ROOT = path.join(__dirname, '..')

// ANSI colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m'
}

function log(message, color = '') {
  console.log(`${color}${message}${colors.reset}`)
}

function logStep(step, message) {
  console.log(`${colors.cyan}[${step}]${colors.reset} ${message}`)
}

function logSuccess(message) {
  console.log(`${colors.green}${message}${colors.reset}`)
}

function logWarning(message) {
  console.log(`${colors.yellow}${message}${colors.reset}`)
}

function logError(message) {
  console.error(`${colors.red}${message}${colors.reset}`)
}

// Get all blog posts sorted by date (newest first)
async function getAllPosts() {
  const blogDir = path.join(BLOG_ROOT, 'src/content/blog')
  const files = await fs.readdir(blogDir)

  const posts = []

  for (const file of files) {
    if (!file.endsWith('.mdx') && !file.endsWith('.md')) continue

    const filePath = path.join(blogDir, file)
    const stat = await fs.stat(filePath)
    if (stat.isDirectory()) continue

    try {
      const content = await fs.readFile(filePath, 'utf-8')
      const { data: frontmatter } = matter(content)

      // Skip drafts
      if (frontmatter.draft) continue

      const date = new Date(frontmatter.date || frontmatter.pubDate)

      posts.push({
        filePath,
        filename: file,
        title: frontmatter.title,
        date,
        tags: frontmatter.tags || []
      })
    } catch {
      // Skip files that can't be parsed
    }
  }

  // Sort by date, newest first
  posts.sort((a, b) => b.date - a.date)

  return posts
}

// Interactive post selector with pagination
async function selectPost(posts) {
  const PAGE_SIZE = 15
  const totalPages = Math.ceil(posts.length / PAGE_SIZE)
  let currentPage = 0

  function renderPage() {
    // Clear screen and move cursor to top
    console.clear()

    const start = currentPage * PAGE_SIZE
    const end = Math.min(start + PAGE_SIZE, posts.length)
    const displayPosts = posts.slice(start, end)

    console.log(`\n${colors.bright}Select a post to publish to Medium:${colors.reset}`)
    console.log(`${colors.dim}Page ${currentPage + 1} of ${totalPages} (${posts.length} posts)${colors.reset}\n`)

    displayPosts.forEach((post, index) => {
      const dateStr = post.date.toISOString().split('T')[0]
      const num = String(start + index + 1).padStart(3, ' ')
      // Truncate long titles
      const maxTitleLen = 55
      let title = post.title
      if (title.length > maxTitleLen) {
        title = title.substring(0, maxTitleLen - 3) + '...'
      }
      console.log(`  ${colors.cyan}${num}${colors.reset}. ${colors.dim}[${dateStr}]${colors.reset} ${title}`)
    })

    console.log('')
    console.log(`  ${colors.dim}← → arrow keys to change page | Enter number to select | q to quit${colors.reset}`)
    console.log('')
  }

  return new Promise((resolve) => {
    renderPage()

    // Enable keypress events
    readline.emitKeypressEvents(process.stdin)
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true)
    }

    let inputBuffer = ''

    const cleanup = () => {
      process.stdin.removeAllListeners('keypress')
      if (process.stdin.isTTY) process.stdin.setRawMode(false)
    }

    process.stdin.on('keypress', (str, key) => {
      if (!key) return

      // Handle Ctrl+C
      if (key.ctrl && key.name === 'c') {
        cleanup()
        console.log('')
        process.exit(0)
      }

      // Handle arrow keys for pagination
      if (key.name === 'left' && currentPage > 0) {
        currentPage--
        inputBuffer = ''
        renderPage()
        process.stdout.write(`${colors.bright}Enter number or 'q':${colors.reset} `)
        return
      }

      if (key.name === 'right' && currentPage < totalPages - 1) {
        currentPage++
        inputBuffer = ''
        renderPage()
        process.stdout.write(`${colors.bright}Enter number or 'q':${colors.reset} `)
        return
      }

      // Handle quit
      if (str === 'q' || str === 'Q') {
        process.stdout.write('q\n')
        cleanup()
        resolve(null)
        return
      }

      // Handle enter
      if (key.name === 'return') {
        process.stdout.write('\n')
        cleanup()

        if (inputBuffer === '') {
          resolve(null)
          return
        }

        const num = parseInt(inputBuffer, 10)
        if (isNaN(num) || num < 1 || num > posts.length) {
          logError(`Invalid selection: ${inputBuffer}`)
          resolve(null)
          return
        }

        resolve(posts[num - 1])
        return
      }

      // Handle backspace
      if (key.name === 'backspace') {
        if (inputBuffer.length > 0) {
          inputBuffer = inputBuffer.slice(0, -1)
          process.stdout.write('\b \b')
        }
        return
      }

      // Handle number input
      if (str >= '0' && str <= '9') {
        inputBuffer += str
        process.stdout.write(str)
      }
    })

    process.stdout.write(`${colors.bright}Enter number or 'q':${colors.reset} `)
  })
}

// Resolve slug to file path
async function resolvePostPath(slugOrPath) {
  // If it's already a full path
  if (slugOrPath.endsWith('.mdx') || slugOrPath.endsWith('.md')) {
    const fullPath = path.isAbsolute(slugOrPath) ? slugOrPath : path.join(BLOG_ROOT, slugOrPath)
    try {
      await fs.access(fullPath)
      return fullPath
    } catch {
      throw new Error(`File not found: ${fullPath}`)
    }
  }

  // Handle URL-style slug: 2025/01/12/post-name
  let slug = slugOrPath
  const urlMatch = slugOrPath.match(/^(\d{4})\/(\d{2})\/(\d{2})\/(.+)$/)
  if (urlMatch) {
    slug = `${urlMatch[1]}-${urlMatch[2]}-${urlMatch[3]}-${urlMatch[4]}`
  }

  // Try to find the file
  const blogDir = path.join(BLOG_ROOT, 'src/content/blog')
  const tunesDir = path.join(BLOG_ROOT, 'src/content/tunes')

  // Check for exact match
  for (const dir of [blogDir, tunesDir]) {
    for (const ext of ['.mdx', '.md']) {
      const filePath = path.join(dir, `${slug}${ext}`)
      try {
        await fs.access(filePath)
        return filePath
      } catch {
        // Continue searching
      }
    }
  }

  // Check for directory-based posts (e.g., slug/index.mdx)
  for (const dir of [blogDir, tunesDir]) {
    const indexPath = path.join(dir, slug, 'index.mdx')
    try {
      await fs.access(indexPath)
      return indexPath
    } catch {
      // Continue searching
    }
  }

  throw new Error(`Could not find post: ${slugOrPath}\nTried:\n  - ${blogDir}/${slug}.mdx\n  - ${tunesDir}/${slug}.mdx`)
}

// Create URL-friendly slug from title (matches src/utils/url.ts)
function createUrlFriendlySlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .trim()
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
}

// Generate canonical URL from frontmatter (matches src/utils/url.ts getPostUrl)
function generateCanonicalUrl(frontmatter, blogUrl) {
  const date = new Date(frontmatter.date || frontmatter.pubDate)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  // Generate slug from title (same as blog does)
  const slug = createUrlFriendlySlug(frontmatter.title)

  return `${blogUrl}/${year}/${month}/${day}/${slug}/`
}

// Print usage
function printUsage() {
  console.log(`
${colors.bright}Usage:${colors.reset} pnpm run medium <slug-or-path> [options]

${colors.bright}Arguments:${colors.reset}
  slug-or-path    Post slug or file path. Supports:
                  - Slug: 2025-01-12-post-name
                  - URL-style: 2025/01/12/post-name
                  - Path: src/content/blog/2025-01-12-post-name.mdx

${colors.bright}Options:${colors.reset}
  --dry-run       Preview transformation without publishing
  --gists         Create GitHub Gists for code blocks (requires GITHUB_TOKEN)
  --help          Show this help message

${colors.bright}Environment Variables:${colors.reset}
  MEDIUM_TOKEN    Required. Your Medium integration token
  BLOG_URL        Optional. Blog URL (default: https://www.russ.cloud)
  GITHUB_TOKEN    Optional. For GitHub Gist creation

${colors.bright}Examples:${colors.reset}
  pnpm run medium 2025-01-12-post-name --dry-run
  pnpm run medium 2025/01/12/post-name
  pnpm run medium src/content/blog/2025-01-12-post-name.mdx
`)
}

async function main() {
  const args = process.argv.slice(2)

  // Check for help flag
  if (args.includes('--help') || args.includes('-h')) {
    printUsage()
    process.exit(0)
  }

  // Parse flags
  const dryRun = args.includes('--dry-run')
  const useGists = args.includes('--gists')
  const slugOrPath = args.find(arg => !arg.startsWith('--'))

  // If no slug provided, show interactive selector
  let selectedFilePath = null
  if (!slugOrPath) {
    console.log(`${colors.cyan}Loading posts...${colors.reset}`)
    const posts = await getAllPosts()

    if (posts.length === 0) {
      logError('No published posts found.')
      process.exit(1)
    }

    const selected = await selectPost(posts)
    if (!selected) {
      console.log('Cancelled.')
      process.exit(0)
    }

    selectedFilePath = selected.filePath
  }

  // Validate environment
  if (!dryRun && !process.env.MEDIUM_TOKEN) {
    logError('Error: MEDIUM_TOKEN environment variable is required')
    logError('Get your token from: https://medium.com/me/settings/security')
    process.exit(1)
  }

  if (useGists && !process.env.GITHUB_TOKEN) {
    logWarning('Warning: --gists flag used but GITHUB_TOKEN not set. Code blocks will use native formatting.')
  }

  const blogUrl = process.env.BLOG_URL || 'https://www.russ.cloud'

  try {
    // Step 1: Resolve and load the post
    const filePath = selectedFilePath || await resolvePostPath(slugOrPath)
    logStep('1/4', `Loading post: ${path.basename(filePath)}`)
    log(`  Found: ${path.relative(BLOG_ROOT, filePath)}`, colors.dim)

    const fileContent = await fs.readFile(filePath, 'utf-8')
    const { data: frontmatter, content: mdxContent } = matter(fileContent)

    // Check for draft
    if (frontmatter.draft) {
      logWarning('  Warning: This post is marked as draft')
    }

    // Step 2: Generate canonical URL
    const canonicalUrl = generateCanonicalUrl(frontmatter, blogUrl)
    logStep('2/4', `Canonical URL: ${canonicalUrl}`)

    // Step 3: Transform content
    logStep('3/4', 'Transforming MDX to Medium format...')

    // Create gist client if --gists flag is used and GITHUB_TOKEN is available
    let gistClient = null
    if (useGists && process.env.GITHUB_TOKEN) {
      gistClient = new GitHubGistClient(process.env.GITHUB_TOKEN)
      log('  Using GitHub Gists for tables', colors.dim)
    }

    const transformedContent = await transformMDXToMedium(mdxContent, {
      blogUrl,
      canonicalUrl,
      postPath: filePath,
      gistClient
    })

    // Log transformation stats
    const stats = getTransformationStats(mdxContent, transformedContent)
    const nonZeroStats = Object.entries(stats).filter(([, v]) => v > 0)
    if (nonZeroStats.length > 0) {
      for (const [component, count] of nonZeroStats) {
        log(`  - Transformed ${count} ${component} component${count > 1 ? 's' : ''}`, colors.dim)
      }
    }

    // Build final content with header and footer
    let finalContent = ''

    // Add title as H1 header
    finalContent += `# ${frontmatter.title}\n\n`

    // Add the main content
    finalContent += transformedContent

    // Add canonical footer with original publish date
    const pubDate = new Date(frontmatter.date || frontmatter.pubDate)
    const dateOptions = { year: 'numeric', month: 'long', day: 'numeric' }
    const formattedDate = pubDate.toLocaleDateString('en-US', dateOptions)
    finalContent += `\n\n---\n\n*Originally published on ${formattedDate} at [${blogUrl.replace('https://', '')}](${canonicalUrl})*\n`

    // Step 4: Publish or preview
    if (dryRun) {
      logStep('4/4', 'Dry run - Preview output:')
      console.log('\n' + colors.dim + '─'.repeat(60) + colors.reset)
      console.log(`${colors.bright}Title:${colors.reset} ${frontmatter.title}`)
      console.log(`${colors.bright}Tags:${colors.reset} ${(frontmatter.tags || []).slice(0, 5).join(', ')}`)
      console.log(`${colors.bright}Canonical:${colors.reset} ${canonicalUrl}`)
      console.log(colors.dim + '─'.repeat(60) + colors.reset)
      console.log(finalContent)
      console.log(colors.dim + '─'.repeat(60) + colors.reset + '\n')
      logSuccess('Dry run complete. No post was published.')
      return
    }

    logStep('4/4', 'Publishing to Medium...')
    const client = new MediumClient(process.env.MEDIUM_TOKEN)

    // Get user info
    const user = await client.getUser()
    log(`  Authenticated as: ${user.name} (@${user.username})`, colors.dim)

    // Create post
    const result = await client.createPost(user.id, {
      title: frontmatter.title,
      content: finalContent,
      contentFormat: 'markdown',
      canonicalUrl,
      tags: frontmatter.tags || [],
      publishStatus: 'draft'
    })

    console.log('')
    logSuccess('Success! Post published as draft.')
    console.log(`${colors.bright}Medium draft:${colors.reset} ${result.url}`)
    console.log(`${colors.bright}Original post:${colors.reset} ${canonicalUrl}`)
    console.log('')
    console.log(`${colors.bright}Next steps:${colors.reset}`)
    console.log('  1. Review the post on Medium')
    console.log('  2. Copy images from original post if needed')
    console.log('  3. Verify featured image (Shift+F on an image to change it)')
    console.log('  4. Publish when ready')
    console.log('')

    process.exit(0)

  } catch (error) {
    logError(`\nError: ${error.message}`)
    if (error.response?.data) {
      logError(`API Error: ${JSON.stringify(error.response.data, null, 2)}`)
    }
    process.exit(1)
  }
}

main()
