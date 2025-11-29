import sharp from 'sharp'
import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { fal } from '@fal-ai/client'
import dotenv from 'dotenv'
import OpenAI from 'openai'
import readline from 'readline'

// Load environment variables
dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load configuration
let config
try {
  const configPath = path.join(__dirname, 'fal-cover-config.json')
  const configFile = await fs.readFile(configPath, 'utf-8')
  config = JSON.parse(configFile)
} catch (error) {
  console.error('Failed to load fal-cover-config.json:', error.message)
  process.exit(1)
}

// Initialize OpenAI client (optional - for enhanced prompts)
let openai = null
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  })
}

/**
 * Generate an enhanced image prompt using OpenAI GPT-4
 * @param {string} title - Blog post title
 * @param {string} description - Blog post description
 * @param {string[]} tags - Blog post tags
 * @param {boolean} debug - Enable debug logging
 * @returns {Promise<string>} Enhanced prompt for image generation
 */
async function generateEnhancedPrompt(title, description, tags = [], debug = false) {
  if (!openai) {
    if (debug) {
      console.log('  ⚠ No OpenAI API key found, using basic prompt generation')
    }
    return generateBasicPrompt(title, description, tags)
  }

  try {
    if (debug) {
      console.log('  Generating enhanced prompt with GPT-4...')
    }

    const systemPrompt = config.prompts.gptSystemPrompt

    const userPrompt = config.prompts.gptUserPromptTemplate
      .replace('${title}', title)
      .replace('${description}', description)
      .replace('${tags}', tags.length > 0 ? tags.join(', ') : 'general')

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 300,
      temperature: 0.8
    })

    const enhancedPrompt = response.choices[0].message.content.trim()

    if (debug) {
      console.log(`  ✓ Generated enhanced prompt: "${enhancedPrompt}"`)
    }

    return enhancedPrompt
  } catch (error) {
    if (debug) {
      console.error(`  ⚠ Failed to generate enhanced prompt: ${error.message}`)
    }
    return generateBasicPrompt(title, description, tags)
  }
}

/**
 * Generate a basic image prompt without AI enhancement
 * Uses creative visual themes from config based on tags
 */
function generateBasicPrompt(title, description, tags = []) {
  const tagThemes = config.tagThemes || {}
  const defaultTheme = config.defaultTheme || 'dramatic landscape with rich colors, cinematic lighting, professional photography'

  // Find matching theme or use default
  let theme = defaultTheme
  for (const tag of tags) {
    const lowerTag = tag.toLowerCase()
    if (tagThemes[lowerTag]) {
      theme = tagThemes[lowerTag]
      break
    }
  }

  return config.prompts.basicPromptTemplate.replace('${theme}', theme)
}

/**
 * Create a readline interface for user input
 */
function createReadlineInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })
}

/**
 * Ask user a question and return their response
 */
function askQuestion(rl, query) {
  return new Promise(resolve => rl.question(query, resolve))
}

/**
 * Refine a prompt based on user feedback using GPT-4
 */
async function refinePrompt(originalPrompt, userFeedback, debug = false) {
  if (!openai) {
    console.log('  ⚠ No OpenAI API key - cannot refine prompt automatically')
    return originalPrompt
  }

  try {
    if (debug) {
      console.log('  Refining prompt with GPT-4...')
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are helping refine an AI image generation prompt. The user will provide the current prompt and their feedback on what to change.

CRITICAL RULES:
1. ABSOLUTELY NO text, words, letters, numbers, code, or typography in the image
2. NO screens showing text or code
3. NO books with visible text
4. NO signs, labels, or UI elements

Apply the user's feedback while maintaining these rules. Output ONLY the refined prompt, nothing else. Keep it under 150 words.`
        },
        {
          role: 'user',
          content: `Current prompt:\n"${originalPrompt}"\n\nUser feedback:\n${userFeedback}\n\nGenerate the refined prompt.`
        }
      ],
      max_tokens: 300,
      temperature: 0.7
    })

    const refinedPrompt = response.choices[0].message.content.trim()

    if (debug) {
      console.log(`  ✓ Refined prompt generated`)
    }

    return refinedPrompt
  } catch (error) {
    console.error(`  ⚠ Failed to refine prompt: ${error.message}`)
    return originalPrompt
  }
}

/**
 * Interactive prompt review and refinement loop
 */
async function interactivePromptReview(initialPrompt, title, description, tags, debug = false) {
  const rl = createReadlineInterface()
  let currentPrompt = initialPrompt

  console.log('\n' + '─'.repeat(60))
  console.log('📝 PROMPT REVIEW')
  console.log('─'.repeat(60))

  while (true) {
    console.log('\n🎨 Current image prompt:\n')
    console.log(`   "${currentPrompt}"`)
    console.log('')

    const response = await askQuestion(rl, '✓ Accept prompt? (y)es / (e)dit / (r)egenerate / (q)uit: ')
    const choice = response.toLowerCase().trim()

    if (choice === 'y' || choice === 'yes' || choice === '') {
      rl.close()
      console.log('  ✓ Prompt accepted')
      return currentPrompt
    } else if (choice === 'e' || choice === 'edit') {
      console.log('\n  Describe what changes you want (e.g., "make it more dramatic", "add warm colors"):')
      const feedback = await askQuestion(rl, '  > ')
      if (feedback.trim()) {
        console.log('  Refining prompt...')
        currentPrompt = await refinePrompt(currentPrompt, feedback, debug)
      }
    } else if (choice === 'r' || choice === 'regenerate') {
      console.log('  Regenerating prompt from scratch...')
      currentPrompt = await generateEnhancedPrompt(title, description, tags, debug)
    } else if (choice === 'q' || choice === 'quit') {
      rl.close()
      throw new Error('User cancelled prompt review')
    } else {
      console.log('  Invalid choice. Please enter y, e, r, or q.')
    }
  }
}

/**
 * Generate a blog cover image using FAL.ai text-to-image
 * @param {Object} options - Generation options
 * @param {string} options.title - Blog post title
 * @param {string} options.description - Blog post description
 * @param {string[]} options.tags - Blog post tags
 * @param {string} options.outputPath - Path to save the generated image
 * @param {number} options.width - Output width (default: 1400)
 * @param {number} options.height - Output height (default: 800)
 * @param {boolean} options.debug - Enable debug logging
 * @param {boolean} options.interactive - Enable interactive prompt review (default: true for CLI)
 * @returns {Promise<Object>} Result with output paths and metadata
 */
async function generateCoverImage(options) {
  const {
    title,
    description,
    tags = [],
    outputPath,
    width = 1400,
    height = 800,
    debug = false,
    interactive = false
  } = options

  // Validate FAL_KEY
  const falKey = process.env.FAL_KEY
  if (!falKey) {
    throw new Error('FAL_KEY environment variable is required for image generation')
  }

  // Configure FAL client
  fal.config({
    credentials: falKey
  })

  if (debug) {
    console.log(`  Creating FAL.ai cover image (${width}x${height})...`)
    console.log(`  Title: "${title}"`)
    console.log(`  Description: "${description}"`)
    console.log(`  Tags: ${tags.join(', ') || 'none'}`)
  }

  // Generate enhanced prompt
  let prompt = await generateEnhancedPrompt(title, description, tags, debug)

  // Interactive prompt review if enabled
  if (interactive) {
    prompt = await interactivePromptReview(prompt, title, description, tags, debug)
  }

  // Append quality/no-text suffix from config
  const promptSuffix = config.prompts?.promptSuffix || ''
  if (promptSuffix) {
    prompt = `${prompt} ${promptSuffix}`
    if (debug) {
      console.log(`  Added quality suffix to prompt`)
    }
  }

  // Determine aspect ratio based on dimensions
  let aspectRatio = '16:9' // Default for 1400×800
  if (width === height) {
    aspectRatio = '1:1'
  } else if (width > height) {
    const ratio = width / height
    if (ratio > 1.7) aspectRatio = '16:9'
    else if (ratio > 1.4) aspectRatio = '3:2'
    else aspectRatio = '4:3'
  } else {
    const ratio = height / width
    if (ratio > 1.7) aspectRatio = '9:16'
    else if (ratio > 1.4) aspectRatio = '2:3'
    else aspectRatio = '3:4'
  }

  // Prepare API request payload (use config values)
  const apiInput = {
    prompt,
    num_images: config.output?.numImages || 1,
    aspect_ratio: config.output?.aspectRatio || aspectRatio,
    output_format: config.output?.format || 'png',
    resolution: config.output?.resolution || '2K'
  }

  // Use model from config
  const modelName = config.model?.name || 'fal-ai/nano-banana-pro'

  if (debug) {
    console.log(`  Using model: ${modelName}`)
    console.log(`  Aspect ratio: ${apiInput.aspect_ratio}`)
    console.log(`  Prompt: "${prompt}"`)
    console.log(`  API payload:`, JSON.stringify(apiInput, null, 2))
  }

  try {

    const result = await fal.subscribe(modelName, {
      input: apiInput,
      logs: debug,
      onQueueUpdate: (update) => {
        if (debug && update.status === 'IN_PROGRESS') {
          update.logs?.map(log => log.message).forEach(msg => console.log(`  [FAL] ${msg}`))
        }
      }
    })

    if (!result.data || !result.data.images || result.data.images.length === 0) {
      throw new Error('FAL.ai returned no images')
    }

    const imageUrl = result.data.images[0].url

    if (debug) {
      console.log(`  Generated image URL: ${imageUrl}`)
    }

    // Download the image
    const response = await fetch(imageUrl)
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Get original image dimensions
    const originalMetadata = await sharp(buffer).metadata()
    const originalWidth = originalMetadata.width
    const originalHeight = originalMetadata.height

    // Ensure output directory exists
    const outputDir = path.dirname(outputPath)
    await fs.mkdir(outputDir, { recursive: true })

    // Save the original full-resolution image
    await sharp(buffer)
      .png({ compressionLevel: 6, quality: 100 })
      .toFile(outputPath)

    if (debug) {
      console.log(`  ✓ Saved original resolution: ${originalWidth}×${originalHeight} → ${outputPath}`)
    }

    // Save resized version with -small suffix (matching tunes post format)
    const ext = path.extname(outputPath)
    const baseName = path.basename(outputPath, ext)
    const smallOutputPath = path.join(outputDir, `${baseName}-small${ext}`)

    await sharp(buffer)
      .resize(width, height, { fit: 'cover' })
      .png({ compressionLevel: 6, quality: 100 })
      .toFile(smallOutputPath)

    console.log(`  ✓ Created AI-generated cover image`)
    console.log(`    Original: ${originalWidth}×${originalHeight} → ${outputPath}`)
    console.log(`    Small:    ${width}×${height} → ${smallOutputPath}`)

    return {
      outputPath,
      smallOutputPath,
      originalWidth,
      originalHeight,
      prompt,
      imageUrl
    }

  } catch (error) {
    // Enhanced error reporting
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
 * Check if FAL.ai cover generation is available
 * @returns {boolean} True if FAL_KEY is configured
 */
function isFALAvailable() {
  return !!process.env.FAL_KEY
}

/**
 * Parse CLI arguments
 */
function parseArgs(args) {
  const options = {
    title: null,
    description: null,
    tags: [],
    output: null,
    width: 1400,
    height: 800,
    debug: false,
    interactive: true, // Enable by default for CLI
    help: false
  }

  for (const arg of args) {
    if (arg === '--help' || arg === '-h') {
      options.help = true
    } else if (arg === '--debug' || arg === '-d') {
      options.debug = true
    } else if (arg === '--no-interactive' || arg === '-y') {
      options.interactive = false
    } else if (arg.startsWith('--title=')) {
      options.title = arg.split('=').slice(1).join('=')
    } else if (arg.startsWith('--description=')) {
      options.description = arg.split('=').slice(1).join('=')
    } else if (arg.startsWith('--tags=')) {
      options.tags = arg.split('=').slice(1).join('=').split(',').map(t => t.trim())
    } else if (arg.startsWith('--output=')) {
      options.output = arg.split('=').slice(1).join('=')
    } else if (arg.startsWith('--width=')) {
      options.width = parseInt(arg.split('=')[1], 10)
    } else if (arg.startsWith('--height=')) {
      options.height = parseInt(arg.split('=')[1], 10)
    }
  }

  return options
}

/**
 * Display CLI help
 */
function showHelp() {
  console.log(`
FAL.ai Blog Cover Generator

Generates AI-powered blog cover images using FAL.ai's Gemini 3 Pro Image model.
Uses OpenAI GPT-4 to create enhanced image prompts from your post metadata.

Usage:
  node scripts/fal-cover-generator.js [options]

Options:
  --title=<string>        Blog post title (required)
  --description=<string>  Blog post description (required)
  --tags=<string>         Comma-separated tags (optional)
  --output=<path>         Output path for the image (default: ./test-output/cover.png)
  --width=<number>        Output width in pixels (default: 1400)
  --height=<number>       Output height in pixels (default: 800)
  --no-interactive, -y    Skip interactive prompt review (auto-accept)
  --debug, -d             Enable debug output
  --help, -h              Show this help message

Interactive Mode (default):
  By default, the script shows you the generated prompt and lets you:
  - (y)es: Accept the prompt and generate the image
  - (e)dit: Describe changes and GPT-4 will refine the prompt
  - (r)egenerate: Generate a completely new prompt
  - (q)uit: Cancel without generating

Output Files:
  The script saves TWO images:
  1. <output>.png           - Full resolution from FAL.ai (typically 2K)
  2. <output>-small.png     - Resized to --width×--height (default 1400×800)

Environment Variables:
  FAL_KEY                 FAL.ai API key (required)
  OPENAI_API_KEY          OpenAI API key (required for prompt generation)

Examples:
  # Interactive mode (default) - review and refine prompt before generating
  node scripts/fal-cover-generator.js --title="Docker Best Practices" \\
    --description="Learn the essential Docker best practices for production"

  # Skip interactive review (auto-accept first prompt)
  node scripts/fal-cover-generator.js -y \\
    --title="Kubernetes Security Guide" \\
    --description="Comprehensive security hardening for K8s clusters" \\
    --tags="kubernetes,security,devops"

  # Debug mode with custom output
  node scripts/fal-cover-generator.js \\
    --title="Test Post" \\
    --description="A test description" \\
    --output=./my-cover.png \\
    --debug
`)
}

/**
 * CLI entry point
 */
async function main(cliArgs = []) {
  const options = parseArgs(cliArgs)

  if (options.help) {
    showHelp()
    return
  }

  if (!options.title) {
    console.error('❌ Error: --title is required')
    console.error('Run with --help for usage information')
    process.exit(1)
  }

  if (!options.description) {
    console.error('❌ Error: --description is required')
    console.error('Run with --help for usage information')
    process.exit(1)
  }

  if (!isFALAvailable()) {
    console.error('❌ Error: FAL_KEY environment variable is not set')
    console.error('Get your API key from https://fal.ai')
    process.exit(1)
  }

  console.log('🎨 Generating AI blog cover image...\n')

  // Determine output path
  let outputPath
  if (options.output) {
    outputPath = path.isAbsolute(options.output)
      ? options.output
      : path.join(process.cwd(), options.output)
  } else {
    // Generate filename from title (kebab-case)
    const kebabTitle = options.title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
    const outputDir = path.join(__dirname, '..', 'test-output')
    await fs.mkdir(outputDir, { recursive: true })
    outputPath = path.join(outputDir, `${kebabTitle}.png`)
  }

  try {
    const result = await generateCoverImage({
      title: options.title,
      description: options.description,
      tags: options.tags,
      outputPath,
      width: options.width,
      height: options.height,
      debug: options.debug,
      interactive: options.interactive
    })

    console.log('\n✨ Cover image generated successfully!')
    console.log(`   Original: ${result.outputPath}`)
    console.log(`   Small:    ${result.smallOutputPath}`)

  } catch (error) {
    console.error('\n❌ Cover generation failed:')
    console.error(`   ${error.message}`)
    process.exit(1)
  }
}

// Export for use in other scripts
export { generateCoverImage, generateEnhancedPrompt, isFALAvailable }

// Run CLI if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2)
  main(args).catch(error => {
    console.error('Failed:', error)
    process.exit(1)
  })
}
