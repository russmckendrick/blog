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
    this.trackCountCache = new Map()
  }

  /**
   * Get track count for an album with caching
   * @param {string} artist - Artist name
   * @param {string} album - Album name
   * @returns {number|null} Track count or null if unavailable
   */
  async getAlbumTrackCount(artist, album) {
    const cacheKey = `${artist.toLowerCase()}|||${album.toLowerCase()}`

    if (this.trackCountCache.has(cacheKey)) {
      return this.trackCountCache.get(cacheKey)
    }

    const albumInfo = await this.getAlbumInfo(artist, album)
    let trackCount = null

    if (albumInfo?.tracks?.track) {
      const tracks = albumInfo.tracks.track
      trackCount = Array.isArray(tracks) ? tracks.length : 1
    }

    this.trackCountCache.set(cacheKey, trackCount)
    return trackCount
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
   * Aggregate album data by counting unique days each album was played
   * Uses getRecentTracks to get individual scrobbles with timestamps
   * @param {number} year - The year to aggregate
   * @param {function} progressCallback - Optional callback for progress updates
   */
  async getYearlyAlbumData(year, progressCallback = null) {
    const albumData = {} // key -> { artist, album, days: Set, scrobbles, monthlyDays: { month: Set } }
    const monthlyData = {}

    // Initialize monthly data
    for (let month = 0; month < 12; month++) {
      monthlyData[month] = { albums: {}, totalPlays: 0 }
    }

    // Define year boundaries
    const yearStart = Math.floor(new Date(year, 0, 1).getTime() / 1000)
    const yearEnd = Math.floor(new Date(year + 1, 0, 1).getTime() / 1000)

    // Fetch all scrobbles for the year with pagination
    console.log(`Fetching all scrobbles for ${year}...`)
    let page = 1
    let totalPages = 1
    let totalTracks = 0

    while (page <= totalPages) {
      try {
        const data = await this.getRecentTracks(yearStart, yearEnd, page, 200)
        const tracks = data?.track || []
        const attrs = data?.['@attr'] || {}

        totalPages = parseInt(attrs.totalPages) || 1
        const total = parseInt(attrs.total) || 0

        if (page === 1) {
          console.log(`  Found ${total.toLocaleString()} scrobbles across ${totalPages} pages`)
        }

        process.stdout.write(`\r  Progress: page ${page}/${totalPages}`)

        for (const track of tracks) {
          // Skip currently playing track (no date)
          if (!track.date) continue

          const rawArtist = track.artist['#text']
          const albumName = track.album['#text']

          // Skip tracks with no album
          if (!albumName) continue

          // Normalize artist name (remove Last.fm disambiguation like "(3)")
          const artist = removeBracketedSuffix(rawArtist)
          // Normalize album name
          const normalizedAlbum = removeBracketedSuffix(albumName)
          const key = `${normalizeText(artist)}|||${normalizeText(normalizedAlbum)}`

          // Get the date (YYYY-MM-DD) from timestamp
          const timestamp = parseInt(track.date.uts)
          const trackDate = new Date(timestamp * 1000)
          const dateStr = trackDate.toISOString().split('T')[0]
          const month = trackDate.getMonth()

          // Initialize album entry if needed
          if (!albumData[key]) {
            albumData[key] = {
              artist,
              album: normalizedAlbum,
              days: new Set(),
              scrobbles: 0,
              monthlyDays: {}
            }
            for (let m = 0; m < 12; m++) {
              albumData[key].monthlyDays[m] = new Set()
            }
          } else if (normalizedAlbum.length < albumData[key].album.length) {
            // Prefer shorter album name
            albumData[key].album = normalizedAlbum
          }

          // Track unique days and scrobbles
          albumData[key].days.add(dateStr)
          albumData[key].scrobbles++
          albumData[key].monthlyDays[month].add(dateStr)

          totalTracks++
        }

        // Rate limiting
        await this.delay(100)
        page++
      } catch (error) {
        console.warn(`\nWarning: Could not fetch page ${page}: ${error.message}`)
        page++
      }
    }

    console.log(`\n  Processed ${totalTracks.toLocaleString()} tracks`)

    // Convert Sets to counts (playcount = unique days)
    const albumCounts = {}
    for (const [key, data] of Object.entries(albumData)) {
      albumCounts[key] = {
        artist: data.artist,
        album: data.album,
        playcount: data.days.size, // Unique days = album plays
        scrobbles: data.scrobbles
      }

      // Update monthly data
      for (let month = 0; month < 12; month++) {
        const monthDays = data.monthlyDays[month].size
        if (monthDays > 0) {
          monthlyData[month].albums[key] = {
            artist: data.artist,
            album: data.album,
            playcount: monthDays,
            scrobbles: data.scrobbles
          }
          monthlyData[month].totalPlays += monthDays
        }
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
