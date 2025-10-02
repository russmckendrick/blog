import { getCollection } from 'astro:content';
import rss from '@astrojs/rss';
import { SITE_DESCRIPTION, SITE_TITLE } from '../consts';
import { createUrlFriendlySlug } from '../utils/url';

export async function GET(context) {
	const posts = await getCollection('blog');
	return rss({
		title: SITE_TITLE,
		description: SITE_DESCRIPTION,
		site: context.site,
		items: posts.map((post) => {
			const date = post.data.pubDate;
			const year = date.getFullYear();
			const month = String(date.getMonth() + 1).padStart(2, '0');
			const day = String(date.getDate()).padStart(2, '0');
			const slug = createUrlFriendlySlug(post.data.title);

			return {
				...post.data,
				link: `/${year}/${month}/${day}/${slug}/`,
			};
		}),
	});
}
