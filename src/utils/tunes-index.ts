// Type-safe accessor for src/data/tunes-index.json.
// The JSON is regenerated on every build by scripts/build-tunes-index.js
// (wired into the `prebuild` script in package.json).

import indexData from '../data/tunes-index.json'

export interface TuneIndexPostRef {
  title: string
  url: string
  date: string
}

export interface TuneIndexArtist {
  slug: string
  name: string
  artistUrl: string | null
  image: string | null
  albumCount: number
  postCount: number
  albums: string[]
  posts: TuneIndexPostRef[]
}

export interface TuneIndexAlbum {
  slug: string
  name: string
  artist: string
  artistSlug: string
  albumUrl: string | null
  artistUrl: string | null
  image: string | null
  posts: TuneIndexPostRef[]
}

export interface TuneIndex {
  generatedAt: string
  totals: { posts: number; artists: number; albums: number }
  artists: TuneIndexArtist[]
  albums: TuneIndexAlbum[]
}

export const tunesIndex = indexData as TuneIndex

export function getArtistBySlug(slug: string): TuneIndexArtist | undefined {
  return tunesIndex.artists.find((artist) => artist.slug === slug)
}

export function getAlbumBySlug(slug: string): TuneIndexAlbum | undefined {
  return tunesIndex.albums.find((album) => album.slug === slug)
}

export function getAlbumsByArtist(artistSlug: string): TuneIndexAlbum[] {
  return tunesIndex.albums.filter((album) => album.artistSlug === artistSlug)
}

export function getArtistTuneUrl(slug: string): string {
  return `/tunes/artist/${slug}/`
}

export function getAlbumTuneUrl(slug: string): string {
  return `/tunes/album/${slug}/`
}
