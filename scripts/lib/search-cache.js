import { promises as fs } from 'fs'
import path from 'path'
import crypto from 'crypto'

export class SearchCache {
  constructor(cacheDir = 'scripts/.research-cache') {
    this.cacheDir = cacheDir
    this.enabled = process.env.ENABLE_SEARCH_CACHE !== 'false' // Enabled by default
  }

  /**
   * Initialize cache directory
   */
  async init() {
    if (!this.enabled) return

    try {
      await fs.mkdir(this.cacheDir, { recursive: true })
      // Create .gitignore to exclude cache from git
      const gitignorePath = path.join(this.cacheDir, '.gitignore')
      await fs.writeFile(gitignorePath, '*\n!.gitignore\n')
    } catch (error) {
      console.warn(`Failed to initialize search cache: ${error.message}`)
      this.enabled = false
    }
  }

  /**
   * Generate cache key from search query
   */
  getCacheKey(artist, album, provider = 'default') {
    const normalized = `${artist}|||${album}|||${provider}`.toLowerCase().trim()
    return crypto.createHash('md5').update(normalized).digest('hex')
  }

  /**
   * Get cached search results
   */
  async get(artist, album, provider = 'default') {
    if (!this.enabled) return null

    try {
      const cacheKey = this.getCacheKey(artist, album, provider)
      const cachePath = path.join(this.cacheDir, `${cacheKey}.json`)

      const stats = await fs.stat(cachePath).catch(() => null)
      if (!stats) return null

      // Check if cache is older than 30 days
      const age = Date.now() - stats.mtimeMs
      const maxAge = 30 * 24 * 60 * 60 * 1000 // 30 days
      if (age > maxAge) {
        await fs.unlink(cachePath).catch(() => {})
        return null
      }

      const data = await fs.readFile(cachePath, 'utf-8')
      const cached = JSON.parse(data)
      console.log(`    ✓ Cache hit for ${album} by ${artist}`)
      return cached.results
    } catch (error) {
      return null
    }
  }

  /**
   * Store search results in cache
   */
  async set(artist, album, results, provider = 'default') {
    if (!this.enabled || !results) return

    try {
      const cacheKey = this.getCacheKey(artist, album, provider)
      const cachePath = path.join(this.cacheDir, `${cacheKey}.json`)

      const data = {
        artist,
        album,
        provider,
        timestamp: Date.now(),
        results
      }

      await fs.writeFile(cachePath, JSON.stringify(data, null, 2))
    } catch (error) {
      console.warn(`Failed to cache search results: ${error.message}`)
    }
  }

  /**
   * Clear all cached results
   */
  async clear() {
    if (!this.enabled) return

    try {
      const files = await fs.readdir(this.cacheDir)
      for (const file of files) {
        if (file !== '.gitignore') {
          await fs.unlink(path.join(this.cacheDir, file))
        }
      }
      console.log('Search cache cleared')
    } catch (error) {
      console.warn(`Failed to clear cache: ${error.message}`)
    }
  }

  /**
   * Get cache statistics
   */
  async stats() {
    if (!this.enabled) {
      return { enabled: false, count: 0 }
    }

    try {
      const files = await fs.readdir(this.cacheDir)
      const count = files.filter(f => f.endsWith('.json')).length
      return { enabled: true, count }
    } catch (error) {
      return { enabled: false, count: 0, error: error.message }
    }
  }
}
