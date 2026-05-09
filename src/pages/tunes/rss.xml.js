import { getCollection } from 'astro:content'
import rss from '@astrojs/rss'
import { SITE_TITLE } from '../../consts'
import { createUrlFriendlySlug } from '../../utils/url'

export async function GET(context) {
  const tunes = (await getCollection('tunes'))
    .filter((post) => import.meta.env.DEV || !post.data.draft)
    .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())
    .slice(0, 50)

  const items = tunes.map((post) => {
    const date = post.data.pubDate
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const slug = createUrlFriendlySlug(post.data.title)
    const link = `/${year}/${month}/${day}/${slug}/`
    return {
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link,
      categories: post.data.tags || [],
      author: 'web.site@mckendrick.email (Russ McKendrick)',
      customData: `<guid isPermaLink="true">${context.site}${link.replace(/^\//, '')}</guid>`
    }
  })

  return rss({
    title: `${SITE_TITLE} - Tunes`,
    description: 'Weekly Listened to This Week posts - albums, artists, and what was on the turntable.',
    site: context.site,
    items,
    customData: `<language>en-gb</language>`
  })
}
