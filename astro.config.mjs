// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';
import expressiveCode from 'astro-expressive-code';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';
import astroIcon from 'astro-icon';
import { rehypeExternalLinks } from './src/utils/rehype-external-links.ts';
import { rehypeGlossaryLinks } from './src/utils/rehype-glossary-links.ts';
import { getGlossaryTermMap } from './src/utils/glossary-terms.ts';
import { expressiveCodeA11yPlugin } from './src/utils/expressive-code-a11y-plugin.ts';
import pagefind from 'astro-pagefind';

const glossaryTermMap = getGlossaryTermMap();

// https://astro.build/config
export default defineConfig({
	site: 'https://www.russ.cloud/',
	markdown: {
		syntaxHighlight: false,
		rehypePlugins: [
			rehypeExternalLinks,
			[rehypeGlossaryLinks, { termMap: glossaryTermMap }],
		],
	},
	integrations: [
		react(),
		expressiveCode({
			themes: ['github-dark', 'github-light'],
			themeCssSelector: (theme) => `[data-theme='${theme.type}']`,
			styleOverrides: {
				borderRadius: '0.5rem',
				codeFontFamily: 'Fira Code, Consolas, Monaco, monospace',
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
				// Extract date from URL pattern /YYYY/MM/DD/ and use as lastmod
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
