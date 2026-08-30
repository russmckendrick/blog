import assert from 'node:assert/strict'
import test from 'node:test'
import { processAlbumData, processArtistData } from '../generate-tunes-post.js'
import { formatReleaseDetails } from '../lib/release-details.js'

// A stand-in for CollectionManager's `info` map. Keys are "<artist>|||<album>" for releases
// and "<artist>" for artists, both normalised (lowercased, "&" -> "and").
const collectionInfo = {
  'various|||empire records - the soundtrack': {
    album_link: 'https://www.russ.fm/album/empire-records-the-soundtrack-38185662/',
    album_image: 'https://assets.russ.fm/album/empire-records/hi-res.jpg'
  },
  'various|||electronic': { album_link: 'https://example.test/va-electronic/' },
  'electronic|||electronic': { album_link: 'https://example.test/electronic/' },
  'pink floyd|||the wall': { album_link: 'https://example.test/the-wall/' }
}

const row = (artist, name, playcount) => ({
  artist: { '#text': artist },
  name,
  playcount: String(playcount)
})

const chart = albums => ({ weeklyalbumchart: { album: albums } })

const EMPIRE = 'Empire Records - The Soundtrack'
const TRACK_ARTISTS = [
  'Ape Hangers', 'Better Than Ezra', 'Coyote Shivers', 'Cracker', 'Drill',
  'Edwyn Collins', 'Evan Dando', 'Gin Blossoms', 'Lustre', 'Please',
  'The Cranberries', 'The Innocence Mission', 'The Martinis', 'The Meices'
]

test('folds a compilation scrobbled as one row per track artist into a single entry', () => {
  const { topAlbums: result } = processAlbumData(
    chart(TRACK_ARTISTS.map(artist => row(artist, EMPIRE, 1))),
    collectionInfo,
    20
  )

  assert.equal(result.length, 1, 'one compilation must not produce one section per track')
  const [[artist, album], plays] = result[0]
  assert.equal(artist, 'Various Artists')
  assert.equal(album, EMPIRE)
  assert.equal(plays, 14, 'plays from every track artist are summed')
})

test('merges an explicit Various Artists row with track-artist rows without duplicating', () => {
  const { topAlbums: result } = processAlbumData(
    chart([
      row('Various Artists', EMPIRE, 4),
      row('Cracker', EMPIRE, 1),
      row('Gin Blossoms', EMPIRE, 1)
    ]),
    collectionInfo,
    20
  )

  assert.equal(result.length, 1)
  assert.deepEqual(result[0], [['Various Artists', EMPIRE], 6])
})

test('never re-credits a real artist album that shares a compilation title', () => {
  const { topAlbums: result } = processAlbumData(
    chart([row('Electronic', 'Electronic', 8), row('Some Unknown Act', 'Electronic', 3)]),
    collectionInfo,
    20
  )

  const byArtist = Object.fromEntries(result.map(([[artist], plays]) => [artist, plays]))
  assert.equal(byArtist['Electronic'], 8, 'the artist who owns the album keeps it')
  assert.equal(byArtist['Various Artists'], 3, 'only the unmatched row folds to the compilation')
})

test('still merges a genuine split album on artist dominance', () => {
  const { topAlbums: result } = processAlbumData(
    chart([row('Pink Floyd', 'The Wall', 9), row('Pink Floyd feat. Someone', 'The Wall', 1)]),
    collectionInfo,
    20
  )

  assert.deepEqual(result, [[['Pink Floyd', 'The Wall'], 10]])
})

test('degrades to the previous behaviour when no collection data is available', () => {
  const albums = TRACK_ARTISTS.map(artist => row(artist, EMPIRE, 1))
  assert.equal(processAlbumData(chart(albums), null, 20).topAlbums.length, TRACK_ARTISTS.length)
})

test('release details name a performer per track only for compilations', () => {
  const compilation = formatReleaseDetails(
    { release_name: EMPIRE, release_artist: 'Various', labels: ['A&M', 'A&M'] },
    { tracklist: [{ position: 'A1', title: 'Til I Hear It From You', artists: [{ name: 'Gin Blossoms' }] }] }
  )
  assert.match(compilation, /A1\. Gin Blossoms - Til I Hear It From You/)
  assert.match(compilation, /- Labels: A&M$/m, 'duplicated labels are collapsed')

  const singleArtist = formatReleaseDetails(
    { release_name: 'Deadwing', release_artist: 'Porcupine Tree' },
    { tracklist: [{ position: 'A1', title: 'Deadwing', duration: '9:46', artists: [] }] }
  )
  assert.match(singleArtist, /A1\. Deadwing \(9:46\)/)
  assert.doesNotMatch(singleArtist, /Porcupine Tree - Deadwing/)
})

test('caps a long tracklist rather than swamping the prompt', () => {
  const tracklist = Array.from({ length: 51 }, (_, i) => ({ position: `${i + 1}`, title: `Track ${i + 1}`, artists: [] }))
  const block = formatReleaseDetails({ release_name: 'Box Set' }, { tracklist })
  assert.match(block, /\.\.\.and 11 more tracks/)
})

test('discounts artist plays that came only from a folded compilation', () => {
  const albums = chart([
    ...TRACK_ARTISTS.map(artist => row(artist, EMPIRE, 1)),
    row('Cracker', 'Kerosene Hat', 4)
  ])
  const { compilationArtistPlays } = processAlbumData(albums, collectionInfo, 20)

  const artistChart = {
    weeklyartistchart: {
      artist: [
        { name: 'XTC', playcount: '12' },
        // Cracker: 4 from their own LP plus 1 from the soundtrack
        { name: 'Cracker', playcount: '5' },
        { name: 'Gin Blossoms', playcount: '1' },
        { name: 'Ape Hangers', playcount: '1' }
      ]
    }
  }

  const result = processArtistData(artistChart, compilationArtistPlays, 20)
  const byName = Object.fromEntries(result)

  assert.equal(byName['XTC'], 12, 'unrelated artists are untouched')
  assert.equal(byName['Cracker'], 4, 'keeps the plays earned outside the compilation')
  assert.equal(byName['Gin Blossoms'], undefined, 'compilation-only artists are dropped')
  assert.equal(byName['Ape Hangers'], undefined)
})

test('leaves the artist chart untouched when nothing was folded', () => {
  const artistChart = { weeklyartistchart: { artist: [{ name: 'XTC', playcount: '12' }] } }
  assert.deepEqual(processArtistData(artistChart, new Map(), 20), [['XTC', 12]])
  assert.deepEqual(processArtistData(artistChart, null, 20), [['XTC', 12]])
})
