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
			name: 'Inter',
			cssVariable: '--font-inter',
			fallbacks: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
			options: {
				variants: [
					{ weight: '100 900', style: 'normal', src: ['./src/assets/fonts/inter-variable-latin.woff2'] }
				]
			}
		},
		{
			provider: fontProviders.local(),
			name: 'Plus Jakarta Sans',
			cssVariable: '--font-plus-jakarta',
			fallbacks: ['Inter', 'system-ui', 'sans-serif'],
			options: {
				variants: [
					{ weight: 600, style: 'normal', src: ['./src/assets/fonts/plus-jakarta-sans-600-latin.woff2'] },
					{ weight: 700, style: 'normal', src: ['./src/assets/fonts/plus-jakarta-sans-700-latin.woff2'] },
					{ weight: 800, style: 'normal', src: ['./src/assets/fonts/plus-jakarta-sans-800-latin.woff2'] }
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
		},
		{
			provider: fontProviders.local(),
			name: 'Crimson Pro',
			cssVariable: '--font-crimson',
			fallbacks: ['Georgia', 'Times New Roman', 'serif'],
			options: {
				variants: [
					{ weight: 400, style: 'normal', src: ['./src/assets/fonts/crimson-pro-400-latin.woff2'] },
					{ weight: 500, style: 'normal', src: ['./src/assets/fonts/crimson-pro-500-latin.woff2'] },
					{ weight: 600, style: 'normal', src: ['./src/assets/fonts/crimson-pro-600-latin.woff2'] },
					{ weight: 400, style: 'italic', src: ['./src/assets/fonts/crimson-pro-400-italic-latin.woff2'] },
					{ weight: 500, style: 'italic', src: ['./src/assets/fonts/crimson-pro-500-italic-latin.woff2'] }
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
			themes: ['github-dark', 'github-light'],
			themeCssSelector: (theme) => `[data-theme='${theme.type}']`,
			styleOverrides: {
				borderRadius: '0.5rem',
				codeFontFamily: 'IBM Plex Mono, ui-monospace, Consolas, monospace',
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
			// Optimize module preloading to reduce critical request chains
			modulePreload: {
				polyfill: false, // Modern browsers support ES modules, no polyfill needed
				resolveDependencies: (_filename, deps) => {
					// Preload all dependencies to avoid chained requests
					return deps;
				}
			},
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
