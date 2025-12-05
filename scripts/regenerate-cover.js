#!/usr/bin/env node

import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { spawn } from 'child_process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/**
 * Parse frontmatter from MDX content
 */
function parseFrontmatter(content) {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/)
  if (!frontmatterMatch) {
    throw new Error('No frontmatter found in file')
  }

  const frontmatterText = frontmatterMatch[1]
  const frontmatter = {}

  // Parse YAML-like frontmatter
  let currentKey = null
  let inArray = false
  let arrayItems = []

  for (const line of frontmatterText.split('\n')) {
    // Check for array item
    if (line.match(/^\s+-\s+"?(.+?)"?$/)) {
      const match = line.match(/^\s+-\s+"?(.+?)"?$/)
      if (match && inArray && currentKey) {
        arrayItems.push(match[1].replace(/^"|"$/g, ''))
      }
      continue
    }

    // Save previous array if we were in one
    if (inArray && currentKey) {
      frontmatter[currentKey] = arrayItems
      inArray = false
      arrayItems = []
    }

    // Check for key: value
    const kvMatch = line.match(/^(\w+):\s*(.*)$/)
    if (kvMatch) {
      const [, key, value] = kvMatch
      if (value === '') {
        // Could be start of array or object
        currentKey = key
        inArray = true
        arrayItems = []
      } else {
        frontmatter[key] = value.replace(/^"|"$/g, '')
      }
    }
  }

  // Save final array if we were in one
  if (inArray && currentKey) {
    frontmatter[currentKey] = arrayItems
  }

  return {
    frontmatter,
    content: content.slice(frontmatterMatch[0].length).trim()
  }
}

/**
 * Extract meaningful content for description generation
 */
function extractContentSummary(content, maxLength = 500) {
  // Remove MDX components and imports
  let text = content
    .replace(/import\s+.*?from\s+['"].*?['"]/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Convert links to text
    .replace(/```[\s\S]*?```/g, '') // Remove code blocks
    .replace(/`[^`]+`/g, '') // Remove inline code
    .replace(/#{1,6}\s+/g, '') // Remove headers
    .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold
    .replace(/\*([^*]+)\*/g, '$1') // Remove italic
    .replace(/\n+/g, ' ') // Collapse newlines
    .replace(/\s+/g, ' ') // Collapse spaces
    .trim()

  if (text.length > maxLength) {
    text = text.slice(0, maxLength) + '...'
  }

  return text
}

/**
 * Run the fal-cover-generator script
 */
function runGenerator(args) {
  return new Promise((resolve, reject) => {
    const proc = spawn('node', [path.join(__dirname, 'fal-cover-generator.js'), ...args], {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    })

    proc.on('close', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`Generator exited with code ${code}`))
      }
    })

    proc.on('error', reject)
  })
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2)

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
Regenerate Cover Image

Reads an MDX blog post and generates a new AI cover image based on its content.

Usage:
  node scripts/regenerate-cover.js <filename.mdx> ["scenario"] [options]

Arguments:
  <filename.mdx>    MDX filename (e.g., 2014-05-10-hackers.mdx)
  "scenario"        Optional scenario/theme to guide image generation (in quotes)

Options:
  --no-interactive, -y    Skip interactive prompt review
  --debug, -d             Enable debug output
  --help, -h              Show this help message

Examples:
  node scripts/regenerate-cover.js 2014-05-10-hackers.mdx
  node scripts/regenerate-cover.js 2014-05-10-hackers.mdx "hooded figure in shadows"
  node scripts/regenerate-cover.js 2014-05-31-openshift.mdx "container ship being unloaded" -y
`)
    return
  }

  // Parse arguments
  const mdxFilename = args.find(arg => arg.endsWith('.mdx'))
  const noInteractive = args.includes('--no-interactive') || args.includes('-y')
  const debug = args.includes('--debug') || args.includes('-d')

  // Find scenario - any quoted string or unquoted string that's not a flag or mdx file
  const scenario = args.find(arg =>
    !arg.endsWith('.mdx') &&
    !arg.startsWith('-') &&
    !arg.startsWith('--') &&
    arg.length > 0
  )

  if (!mdxFilename) {
    console.error('Error: Please provide an MDX filename')
    process.exit(1)
  }

  // Construct paths
  const blogDir = path.join(__dirname, '..', 'src', 'content', 'blog')
  const mdxPath = path.join(blogDir, mdxFilename)

  // Check if file exists
  try {
    await fs.access(mdxPath)
  } catch {
    console.error(`Error: File not found: ${mdxPath}`)
    process.exit(1)
  }

  console.log(`\n📄 Reading: ${mdxFilename}`)

  // Read and parse the MDX file
  const fileContent = await fs.readFile(mdxPath, 'utf-8')
  const { frontmatter, content } = parseFrontmatter(fileContent)

  const title = frontmatter.title
  const baseDescription = frontmatter.description || extractContentSummary(content)
  const tags = frontmatter.tags || []

  // If scenario provided, prepend it to guide the AI
  const description = scenario
    ? `IMAGE SCENARIO: ${scenario}. Context: ${baseDescription}`
    : baseDescription

  console.log(`   Title: ${title}`)
  if (scenario) {
    console.log(`   Scenario: ${scenario}`)
  }
  console.log(`   Description: ${baseDescription.slice(0, 100)}${baseDescription.length > 100 ? '...' : ''}`)
  console.log(`   Tags: ${tags.join(', ') || 'none'}`)

  // Determine output path based on filename
  const slug = mdxFilename.replace('.mdx', '')
  const assetsDir = path.join(__dirname, '..', 'src', 'assets', slug)
  const outputPath = path.join(assetsDir, `blog-cover-${slug}.png`)

  console.log(`   Output: ${outputPath}`)

  // Ensure assets directory exists
  await fs.mkdir(assetsDir, { recursive: true })

  // Build generator arguments
  const generatorArgs = [
    `--title=${title}`,
    `--description=${description}`,
    `--output=${outputPath}`
  ]

  if (tags.length > 0) {
    generatorArgs.push(`--tags=${tags.join(',')}`)
  }

  if (noInteractive) {
    generatorArgs.push('-y')
  }

  if (debug) {
    generatorArgs.push('--debug')
  }

  console.log(`\n🎨 Generating cover image...\n`)

  try {
    await runGenerator(generatorArgs)
    console.log(`\n✨ Cover image regenerated successfully!`)
  } catch (error) {
    console.error(`\n❌ Failed to generate cover:`, error.message)
    process.exit(1)
  }
}

main().catch(error => {
  console.error('Error:', error)
  process.exit(1)
})
