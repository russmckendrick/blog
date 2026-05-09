import { getCollection } from 'astro:content'
import rss from '@astrojs/rss'
import { SITE_TITLE } from '../../../consts'
import { createUrlFriendlySlug } from '../../../utils/url'

function normalizeTagSlug(slug) {
  return slug.toLowerCase().replace(/\s+/g, '-')
}

export async function getStaticPaths() {
  const posts = (await getCollection('blog')).filter(
    (post) => import.meta.env.DEV || !post.data.draft
  )
  const allTags = new Set()
  for (const post of posts) {
    for (const tag of post.data.tags || []) {
      allTags.add(normalizeTagSlug(tag))
    }
  }
  return Array.from(allTags).map((tag) => ({ params: { tag } }))
}

export async function GET(context) {
  const { tag } = context.params
  const posts = (await getCollection('blog'))
    .filter((post) => import.meta.env.DEV || !post.data.draft)
    .filter((post) =>
      (post.data.tags || []).map((t) => normalizeTagSlug(t)).includes(tag)
    )
    .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())
    .slice(0, 30)

  const items = posts.map((post) => {
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
    title: `${SITE_TITLE} - #${tag}`,
    description: `Posts tagged ${tag} on ${SITE_TITLE}.`,
    site: context.site,
    items,
    customData: `<language>en-gb</language>`
  })
}
