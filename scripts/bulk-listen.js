#!/usr/bin/env node

import { spawn } from 'child_process'
import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Parse CLI arguments
 */
function parseArgs(args) {
  const options = {
    from: null,
    to: null,
    debug: false,
    dryRun: false,
    help: false
  }

  for (const arg of args) {
    if (arg === '--help' || arg === '-h') {
      options.help = true
    } else if (arg === '--debug' || arg === '-d') {
      options.debug = true
    } else if (arg === '--dry-run' || arg === '-n') {
      options.dryRun = true
    } else if (arg.startsWith('--from=')) {
      options.from = arg.split('=')[1]
    } else if (arg.startsWith('--to=')) {
      options.to = arg.split('=')[1]
    }
  }

  return options
}

/**
 * Display help
 */
function showHelp() {
  console.log(`
Bulk FAL.ai Collage Generator for Listened Posts

Usage:
  node scripts/bulk-listen.js --from=YYYY-MM-DD --to=YYYY-MM-DD [options]

Options:
  --from=<date>       Start date (required, format: YYYY-MM-DD)
  --to=<date>         End date (required, format: YYYY-MM-DD)
  --debug, -d         Enable debug output for fal-collage.js
  --dry-run, -n       Show what would be processed without running
  --help, -h          Show this help message

Examples:
  # Process all weeks from May to December 2023
  node scripts/bulk-listen.js --from=2023-05-22 --to=2023-12-25

  # Dry run to see what folders would be processed
  node scripts/bulk-listen.js --from=2023-05-22 --to=2023-12-25 --dry-run

  # With debug output
  node scripts/bulk-listen.js --from=2023-05-22 --to=2023-12-25 --debug

Notes:
  - Processes weekly intervals (7 days apart)
  - Only processes folders that exist in public/assets/
  - Outputs to src/assets/ for each date
  - Skips dates where the input folder doesn't exist
`)
}

/**
 * Generate weekly dates between from and to
 */
function generateWeeklyDates(fromDate, toDate) {
  const dates = []
  const current = new Date(fromDate)
  const end = new Date(toDate)

  while (current <= end) {
    const year = current.getFullYear()
    const month = String(current.getMonth() + 1).padStart(2, '0')
    const day = String(current.getDate()).padStart(2, '0')
    dates.push(`${year}-${month}-${day}`)
    current.setDate(current.getDate() + 7)
  }

  return dates
}

/**
 * Check if a directory exists
 */
async function dirExists(dirPath) {
  try {
    const stat = await fs.stat(dirPath)
    return stat.isDirectory()
  } catch {
    return false
  }
}

/**
 * Run fal-collage.js for a specific date
 */
function runFalCollage(date, debug = false) {
  return new Promise((resolve, reject) => {
    const inputPath = `public/assets/${date}-listened-to-this-week/albums`
    const outputPath = `src/assets/${date}-listened-to-this-week/tunes-cover-${date}-listened-to-this-week.png`

    const args = [
      path.join(__dirname, 'fal-collage.js'),
      `--input=${inputPath}`,
      `--output=${outputPath}`
    ]

    if (debug) {
      args.push('--debug')
    }

    console.log(`\n${'='.repeat(60)}`)
    console.log(`Processing: ${date}`)
    console.log(`${'='.repeat(60)}`)
    console.log(`  Input:  ${inputPath}`)
    console.log(`  Output: ${outputPath}`)

    const child = spawn('node', args, {
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit'
    })

    child.on('close', (code) => {
      if (code === 0) {
        resolve({ date, success: true })
      } else {
        resolve({ date, success: false, code })
      }
    })

    child.on('error', (error) => {
      resolve({ date, success: false, error: error.message })
    })
  })
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2)
  const options = parseArgs(args)

  if (options.help) {
    showHelp()
    process.exit(0)
  }

  if (!options.from || !options.to) {
    console.error('Error: --from and --to dates are required')
    console.error('Use --help for usage information')
    process.exit(1)
  }

  // Validate date format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(options.from) || !dateRegex.test(options.to)) {
    console.error('Error: Dates must be in YYYY-MM-DD format')
    process.exit(1)
  }

  const fromDate = new Date(options.from)
  const toDate = new Date(options.to)

  if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
    console.error('Error: Invalid date provided')
    process.exit(1)
  }

  if (fromDate > toDate) {
    console.error('Error: --from date must be before --to date')
    process.exit(1)
  }

  console.log('Bulk FAL.ai Collage Generator')
  console.log('=============================')
  console.log(`From: ${options.from}`)
  console.log(`To:   ${options.to}`)
  console.log(`Debug: ${options.debug}`)
  console.log(`Dry run: ${options.dryRun}`)

  // Generate all weekly dates
  const allDates = generateWeeklyDates(options.from, options.to)
  console.log(`\nGenerated ${allDates.length} weekly dates`)

  // Check which folders exist
  const projectRoot = path.join(__dirname, '..')
  const validDates = []

  for (const date of allDates) {
    const inputDir = path.join(projectRoot, 'public', 'assets', `${date}-listened-to-this-week`, 'albums')
    if (await dirExists(inputDir)) {
      validDates.push(date)
    } else if (options.dryRun || options.debug) {
      console.log(`  Skipping ${date} - folder not found: ${inputDir}`)
    }
  }

  console.log(`Found ${validDates.length} folders to process`)

  if (validDates.length === 0) {
    console.log('\nNo valid folders found to process')
    process.exit(0)
  }

  if (options.dryRun) {
    console.log('\nDry run - would process:')
    for (const date of validDates) {
      console.log(`  ${date}-listened-to-this-week`)
    }
    process.exit(0)
  }

  // Process each date
  const results = []
  for (const date of validDates) {
    const result = await runFalCollage(date, options.debug)
    results.push(result)
  }

  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('SUMMARY')
  console.log('='.repeat(60))

  const successful = results.filter(r => r.success)
  const failed = results.filter(r => !r.success)

  console.log(`Total processed: ${results.length}`)
  console.log(`Successful: ${successful.length}`)
  console.log(`Failed: ${failed.length}`)

  if (failed.length > 0) {
    console.log('\nFailed dates:')
    for (const f of failed) {
      console.log(`  ${f.date}: ${f.error || `exit code ${f.code}`}`)
    }
  }

  if (successful.length > 0) {
    console.log('\nSuccessful dates:')
    for (const s of successful) {
      console.log(`  ${s.date}`)
    }
  }
}

main().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})
