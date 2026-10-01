import type {
  BlogPosting,
  Person,
  BreadcrumbList,
  FAQPage,
  HowTo,
  MusicRecording,
  MusicAlbum,
  MusicGroup,
  CollectionPage,
  DefinedTerm,
  Book,
  WebSite,
  ProfilePage,
  WithContext
} from 'schema-dts'
import { SITE_TITLE, SITE_NAME, SITE_LANG, AUTHOR_NAME, AUTHOR_HOMEPAGE, SOCIAL_LINKS } from '../consts'
import { absoluteUrl, avatarPng, stripEmoji } from './seo'

/**
 * Stable @ids so every page's JSON-LD points at the same author and site
 * entities instead of redefining them. The person node lives on /about/.
 */
export const personId = (siteUrl: string) => absoluteUrl('/about/#person', siteUrl)
export const websiteId = (siteUrl: string) => absoluteUrl('/#website', siteUrl)

/** Rich results don't take SVG images; this PNG is the author's avatar. */
const AUTHOR_IMAGE = '/images/avatar-192x192.png'

/**
 * Creates a Person schema for the author
 */
export function createPersonSchema(siteUrl: string, avatarPath?: string): WithContext<Person> {
  const socialUrls = SOCIAL_LINKS.map(link => link.url)
  const avatarUrl = avatarPng(avatarPath || AUTHOR_IMAGE)

  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': personId(siteUrl),
    name: AUTHOR_NAME,
    url: AUTHOR_HOMEPAGE,
    image: absoluteUrl(avatarUrl, siteUrl),
    sameAs: socialUrls,
    knowsAbout: ['DevOps', 'Cloud Computing', 'Docker', 'Kubernetes', 'Azure', 'AWS', 'Linux', 'Automation']
  }
}

/**
 * Creates a ProfilePage schema for the about page, with the author as its
 * main entity (Google's preferred markup for a person's profile page).
 */
export function createProfilePageSchema(siteUrl: string, pageUrl: string): WithContext<ProfilePage> {
  // schema-dts types Person as a union with string, so copy it as a plain
  // object to drop the nested @context
  const person = { ...(createPersonSchema(siteUrl) as unknown as Record<string, unknown>) }
  delete person['@context']
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    url: pageUrl,
    inLanguage: SITE_LANG,
    isPartOf: { '@id': websiteId(siteUrl) },
    mainEntity: person as unknown as Person
  }
}

/**
 * Creates a BlogPosting schema for blog posts
 */
interface BlogPostingSchemaProps {
  title: string
  description: string
  url: string
  datePublished: Date
  dateModified?: Date
  image: string
  author: string
  authorAvatar?: string
  keywords?: string[]
  siteUrl: string
  wordCount?: number
  readingTimeMinutes?: number
  articleSection?: string
  inLanguage?: string
}

export function createBlogPostingSchema({
  title,
  description,
  url,
  datePublished,
  dateModified,
  image,
  author,
  authorAvatar,
  keywords = [],
  siteUrl,
  wordCount,
  readingTimeMinutes,
  articleSection,
  inLanguage = 'en-GB'
}: BlogPostingSchemaProps): WithContext<BlogPosting> {
  const authorImageUrl = absoluteUrl(avatarPng(authorAvatar || AUTHOR_IMAGE), siteUrl)

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    description: description,
    image: absoluteUrl(image, siteUrl),
    datePublished: datePublished.toISOString(),
    dateModified: (dateModified || datePublished).toISOString(),
    inLanguage,
    // Tunes posts are credited to the AI author; everything else links to
    // the site-wide person entity.
    author: author === AUTHOR_NAME
      ? { '@type': 'Person', '@id': personId(siteUrl), name: author, url: AUTHOR_HOMEPAGE, image: authorImageUrl }
      : { '@type': 'Person', name: author, image: authorImageUrl },
    // A personal blog: the publisher is the author, not an organisation
    publisher: { '@type': 'Person', '@id': personId(siteUrl), name: AUTHOR_NAME, url: AUTHOR_HOMEPAGE },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url
    },
    isPartOf: {
      '@type': 'Blog',
      // The homepage is the blog's listing; the old /blog/ archive route was
      // an orphaned duplicate of it and now redirects here.
      '@id': new URL('/', siteUrl).toString(),
      name: SITE_NAME
    },
    keywords: keywords.join(', '),
    ...(typeof wordCount === 'number' && wordCount > 0 && { wordCount }),
    ...(typeof readingTimeMinutes === 'number' && readingTimeMinutes > 0 && {
      timeRequired: `PT${readingTimeMinutes}M`
    }),
    ...(articleSection && { articleSection: stripEmoji(articleSection) })
  }
}

/**
 * Creates a BreadcrumbList schema
 */
interface BreadcrumbItem {
  name: string
  url: string
}

export function createBreadcrumbSchema(
  items: BreadcrumbItem[],
  siteUrl: string
): WithContext<BreadcrumbList> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: new URL(item.url, siteUrl).toString()
    }))
  }
}

/**
 * Creates a FAQPage schema for posts with Q&A sections
 */
export interface FAQItem {
  question: string
  answer: string
}

export function createFAQSchema(
  faqs: FAQItem[],
  _url: string
): WithContext<FAQPage> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  }
}

/**
 * Creates a HowTo schema for tutorial posts
 */
export interface HowToStep {
  name: string
  text: string
  image?: string
}

export function createHowToSchema({
  name,
  description,
  steps,
  totalTime,
  image
}: {
  name: string
  description: string
  steps: HowToStep[]
  totalTime?: string
  _url: string
  image?: string
}): WithContext<HowTo> {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name,
    description,
    ...(image && { image }),
    ...(totalTime && { totalTime }),
    step: steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.name,
      text: step.text,
      ...(step.image && { image: step.image })
    }))
  }
}

/**
 * Creates a MusicRecording schema for tunes posts featuring a specific track/album
 */
interface MusicRecordingSchemaProps {
  name: string
  byArtist: string
  inAlbum?: string
  datePublished?: number
  genre?: string[]
  url: string
  image?: string
  description?: string
}

export function createMusicRecordingSchema({
  name,
  byArtist,
  inAlbum,
  datePublished,
  genre = [],
  url,
  image,
  description
}: MusicRecordingSchemaProps): WithContext<MusicRecording> {
  return {
    '@context': 'https://schema.org',
    '@type': 'MusicRecording',
    name,
    byArtist: {
      '@type': 'MusicGroup',
      name: byArtist
    },
    ...(inAlbum && {
      inAlbum: {
        '@type': 'MusicAlbum',
        name: inAlbum,
        ...(byArtist && {
          byArtist: {
            '@type': 'MusicGroup',
            name: byArtist
          }
        }),
        ...(datePublished && { datePublished: String(datePublished) })
      }
    }),
    ...(genre.length > 0 && { genre }),
    ...(image && { image }),
    ...(description && { description }),
    url
  }
}

/**
 * Creates a MusicAlbum schema for album browse pages
 */
interface MusicAlbumSchemaProps {
  name: string
  byArtist: string
  url: string
  numTracks?: number
  datePublished?: string | number
  genre?: string[]
  image?: string
  description?: string
}

export function createMusicAlbumSchema({
  name,
  byArtist,
  url,
  numTracks,
  datePublished,
  genre = [],
  image,
  description
}: MusicAlbumSchemaProps): WithContext<MusicAlbum> {
  return {
    '@context': 'https://schema.org',
    '@type': 'MusicAlbum',
    name,
    byArtist: {
      '@type': 'MusicGroup',
      name: byArtist
    },
    url,
    ...(numTracks && { numTracks }),
    ...(datePublished && { datePublished: String(datePublished) }),
    ...(genre.length > 0 && { genre }),
    ...(image && { image }),
    ...(description && { description })
  }
}

/**
 * Creates a CollectionPage schema for browse / archive / tag pages
 */
interface CollectionPageItem {
  name: string
  url: string
}

interface CollectionPageSchemaProps {
  name: string
  description: string
  url: string
  items?: CollectionPageItem[]
  numberOfItems?: number
}

export function createCollectionPageSchema({
  name,
  description,
  url,
  items = [],
  numberOfItems
}: CollectionPageSchemaProps): WithContext<CollectionPage> {
  const total = numberOfItems ?? items.length
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    description,
    url,
    inLanguage: SITE_LANG,
    isPartOf: { '@id': websiteId(new URL('/', url).toString()) },
    ...(total > 0 && {
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: total,
        itemListElement: items.map((item, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: item.name,
          url: item.url
        }))
      }
    })
  }
}

/**
 * Creates a DefinedTerm schema for glossary entries
 */
interface DefinedTermSchemaProps {
  name: string
  description: string
  url: string
  termCode?: string
  inDefinedTermSet?: string
}

export function createDefinedTermSchema({
  name,
  description,
  url,
  termCode,
  inDefinedTermSet
}: DefinedTermSchemaProps): WithContext<DefinedTerm> {
  return {
    '@context': 'https://schema.org',
    '@type': 'DefinedTerm',
    name,
    description,
    url,
    ...(termCode && { termCode }),
    ...(inDefinedTermSet && {
      inDefinedTermSet: {
        '@type': 'DefinedTermSet',
        name: inDefinedTermSet
      }
    })
  }
}

/**
 * Creates a MusicGroup schema for tunes artist browse pages
 */
interface MusicGroupSchemaProps {
  name: string
  url: string
  image?: string
  sameAs?: string[]
  genre?: string[]
}

export function createMusicGroupSchema({
  name,
  url,
  image,
  sameAs,
  genre = []
}: MusicGroupSchemaProps): WithContext<MusicGroup> {
  return {
    '@context': 'https://schema.org',
    '@type': 'MusicGroup',
    name,
    url,
    ...(image && { image }),
    ...(sameAs && sameAs.length > 0 && { sameAs }),
    ...(genre.length > 0 && { genre })
  }
}

/**
 * Creates a Book schema for the books hub
 */
interface BookSchemaProps {
  name: string
  author: string
  url?: string
  image?: string
  sameAs?: string[]
  publisher?: string
  datePublished?: string
  isbn?: string
}

export function createBookSchema({
  name,
  author,
  url,
  image,
  sameAs,
  publisher,
  datePublished,
  isbn
}: BookSchemaProps): WithContext<Book> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Book',
    name,
    author: {
      '@type': 'Person',
      name: author
    },
    ...(url && { url }),
    ...(image && { image }),
    ...(sameAs && sameAs.length > 0 && { sameAs }),
    ...(publisher && {
      publisher: {
        '@type': 'Organization',
        name: publisher
      }
    }),
    ...(datePublished && { datePublished }),
    ...(isbn && { isbn })
  }
}

/**
 * Creates a WebSite schema with a SearchAction so Google can render a sitelinks
 * search box. Emit on the homepage only.
 */
export function createWebSiteSchema(siteUrl: string): WithContext<WebSite> {
  const normalised = siteUrl.endsWith('/') ? siteUrl : `${siteUrl}/`
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': websiteId(siteUrl),
    name: SITE_NAME,
    alternateName: SITE_TITLE,
    url: normalised,
    inLanguage: SITE_LANG,
    publisher: { '@id': personId(siteUrl) },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${normalised}search/?q={search_term_string}`
      },
      // schema-dts requires a string here; Google parses the named query input.
      'query-input': 'required name=search_term_string'
    } as unknown as WithContext<WebSite>['potentialAction']
  }
}
