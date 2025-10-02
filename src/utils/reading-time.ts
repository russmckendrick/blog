const WORDS_PER_MINUTE = 220;

function stripMarkdown(input: string): string {
	return input
		.replace(/```[\s\S]*?```/g, ' ') // fenced code blocks
		.replace(/`[^`]*`/g, ' ') // inline code
		.replace(/<[^>]+>/g, ' ') // HTML tags
		.replace(/\{\{?[\s\S]*?\}?\}/g, ' ') // shortcodes or mdx expressions
		.replace(/\[(.*?)\]\((.*?)\)/g, '$1') // links
		.replace(/![^!]*?\((.*?)\)/g, ' ') // images
		.replace(/[#>*_~\-]+/g, ' '); // markdown tokens
}

export function getReadingTime(body?: string): string | null {
	if (!body) {
		return null;
	}

	const cleaned = stripMarkdown(body);
	const words = cleaned.trim().split(/\s+/).filter(Boolean).length;

	if (!words) {
		return null;
	}

	const minutes = Math.max(1, Math.round(words / WORDS_PER_MINUTE));
	return `${minutes} min`;
}
