// Cloudflare Worker entry. Static assets are served by the ASSETS binding
// (configured in wrangler.jsonc). This Worker adds two features on top:
//
// 1. Content negotiation for text/markdown, satisfying the "Markdown for
//    Agents" check. Cloudflare's zone-level Markdown for Agents requires Pro+;
//    this gives equivalent behaviour on Free by serving the pre-generated .md
//    twin written by scripts/generate-llms-markdown.js.
// 2. A first-party proxy for Plausible Analytics, so both the tracking script
//    and the event endpoint are served from this origin instead of
//    plausible.io. See the Plausible section of docs/architecture/seo-implementation.md.

// --- Plausible first-party proxy -------------------------------------------
// Proxying only the script would achieve nothing: the script POSTs its events
// to the endpoint, and that request is what content blockers actually drop. So
// both halves are served from here, and BaseHead.astro points `plausible.init`
// at PLAUSIBLE_EVENT_PATH via its `endpoint` option.
const PLAUSIBLE_SCRIPT_PATH = '/js/pa.js'
const PLAUSIBLE_EVENT_PATH = '/api/event'
const PLAUSIBLE_SCRIPT_ORIGIN = 'https://plausible.io/js/pa-1kQuB-9i3FNq-UW5DZix5.js'
const PLAUSIBLE_EVENT_ORIGIN = 'https://plausible.io/api/event'
const PLAUSIBLE_SCRIPT_TTL = 21600 // 6h — long enough to be cheap, short enough to pick up upstream fixes.

async function proxyPlausibleScript() {
	// cacheEverything keeps the upstream fetch to once per POP per TTL rather
	// than once per visitor.
	const upstream = await fetch(PLAUSIBLE_SCRIPT_ORIGIN, {
		cf: { cacheTtl: PLAUSIBLE_SCRIPT_TTL, cacheEverything: true },
	})
	const headers = new Headers(upstream.headers)
	headers.set('Cache-Control', `public, max-age=${PLAUSIBLE_SCRIPT_TTL}`)
	headers.delete('set-cookie')
	return new Response(upstream.body, { status: upstream.status, headers })
}

function proxyPlausibleEvent(request) {
	// Send only what the Events API actually reads. Forwarding the whole header
	// set would hand plausible.io our cookies and Referer for no benefit.
	const headers = new Headers({
		'Content-Type': request.headers.get('Content-Type') || 'text/plain',
		'User-Agent': request.headers.get('User-Agent') || '',
	})

	// A Worker subrequest originates from Cloudflare, not the visitor, so
	// without this Plausible sees an edge IP: its bot filter then drops the
	// event while still answering 202, and the miss is invisible.
	const clientIp = request.headers.get('CF-Connecting-IP')
	if (clientIp) headers.set('X-Forwarded-For', clientIp)

	return fetch(PLAUSIBLE_EVENT_ORIGIN, { method: 'POST', headers, body: request.body })
}

function wantsMarkdown(request) {
	const accept = request.headers.get('Accept') || ''
	// Match only when text/markdown is explicitly present in the Accept header.
	// Browsers send text/html,application/xhtml+xml,... - never text/markdown.
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
		const url = new URL(request.url)

		if (url.pathname === PLAUSIBLE_SCRIPT_PATH && request.method === 'GET') {
			return proxyPlausibleScript()
		}
		if (url.pathname === PLAUSIBLE_EVENT_PATH) {
			if (request.method !== 'POST') return new Response(null, { status: 405 })
			return proxyPlausibleEvent(request)
		}

		if (request.method === 'GET' && wantsMarkdown(request)) {
			const md = await serveMarkdown(url, env, request)
			if (md) return md
		}
		return env.ASSETS.fetch(request)
	},
}
