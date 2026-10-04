import { getCollection } from 'astro:content'
import rss from '@astrojs/rss'
import { SITE_TITLE } from '../../consts'
import { createUrlFriendlySlug } from '../../utils/url'
import { getCFImageUrl } from '../../utils/cloudflare-images'
import { getTuneCovers } from '../../utils/tune-covers'

// Record covers per week in the feed - matches the lead row on /tunes/
const ALBUMS_PER_WEEK = 8

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export async function GET(context) {
  const tunes = (await getCollection('tunes'))
    .filter((post) => import.meta.env.DEV || !post.data.draft)
    .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())
    .slice(0, 50)

  const absolute = (value) => new URL(value, context.site).toString()

  const items = tunes.map((post) => {
    const date = post.data.pubDate
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const slug = createUrlFriendlySlug(post.data.title)
    const link = `/${year}/${month}/${day}/${slug}/`

    // Same blog: namespace as the main feed, so readers like russ.social can
    // show the week's cover and records without scraping /tunes/.
    const coverXml = post.data.heroImage
      ? `\n<blog:coverImage>${escapeXml(absolute(getCFImageUrl(post.data.heroImage, { width: 1600, quality: 80, format: 'jpeg', fit: 'scale-down' })))}</blog:coverImage>`
      : ''
    const ogImageXml = `\n<blog:ogImage>${escapeXml(absolute(`${year}/${month}/${day}/${slug}-og.png`))}</blog:ogImage>`
    const albumsXml = getTuneCovers(post, ALBUMS_PER_WEEK)
      .map((cover) => {
        const image = absolute(getCFImageUrl(cover.src, { width: 320, quality: 70 }))
        return `\n<blog:album image="${escapeXml(image)}">${escapeXml(cover.alt)}</blog:album>`
      })
      .join('')

    return {
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link,
      categories: post.data.tags || [],
      author: 'web.site@mckendrick.email (Russ McKendrick)',
      customData: `<guid isPermaLink="true">${context.site}${link.replace(/^\//, '')}</guid>${coverXml}${ogImageXml}${albumsXml}`
    }
  })

  return rss({
    title: `${SITE_TITLE} - Tunes`,
    description: 'Weekly Listened to This Week posts - albums, artists, and what was on the turntable.',
    site: context.site,
    items,
    customData: `<language>en-gb</language>`,
    xmlns: {
      blog: 'https://www.russ.cloud/rss/ns'
    }
  })
}
