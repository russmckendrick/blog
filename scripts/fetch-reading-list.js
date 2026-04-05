#!/usr/bin/env node

/**
 * Fetch reading list from Instapaper API
 *
 * Usage:
 *   node scripts/fetch-reading-list.js                  # fetch from all folders
 *   node scripts/fetch-reading-list.js --folder starred # fetch from a specific folder
 *
 * Required .env variables:
 *   INSTAPAPER_CONSUMER_KEY
 *   INSTAPAPER_CONSUMER_SECRET
 *   INSTAPAPER_USERNAME
 *   INSTAPAPER_PASSWORD
 */

import 'dotenv/config'
import OAuth from 'oauth-1.0a'
import crypto from 'crypto'
import { writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUTPUT_PATH = resolve(__dirname, '../src/data/reading.json')

const API_BASE = 'https://www.instapaper.com'
const BUILT_IN_FOLDERS = ['unread', 'starred', 'archive']

// ── Config ──────────────────────────────────────────────────────────────────

const {
  INSTAPAPER_CONSUMER_KEY,
  INSTAPAPER_CONSUMER_SECRET,
  INSTAPAPER_USERNAME,
  INSTAPAPER_PASSWORD,
} = process.env

if (!INSTAPAPER_CONSUMER_KEY || !INSTAPAPER_CONSUMER_SECRET || !INSTAPAPER_USERNAME) {
  console.error('Missing required INSTAPAPER_* env variables. See .env.example.')
  process.exit(1)
}

// ── OAuth 1.0a setup ────────────────────────────────────────────────────────

const oauth = OAuth({
  consumer: {
    key: INSTAPAPER_CONSUMER_KEY,
    secret: INSTAPAPER_CONSUMER_SECRET,
  },
  signature_method: 'HMAC-SHA1',
  hash_function(baseString, key) {
    return crypto.createHmac('sha1', key).update(baseString).digest('base64')
  },
})

let accessToken = null

async function apiRequest(path, params = {}) {
  const url = `${API_BASE}${path}`
  const requestData = { url, method: 'POST', data: params }

  const headers = oauth.toHeader(
    oauth.authorize(requestData, accessToken)
  )

  const body = new URLSearchParams(params)

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`API error ${res.status} on ${path}: ${text}`)
  }

  return res
}

// ── Auth ─────────────────────────────────────────────────────────────────────

async function authenticate() {
  const res = await apiRequest('/api/1/oauth/access_token', {
    x_auth_username: INSTAPAPER_USERNAME,
    x_auth_password: INSTAPAPER_PASSWORD || '',
    x_auth_mode: 'client_auth',
  })

  // Response is qline format: oauth_token=x&oauth_token_secret=y
  const text = await res.text()
  const parsed = new URLSearchParams(text)

  accessToken = {
    key: parsed.get('oauth_token'),
    secret: parsed.get('oauth_token_secret'),
  }

  if (!accessToken.key) {
    throw new Error('Failed to obtain access token')
  }

  console.log('Authenticated successfully')
}

// ── Fetch bookmarks ─────────────────────────────────────────────────────────

async function fetchBookmarks(folderId) {
  const res = await apiRequest('/api/1/bookmarks/list', {
    limit: '500',
    folder_id: folderId,
  })

  const data = await res.json()

  // API returns a flat array of mixed types (meta, user, bookmark, highlight)
  const items = Array.isArray(data) ? data : data.bookmarks || []

  return items
    .filter(b => b.type === 'bookmark')
    .map(b => ({
      bookmark_id: b.bookmark_id,
      title: b.title || '(untitled)',
      url: b.url,
      description: b.description || '',
      time: new Date(b.time * 1000).toISOString(),
      starred: b.starred === '1' || b.starred === true,
      progress: parseFloat(b.progress) || 0,
      tags: (b.tags || []).map(t => t.name),
      folder: folderId,
    }))
}

async function fetchCustomFolders() {
  const res = await apiRequest('/api/1/folders/list')
  const data = await res.json()
  return data.filter(f => f.type === 'folder')
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2)
  const folderFlagIdx = args.indexOf('--folder')
  const singleFolder = folderFlagIdx !== -1 ? args[folderFlagIdx + 1] : null

  await authenticate()

  let allBookmarks = []

  if (singleFolder) {
    console.log(`Fetching bookmarks from folder: ${singleFolder}`)
    const bookmarks = await fetchBookmarks(singleFolder)
    allBookmarks = bookmarks
    console.log(`  ${singleFolder}: ${bookmarks.length} bookmarks`)
  } else {
    // Fetch from all built-in folders
    for (const folder of BUILT_IN_FOLDERS) {
      console.log(`Fetching from ${folder}...`)
      const bookmarks = await fetchBookmarks(folder)
      allBookmarks.push(...bookmarks)
      console.log(`  ${folder}: ${bookmarks.length} bookmarks`)
    }

    // Fetch from custom folders
    const customFolders = await fetchCustomFolders()
    for (const folder of customFolders) {
      console.log(`Fetching from ${folder.title} (${folder.folder_id})...`)
      const bookmarks = await fetchBookmarks(folder.folder_id.toString())
      // Tag with the folder title instead of ID
      bookmarks.forEach(b => (b.folder = folder.title))
      allBookmarks.push(...bookmarks)
      console.log(`  ${folder.title}: ${bookmarks.length} bookmarks`)
    }
  }

  // Deduplicate by bookmark_id (same article can appear in multiple contexts)
  const seen = new Set()
  const unique = []
  for (const b of allBookmarks) {
    if (!seen.has(b.bookmark_id)) {
      seen.add(b.bookmark_id)
      unique.push(b)
    }
  }

  // Sort newest first
  unique.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())

  writeFileSync(OUTPUT_PATH, JSON.stringify(unique, null, 2))
  console.log(`\nWrote ${unique.length} bookmarks to ${OUTPUT_PATH}`)
}

main().catch(err => {
  console.error('Error:', err.message)
  process.exit(1)
})
