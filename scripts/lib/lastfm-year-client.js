import axios from 'axios'
import { LastFMClient } from './lastfm-client.js'
import { removeBracketedSuffix, normalizeText } from './text-utils.js'

/**
 * Extended Last.fm client with year-end wrapped functionality
 * Adds support for:
 * - Top artists/albums by period (12month, 6month, etc.)
 * - User info (total scrobbles, registration date)
 * - Weekly chart list for aggregating custom date ranges
 */
export class LastFMYearClient extends LastFMClient {
  constructor(username, apiKey) {
    super(username, apiKey)
  }

  /**
   * Get user info including total playcount and registration date
   */
  async getUserInfo() {
    try {
      const params = {
        method: 'user.getinfo',
        user: this.username,
        api_key: this.apiKey,
        format: 'json'
      }

      const response = await axios.get(this.baseUrl, { params })
      return response.data.user
    } catch (error) {
      console.error(`Error fetching user info: ${error.message}`)
      throw error
    }
  }

  /**
   * Get top artists for a specific period
   * @param {string} period - overall | 7day | 1month | 3month | 6month | 12month
   * @param {number} limit - Number of results to fetch (max 1000)
   */
  async getTopArtists(period = '12month', limit = 50) {
    try {
      const params = {
        method: 'user.gettopartists',
        user: this.username,
        api_key: this.apiKey,
        format: 'json',
        period,
        limit
      }

      const response = await axios.get(this.baseUrl, { params })
      return response.data.topartists
    } catch (error) {
      console.error(`Error fetching top artists: ${error.message}`)
      throw error
    }
  }

  /**
   * Get top albums for a specific period
   * @param {string} period - overall | 7day | 1month | 3month | 6month | 12month
   * @param {number} limit - Number of results to fetch (max 1000)
   */
  async getTopAlbums(period = '12month', limit = 50) {
    try {
      const params = {
        method: 'user.gettopalbums',
        user: this.username,
        api_key: this.apiKey,
        format: 'json',
        period,
        limit
      }

      const response = await axios.get(this.baseUrl, { params })
      return response.data.topalbums
    } catch (error) {
      console.error(`Error fetching top albums: ${error.message}`)
      throw error
    }
  }

  /**
   * Get top tracks for a specific period
   * @param {string} period - overall | 7day | 1month | 3month | 6month | 12month
   * @param {number} limit - Number of results to fetch (max 1000)
   */
  async getTopTracks(period = '12month', limit = 50) {
    try {
      const params = {
        method: 'user.gettoptracks',
        user: this.username,
        api_key: this.apiKey,
        format: 'json',
        period,
        limit
      }

      const response = await axios.get(this.baseUrl, { params })
      return response.data.toptracks
    } catch (error) {
      console.error(`Error fetching top tracks: ${error.message}`)
      throw error
    }
  }

  /**
   * Get list of available weekly chart ranges
   * Returns Unix timestamps for each available weekly chart
   */
  async getWeeklyChartList() {
    try {
      const params = {
        method: 'user.getweeklychartlist',
        user: this.username,
        api_key: this.apiKey,
        format: 'json'
      }

      const response = await axios.get(this.baseUrl, { params })
      return response.data.weeklychartlist.chart
    } catch (error) {
      console.error(`Error fetching weekly chart list: ${error.message}`)
      throw error
    }
  }

  /**
   * Get all weekly charts for a specific calendar year
   * This aggregates multiple weekly charts to get accurate year data
   * @param {number} year - The year to get data for (e.g., 2025)
   */
  async getYearChartRanges(year) {
    const charts = await this.getWeeklyChartList()

    const yearStart = new Date(year, 0, 1).getTime() / 1000
    const yearEnd = new Date(year + 1, 0, 1).getTime() / 1000

    return charts.filter(chart => {
      const from = parseInt(chart.from)
      const to = parseInt(chart.to)
      // Include charts that overlap with the year
      return from < yearEnd && to > yearStart
    })
  }

  /**
   * Aggregate all weekly artist charts for a specific year
   * @param {number} year - The year to aggregate
   * @param {function} progressCallback - Optional callback for progress updates
   */
  async getYearlyArtistData(year, progressCallback = null) {
    const ranges = await this.getYearChartRanges(year)
    const artistCounts = {}
    const monthlyData = {}

    // Initialize monthly data
    for (let month = 0; month < 12; month++) {
      monthlyData[month] = { artists: {}, totalPlays: 0 }
    }

    console.log(`Fetching ${ranges.length} weekly charts for ${year}...`)

    for (let i = 0; i < ranges.length; i++) {
      const range = ranges[i]
      if (progressCallback) {
        progressCallback(i + 1, ranges.length)
      }

      try {
        const data = await this.getWeeklyArtistChart(range.from, range.to)
        const artists = data.weeklyartistchart?.artist || []

        // Determine which month this week falls into
        const weekMidpoint = (parseInt(range.from) + parseInt(range.to)) / 2
        const weekDate = new Date(weekMidpoint * 1000)
        const month = weekDate.getMonth()

        for (const artist of artists) {
          const name = artist.name
          const playcount = parseInt(artist.playcount) || 0

          // Aggregate total
          artistCounts[name] = (artistCounts[name] || 0) + playcount

          // Aggregate monthly
          if (monthlyData[month]) {
            monthlyData[month].artists[name] = (monthlyData[month].artists[name] || 0) + playcount
            monthlyData[month].totalPlays += playcount
          }
        }

        // Small delay to avoid rate limiting
        await this.delay(100)
      } catch (error) {
        console.warn(`Warning: Could not fetch chart for range ${range.from}-${range.to}`)
      }
    }

    return { artistCounts, monthlyData }
  }

  /**
   * Aggregate all weekly album charts for a specific year
   * @param {number} year - The year to aggregate
   * @param {function} progressCallback - Optional callback for progress updates
   */
  async getYearlyAlbumData(year, progressCallback = null) {
    const ranges = await this.getYearChartRanges(year)
    const albumCounts = {}
    const monthlyData = {}

    // Initialize monthly data
    for (let month = 0; month < 12; month++) {
      monthlyData[month] = { albums: {}, totalPlays: 0 }
    }

    console.log(`Fetching ${ranges.length} weekly album charts for ${year}...`)

    for (let i = 0; i < ranges.length; i++) {
      const range = ranges[i]
      if (progressCallback) {
        progressCallback(i + 1, ranges.length)
      }

      try {
        const data = await this.getWeeklyAlbumChart(range.from, range.to)
        const albums = data.weeklyalbumchart?.album || []

        // Determine which month this week falls into
        const weekMidpoint = (parseInt(range.from) + parseInt(range.to)) / 2
        const weekDate = new Date(weekMidpoint * 1000)
        const month = weekDate.getMonth()

        for (const album of albums) {
          const artist = album.artist['#text']
          const albumName = album.name
          // Normalize album name by removing bracketed suffixes for deduplication
          // e.g., "Attack Of The Grey Lantern" and "Attack of the Grey Lantern (Remastered - 21st Anniversary Edition)"
          // should be treated as the same album
          const normalizedAlbum = removeBracketedSuffix(albumName)
          const key = `${normalizeText(artist)}|||${normalizeText(normalizedAlbum)}`
          const playcount = parseInt(album.playcount) || 0

          // Aggregate total - use the shorter/cleaner album name when merging
          if (!albumCounts[key]) {
            albumCounts[key] = { artist, album: normalizedAlbum, playcount: 0 }
          } else if (normalizedAlbum.length < albumCounts[key].album.length) {
            // Prefer shorter album name (usually the cleaner one without suffixes)
            albumCounts[key].album = normalizedAlbum
          }
          albumCounts[key].playcount += playcount

          // Aggregate monthly
          if (monthlyData[month]) {
            if (!monthlyData[month].albums[key]) {
              monthlyData[month].albums[key] = { artist, album: normalizedAlbum, playcount: 0 }
            }
            monthlyData[month].albums[key].playcount += playcount
            monthlyData[month].totalPlays += playcount
          }
        }

        // Small delay to avoid rate limiting
        await this.delay(100)
      } catch (error) {
        console.warn(`Warning: Could not fetch album chart for range ${range.from}-${range.to}`)
      }
    }

    return { albumCounts, monthlyData }
  }

  /**
   * Get comprehensive year-end statistics
   * @param {number} year - The year to analyze
   */
  async getYearWrappedData(year) {
    console.log(`\nGathering ${year} wrapped data...`)

    // Get user info for context
    const userInfo = await this.getUserInfo()
    console.log(`User: ${userInfo.name} (${userInfo.playcount} total scrobbles)`)

    // Get yearly aggregated data
    console.log('\nAggregating artist data...')
    const artistData = await this.getYearlyArtistData(year, (current, total) => {
      process.stdout.write(`\r  Progress: ${current}/${total} weeks`)
    })
    console.log('')

    console.log('Aggregating album data...')
    const albumData = await this.getYearlyAlbumData(year, (current, total) => {
      process.stdout.write(`\r  Progress: ${current}/${total} weeks`)
    })
    console.log('')

    // Sort and rank
    const topArtists = Object.entries(artistData.artistCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, playcount], index) => ({
        rank: index + 1,
        name,
        playcount
      }))

    const topAlbums = Object.values(albumData.albumCounts)
      .sort((a, b) => b.playcount - a.playcount)
      .map((album, index) => ({
        rank: index + 1,
        ...album
      }))

    // Calculate statistics
    const totalScrobbles = topArtists.reduce((sum, a) => sum + a.playcount, 0)
    const uniqueArtists = topArtists.length
    const uniqueAlbums = topAlbums.length

    // Estimate listening time (avg 3.5 minutes per track)
    const estimatedMinutes = totalScrobbles * 3.5
    const estimatedHours = Math.round(estimatedMinutes / 60)

    // Find monthly breakdown
    const monthlyBreakdown = []
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December']

    for (let month = 0; month < 12; month++) {
      const monthArtists = Object.entries(artistData.monthlyData[month].artists)
        .sort((a, b) => b[1] - a[1])

      const monthAlbums = Object.values(albumData.monthlyData[month].albums)
        .sort((a, b) => b.playcount - a.playcount)

      monthlyBreakdown.push({
        month: monthNames[month],
        monthIndex: month,
        totalPlays: artistData.monthlyData[month].totalPlays,
        topArtist: monthArtists[0] ? { name: monthArtists[0][0], playcount: monthArtists[0][1] } : null,
        topAlbum: monthAlbums[0] || null
      })
    }

    // Find peak listening month
    const peakMonth = [...monthlyBreakdown].sort((a, b) => b.totalPlays - a.totalPlays)[0]

    return {
      year,
      userInfo,
      stats: {
        totalScrobbles,
        uniqueArtists,
        uniqueAlbums,
        estimatedHours,
        peakMonth
      },
      topArtists,
      topAlbums,
      monthlyBreakdown
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
