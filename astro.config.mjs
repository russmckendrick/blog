// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';
import expressiveCode from 'astro-expressive-code';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';
import astroIcon from 'astro-icon';
import { rehypeExternalLinks } from './src/utils/rehype-external-links.ts';
import pagefind from 'astro-pagefind';
import robotsTxt from 'astro-robots-txt';
import compress from '@playform/compress';

// https://astro.build/config
export default defineConfig({
	site: 'https://www.russ.cloud/',
	markdown: {
		syntaxHighlight: false,
		rehypePlugins: [rehypeExternalLinks],
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
		}),
		robotsTxt({
			policy: [
				{
					userAgent: '*',
					allow: '/',
					disallow: ['/draft/', '/_astro/'],
				},
			],
		}),
		compress({
			Logger: 2,
			Image: false, // Disable image optimization - use npm run optimize instead
			Exclude: [
				(file) => file.endsWith('.mp3'),
				(file) => file.endsWith('.wav'),
				(file) => file.endsWith('.ogg'),
				(file) => file.endsWith('.m4a'),
				(file) => file.includes('/pagefind/'),
				(file) => file.endsWith('.wasm'),
				(file) => file.endsWith('.pf_fragment'),
				(file) => file.endsWith('.DS_Store')
			]
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
	},
	build: {
		format: 'directory',
		inlineStylesheets: 'always'  // Inline all CSS to eliminate render-blocking requests
	}
});
