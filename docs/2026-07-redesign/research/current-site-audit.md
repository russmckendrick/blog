> **Provenance:** research agent output, 31 Jul 2026, commissioned for the
> "Reading Room" redesign proposal (see [../NOTES.md](../NOTES.md)).
> Audit of the incumbent Print Edition design system (tokens, fonts, nav, homepage structure, reusable infrastructure) as it stood before the redesign proposal.

# Design System Audit — russ.cloud "Print Edition" (Astro blog, /Users/russ.mckendrick/Code/blog)

## 1. Current design tokens

### Fonts — what and how loaded
Loaded via **Astro's Fonts API with `fontProviders.local()`** in `/Users/russ.mckendrick/Code/blog/astro.config.mjs` (lines 24–53). Self-hosted woff2 files in `/Users/russ.mckendrick/Code/blog/src/assets/fonts/`; `<Font cssVariable="--font-source-serif" />` and `<Font cssVariable="--font-ibm-plex-mono" />` tags emitted in `/Users/russ.mckendrick/Code/blog/src/components/layout/BaseHead.astro` (lines 99–100). **Deliberately NOT preloaded** — the LCP element is always an image, so fonts use `font-display: swap` with Astro's CLS-safe fallback metrics (documented in a comment at BaseHead.astro:91–98). Tailwind mapping happens in the `@theme inline` block of `/Users/russ.mckendrick/Code/blog/src/styles/global.css` (lines 117–122).

- **Source Serif 4** (`--font-serif` and `--font-display` — same face for both): a **variable font instanced to wght 400–800** (via fonttools varLib.instancer, ~30% smaller than the full axis). Files: `source-serif-4-variable-latin.woff2` (normal) + `source-serif-4-variable-italic-latin.woff2` (italic), weight range `'400 800'`. Fallbacks: Georgia, Times New Roman, serif.
- **IBM Plex Mono** (`--font-mono`): three static weights — `ibm-plex-mono-400-latin.woff2`, `-500-`, `-600-`. Fallbacks: ui-monospace, Cascadia Code, Consolas, Courier New, monospace.
- `--font-sans` is a bare system-ui stack kept only as a fallback for tiny chrome; DESIGN.md forbids reintroducing a webfont sans.
- Separate TTFs exist solely for OG rendering: `src/images/opengraph/fonts/SourceSerif4-Regular.ttf`, `SourceSerif4-Bold.ttf`, `IBMPlexMono-Medium.ttf` (consumed by satori).

Typography scale (global.css + DESIGN.md): body 1.125rem/1.75 at weight 400, measure ~72ch (`.article-column` max-width 72ch, global.css:648–651). Headlines use the variable axis: h1/display **700** with letter-spacing -0.015em (h1 in sectioning contexts: `clamp(2.5rem, 6vw, 4rem)`); h2/card titles **660**, -0.01em; h3 **620**; h4/h5 serif small-caps at 600 with +0.04em tracking. `.rubric` utility (global.css:205–212): mono, 0.8125rem, weight 500, uppercase, 0.08em tracking, `--ink-muted` colour — the standard label/dateline/metadata treatment. `.tag-editorial` (global.css:217–239): mono 0.6875rem caps in a square 1px hairline box, accent on hover. Dates day-first ("13 Jun 2026") via `src/components/blog/FormattedDate.astro`.

### Colour palette (CSS custom properties, `:root` light / `.dark` dark, global.css:11–88)

Primitives (preferred names):

| Token | Light | Dark |
|---|---|---|
| `--paper` (page bg) | `#F6F6F6` | `#16130E` |
| `--paper-bright` (code frames, link previews) | `#FFFFFF` | `#100E0A` |
| `--paper-shade` | `#EDEDED` | `#1D1912` |
| `--paper-tint` | `#E4E4E4` | `#221E16` |
| `--paper-deep` | `#D8D8D8` | `#2A251B` |
| `--paper-deepest` | `#C9C9C9` | `#363023` |
| `--ink` (headings/primary copy) | `#1A1A1A` | `#E9E2D2` |
| `--ink-muted` (prose, metadata) | `#555555` | `#B5AC97` |
| `--rule` (hairline) | `rgba(0,0,0,.14)` | `rgba(233,226,210,.16)` |
| `--rule-strong` (heavy editorial rule) | `rgba(0,0,0,.5)` | `rgba(233,226,210,.5)` |
| `--accent` (links, active) | `#BF3B00` burnt orange | `#D99C82` muted salmon |
| `--accent-strong` (hovers, filled buttons) | `#8F2D00` | `#E5B29C` |
| `--accent-highlight` (text highlights only) | `#8A6D1F` ochre | `#C9A94E` |

Note the light theme is deliberately neutral newsprint (no warmth); dark mode swaps to warm ink `#E9E2D2` on near-black `#16130E`. **There is no blue** (explicit rule). Callout accent inks (global.css:934–948): note `#555555`/`#B5AC97`, tip `#3D5C33`/`#A4BD8C`, important `#2F4A63`/`#93B2CE`, caution `#8F2D00`/`#E5A48C`, warning `#8A6D1F`/`#D4B968`.

**Legacy Material-style aliases** are kept mapped onto the primitives so old components still work: `--color-surface`→`--paper`, `--color-surface-container-lowest`→`--paper-bright`, `--color-surface-container-low/-/high/highest`→shade/tint/deep/deepest, `--color-on-surface`→`--ink`, `--color-on-surface-variant`→`--ink-muted`, `--color-outline-variant`→`--rule`, `--color-primary`→`--accent-strong`, `--color-secondary`→`--accent`, `--color-on-primary`→`#FFFFFF` light / `#2A1109` dark. Also deliberately-inert tokens: `--shadow-ambient: none`, `--glass-bg: var(--color-surface)` (opaque), `--glass-blur: none`, `--ghost-border: 1px solid var(--rule)` — the `.glass`/`.shadow-ambient` utilities exist but do nothing by design. Hard rule everywhere in docs: never raw hex, never Tailwind `gray-*`/`blue-*`.

### Spacing, radii, shadows/rules
- Spacing scale (DESIGN.md frontmatter): xxs 4 / xs 8 / sm 12 / md 16 / lg 24 / xl 32 / xxl 40 / xxxl 48 / section 64px. In practice components use Tailwind utilities (gap-4/5, pt-6, mt-10 sm:mt-14, py-10, etc.).
- **Radius 0 everywhere** (`rounded: none | full` only). Two sanctioned exceptions: circular avatar portraits, and terminal code blocks styled as macOS windows (10px radius, real drop shadow, CSS traffic lights `#FF5F57`/`#FEBC2E`/`#28C840`, permanently dark Catppuccin Macchiato body `#24273A`, titlebar `#2C3047`, text `#CAD3F5` — in both site themes; global.css:779–860 + a third EC theme in astro.config.mjs whose selector `[data-theme='terminal-profile-only']` never matches page-wide).
- **No cards, shadows, glass or gradients.** Separation = hairline rules (`1px solid var(--rule)`) between entries and framing every image; heavy rules (`border-t-2`/`border-b-2` + `--rule-strong`) closing page headers; tables get 2px rules top/bottom with hairline rows; blockquote = 2px ink left rule; `hr` renders as a centred asterism dinkus (`\2042`).

### Motion system ("the magazine, filmed")
Timing tokens (global.css:60–63): `--ease-settle: cubic-bezier(0.22, 0.61, 0.36, 1)`, `--dur-quick` 150ms, `--dur-hover` 400ms, `--dur-page` 600ms. No springs, bounces, or translate-lift hovers.
- `data-entrance`: pure-CSS staggered fade + 14px rise at first paint (keyframe `entrance-rise`, 0.6s; sibling-order delays 0.09s/0.18s/0.27s), inside `@media (prefers-reduced-motion: no-preference)` — never JS-gated (documented LCP rationale in global.css:342–346).
- `data-settle`: hero image settles from scale 1.03 → 1 over 0.9s (`image-settle`).
- `data-reveal`: scroll reveal via a tiny **inline IntersectionObserver** in `/Users/russ.mckendrick/Code/blog/src/components/layout/RevealInit.astro` (threshold 0.15, adds `.is-revealed`, claims elements with `data-reveal-bound`); the transition lives in global.css gated on `@media (scripting: enabled) and (prefers-reduced-motion: no-preference)`. `data-reveal="rule"` draws rules in horizontally (scaleX from left, 0.7s). **No animation library ships at all** — note DESIGN.md still says "vanilla Motion library via `src/scripts/motion.ts`", but `src/scripts/` is empty and docs/guides/design-system.md (the newer doc) confirms the observer-only implementation; DESIGN.md is stale on this one point.
- Shared-element view transitions: `PostCard.astro` and `BlogPost.astro` derive `transition:name` values `post-img-<slug>` / `post-title-<slug>` from the post URL so listing cover morphs into article hero. Root view-transition is a quick cross-fade (180ms out / 220ms in, global.css:445–451).
- Hovers: `.nav-underline` scaleX draw-in from left; image zoom scale 1.03–1.04 over 700ms ease-out inside the hairline frame; headline colour shift to `--color-secondary`. Legacy `.reveal*` classes are neutered no-ops.

## 2. Nav / header

`/Users/russ.mckendrick/Code/blog/src/components/layout/Header.astro`, wrapped by `HeaderWrapper.astro` (sticky top-0 z-50; has scroll auto-hide code but `BaseLayout.astro` passes `autoHide={false}`, so the masthead is plain sticky). Masthead = opaque paper, 1px bottom rule (`.masthead`), left: `/images/logo.svg` (h-8 w-10) + bold Source Serif wordmark (SITE_TITLE).

Links from `NAVIGATION_ITEMS` in `/Users/russ.mckendrick/Code/blog/src/consts.ts:47–61`: **Search** (/search/, icon `search`), **Tags** (/tags/, `tag`), **Tunes** (/tunes/, `headphones`), **Reading** (/reading/, `bookOpen`), **Books** (/books/, `book`), **About** (/about/, `user`), **Archives** (/archives/, `archive`), **Source** (external → github.com/russmckendrick/blog, `github`). Icons render through `src/components/ui/Icon.astro` at 18px.

Desktop (md+): **icon-only** links (`.nav-icon-link`) whose `.rubric` text label sits in a collapsed `.nav-label` span that slides out on hover/focus (max-width/opacity transition on `--dur-hover`/`--ease-settle`, disabled under reduced motion; label stays in DOM for screen readers), combined with `.nav-underline` draw-in. Plus an icon-only theme toggle (`#theme-toggle`, sun/moon swapped by `.dark`).

Mobile (<md): hamburger button with `aria-controls`/`aria-expanded` and a sr-only label that flips Open/Close; disclosure panel (`#mobile-menu`, `.mobile-hidden` = `hidden`) listing icon + full text label rows plus a "Toggle theme" row; closes on outside click, Escape (refocusing the trigger), and link click. All wiring in an inline script with AbortController cleanup, re-initialised on `astro:page-load`.

Footer (`Footer.astro`): colophon — hairline top rule, centred small-caps `.rubric` nav of the same items, italic copyright line "© YYYY … Set in Source Serif & IBM Plex Mono".

## 3. Homepage structure

`/Users/russ.mckendrick/Code/blog/src/pages/index.astro`: inside `BaseLayout`, one `<section class="max-w-7xl mx-auto px-5">` with a sr-only h1. Shows **7 posts: 1 featured + 6 grid**, then `Pagination` (page size 9 thereafter, `/page/N/`).

- **Featured** = `HeroSection.astro` (`src/components/home/`) which is just a thin wrapper around `<PostCard variant="featured" priority headingLevel="2" />`. The featured variant (PostCard.astro:122–205) is a **lead-story editorial spread**: rule-free, flex row at lg (text left ~1/2, image right ~1/2; image stacks first on mobile), accent-coloured "Featured · date · reading time" rubric, 700-weight headline at text-3xl → 2.75rem, standfirst, author rubric + up to 4 `.tag-editorial` stamps, hairline-framed cover (h-64→lg:min-h-[400px]) with LQIP blur-up background and 1.03 hover zoom.
- **Grid**: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10`, each cell wrapped in `data-reveal` and rendering `<PostCard variant="grid" headingLevel="3" />` — an index entry opened by a hairline `border-t`: dateline rubric, framed 4:3 cover, 660-weight headline (text-xl), 2-line clamped standfirst, footer rubric of reading time · first tag.
- LCP optimisation: index.astro preloads the featured post's hero `imagesrcset` (Cloudflare-transformed, `fetchpriority="high"`); priority cards skip LQIP to cut the request chain.
- Other PostCard variants for reuse elsewhere: `vertical` (blog list — full-width 16:9/5:2 cover, border-b entry) and `horizontal` (related posts — compact rule-topped row, 30% image right).
- `src/components/home/CategoryPills.astro` exists but is not used on index.astro.

## 4. Theme-independent, reusable infrastructure

- **Cloudflare image pipeline** — `/Users/russ.mckendrick/Code/blog/src/utils/cloudflare-images.ts`: `getCFImageUrl(src, options)` (builds `/cdn-cgi/image/...` URLs; passes through external URLs, SVGs, and everything in DEV), `generateCFSrcSet(src, widths, quality, format)`, `getLQIPUrl(src)` for blur-up placeholders. Presets in `src/consts.ts` `CF_IMAGE_PRESETS` (hero q60 avif; thumbnailPriority q28; thumbnail q25; thumbnailHorizontal q25, each with tuned width arrays). Runtime CDN transformation, zero build-time processing (`astro.config.mjs` sets the noop image service). Fully theme-agnostic.
- **OG image generation** — `/Users/russ.mckendrick/Code/blog/src/pages/[year]/[month]/[day]/[slug]-og.png.ts` + `src/components/OpenGraph/OG.tsx` + `createImage.ts` (**satori → SVG → sharp → PNG**, with its own TTFs under `src/images/opengraph/fonts/`). Resolves cover images back to filesystem paths for both blog and tunes collections. Reusable; only OG.tsx's visual template is theme-coupled.
- **Link-preview cache** — `/Users/russ.mckendrick/Code/blog/scripts/cache-link-preview-images.js`: downloads OG images at build time into `public/assets/link-previews/` (manifest `src/data/link-preview-cache.json`, 7-day staleness, concurrency 4) so LinkPreview embeds can go through Cloudflare transforms. Theme-independent.
- **Dark mode mechanism** — class-based (`.dark` on `<html>`) plus `data-theme="light|dark"` (consumed by Expressive Code). FOUC-proof inline script in `BaseHead.astro:132–154`: applies from `localStorage.theme` or `prefers-color-scheme` before paint, and re-stamps the incoming document on `astro:before-swap`. Toggle logic in `Header.astro`. Tailwind wiring: `@custom-variant dark (&:where(.dark, .dark *))` in global.css:111. Any redesign inherits this for free as long as it defines tokens under `:root` / `.dark`.
- **Motion utilities** — token vocabulary (`--ease-settle`, `--dur-*`), the `data-entrance`/`data-settle` pure-CSS keyframes, and the `RevealInit.astro` IntersectionObserver are all generic attribute-driven mechanics; retint/retime them without touching the mechanism. All reduced-motion-safe by construction.
- Other reusable plumbing seen in passing: `HeaderWrapper.astro` (sticky + optional scroll auto-hide, currently off), the BaseLayout inline a11y fixer (aria-labels, code-block tabindex, LightGallery cleanup), skip-link pattern, view-transition names in PostCard/BlogPost, `FormattedDate.astro`, `reading-time.ts`, `tags.ts` (`getTagColorClasses()` currently returns `.tag-editorial` for everything; `TAG_METADATA` titles/emojis/descriptions retained), sitemap lastmod logic, Pagefind search, Giscus comments with swappable CSS themes (`public/giscus/light.css`/`dark.css`), Plausible analytics, `inlineStylesheets: 'always'` build setting.

## 5. DESIGN.md intent/philosophy (July 2026 "Print Edition")

`/Users/russ.mckendrick/Code/blog/DESIGN.md` (frontmatter tokens + prose). Core statements of intent:

- **Concept**: "Russ.Cloud is set as 'The Print Edition': a high-end print journal adapted for a technical blog and music archive… read like a well-set magazine — paper tones, serif typography, hairline rules instead of cards, dated-journal metadata, and image-led layouts where the AI-generated cover art is the artwork. Chrome stays quiet; type, rules, and imagery carry the personality."
- **Light-first**: the site is "paper" first; dark mode "swaps ink and paper rather than becoming a separate theme."
- **One serif, differentiated by weight** "like a real newspaper"; mono is "promoted to metadata duty" (datelines, reading time, rubrics). No new fonts, no tight negative letter-spacing beyond the specified amounts.
- **Rules instead of cards**: no cards/shadows/glass/gradients; most separation from hairline and heavy rules; "the covers are the artwork; frame them with hairlines and let them breathe on paper." Radius 0 with the two named print-convention exceptions (circular avatars; macOS terminal windows, which "read as a figure, not chrome").
- **Motion philosophy**: "choreographed but calm — 'the magazine, filmed'"; hero images "settle onto the page like a plate"; entrances stagger dateline → title → byline → hero; no springs/bounces/lift hovers; always honour `prefers-reduced-motion`.
- **Single accent discipline**: one burnt orange for everything interactive, ochre reserved for highlights, "There is no blue."
- **Editorial component language**: masthead, colophon footer, page-header pattern (rubric → heading → standfirst → heavy rule), index-entry listings, journal article header with drop cap, pull-quote blockquotes, asterism dinkus, print tables, `.tag-editorial` as "a quiet classification stamp" (pastel tag chips explicitly retired), reading progress as "a 2px accent rule. No gradient, no glow."
- **Token discipline**: route all colour through tokens so "light and dark must both come free"; legacy Material aliases retained only for compatibility.
- Explicit Don'ts: no border radius, shadows, glass, gradients, pastel chips, Tailwind grey/blue utilities, new fonts, springs/scale-bounces.
- One staleness flag for any synthesis work: DESIGN.md's motion section still references the Motion library and `src/scripts/motion.ts`; the shipped implementation (per `docs/guides/design-system.md` and the code) is CSS + inline IntersectionObserver with no animation library.
