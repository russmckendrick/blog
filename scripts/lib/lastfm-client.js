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
}
