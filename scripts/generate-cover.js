#!/usr/bin/env node

import sharp from 'sharp'
import { promises as fs } from 'fs'
import { existsSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import readline from 'readline'
import matter from 'gray-matter'
import sanitizeHtml from 'sanitize-html'
import dotenv from 'dotenv'
import OpenAI from 'openai'
import { fal } from '@fal-ai/client'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const BLOG_DIR = path.join(__dirname, '..', 'src', 'content', 'blog')
const ASSETS_DIR = path.join(__dirname, '..', 'src', 'assets')

const IMAGE_MODEL = 'openai/gpt-image-2'
const PROMPT_MODEL = 'gpt-5.4'
// gpt-image-2: dimensions must be multiples of 16; 2560x1440 is the model's
// recommended upper reliability boundary (2K, exact 16:9)
const FAL_INPUT = { image_size: { width: 2560, height: 1440 }, quality: 'high', num_images: 1, output_format: 'png' }
const SMALL_WIDTH = 1400
const SMALL_HEIGHT = 800
const MAX_CONTENT_CHARS = 10000

const SYSTEM_PROMPT = `You design cover images for blog posts. You will be given the post itself.
Read it, work out what the post is really about, and write a prompt for an
image generation model (gpt-image-2) that would make a striking, relevant
16:9 blog header image for it. Write the prompt in the order scene, subject,
key details, constraints - and state the constraints explicitly at the end.

You have complete creative freedom - any style, medium, mood, or concept is
fine as long as the image genuinely represents this specific post. That
said, lean photographic by default: favour real, physical, photographable
scenes with believable materials and lighting, and reach for illustration
or stylised rendering only when the post genuinely calls for it.

Photographic does not mean tabletop still-life. Do not default to objects
arranged on a desk or workbench - that is the cliché to avoid. Let the post
choose the scene and the scale: a location, a landscape, machinery at work,
a street, weather, a person mid-task, extreme macro, an aerial view. Pick
the vantage point a photographer would choose for this particular story.

Hard rules (defects, not style choices):
- ABSOLUTELY NO text or lettering of any kind: no words, letters, numbers,
  code, glyphs, icons, or typography anywhere. Covers are pure visual
  interpretation, and the image model WILL write on any object that usually
  carries text - so keep text-bearing props out of the scene entirely: no
  signs, shopfront lettering, labels, tags, posters, books, documents, or
  handwriting. If such a prop is essential to the concept, explicitly
  describe it as blank and unmarked ("a plain blank sign"). Represent code,
  terminals, and data abstractly through shape, light, texture, and pattern.
- Never depict software interfaces: no app windows, dashboards, terminal
  screens, or websites. Represent software and tools through metaphor,
  physical objects, and scenes instead.
- Never invent branding: no logos, wordmarks, or badges - real or made up.
- No watermarks.

Reply with the image prompt only, no commentary.`

const CHAT_PROMPT = `You are iterating on an image generation prompt for a blog cover, in
conversation with the post's author. You will see the post, the current
prompt, and the author's change requests one at a time. After each request,
reply with the complete revised image prompt only - no commentary, no
questions. Apply exactly what the author asks (add, remove, or replace
elements, change the style or mood), keep everything they have not asked to
change, and always keep the hard rules: absolutely no text or lettering of
any kind (no words, letters, numbers, code, glyphs, or icons anywhere), no
text-bearing props (signs, shopfront lettering, labels, posters, documents
- any essential one must be described as blank and unmarked), no software
interfaces (app windows, dashboards, terminal screens, websites), no
branding real or invented, and no watermarks.`

// .env is a named pipe in this repo - a top-level dotenv.config() would block
// every invocation, including --help and --extract-only. Load lazily instead.
let envLoaded = false
function loadEnv() {
  if (envLoaded) return
  envLoaded = true
  dotenv.config()
}

let openaiClient = null
function getOpenAI() {
  loadEnv()
  if (!process.env.OPENAI_API_KEY) return null
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }
  return openaiClient
}

/**
 * Resolve a post argument to an existing file. Accepts a path, or a bare
 * filename (with or without .mdx) resolved against src/content/blog/.
 */
function resolvePostPath(input) {
  const withExt = /\.(mdx|md)$/.test(input) ? input : `${input}.mdx`
  const candidates = [
    path.resolve(process.cwd(), input),
    path.resolve(process.cwd(), withExt),
    path.join(BLOG_DIR, path.basename(withExt))
  ]
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate
  }
  throw new Error(`Post not found: ${input}\n  Tried:\n${candidates.map(c => `    ${c}`).join('\n')}`)
}

async function loadPost(postPath) {
  const raw = await fs.readFile(postPath, 'utf-8')
  const parsed = matter(raw)
  const slug = path.basename(postPath).replace(/\.(mdx|md)$/, '')
  return {
    path: postPath,
    slug,
    title: parsed.data.title || null,
    description: parsed.data.description || null,
    body: parsed.content,
    draft: Boolean(parsed.data.draft),
    hasCoverImage: Boolean(parsed.data.cover?.image)
  }
}

async function readDraftText(source) {
  if (source === '-') {
    const chunks = []
    for await (const chunk of process.stdin) chunks.push(chunk)
    return Buffer.concat(chunks).toString('utf-8')
  }
  const filePath = path.resolve(process.cwd(), source)
  return fs.readFile(filePath, 'utf-8')
}

/**
 * Reduce an MDX body to plain-ish text for the prompt model: drop code
 * fences, imports, and embed components, keep the prose and its structure.
 */
function extractPostText(body) {
  let text = body

  // Code fences first, before tag stripping, so code containing < survives as a marker
  text = text.replace(/```[\s\S]*?```/g, '[code example]')

  // MDX import/export lines
  text = text.replace(/^import\s.*$/gm, '')
  text = text.replace(/^export\s.*$/gm, '')

  // Unwrap inline code, escaping any tags inside it so sanitize-html keeps
  // the text (`<img>` should survive as prose); decoded again below
  text = text.replace(/`([^`\n]*)`/g, (match, code) => code.replace(/</g, '&lt;').replace(/>/g, '&gt;'))

  // Strip JSX/HTML tags; inner text of wrapping components is kept
  text = sanitizeHtml(text, { allowedTags: [], allowedAttributes: {} })

  // Undo sanitize-html's entity encoding of plain prose
  text = text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")

  // Markdown images and links become their text
  text = text.replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
  text = text.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')

  text = text.replace(/\n{3,}/g, '\n\n').trim()

  if (text.length > MAX_CONTENT_CHARS) {
    text = `${text.slice(0, MAX_CONTENT_CHARS)}\n…[post truncated]`
  }

  return text
}

function buildUserMessage({ title, description, content, hint, avoid = [] }) {
  const parts = []
  if (title) parts.push(`Title: ${title}`)
  if (description) parts.push(`Description: ${description}`)
  parts.push(`Post:\n${content}`)
  if (hint) parts.push(`Author's steer: ${hint}`)
  if (avoid.length > 0) {
    parts.push(`Covers already designed in this batch used the scenes below - choose a clearly different setting, composition, and vantage point for this one:\n${avoid.map(p => `- ${p}`).join('\n')}`)
  }
  return parts.join('\n\n')
}

async function generatePromptFromContent(userMessage, debug = false) {
  const openai = getOpenAI()
  if (!openai) {
    throw new Error('OPENAI_API_KEY is not set - set it or pass --prompt to supply your own image prompt')
  }

  const spinner = createSpinner('Reading the post and designing a cover prompt...')
  spinner.start()

  try {
    const response = await openai.responses.create({
      model: PROMPT_MODEL,
      instructions: SYSTEM_PROMPT,
      input: userMessage,
      temperature: 0.8
    })
    spinner.stop('Cover prompt designed')

    const prompt = (response.output_text || '').trim()
    if (!prompt) {
      throw new Error(`${PROMPT_MODEL} returned an empty prompt`)
    }
    if (debug) {
      console.log(`  ✓ Generated prompt: "${prompt}"`)
    }
    return prompt
  } catch (error) {
    spinner.fail('Prompt generation failed')
    throw error
  }
}

function printPrompt(prompt) {
  console.log('\n🎨 Current image prompt:\n')
  const promptLines = prompt.split('\n')
  if (promptLines.length === 1) {
    console.log(`   "${prompt}"`)
  } else {
    console.log('   """')
    for (const line of promptLines) {
      console.log(`   ${line}`)
    }
    console.log('   """')
  }
  console.log('')
}

/**
 * Multi-turn chat over the prompt: each message is applied with the full
 * conversation (and the post) as context, so requests can build on each
 * other. "done" keeps the result, "cancel" reverts to the pre-chat prompt.
 */
async function chatRefinePrompt(rl, startingPrompt, context, debug = false) {
  const openai = getOpenAI()
  if (!openai) {
    console.log('  ⚠ No OpenAI API key - cannot chat about the prompt (use (d)irect replace instead)')
    return startingPrompt
  }

  console.log('\n  💬 Chat about the image - one change at a time, e.g. "replace the engineer with a traditional english butler".')
  console.log('     Enter or "done" keeps the current prompt, "cancel" reverts everything from this chat.')

  let currentPrompt = startingPrompt
  const messages = [{
    role: 'user',
    content: `${context || 'No post context available.'}\n\nCurrent image prompt to iterate on:\n"${startingPrompt}"`
  }]

  while (true) {
    const line = (await askQuestion(rl, '\n  you> ')).trim()

    if (!line || /^(done|y|yes|ok|accept)$/i.test(line)) {
      return currentPrompt
    }
    if (/^(cancel|revert|undo)$/i.test(line)) {
      console.log('  ↩ Reverted to the prompt from before this chat')
      return startingPrompt
    }

    messages.push({ role: 'user', content: line })

    const spinner = createSpinner('Revising prompt...')
    spinner.start()
    try {
      const response = await openai.responses.create({
        model: PROMPT_MODEL,
        instructions: CHAT_PROMPT,
        input: messages,
        temperature: 0.7
      })
      const revised = (response.output_text || '').trim()
      if (!revised) {
        spinner.fail('Empty reply - prompt unchanged')
        messages.pop()
        continue
      }
      spinner.stop('Prompt revised')
      currentPrompt = revised
      messages.push({ role: 'assistant', content: revised })
      printPrompt(currentPrompt)
      if (debug) {
        console.log(`  (chat history: ${messages.length} messages)`)
      }
    } catch (error) {
      spinner.fail(`Failed to revise prompt: ${error.message}`)
      messages.pop()
    }
  }
}

function createReadlineInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })
}

function askQuestion(rl, query) {
  return new Promise(resolve => rl.question(query, resolve))
}

function askMultiline(rl, query) {
  return new Promise(resolve => {
    process.stdout.write(`${query}\n  (type END on its own line when done)\n  > `)
    const lines = []
    const onLine = (line) => {
      if (line.trim().toUpperCase() === 'END') {
        rl.removeListener('line', onLine)
        resolve(lines.join('\n'))
      } else {
        lines.push(line)
        process.stdout.write('  > ')
      }
    }
    rl.on('line', onLine)
  })
}

function createSpinner(message) {
  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
  let i = 0
  let interval = null

  // \r alone leaves residue when the new line is shorter - erase it first
  const render = (text) => process.stdout.write(`\r\x1b[2K${text}`)

  return {
    start() {
      process.stdout.write('\n')
      render(`${frames[0]} ${message}`)
      interval = setInterval(() => {
        i = (i + 1) % frames.length
        render(`${frames[i]} ${message}`)
      }, 80)
    },
    update(newMessage) {
      message = newMessage
      render(`${frames[i]} ${message}`)
    },
    stop(finalMessage) {
      if (interval) {
        clearInterval(interval)
        interval = null
      }
      render(`✓ ${finalMessage || message}`)
      process.stdout.write('\n')
    },
    fail(errorMessage) {
      if (interval) {
        clearInterval(interval)
        interval = null
      }
      render(`✗ ${errorMessage || message}`)
      process.stdout.write('\n')
    }
  }
}

/**
 * Interactive prompt review loop. `regenerate` re-runs prompt design against
 * the full post content; `context` grounds the chat in the post.
 */
async function interactivePromptReview(initialPrompt, { regenerate, context, debug = false }) {
  const rl = createReadlineInterface()
  let currentPrompt = initialPrompt

  console.log('\n' + '─'.repeat(60))
  console.log('📝 PROMPT REVIEW')
  console.log('─'.repeat(60))

  while (true) {
    printPrompt(currentPrompt)

    const response = await askQuestion(rl, '✓ Accept prompt? (y)es / (c)hat / (d)irect replace / (r)egenerate / (q)uit: ')
    const choice = response.toLowerCase().trim()

    if (choice === 'y' || choice === 'yes' || choice === '') {
      rl.close()
      console.log('  ✓ Prompt accepted')
      return currentPrompt
    } else if (choice === 'c' || choice === 'chat' || choice === 'e' || choice === 'edit') {
      currentPrompt = await chatRefinePrompt(rl, currentPrompt, context, debug)
    } else if (choice === 'd' || choice === 'direct') {
      const newPrompt = await askMultiline(rl, '\n  Enter your replacement prompt:')
      if (newPrompt.trim()) {
        currentPrompt = newPrompt.trim()
        console.log('  ✓ Prompt replaced')
      }
    } else if (choice === 'r' || choice === 'regenerate') {
      console.log('  Regenerating prompt from the post...')
      currentPrompt = await regenerate()
    } else if (choice === 'q' || choice === 'quit') {
      rl.close()
      throw new Error('User cancelled prompt review')
    } else {
      console.log('  Invalid choice. Please enter y, c, d, r, or q.')
    }
  }
}

/**
 * Generate the cover via FAL.ai and write the full-size and -small images.
 */
async function generateImage(prompt, outputPath, debug = false) {
  loadEnv()
  const falKey = process.env.FAL_KEY
  if (!falKey) {
    throw new Error('FAL_KEY environment variable is required for image generation')
  }

  fal.config({ credentials: falKey })

  const apiInput = { prompt, ...FAL_INPUT }

  if (debug) {
    console.log(`  Using model: ${IMAGE_MODEL}`)
    console.log(`  API payload:`, JSON.stringify(apiInput, null, 2))
  }

  const spinner = createSpinner('Generating image with FAL.ai...')

  try {
    spinner.start()

    const result = await fal.subscribe(IMAGE_MODEL, {
      input: apiInput,
      logs: debug,
      onQueueUpdate: (update) => {
        if (update.status === 'IN_QUEUE') {
          spinner.update('Queued - waiting for FAL.ai...')
        } else if (update.status === 'IN_PROGRESS') {
          spinner.update('Generating image...')
          if (debug) {
            update.logs?.map(log => log.message).forEach(msg => console.log(`\n  [FAL] ${msg}`))
          }
        }
      }
    })

    if (!result.data || !result.data.images || result.data.images.length === 0) {
      spinner.fail('FAL.ai returned no images')
      throw new Error('FAL.ai returned no images')
    }

    spinner.stop('Image generated')

    const imageUrl = result.data.images[0].url

    if (debug) {
      console.log(`  Generated image URL: ${imageUrl}`)
    }

    const downloadSpinner = createSpinner('Downloading image...')
    downloadSpinner.start()

    const response = await fetch(imageUrl)
    if (!response.ok) {
      downloadSpinner.fail('Failed to download image')
      throw new Error(`Failed to download image: ${response.statusText}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    downloadSpinner.stop('Image downloaded')

    const originalMetadata = await sharp(buffer).metadata()
    const originalWidth = originalMetadata.width
    const originalHeight = originalMetadata.height

    const outputDir = path.dirname(outputPath)
    await fs.mkdir(outputDir, { recursive: true })

    const saveSpinner = createSpinner('Saving images...')
    saveSpinner.start()

    await sharp(buffer)
      .png({ compressionLevel: 6, quality: 100 })
      .toFile(outputPath)

    const ext = path.extname(outputPath)
    const baseName = path.basename(outputPath, ext)
    const smallOutputPath = path.join(outputDir, `${baseName}-small${ext}`)

    saveSpinner.update('Resizing and saving small version...')

    await sharp(buffer)
      .resize(SMALL_WIDTH, SMALL_HEIGHT, { fit: 'cover' })
      .png({ compressionLevel: 6, quality: 100 })
      .toFile(smallOutputPath)

    saveSpinner.stop('Images saved')

    console.log(`    Original: ${originalWidth}×${originalHeight} → ${path.basename(outputPath)}`)
    console.log(`    Small:    ${SMALL_WIDTH}×${SMALL_HEIGHT} → ${path.basename(smallOutputPath)}`)

    return { outputPath, smallOutputPath, originalWidth, originalHeight, prompt, imageUrl }
  } catch (error) {
    let errorMessage = error.message

    if (error.body) {
      errorMessage += `\n  Response body: ${JSON.stringify(error.body, null, 2)}`
    }

    if (error.status) {
      errorMessage += `\n  HTTP status: ${error.status}`
    }

    if (debug) {
      console.error('  Full error object:', error)
    }

    throw new Error(`FAL.ai API call failed: ${errorMessage}`)
  }
}

/**
 * Insert a cover block into the post frontmatter if one is missing. Uses a
 * string splice so the rest of the frontmatter stays byte-identical.
 */
async function ensureCoverFrontmatter(postPath, slug) {
  const raw = await fs.readFile(postPath, 'utf-8')
  const parsed = matter(raw)
  if (parsed.data.cover?.image) return false

  const closingIndex = raw.indexOf('\n---', 3)
  if (!raw.startsWith('---') || closingIndex === -1) {
    console.warn('  ⚠ Could not locate the frontmatter block - add the cover block manually:')
    console.warn(`    cover:\n      image: "../../assets/${slug}/blog-cover-${slug}.png"`)
    return false
  }

  const insert = `cover:\n  image: "../../assets/${slug}/blog-cover-${slug}.png"\n`
  const updated = raw.slice(0, closingIndex + 1) + insert + raw.slice(closingIndex + 1)
  await fs.writeFile(postPath, updated, 'utf8')
  return true
}

/**
 * Parse a selection like "1,3,5-8", "all", or "q" into zero-based indices.
 * Returns 'quit', 'invalid', or an array of indices.
 */
function parseSelection(input, max) {
  const trimmed = input.trim().toLowerCase()
  if (trimmed === 'q' || trimmed === 'quit') return 'quit'
  if (trimmed === 'all') return Array.from({ length: max }, (value, i) => i)
  if (!trimmed) return 'invalid'

  const indices = new Set()
  for (const part of trimmed.split(',')) {
    const piece = part.trim()
    if (!piece) continue
    const range = piece.match(/^(\d+)\s*-\s*(\d+)$/)
    if (range) {
      const start = Number(range[1])
      const end = Number(range[2])
      if (start < 1 || end > max || start > end) return 'invalid'
      for (let i = start; i <= end; i++) indices.add(i - 1)
    } else if (/^\d+$/.test(piece)) {
      const n = Number(piece)
      if (n < 1 || n > max) return 'invalid'
      indices.add(n - 1)
    } else {
      return 'invalid'
    }
  }
  return [...indices].sort((a, b) => a - b)
}

/**
 * The per-post pipeline used by bulk mode: extract → design → review →
 * generate → frontmatter. Returns a status record for the summary.
 */
async function generateCoverForPost(post, options, usedPrompts = []) {
  const content = extractPostText(post.body)
  const userMessage = buildUserMessage({ title: post.title, description: post.description, content, hint: options.hint, avoid: usedPrompts })

  if (options.debug) {
    console.log(`  Extracted content: ${content.length} chars`)
  }

  if (options.extractOnly) {
    console.log(userMessage)
    return { slug: post.slug, status: 'extracted' }
  }

  let prompt = await generatePromptFromContent(userMessage, options.debug)

  if (options.interactive) {
    prompt = await interactivePromptReview(prompt, {
      regenerate: () => generatePromptFromContent(userMessage, options.debug),
      context: userMessage,
      debug: options.debug
    })
  }

  if (options.dryRun) {
    console.log('\n🎨 Final prompt (dry run - no image generated):\n')
    console.log(prompt)
    return { slug: post.slug, status: 'dry-run', prompt }
  }

  const outputPath = path.join(ASSETS_DIR, post.slug, `blog-cover-${post.slug}.png`)
  const result = await generateImage(prompt, outputPath, options.debug)

  if (!post.hasCoverImage && await ensureCoverFrontmatter(post.path, post.slug)) {
    console.log(`  ✓ Added cover block to ${path.basename(post.path)}`)
  }

  console.log(`\n✨ ${post.slug} cover generated`)
  console.log(`   Original: ${result.outputPath}`)
  console.log(`   Small:    ${result.smallOutputPath}`)
  return { slug: post.slug, status: 'generated', prompt }
}

/**
 * Bulk mode: list recent posts, let the user pick which ones to regenerate,
 * then run each through the normal pipeline. One failure doesn't stop the run.
 */
async function runBulk(options) {
  if (options.post) {
    console.error('❌ Error: --bulk does not take a post argument')
    process.exit(1)
  }
  if (options.prompt || options.text || options.output) {
    console.error('❌ Error: --bulk cannot be combined with --prompt, --text, or --output')
    process.exit(1)
  }

  const limit = options.bulk === 'all' ? Infinity : options.bulk
  const files = (await fs.readdir(BLOG_DIR))
    .filter(file => /^\d{4}-\d{2}-\d{2}-.+\.(mdx|md)$/.test(file))
    .sort()
    .reverse()
    .slice(0, limit === Infinity ? undefined : limit)

  if (files.length === 0) {
    console.error('❌ No posts found in src/content/blog/')
    process.exit(1)
  }

  const posts = []
  for (const file of files) {
    posts.push(await loadPost(path.join(BLOG_DIR, file)))
  }

  console.log(`\n📚 ${options.bulk === 'all' ? 'All' : `The ${posts.length} most recent`} posts:\n`)
  posts.forEach((post, i) => {
    const date = post.slug.slice(0, 10)
    const marker = post.draft ? ' (draft)' : ''
    console.log(`  ${String(i + 1).padStart(3)}. ${date}  ${post.title || post.slug}${marker}`)
  })

  const rl = createReadlineInterface()
  let selectedIndices = null
  while (!selectedIndices) {
    const answer = await askQuestion(rl, '\nRegenerate covers for which posts? (e.g. 1,3,5-8 / all / q to quit): ')
    const result = parseSelection(answer, posts.length)
    if (result === 'quit') {
      rl.close()
      console.log('Cancelled - no covers generated')
      return
    }
    if (result === 'invalid' || result.length === 0) {
      console.log(`  Invalid selection. Use numbers 1-${posts.length}, ranges (5-8), "all", or "q".`)
      continue
    }
    selectedIndices = result
  }
  rl.close()

  const chosen = selectedIndices.map(i => posts[i])
  console.log(`\n▶ Processing ${chosen.length} post${chosen.length === 1 ? '' : 's'}`)

  const results = []
  const usedPrompts = []
  for (const [n, post] of chosen.entries()) {
    console.log('\n' + '═'.repeat(60))
    console.log(`📄 [${n + 1}/${chosen.length}] ${post.slug}`)
    console.log('═'.repeat(60))
    try {
      const record = await generateCoverForPost(post, options, usedPrompts)
      if (record.prompt) usedPrompts.push(record.prompt)
      results.push(record)
    } catch (error) {
      if (/cancelled/i.test(error.message)) {
        console.log(`  ⏭ Skipped ${post.slug}`)
        results.push({ slug: post.slug, status: 'skipped' })
      } else {
        console.error(`  ❌ ${post.slug} failed: ${error.message}`)
        results.push({ slug: post.slug, status: 'failed', error: error.message })
      }
    }
  }

  console.log('\n' + '═'.repeat(60))
  console.log('📋 BULK SUMMARY')
  console.log('═'.repeat(60))
  const icons = { generated: '✅', 'dry-run': '📝', extracted: '📄', skipped: '⏭', failed: '❌' }
  for (const result of results) {
    const note = result.error ? ` - ${result.error.split('\n')[0]}` : ''
    console.log(`  ${icons[result.status] || '•'} ${result.slug} (${result.status})${note}`)
  }
  if (results.some(result => result.status === 'failed')) {
    process.exitCode = 1
  }
}

function parseArgs(args) {
  const options = {
    post: null,
    text: null,
    prompt: null,
    hint: null,
    output: null,
    title: null,
    description: null,
    bulk: null,
    extractOnly: false,
    dryRun: false,
    interactive: true,
    debug: false,
    help: false
  }

  for (const arg of args) {
    if (arg === '--help' || arg === '-h') {
      options.help = true
    } else if (arg === '--debug' || arg === '-d') {
      options.debug = true
    } else if (arg === '--no-interactive' || arg === '-y') {
      options.interactive = false
    } else if (arg === '--extract-only') {
      options.extractOnly = true
    } else if (arg === '--dry-run') {
      options.dryRun = true
    } else if (arg === '--bulk') {
      options.bulk = 20
    } else if (arg.startsWith('--bulk=')) {
      const value = arg.split('=')[1]
      if (value === 'all') {
        options.bulk = 'all'
      } else {
        const count = parseInt(value, 10)
        if (!Number.isInteger(count) || count < 1) {
          console.error(`❌ Invalid --bulk value: ${value} (use a number or "all")`)
          process.exit(1)
        }
        options.bulk = count
      }
    } else if (arg.startsWith('--text=')) {
      options.text = arg.split('=').slice(1).join('=')
    } else if (arg.startsWith('--prompt=')) {
      options.prompt = arg.split('=').slice(1).join('=')
    } else if (arg.startsWith('--hint=')) {
      options.hint = arg.split('=').slice(1).join('=')
    } else if (arg.startsWith('--output=')) {
      options.output = arg.split('=').slice(1).join('=')
    } else if (arg.startsWith('--title=')) {
      options.title = arg.split('=').slice(1).join('=')
    } else if (arg.startsWith('--description=')) {
      options.description = arg.split('=').slice(1).join('=')
    } else if (arg.startsWith('-')) {
      console.error(`❌ Unknown option: ${arg}`)
      console.error('Run with --help for usage information')
      process.exit(1)
    } else if (!options.post) {
      options.post = arg
    } else {
      console.error(`❌ Unexpected argument: ${arg}`)
      process.exit(1)
    }
  }

  return options
}

function showHelp() {
  console.log(`
Blog Cover Generator

Reads a blog post (or draft text), has ${PROMPT_MODEL} design a representative
image prompt from the actual content, and generates the cover with FAL.ai
${IMAGE_MODEL}. The prompt model has creative freedom with a default lean
toward photographic realism, and nothing is appended to its prompt; the only
hard rules are defect guards - no text of any kind, no software interfaces,
no branding, no watermarks. Covers are pure visual interpretation of the post.

Usage:
  node scripts/generate-cover.js <post.mdx> [options]
  node scripts/generate-cover.js --bulk [options]
  node scripts/generate-cover.js --text=<file|-> --output=<path> [options]

Arguments:
  <post.mdx>              Post filename (bare names resolve against
                          src/content/blog/) or a path. Sets the content,
                          title/description context, and output location.

Options:
  --bulk[=N|all]          List the N most recent posts (default 20, or all),
                          pick which ones to regenerate, then run each through
                          the normal flow. Composes with --dry-run, --hint,
                          and -y; one failure doesn't stop the run.
  --text=<file|->         Read draft content from a file ("-" = stdin) instead
                          of the post body. Without <post.mdx>, --output is
                          required. Stdin input disables the interactive review.
  --prompt=<string>       Use this image prompt verbatim (skips the LLM step)
  --hint=<string>         One-line steer for the prompt model, e.g.
                          --hint="focus on the recording feature"
  --output=<path>         Output path (default: src/assets/<slug>/blog-cover-<slug>.png)
  --title=<string>        Title context for --text mode without a post file
  --description=<string>  Description context for --text mode without a post file
  --extract-only          Print the content that would be sent to the prompt
                          model, then exit (needs no API keys)
  --dry-run               Stop after printing the final prompt (no image call)
  --no-interactive, -y    Skip the interactive prompt review (auto-accept)
  --debug, -d             Verbose logging
  --help, -h              Show this help message

Interactive review (default):
  - (y)es: accept the prompt and generate the image
  - (c)hat: guide the image in conversation - add, remove, or replace
    elements one message at a time ("replace the engineer with a butler");
    each turn shows the revised prompt. "done" keeps it, "cancel" reverts.
  - (d)irect replace: paste your own prompt (supports multiline)
  - (r)egenerate: design a new prompt from the post again
  - (q)uit: cancel without generating

Output:
  <output>.png            Full resolution from FAL.ai (2K, 16:9)
  <output>-small.png      Resized to ${SMALL_WIDTH}×${SMALL_HEIGHT}
  If the post has no cover: block in its frontmatter, one is added.

Environment variables:
  FAL_KEY                 FAL.ai API key (required to generate)
  OPENAI_API_KEY          OpenAI API key (required unless --prompt is given)

Examples:
  # Generate a cover from a finished post
  node scripts/generate-cover.js 2026-07-12-a-catch-up-terminal-svg-and-token-use-v1.mdx

  # Inspect the designed prompt without generating an image
  node scripts/generate-cover.js my-post.mdx --dry-run

  # Post not written yet - use a draft
  node scripts/generate-cover.js --text=draft.md --output=test-output/cover.png \\
    --title="My Next Post"

  # Bring your own prompt (e.g. authored in a Claude session)
  node scripts/generate-cover.js my-post.mdx --prompt="A hand-inked etching of..." -y

  # Pick posts from the last 30 and regenerate their covers
  node scripts/generate-cover.js --bulk=30

  # Preview the prompts a bulk run would design, without generating images
  node scripts/generate-cover.js --bulk --dry-run -y
`)
}

async function main(cliArgs = []) {
  const options = parseArgs(cliArgs)

  if (options.help) {
    showHelp()
    return
  }

  if (options.bulk) {
    await runBulk(options)
    return
  }

  if (!options.post && !options.text && !options.prompt) {
    console.error('❌ Error: provide a post file, --text, --prompt, or --bulk')
    console.error('Run with --help for usage information')
    process.exit(1)
  }

  // Resolve the post (content source + output location) if given
  let post = null
  if (options.post) {
    post = await loadPost(resolvePostPath(options.post))
  }

  // Stdin draft input means readline cannot run - force non-interactive
  if (options.text === '-' && options.interactive) {
    console.log('ℹ Reading draft from stdin - interactive review disabled')
    options.interactive = false
  }

  const title = options.title || post?.title || null
  const description = options.description || post?.description || null

  let content = null
  if (options.text) {
    content = extractPostText(await readDraftText(options.text))
  } else if (post) {
    content = extractPostText(post.body)
  }

  const userMessage = content ? buildUserMessage({ title, description, content, hint: options.hint }) : null

  if (options.debug && content) {
    console.log(`  Extracted content: ${content.length} chars`)
  }

  if (options.extractOnly) {
    if (!userMessage) {
      console.error('❌ Error: --extract-only needs a post file or --text')
      process.exit(1)
    }
    console.log(userMessage)
    return
  }

  // Output path: explicit override, or the post's asset directory
  let outputPath
  if (options.output) {
    outputPath = path.resolve(process.cwd(), options.output)
  } else if (post) {
    outputPath = path.join(ASSETS_DIR, post.slug, `blog-cover-${post.slug}.png`)
  } else {
    console.error('❌ Error: --output is required when no post file is given')
    process.exit(1)
  }

  // Prompt: bring-your-own, or designed from the content
  let prompt
  if (options.prompt) {
    prompt = options.prompt
    if (options.debug) {
      console.log(`  Using supplied prompt: "${prompt}"`)
    }
  } else {
    if (!userMessage) {
      console.error('❌ Error: no content to design a prompt from - provide a post file, --text, or --prompt')
      process.exit(1)
    }
    prompt = await generatePromptFromContent(userMessage, options.debug)
  }

  if (options.interactive) {
    const regenerate = userMessage
      ? () => generatePromptFromContent(userMessage, options.debug)
      : () => {
        console.log('  ⚠ No post content available - keeping the current prompt')
        return prompt
      }
    prompt = await interactivePromptReview(prompt, { regenerate, context: userMessage, debug: options.debug })
  }

  if (options.dryRun) {
    console.log('\n🎨 Final prompt (dry run - no image generated):\n')
    console.log(prompt)
    return
  }

  try {
    const result = await generateImage(prompt, outputPath, options.debug)

    // Keep the frontmatter contract when writing to the post's own asset path
    if (post && !options.output) {
      if (post.hasCoverImage) {
        if (options.debug) {
          console.log('  Frontmatter already has a cover block - left untouched')
        }
      } else if (await ensureCoverFrontmatter(post.path, post.slug)) {
        console.log(`  ✓ Added cover block to ${path.basename(post.path)}`)
      }
    }

    console.log('\n✨ Cover image generated successfully!')
    console.log(`   Original: ${result.outputPath}`)
    console.log(`   Small:    ${result.smallOutputPath}`)
  } catch (error) {
    console.error('\n❌ Cover generation failed:')
    console.error(`   ${error.message}`)
    process.exit(1)
  }
}

export { extractPostText, ensureCoverFrontmatter, buildUserMessage }

if (import.meta.url === `file://${process.argv[1]}`) {
  main(process.argv.slice(2)).catch(error => {
    console.error('❌ Error:', error.message)
    process.exit(1)
  })
}
