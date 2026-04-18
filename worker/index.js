// Cloudflare Worker entry. Static assets are served by the ASSETS binding
// (configured in wrangler.jsonc). This Worker only exists to add one feature:
// content negotiation for text/markdown, satisfying the "Markdown for Agents"
// check. Cloudflare's zone-level Markdown for Agents requires Pro+; this gives
// equivalent behaviour on Free by serving the pre-generated .md twin written
// by scripts/generate-llms-markdown.js.

function wantsMarkdown(request) {
	const accept = request.headers.get('Accept') || ''
	// Match only when text/markdown is explicitly present in the Accept header.
	// Browsers send text/html,application/xhtml+xml,... — never text/markdown.
	return /(^|,)\s*text\/markdown(\s*;|\s*,|\s*$)/i.test(accept)
}

function hasFileExtension(pathname) {
	const last = pathname.split('/').pop() || ''
	return last.includes('.')
}

async function serveMarkdown(url, env, request) {
	let target

	if (url.pathname === '/' || url.pathname === '') {
		target = new URL('/llms.txt', url)
	} else if (!hasFileExtension(url.pathname)) {
		const base = url.pathname.endsWith('/') ? url.pathname : url.pathname + '/'
		target = new URL(base + 'index.md', url)
	} else {
		return null
	}

	const res = await env.ASSETS.fetch(new Request(target, { method: 'GET', headers: request.headers }))
	if (!res.ok) return null

	const headers = new Headers(res.headers)
	headers.set('Content-Type', 'text/markdown; charset=utf-8')
	headers.set('Vary', 'Accept')
	return new Response(res.body, { status: 200, headers })
}

export default {
	async fetch(request, env) {
		if (request.method === 'GET' && wantsMarkdown(request)) {
			const url = new URL(request.url)
			const md = await serveMarkdown(url, env, request)
			if (md) return md
		}
		return env.ASSETS.fetch(request)
	},
}
