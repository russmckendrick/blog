import type {
  BlogPosting,
  Person,
  Organization,
  BreadcrumbList,
  FAQPage,
  HowTo,
  MusicRecording,
  MusicAlbum,
  CollectionPage,
  DefinedTerm,
  WithContext
} from 'schema-dts'
import { SITE_TITLE, AUTHOR_NAME, AUTHOR_HOMEPAGE, SOCIAL_LINKS } from '../consts'

/**
 * Creates a Person schema for the author
 */
export function createPersonSchema(siteUrl: string, avatarPath?: string): WithContext<Person> {
  const socialUrls = SOCIAL_LINKS.map(link => link.url)
  const defaultAvatar = '/images/avatar.svg'
  const avatarUrl = avatarPath || defaultAvatar

  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: AUTHOR_NAME,
    url: AUTHOR_HOMEPAGE,
    image: new URL(avatarUrl, siteUrl).toString(),
    sameAs: socialUrls,
    knowsAbout: ['DevOps', 'Cloud Computing', 'Docker', 'Kubernetes', 'Azure', 'AWS', 'Linux', 'Automation']
  }
}

/**
 * Creates an Organization schema for the publisher
 */
export function createOrganizationSchema(siteUrl: string): WithContext<Organization> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_TITLE,
    url: siteUrl,
    logo: {
      '@type': 'ImageObject',
      url: new URL('/images/logo.svg', siteUrl).toString()
    },
    sameAs: SOCIAL_LINKS.map(link => link.url)
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
  siteUrl
}: BlogPostingSchemaProps): WithContext<BlogPosting> {
  const authorImageUrl = authorAvatar
    ? new URL(authorAvatar, siteUrl).toString()
    : new URL('/images/avatar.svg', siteUrl).toString()

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    description: description,
    image: image,
    datePublished: datePublished.toISOString(),
    dateModified: (dateModified || datePublished).toISOString(),
    author: {
      '@type': 'Person',
      name: author,
      url: AUTHOR_HOMEPAGE,
      image: authorImageUrl
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_TITLE,
      logo: {
        '@type': 'ImageObject',
        url: new URL('/images/logo.svg', siteUrl).toString()
      }
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url
    },
    keywords: keywords.join(', ')
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
  _url,
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
