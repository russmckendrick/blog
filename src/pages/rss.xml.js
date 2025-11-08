import { getCollection } from 'astro:content';
import rss from '@astrojs/rss';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { SITE_DESCRIPTION, SITE_TITLE } from '../consts';
import { createUrlFriendlySlug } from '../utils/url';
import sanitizeHtml from 'sanitize-html';

export async function GET(context) {
	const posts = (await getCollection('blog'))
		.filter(post => import.meta.env.DEV || !post.data.draft) // Exclude drafts in production
		.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf()) // Sort by date, newest first
		.slice(0, 50); // Limit to 50 most recent posts for feed performance

	const container = await AstroContainer.create();

	// Render all posts and prepare RSS items
	const rssItems = await Promise.all(
		posts.map(async (post) => {
			const date = post.data.pubDate;
			const year = date.getFullYear();
			const month = String(date.getMonth() + 1).padStart(2, '0');
			const day = String(date.getDate()).padStart(2, '0');
			const slug = createUrlFriendlySlug(post.data.title);
			const link = `/${year}/${month}/${day}/${slug}/`;

			// Render the MDX content to HTML string
			const { Content } = await post.render();
			const html = await container.renderToString(Content);

			// Sanitize HTML to ensure valid RSS/XML
			const sanitizedHtml = sanitizeHtml(html, {
				allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'figure', 'figcaption']),
				allowedAttributes: {
					...sanitizeHtml.defaults.allowedAttributes,
					img: ['src', 'alt', 'title', 'width', 'height'],
					a: ['href', 'name', 'target', 'rel'],
				},
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
		})
	);

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
