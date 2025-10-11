#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import readline from 'readline'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(query) {
  return new Promise(resolve => rl.question(query, resolve))
}

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function createBlogPost() {
  console.log('\n📝 Create a new blog post\n')

  // Get post title
  const title = await question('Post title: ')
  if (!title.trim()) {
    console.error('❌ Title is required')
    process.exit(1)
  }

  // Get description
  const description = await question('Description: ')
  if (!description.trim()) {
    console.error('❌ Description is required')
    process.exit(1)
  }

  // Get tags
  const tagsInput = await question('Tags (comma-separated): ')
  const tags = tagsInput
    .split(',')
    .map(tag => tag.trim())
    .filter(tag => tag.length > 0)

  // Get ToC preference
  const showTocInput = await question('Show table of contents? (y/n) [y]: ')
  const showToc = showTocInput.toLowerCase() !== 'n'

  rl.close()

  // Generate file details
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const slug = slugify(title)

  const dateStr = `${year}-${month}-${day}`
  const filename = `${dateStr}-${slug}.mdx`
  const isoDate = now.toISOString()

  // Create paths
  const blogDir = path.join(__dirname, '..', 'src', 'content', 'blog')
  const assetsDir = path.join(__dirname, '..', 'src', 'assets', `${dateStr}-${slug}`)
  const postPath = path.join(blogDir, filename)
  const coverImageName = `blog-cover-${dateStr}-${slug}.png`
  const coverImagePath = path.join(assetsDir, coverImageName)

  // Check if post already exists
  if (fs.existsSync(postPath)) {
    console.error(`❌ Post already exists: ${filename}`)
    process.exit(1)
  }

  // Create assets directory
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true })
    console.log(`✅ Created assets directory: ${path.relative(process.cwd(), assetsDir)}`)
  }

  // Copy placeholder cover image
  const placeholderImagePath = path.join(__dirname, '..', 'public', 'images', 'blog-cover.png')
  if (fs.existsSync(placeholderImagePath)) {
    fs.copyFileSync(placeholderImagePath, coverImagePath)
    console.log(`✅ Copied placeholder cover image: ${path.relative(process.cwd(), coverImagePath)}`)
  } else {
    console.warn(`⚠️  Placeholder image not found: ${placeholderImagePath}`)
  }

  // Create frontmatter
  const tagsYaml = tags.length > 0
    ? '\n' + tags.map(tag => `  - "${tag}"`).join('\n')
    : ''

  const frontmatter = `---
title: "${title}"
description: "${description}"
date: ${isoDate}
cover:
  image: "../../assets/${dateStr}-${slug}/${coverImageName}"
draft: true
showToc: ${showToc}
tags:${tagsYaml}
---

Write your blog post content here...

## Section 1

Your content goes here.

## Section 2

More content...
`

  // Write the MDX file
  fs.writeFileSync(postPath, frontmatter, 'utf8')

  // Summary
  console.log('\n✨ Blog post created successfully!\n')
  console.log('📄 Post file:', path.relative(process.cwd(), postPath))
  console.log('🖼️  Cover image:', path.relative(process.cwd(), coverImagePath))
  console.log('\n📋 Next steps:')
  console.log('  1. Replace placeholder cover image if desired:', path.relative(process.cwd(), coverImagePath))
  console.log('  2. Write your blog post content')
  console.log('  3. Set draft: false when ready to publish')
  console.log(`  4. Post URL: /${year}/${month}/${day}/${slug}\n`)
}

createBlogPost().catch(error => {
  console.error('❌ Error:', error.message)
  process.exit(1)
})
