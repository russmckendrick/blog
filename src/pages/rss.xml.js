import { getCollection, render } from 'astro:content';
import rss from '@astrojs/rss';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { SITE_DESCRIPTION, SITE_TITLE } from '../consts';
import { createUrlFriendlySlug } from '../utils/url';
import sanitizeHtml from 'sanitize-html';
import {
	AppleMusic,
	Audio,
	ChatMessage,
	Giphy,
	Img,
	LightGallery,
	Reddit,
	YouTube,
	Instagram,
	LinkPreview,
	Callout,
	GeneralCallout,
	InfoCallout,
	NoteCallout,
	TipCallout,
	ImportantCallout,
	CautionCallout,
	WarningCallout,
} from '../components/embeds';

export async function GET(context) {
	const posts = (await getCollection('blog'))
		.filter(post => import.meta.env.DEV || !post.data.draft) // Exclude drafts in production
		.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf()) // Sort by date, newest first
		.slice(0, 50); // Limit to 50 most recent posts for feed performance

	// Set up AstroContainer for rendering MDX content
	const container = await AstroContainer.create();

	// Load the MDX renderer
	await container.addServerRenderer({
		name: '@astrojs/mdx',
		renderer: (await import('@astrojs/mdx/server.js')).default,
	});

	// Components to be available globally in MDX (same as [slug].astro)
	const components = {
		AppleMusic,
		Audio,
		ChatMessage,
		Giphy,
		Img,
		LightGallery,
		Reddit,
		YouTube,
		Instagram,
		LinkPreview,
		Callout,
		GeneralCallout,
		InfoCallout,
		NoteCallout,
		TipCallout,
		ImportantCallout,
		CautionCallout,
		WarningCallout,
	};

	// Render all posts and prepare RSS items
	const rssItems = await Promise.all(posts.map(async (post) => {
		const date = post.data.pubDate;
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		const slug = createUrlFriendlySlug(post.data.title);
		const link = `/${year}/${month}/${day}/${slug}/`;

		// Render the MDX content to HTML
		const { Content } = await render(post);
		const html = await container.renderToString(Content, {
			props: { components },
		});

		// Sanitize HTML to ensure valid RSS/XML
		const sanitizedHtml = sanitizeHtml(html, {
			allowedTags: sanitizeHtml.defaults.allowedTags.concat([
				'img', 'figure', 'figcaption', 'iframe', 'video', 'audio', 'source',
				'pre', 'code', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'
			]),
			allowedAttributes: {
				...sanitizeHtml.defaults.allowedAttributes,
				img: ['src', 'alt', 'title', 'width', 'height', 'loading', 'decoding'],
				a: ['href', 'name', 'target', 'rel', 'title'],
				iframe: ['src', 'width', 'height', 'frameborder', 'allowfullscreen', 'title'],
				video: ['src', 'width', 'height', 'controls', 'poster'],
				audio: ['src', 'controls'],
				source: ['src', 'type'],
				code: ['class'],
				pre: ['class'],
				div: ['class'],
			},
			allowedSchemes: ['http', 'https', 'mailto'],
		});

		return {
			title: post.data.title,
			description: post.data.description,
			pubDate: post.data.pubDate,
			link: link,
			content: sanitizedHtml,
			categories: post.data.tags || [],
			author: 'web.site@mckendrick.email (Russ McKendrick)',
			// Use full URL as GUID for uniqueness
			customData: `<guid isPermaLink="true">${context.site}${link}</guid>`,
		};
	}));

	return rss({
		title: SITE_TITLE,
		description: SITE_DESCRIPTION,
		site: context.site,
		items: rssItems,
		customData: `<language>en-gb</language>
		<copyright>Copyright ${new Date().getFullYear()} Russ McKendrick</copyright>
		<managingEditor>web.site@mckendrick.email (Russ McKendrick)</managingEditor>
		<webMaster>web.site@mckendrick.email (Russ McKendrick)</webMaster>`,
		xmlns: {
			atom: 'http://www.w3.org/2005/Atom',
		},
	});
}
