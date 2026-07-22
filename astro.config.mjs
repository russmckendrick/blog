// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';
import expressiveCode from 'astro-expressive-code';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, fontProviders } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import astroIcon from 'astro-icon';
import { rehypeExternalLinks } from './src/utils/rehype-external-links.ts';
import { rehypeGlossaryLinks } from './src/utils/rehype-glossary-links.ts';
import { getGlossaryTermMap } from './src/utils/glossary-terms.ts';
import { getPostModifiedDateMap } from './src/utils/post-dates.ts';
import { expressiveCodeA11yPlugin } from './src/utils/expressive-code-a11y-plugin.ts';
import pagefind from 'astro-pagefind';

const glossaryTermMap = getGlossaryTermMap();
const postModifiedDateMap = getPostModifiedDateMap();

// https://astro.build/config
export default defineConfig({
	site: 'https://www.russ.cloud/',
	fonts: [
		{
			provider: fontProviders.local(),
			name: 'Source Serif 4',
			cssVariable: '--font-source-serif',
			fallbacks: ['Georgia', 'Times New Roman', 'serif'],
			options: {
				variants: [
					// Variable fonts instanced to wght 400-800 (fonttools varLib.instancer):
					// the site uses 400-700 body/headings and 800 on book/glossary h1s,
					// so the unused 200-399/801-900 ranges were dead weight (~30% smaller)
					{ weight: '400 800', style: 'normal', src: ['./src/assets/fonts/source-serif-4-variable-latin.woff2'] },
					{ weight: '400 800', style: 'italic', src: ['./src/assets/fonts/source-serif-4-variable-italic-latin.woff2'] }
				]
			}
		},
		{
			provider: fontProviders.local(),
			name: 'IBM Plex Mono',
			cssVariable: '--font-ibm-plex-mono',
			fallbacks: ['ui-monospace', 'Cascadia Code', 'Consolas', 'Courier New', 'monospace'],
			options: {
				variants: [
					{ weight: 400, style: 'normal', src: ['./src/assets/fonts/ibm-plex-mono-400-latin.woff2'] },
					{ weight: 500, style: 'normal', src: ['./src/assets/fonts/ibm-plex-mono-500-latin.woff2'] },
					{ weight: 600, style: 'normal', src: ['./src/assets/fonts/ibm-plex-mono-600-latin.woff2'] }
				]
			}
		}
	],
	markdown: {
		syntaxHighlight: false,
		processor: unified({
			rehypePlugins: [
				rehypeExternalLinks,
				[rehypeGlossaryLinks, { termMap: glossaryTermMap }],
			],
		}),
	},
	integrations: [
		react(),
		expressiveCode({
			// catppuccin-macchiato is never activated page-wide: it exists as a
			// third token layer (--2) that terminal frames read in global.css so
			// terminals always render as a dark slate-navy window (matching the
			// author's actual terminal profile) in both site themes.
			themes: ['github-dark', 'github-light', 'catppuccin-macchiato'],
			themeCssSelector: (theme) =>
				theme.name === 'catppuccin-macchiato'
					? "[data-theme='terminal-profile-only']"
					: `[data-theme='${theme.type}']`,
			styleOverrides: {
				borderRadius: '0',
				borderColor: 'var(--color-outline-variant)',
				codeFontFamily: 'IBM Plex Mono, ui-monospace, Consolas, monospace',
				uiFontFamily: 'IBM Plex Mono, ui-monospace, Consolas, monospace',
				codeBackground: 'var(--color-surface-container-lowest)',
				frames: {
					editorBackground: 'var(--color-surface-container-lowest)',
					editorTabBarBackground: 'var(--color-surface-container-low)',
					// Terminal frames are fully restyled as macOS windows in
					// global.css (see "Terminal frames"); no config values needed.
					frameBoxShadowCssValue: 'none',
				},
			},
			plugins: [expressiveCodeA11yPlugin()],
		}),
		mdx(),
		astroIcon(),
		pagefind(),
		sitemap({
			filter: (page) => !page.includes('/draft/') && !page.includes('/avatars/'),
			changefreq: 'weekly',
			priority: 0.5,
			serialize: (item) => {
				// Prefer the post's actual modified date (lastModified/updatedDate/pubDate)
				// so revised posts signal freshness to crawlers.
				const pathname = new URL(item.url).pathname;
				if (postModifiedDateMap[pathname]) {
					item.lastmod = postModifiedDateMap[pathname];
					return item;
				}
				// Fallback: extract publish date from URL pattern /YYYY/MM/DD/
				const match = item.url.match(/\/(\d{4})\/(\d{2})\/(\d{2})\//);
				if (match) {
					const [, year, month, day] = match;
					item.lastmod = new Date(`${year}-${month}-${day}`).toISOString();
				}
				return item;
			}
		})
	],
	image: {
		// Use passthrough service - no build-time image processing
		// Images are optimized on-demand by Cloudflare Image Transformations
		service: {
			entrypoint: 'astro/assets/services/noop'
		},
		remotePatterns: [{ protocol: "https" }],
	},
	vite: {
		plugins: [tailwindcss()],
		build: {
			// Note: dynamic imports (the lightgallery chunks, fetched on first
			// interaction) are always wrapped in Vite's preload-helper on client
			// builds — Vite 8 injects it unconditionally and no config removes it.
			// The helper's dep arrays are empty here, so the wrapper is inert; the
			// BlogPost.js -> preload-helper.js hop in PageSpeed's dependency tree
			// is a 1.5 KiB framework floor, not a tuning opportunity.
			// Optimize chunking strategy
			rollupOptions: {
				output: {
					// Group small vendor chunks together to reduce requests
					manualChunks: (id) => {
						// Keep Expressive Code together
						if (id.includes('expressive-code')) {
							return 'expressive-code';
						}
					}
				}
			},
			chunkSizeWarningLimit: 1000,
		}
	},
	build: {
		format: 'directory',
		inlineStylesheets: 'always'  // Inline all CSS to eliminate render-blocking requests
	}
});
