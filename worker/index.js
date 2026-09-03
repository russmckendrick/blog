// Cloudflare Worker entry. Static assets are served by the ASSETS binding
// (configured in wrangler.jsonc). This Worker adds four features on top:
//
// 1. Content negotiation for text/markdown, satisfying the "Markdown for
//    Agents" check. Cloudflare's zone-level Markdown for Agents requires Pro+;
//    this gives equivalent behaviour on Free by serving the pre-generated .md
//    twin written by scripts/generate-llms-markdown.js.
// 2. A first-party proxy for Plausible Analytics, so both the tracking script
//    and the event endpoint are served from this origin instead of
//    plausible.io. See the Plausible section of docs/architecture/seo-implementation.md.
// 3. A 301 from the apex domain to the www canonical host.
// 4. `charset=utf-8` on HTML responses, which the assets binding omits.
// 5. A 301 from the retired /YYYY/page/ URL to the /YYYY/ year hub.

// --- Canonical host --------------------------------------------------------
// The zone answers on both russ.cloud and www.russ.cloud, and every canonical
// link, sitemap entry and og:url points at www. Without a redirect the apex
// serves a full duplicate of the site on every URL, so send it to www with a
// 301 that keeps the path and query. Matched exactly, never by suffix, so
// *.workers.dev preview deployments are left alone.
const APEX_HOST = 'russ.cloud'
const CANONICAL_HOST = 'www.russ.cloud'

function redirectToCanonicalHost(url) {
	const target = new URL(url)
	target.hostname = CANONICAL_HOST
	return Response.redirect(target.toString(), 301)
}

// --- Retired year pagination URL -------------------------------------------
// The year archive used to emit /2024/page/ as page 1, a duplicate of the
// /2024/ hub with its own canonical, and Google indexed both. Pages 2+ still
// live at /2024/page/N/; only the bare form is gone. A regex is used rather
// than a _redirects rule because placeholders there cannot be limited to
// digits, and /:x/page/ would also catch real routes like /tunes/page/.
const YEAR_PAGE_ONE = /^\/(\d{4})\/page\/?$/

function redirectYearPageOne(url) {
	const match = url.pathname.match(YEAR_PAGE_ONE)
	if (!match) return null
	const target = new URL(`/${match[1]}/`, url)
	target.search = url.search
	return Response.redirect(target.toString(), 301)
}

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

// The assets binding sends bare `Content-Type: text/html` for pages. The
// document declares <meta charset="utf-8">, but a charset in the header is
// authoritative and cheaper for clients than sniffing the first bytes.
async function serveAsset(request, env) {
	const res = await env.ASSETS.fetch(request)
	const type = res.headers.get('Content-Type') || ''
	if (!type.startsWith('text/html') || type.includes('charset')) return res

	const headers = new Headers(res.headers)
	headers.set('Content-Type', 'text/html; charset=utf-8')
	return new Response(res.body, { status: res.status, statusText: res.statusText, headers })
}

export default {
	async fetch(request, env) {
		const url = new URL(request.url)

		if (url.hostname === APEX_HOST) {
			return redirectToCanonicalHost(url)
		}

		const yearRedirect = redirectYearPageOne(url)
		if (yearRedirect) return yearRedirect

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
		return serveAsset(request, env)
	},
}
