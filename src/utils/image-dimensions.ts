import path from 'node:path'
import sharp from 'sharp'

export interface ImageDimensions {
  width: number
  height: number
}

const dimensionCache = new Map<string, Promise<ImageDimensions | null>>()

function normalizeLocalPath(src: string) {
  const withoutQuery = src.split('?')[0]?.split('#')[0] ?? src
  return withoutQuery.startsWith('/') ? withoutQuery.slice(1) : withoutQuery
}

function isLocalAsset(src: string) {
  return !src.startsWith('http://') && !src.startsWith('https://')
}

async function readDimensions(src: string): Promise<ImageDimensions | null> {
  if (!isLocalAsset(src)) {
    return null
  }

  const normalizedPath = normalizeLocalPath(src)
  const absolutePath = path.resolve(process.cwd(), 'public', normalizedPath)

  try {
    const metadata = await sharp(absolutePath).metadata()
    if (!metadata.width || !metadata.height) {
      return null
    }

    return {
      width: metadata.width,
      height: metadata.height
    }
  } catch {
    return null
  }
}

export function getImageDimensions(src: string) {
  if (!dimensionCache.has(src)) {
    dimensionCache.set(src, readDimensions(src))
  }

  return dimensionCache.get(src)!
}
