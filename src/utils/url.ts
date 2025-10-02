export function createUrlFriendlySlug(title: string): string {
	return title
		.toLowerCase()
		.replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
		.replace(/\s+/g, '-') // Replace spaces with hyphens
		.replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
		.trim()
		.replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

export function getPostUrl(date: Date, title: string): string {
	const year = date.getFullYear().toString();
	const month = (date.getMonth() + 1).toString().padStart(2, '0');
	const day = date.getDate().toString().padStart(2, '0');
	const slug = createUrlFriendlySlug(title);

	return `/${year}/${month}/${day}/${slug}/`;
}