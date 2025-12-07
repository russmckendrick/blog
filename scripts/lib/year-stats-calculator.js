/**
 * Year Statistics Calculator
 * Calculates Spotify Wrapped-style insights from Last.fm data
 * Inspired by: https://newsroom.spotify.com/2025-12-03/how-your-wrapped-is-made/
 */
export class YearStatsCalculator {
  constructor(wrappedData, collectionInfo = {}) {
    this.data = wrappedData
    this.collection = collectionInfo
    this.year = wrappedData.year
  }

  /**
   * Get basic stats summary
   */
  getBasicStats() {
    const { stats } = this.data
    return {
      totalScrobbles: stats.totalScrobbles,
      uniqueArtists: stats.uniqueArtists,
      uniqueAlbums: stats.uniqueAlbums,
      estimatedHours: stats.estimatedHours,
      // Days worth of music
      estimatedDays: Math.round(stats.estimatedHours / 24 * 10) / 10,
      // Average per day
      avgPerDay: Math.round(stats.totalScrobbles / 365),
      // Peak month
      peakMonth: stats.peakMonth
    }
  }

  /**
   * Get top artist of the year with details
   */
  getArtistOfTheYear() {
    const topArtist = this.data.topArtists[0]
    if (!topArtist) return null

    // Calculate percentage of total listens
    const percentage = Math.round((topArtist.playcount / this.data.stats.totalScrobbles) * 100 * 10) / 10

    // Find which months they dominated
    const dominantMonths = this.data.monthlyBreakdown
      .filter(m => m.topArtist?.name === topArtist.name)
      .map(m => m.month)

    return {
      ...topArtist,
      percentageOfTotal: percentage,
      dominantMonths,
      description: this.generateArtistDescription(topArtist, percentage, dominantMonths)
    }
  }

  /**
   * Get album of the year with details
   */
  getAlbumOfTheYear() {
    const topAlbum = this.data.topAlbums[0]
    if (!topAlbum) return null

    // Calculate percentage of total listens
    const percentage = Math.round((topAlbum.playcount / this.data.stats.totalScrobbles) * 100 * 10) / 10

    // Find which months it dominated
    const dominantMonths = this.data.monthlyBreakdown
      .filter(m => m.topAlbum?.album === topAlbum.album && m.topAlbum?.artist === topAlbum.artist)
      .map(m => m.month)

    return {
      ...topAlbum,
      percentageOfTotal: percentage,
      dominantMonths,
      description: this.generateAlbumDescription(topAlbum, percentage, dominantMonths)
    }
  }

  /**
   * Calculate listening streaks and patterns
   */
  getListeningPatterns() {
    const { monthlyBreakdown } = this.data

    // Find the most active month
    const sortedByActivity = [...monthlyBreakdown].sort((a, b) => b.totalPlays - a.totalPlays)
    const mostActiveMonth = sortedByActivity[0]
    const leastActiveMonth = sortedByActivity[sortedByActivity.length - 1]

    // Calculate monthly averages
    const avgPerMonth = Math.round(this.data.stats.totalScrobbles / 12)

    // Find months above average
    const aboveAverageMonths = monthlyBreakdown.filter(m => m.totalPlays > avgPerMonth)

    // Detect listening seasons (quarters)
    const quarters = [
      { name: 'Q1 (Jan-Mar)', months: [0, 1, 2], plays: 0 },
      { name: 'Q2 (Apr-Jun)', months: [3, 4, 5], plays: 0 },
      { name: 'Q3 (Jul-Sep)', months: [6, 7, 8], plays: 0 },
      { name: 'Q4 (Oct-Dec)', months: [9, 10, 11], plays: 0 }
    ]

    for (const month of monthlyBreakdown) {
      const quarterIndex = Math.floor(month.monthIndex / 3)
      quarters[quarterIndex].plays += month.totalPlays
    }

    const topQuarter = [...quarters].sort((a, b) => b.plays - a.plays)[0]

    return {
      mostActiveMonth,
      leastActiveMonth,
      avgPerMonth,
      aboveAverageMonths: aboveAverageMonths.length,
      topQuarter,
      monthlyBreakdown: monthlyBreakdown.map(m => ({
        month: m.month,
        plays: m.totalPlays,
        isAboveAverage: m.totalPlays > avgPerMonth
      }))
    }
  }

  /**
   * Calculate "Listening Age" - which decade resonates most
   * Based on album release years in collection
   */
  getListeningAge(collectionInfo = {}) {
    const decadeCounts = {}
    const albumsWithYears = []

    for (const album of this.data.topAlbums.slice(0, 100)) {
      // Try to find release year in collection
      const key = `${album.artist.toLowerCase()}|||${album.album.toLowerCase()}`
      const collectionData = collectionInfo[key]

      if (collectionData?.release_year) {
        const decade = Math.floor(collectionData.release_year / 10) * 10
        decadeCounts[decade] = (decadeCounts[decade] || 0) + album.playcount
        albumsWithYears.push({
          album: album.album,
          artist: album.artist,
          year: collectionData.release_year,
          playcount: album.playcount
        })
      }
    }

    const sortedDecades = Object.entries(decadeCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([decade, plays]) => ({ decade: parseInt(decade), plays }))

    const topDecade = sortedDecades[0]

    // Calculate average release year weighted by plays
    let totalWeightedYear = 0
    let totalPlays = 0
    for (const album of albumsWithYears) {
      totalWeightedYear += album.year * album.playcount
      totalPlays += album.playcount
    }
    const avgYear = totalPlays > 0 ? Math.round(totalWeightedYear / totalPlays) : null

    return {
      topDecade,
      allDecades: sortedDecades,
      avgYear,
      description: topDecade ? this.generateDecadeDescription(topDecade.decade) : null
    }
  }

  /**
   * Find "Hidden Gems" - albums with high play counts but less mainstream
   * Based on lower overall rankings but significant personal play counts
   */
  getHiddenGems() {
    // Albums that are in top 50 but might not be well-known
    // We'll consider albums from position 10-50 with high play counts relative to position
    const candidates = this.data.topAlbums.slice(10, 50)

    // Calculate expected plays based on rank (using inverse decay)
    // Higher ranked albums should have more plays; gems have more than expected
    const gems = candidates.map((album, index) => {
      const position = 10 + index
      const topAlbumPlays = this.data.topAlbums[0].playcount
      const expectedPlays = topAlbumPlays / (position * 0.5)
      const ratio = album.playcount / expectedPlays

      return {
        ...album,
        expectedPlays: Math.round(expectedPlays),
        overperformance: ratio
      }
    })
      .filter(g => g.overperformance > 1.2) // 20% above expected
      .sort((a, b) => b.overperformance - a.overperformance)
      .slice(0, 6)

    return gems
  }

  /**
   * Get genre breakdown from collection metadata
   */
  getGenreBreakdown(collectionInfo = {}) {
    const genreCounts = {}

    for (const album of this.data.topAlbums) {
      const key = `${album.artist.toLowerCase()}|||${album.album.toLowerCase()}`
      const collectionData = collectionInfo[key]

      if (collectionData?.genres) {
        for (const genre of collectionData.genres) {
          genreCounts[genre] = (genreCounts[genre] || 0) + album.playcount
        }
      }
    }

    const sortedGenres = Object.entries(genreCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([genre, plays], index) => ({
        rank: index + 1,
        genre,
        plays,
        percentage: Math.round((plays / this.data.stats.totalScrobbles) * 100 * 10) / 10
      }))

    return sortedGenres
  }

  /**
   * Find new discoveries - albums from artists not in previous year
   * For now, we'll identify newer albums (released in the year)
   */
  getNewDiscoveries(collectionInfo = {}) {
    const discoveries = []

    for (const album of this.data.topAlbums.slice(0, 100)) {
      const key = `${album.artist.toLowerCase()}|||${album.album.toLowerCase()}`
      const collectionData = collectionInfo[key]

      if (collectionData?.release_year === this.year) {
        discoveries.push({
          ...album,
          releaseYear: this.year,
          isNew: true
        })
      }
    }

    return discoveries.slice(0, 10)
  }

  /**
   * Generate artist sprint - how listening to top 5 artists evolved monthly
   * Similar to Spotify's "Artist Sprint" feature
   */
  getArtistSprint() {
    const top5Artists = this.data.topArtists.slice(0, 5)
    const sprint = []

    for (const artist of top5Artists) {
      const monthlyPlays = this.data.monthlyBreakdown.map(month => {
        const artistInMonth = Object.entries(month.topArtist || {})
        // Find plays for this artist in this month from the raw data
        const monthData = this.data.monthlyBreakdown.find(m => m.month === month.month)
        // This is a simplified version - ideally we'd have full monthly data
        return {
          month: month.month,
          plays: monthData?.topArtist?.name === artist.name ? monthData.topArtist.playcount : 0
        }
      })

      // Find peak month for this artist
      const sortedMonths = [...monthlyPlays].sort((a, b) => b.plays - a.plays)
      const peakMonth = sortedMonths[0]

      sprint.push({
        artist: artist.name,
        totalPlays: artist.playcount,
        monthlyPlays,
        peakMonth: peakMonth.month,
        peakPlays: peakMonth.plays
      })
    }

    return sprint
  }

  /**
   * Generate all wrapped insights
   */
  getAllInsights(collectionInfo = {}) {
    return {
      year: this.year,
      basicStats: this.getBasicStats(),
      artistOfTheYear: this.getArtistOfTheYear(),
      albumOfTheYear: this.getAlbumOfTheYear(),
      listeningPatterns: this.getListeningPatterns(),
      listeningAge: this.getListeningAge(collectionInfo),
      hiddenGems: this.getHiddenGems(),
      genreBreakdown: this.getGenreBreakdown(collectionInfo),
      newDiscoveries: this.getNewDiscoveries(collectionInfo),
      artistSprint: this.getArtistSprint()
    }
  }

  // Helper methods for generating descriptions

  generateArtistDescription(artist, percentage, dominantMonths) {
    if (dominantMonths.length >= 6) {
      return `${artist.name} was your constant companion in ${this.year}, dominating ${dominantMonths.length} months of your listening.`
    } else if (dominantMonths.length >= 3) {
      return `${artist.name} made their mark across ${dominantMonths.join(', ')}, making up ${percentage}% of your year.`
    } else {
      return `${artist.name} earned the top spot with ${artist.playcount.toLocaleString()} plays (${percentage}% of your year).`
    }
  }

  generateAlbumDescription(album, percentage, dominantMonths) {
    if (dominantMonths.length >= 3) {
      return `"${album.album}" by ${album.artist} was on heavy rotation, especially in ${dominantMonths.slice(0, 3).join(', ')}.`
    } else {
      return `"${album.album}" by ${album.artist} topped your charts with ${album.playcount.toLocaleString()} plays.`
    }
  }

  generateDecadeDescription(decade) {
    const descriptions = {
      1950: 'The birth of rock and roll speaks to you.',
      1960: 'The British Invasion and psychedelia define your sound.',
      1970: 'Classic rock, punk, and disco resonate with your soul.',
      1980: 'Synths, new wave, and MTV classics are your jam.',
      1990: 'Grunge, Britpop, and alternative shaped your taste.',
      2000: 'The digital revolution and indie explosion call to you.',
      2010: 'Streaming era sounds and genre-bending define you.',
      2020: 'You\'re living in the present with the latest releases.'
    }

    return descriptions[decade] || `The ${decade}s speak to your musical soul.`
  }
}
