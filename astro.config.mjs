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
import swup from '@swup/astro';
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
			filter: (page) => !page.includes('/draft/'),
			changefreq: 'weekly',
			priority: 0.5,
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
		swup({
			theme: 'fade',
			animationClass: 'page-swap-',
			animationSelector: '[class*="page-swap-"]',
			containers: ['main'],
			cache: true,
			preload: {
				hover: true,
				visible: false  // Disable visible preloading to reduce initial request chain
			},
			accessibility: true,
			smoothScrolling: true,
			updateBodyClass: false,
			updateHead: true,
			reloadScripts: true,
			progress: false,
			loadOnIdle: false,  // Disable idle preloading to reduce background requests
			globalInstance: true,
			linkSelector: 'a[href^="/"]:not([data-no-swup]):not(.lg-trigger):not(.astro-lightgallery-adaptive-item):not([href*="#"])',
			ignoreVisit: (url, { el }) => {
				// Ignore LightGallery links and elements inside galleries
				if (el?.closest('.lg-trigger') ||
				    el?.closest('astro-lightgallery') ||
				    el?.closest('.lg-outer') ||
				    el?.classList?.contains('astro-lightgallery-adaptive-item') ||
				    el?.hasAttribute('data-lg-id') ||
				    el?.hasAttribute('data-lg-size')) {
					return true
				}
				return false
			}
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
		service: {
			entrypoint: 'astro/assets/services/sharp',
			config: {
				limitInputPixels: false,
			}
		},
		// Configure WebP quality and format defaults
		remotePatterns: [{ protocol: "https" }],
	},
	vite: {
		plugins: [tailwindcss()],
	},
	build: {
		format: 'directory'
	}
});
