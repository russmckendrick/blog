import axios from 'axios'

export class LastFMClient {
  constructor(username, apiKey) {
    this.username = username
    this.apiKey = apiKey
    this.baseUrl = 'http://ws.audioscrobbler.com/2.0/'
  }

  async getData(method, fromTime, toTime) {
    try {
      const params = {
        method,
        user: this.username,
        api_key: this.apiKey,
        format: 'json',
        from: fromTime,
        to: toTime
      }

      const response = await axios.get(this.baseUrl, { params })
      return response.data
    } catch (error) {
      console.error(`Error fetching Last.fm data: ${error.message}`)
      throw error
    }
  }

  async getWeeklyArtistChart(fromTime, toTime) {
    return this.getData('user.getweeklyartistchart', fromTime, toTime)
  }

  async getWeeklyAlbumChart(fromTime, toTime) {
    return this.getData('user.getweeklyalbumchart', fromTime, toTime)
  }

  /**
   * Get album info including track count
   * @param {string} artist - Artist name
   * @param {string} album - Album name
   * @returns {Object} Album info from Last.fm
   */
  async getAlbumInfo(artist, album) {
    try {
      const params = {
        method: 'album.getinfo',
        artist,
        album,
        api_key: this.apiKey,
        format: 'json'
      }

      const response = await axios.get(this.baseUrl, { params })
      return response.data.album
    } catch (error) {
      // Return null on error - caller will handle fallback
      return null
    }
  }

  /**
   * Get recent tracks with pagination support
   * @param {number} from - Start timestamp (Unix)
   * @param {number} to - End timestamp (Unix)
   * @param {number} page - Page number (default 1)
   * @param {number} limit - Results per page (max 200)
   * @returns {Object} Recent tracks data
   */
  async getRecentTracks(from, to, page = 1, limit = 200) {
    try {
      const params = {
        method: 'user.getrecenttracks',
        user: this.username,
        api_key: this.apiKey,
        format: 'json',
        from,
        to,
        page,
        limit,
        extended: 0
      }

      const response = await axios.get(this.baseUrl, { params })
      return response.data.recenttracks
    } catch (error) {
      console.error(`Error fetching recent tracks: ${error.message}`)
      throw error
    }
  }
}
