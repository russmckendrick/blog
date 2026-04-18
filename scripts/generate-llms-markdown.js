#!/usr/bin/env node

// Postbuild: emit a plain-markdown twin of every post at the same URL path
// (dist/YYYY/MM/DD/slug/index.md) plus a root /llms.txt index, so AI agents
// that don't negotiate content types can still fetch markdown directly.

import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import matter from 'gray-matter'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const DIST = path.join(ROOT, 'dist')
const SITE = 'https://www.russ.cloud'

// Mirrors src/utils/url.ts — keep in sync if that changes.
function createUrlFriendlySlug(title) {
	return title
		.toLowerCase()
		.replace(/[^a-z0-9\s-]/g, '')
		.replace(/\s+/g, '-')
		.replace(/-+/g, '-')
		.trim()
		.replace(/^-+|-+$/g, '')
}

function pad(n) {
	return String(n).padStart(2, '0')
}

async function readPosts(dir, collection) {
	const entries = []
	const base = path.join(ROOT, 'src/content', dir)
	let files = []
	try {
		files = await fs.readdir(base)
	} catch {
		return entries
	}
	for (const name of files) {
		if (!/\.(md|mdx)$/.test(name)) continue
		const file = path.join(base, name)
		const stat = await fs.stat(file)
		if (!stat.isFile()) continue
		const raw = await fs.readFile(file, 'utf8')
		const { data, content } = matter(raw)
		if (data.draft) continue
		const dateRaw = data.date || data.pubDate
		if (!dateRaw || !data.title) continue
		const date = new Date(dateRaw)
		if (Number.isNaN(date.valueOf())) continue
		entries.push({
			collection,
			title: String(data.title),
			description: data.description ? String(data.description) : '',
			tags: Array.isArray(data.tags) ? data.tags : [],
			author: data.author ? String(data.author) : 'Russ McKendrick',
			date,
			slug: createUrlFriendlySlug(String(data.title)),
			body: content.trim(),
		})
	}
	return entries
}

function postPath(entry) {
	const y = entry.date.getFullYear().toString()
	const m = pad(entry.date.getMonth() + 1)
	const d = pad(entry.date.getDate())
	return `/${y}/${m}/${d}/${entry.slug}/`
}

function renderMarkdown(entry) {
	const urlPath = postPath(entry)
	const lines = []
	lines.push(`# ${entry.title}`)
	lines.push('')
	if (entry.description) {
		lines.push(`> ${entry.description}`)
		lines.push('')
	}
	const meta = []
	meta.push(`- Canonical: ${SITE}${urlPath}`)
	meta.push(`- Published: ${entry.date.toISOString().slice(0, 10)}`)
	meta.push(`- Author: ${entry.author}`)
	if (entry.tags.length) meta.push(`- Tags: ${entry.tags.join(', ')}`)
	lines.push(meta.join('\n'))
	lines.push('')
	lines.push('---')
	lines.push('')
	lines.push(entry.body)
	lines.push('')
	return lines.join('\n')
}

function renderLlmsTxt(blog, tunes) {
	const lines = []
	lines.push('# russ.cloud')
	lines.push('')
	lines.push('> Technical blog by Russ McKendrick — cloud, DevOps, homelab, automation, and weekly music notes. All content licensed for search, agent answers, and training (see /robots.txt).')
	lines.push('')
	lines.push('Each post below links to a plain-markdown version at `<canonical-url>index.md`. The HTML version lives at the canonical URL.')
	lines.push('')
	lines.push('- Feed: https://www.russ.cloud/rss.xml')
	lines.push('- Sitemap: https://www.russ.cloud/sitemap-index.xml')
	lines.push('- Agent skills: https://www.russ.cloud/.well-known/agent-skills/index.json')
	lines.push('')

	const section = (heading, items) => {
		lines.push(`## ${heading}`)
		lines.push('')
		for (const e of items) {
			const url = `${SITE}${postPath(e)}index.md`
			const desc = e.description ? `: ${e.description}` : ''
			lines.push(`- [${e.title}](${url})${desc}`)
		}
		lines.push('')
	}

	section('Blog posts', blog)
	section('Tunes (weekly music notes)', tunes)
	return lines.join('\n')
}

async function writeFile(filePath, content) {
	await fs.mkdir(path.dirname(filePath), { recursive: true })
	await fs.writeFile(filePath, content, 'utf8')
}

async function main() {
	const [blog, tunes] = await Promise.all([
		readPosts('blog', 'blog'),
		readPosts('tunes', 'tunes'),
	])

	const all = [...blog, ...tunes].sort((a, b) => b.date - a.date)
	const sortedBlog = blog.slice().sort((a, b) => b.date - a.date)
	const sortedTunes = tunes.slice().sort((a, b) => b.date - a.date)

	let written = 0
	for (const entry of all) {
		const urlPath = postPath(entry)
		const outFile = path.join(DIST, urlPath.replace(/^\//, ''), 'index.md')
		await writeFile(outFile, renderMarkdown(entry))
		written++
	}

	await writeFile(path.join(DIST, 'llms.txt'), renderLlmsTxt(sortedBlog, sortedTunes))

	console.log(`[llms-markdown] wrote ${written} post markdown files + llms.txt`)
}

main().catch((err) => {
	console.error('[llms-markdown] failed:', err)
	process.exit(1)
})
