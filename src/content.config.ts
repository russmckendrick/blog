import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { AI_AUTHOR } from './consts';

const blog = defineCollection({
	// Load Markdown and MDX files in the `src/content/blog/` directory.
	loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
	// Type-check frontmatter using a schema
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string(),
			// Transform string to Date object - support both pubDate and date
			pubDate: z.coerce.date().optional(),
			date: z.coerce.date().optional(),
			updatedDate: z.coerce.date().optional(),
			lastModified: z.coerce.date().optional(),
			heroImage: image().optional(),
			author: z.string().default('Russ McKendrick'),
			avatar: z.string().optional(),
			tags: z.array(z.string()).default([]),
			draft: z.boolean().default(false),
			summary: z.string().optional(),
			// Hugo-style cover object (now using optimized images)
			cover: z.object({
				image: image().optional(),
				alt: z.string().optional(),
				caption: z.string().optional(),
				hidden: z.boolean().default(false),
				relative: z.boolean().default(true)
			}).optional(),
			// Support both ShowToc and showToc variants
			ShowToc: z.boolean().default(false),
			showToc: z.boolean().default(false),
			TocOpen: z.boolean().default(false)
		})
		.transform((data) => ({
			...data,
			// Normalize date fields - prefer date over pubDate for Hugo compatibility
			pubDate: data.date || data.pubDate || new Date(),
			// Normalize ToC field
			showToc: data.showToc || data.ShowToc
		})),
});

const tunes = defineCollection({
	// Load Markdown and MDX files in the `src/content/tunes/` directory.
	loader: glob({ base: './src/content/tunes', pattern: '**/*.{md,mdx}' }),
	// Type-check frontmatter using a schema
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string(),
			// Transform string to Date object - support both pubDate and date
			pubDate: z.coerce.date().optional(),
			date: z.coerce.date().optional(),
			updatedDate: z.coerce.date().optional(),
			lastModified: z.coerce.date().optional(),
			// Use image() for heroImage to properly handle imported images
			heroImage: image().optional(),
			author: z.string().default(AI_AUTHOR.name),
			avatar: z.string().optional(),
			tags: z.array(z.string()).default([]),
			keywords: z.array(z.string()).default([]),
			draft: z.boolean().default(false),
			// Hugo-style cover object
			cover: z.object({
				image: z.string().optional(),
				alt: z.string().optional(),
				caption: z.string().optional(),
				hidden: z.boolean().default(false),
				relative: z.boolean().default(true)
			}).optional(),
			// Support both ShowToc and showToc variants
			ShowToc: z.boolean().default(false),
			showToc: z.boolean().default(false),
			// Optional album metadata
			album: z.string().optional(),
			artist: z.string().optional(),
			year: z.number().optional(),
			genre: z.array(z.string()).default([])
		})
		.transform((data) => ({
			...data,
			// Normalize date fields - prefer date over pubDate
			pubDate: data.date || data.pubDate || new Date(),
			// Normalize ToC field
			showToc: data.showToc || data.ShowToc
		})),
});

export const collections = { blog, tunes };
