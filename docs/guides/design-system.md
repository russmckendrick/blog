# Design System — "Workbench"

The site is styled as a clean workbench: a white page (light is the default), near-black ink, one grey for everything that is not content, a single tint surface, and an amber accent that marks as a fill and links as darkened text. One typeface, Geist, carries UI, headings and article body alike. Every page sits in the same 1320px frame; listings lay posts out as image-led tiles in a 1/2/3-column grid, hubs such as Books, Tags, Archives and the reading list use card grids, and the few text pages (search, glossary) cap their content at a 760px measure inside the frame. The canonical token reference is [DESIGN.md](../../DESIGN.md) at the repo root; this guide covers how the system is implemented in code.

## Where things live

- **Tokens:** `src/styles/global.css` — CSS custom properties in `:root` (light, the default) and `.dark` (near-black, opt-in from the theme toggle).
- **Theme selection:** light unless the reader has chosen dark — the inline script in `src/components/layout/BaseHead.astro` and `initializeTheme` in `Header.astro` both apply `.dark` only when `localStorage.theme === 'dark'`. The system `prefers-color-scheme` is not consulted.
- **Fonts:** registered in `astro.config.mjs` via Astro's Fonts API (`fontProviders.local()`), woff2 files in `src/assets/fonts/`, `<Font>` tags in `src/components/layout/BaseHead.astro`, Tailwind mapping in the `@theme inline` block of `global.css`.
- **Brand lockup:** `src/components/layout/Logo.astro` renders one inline SVG from generated path data in `src/data/logo-lockup.json` (plus the mark-only `public/favicon.svg`) — both baked by `scripts/generate-logo.js`, never hand-edited.
- **Homepage sections:** `src/components/home/` (`HomeLead`, `HomeIntro`, `TagTabs`, `HomeTunes`, `HomeBooks`, `HomeProjects`); the "Recent writing" tiles are the shared `PostCard`; the shared section head (`.home-section-head` / `.home-section-title` / `.home-section-link`) lives in `global.css` because the components are scoped separately.
- **Scroll reveals:** `src/components/layout/RevealInit.astro` (inline IntersectionObserver + CSS transitions — no animation library, no React islands).
- **Expressive Code theming:** `styleOverrides` in `astro.config.mjs` only; late CSS cannot override its build-time styles.

## Tokens

Primitives (preferred in new code). The `--paper*` names are kept from earlier editions; in Workbench "paper" is simply the page.

| Token | Light | Dark | Use |
|---|---|---|---|
| `--paper` | `#FFFFFF` | `#0B0B0C` | the page |
| `--paper-well` | `#F4F4F5` | `#151517` | the single tint surface: the homepage intro band, tunes panel, author card, hover fills, search input, inline code |
| `--ink` | `#0B0B0C` | `#EDEDEF` | titles and body |
| `--ink-muted` | `#5E5E66` | `#A1A1A6` | "mist" — everything that is not content: deks, dates, read times, captions, inactive tabs |
| `--rule` | `#E6E6E9` | `#26262A` | the hairline — always 1px |
| `--rule-strong` | `#D4D4D8` | `#333338` | hover borders on outlined pills and tiles, the pagination Newer/Older steps, the "+N more" outline |
| `--accent-fill` | `#F2B544` | — | amber **fills only**: reading-progress bar, "Latest" badge, active-contents dot, tombstone dots, prose link underline. Never text — it fails contrast on white |
| `--on-accent-fill` | `#0B0B0C` | — | text sitting on an amber fill |
| `--accent` | `#8A5A00` | `#F2B544` | the text-safe amber: hovers, section links, `.prose hr` dots (the logo's dot and cursor use the mark's palette, not the accent) |
| `--pill` / `--pill-hover` | `#F4F4F5` / `#E6E6E9` | `#151517` / `#1F1F22` | tag pill fill |
| `--terminal-bg` / `--terminal-bar` | `#1B1D27` / `#14161E` | same | the homepage `russ --now` terminal — a dark window in both themes |

There is no third text tint — a second grey is a bug. `--accent-fill` and `--on-accent-fill` are defined once in `:root` and hold in dark mode, where `--accent` itself becomes the same amber.

**Legacy aliases:** the Material-style names (`--color-surface`, `--color-surface-container-*`, `--color-on-surface`, `--color-on-surface-variant`, `--color-primary`, `--color-secondary`, `--color-outline-variant`) are aliases of the primitives so older components keep working — `--color-outline-variant` *is* the hairline, `--color-secondary` *is* `--accent`. `--shadow-ambient` is `none`, `--glass-bg` is the opaque page, and `--ghost-border` is a hairline — the utilities that consume them are inert by design. Never add raw hex values or Tailwind palette colours (`gray-*`, `blue-*`).

**Radius:** soft and generous on the new surfaces, small on the old ones. Fully rounded (`9999px`) pills, badges and avatars; 16px post tiles, project tiles, tag cards, the mobile hero and the mobile tunes-index lead; 18px the homepage lead and tunes panel below 1024px, the author card and the archive year cards; 22px the post hero, homepage lead, tunes panel and tunes-index lead from 1024px, and the "Latest book" panel; 14px callouts, the homepage terminal and reading-list preview images; 12px Expressive Code frames; 10px Expressive Code terminal frames and the author card's button; 8px action pills, the tunes record grid and book covers on `/books/`; 6px book covers on the homepage; 20px the search input; 3px the tunes-index record strip.

## Typography

| Face | Variable | Role |
|---|---|---|
| Geist (variable, wght 400–800, italic 400–700) | `--font-geist` → Tailwind `--font-sans`, `--font-display` and `--font-serif` | everything: UI, headings and article body. Headings heavy and tight (h1 800, −0.035em, lh 1.08; h2 700, −0.025em), meta small (13px) and never tracked |
| Geist Mono (variable, wght 400–700) | `--font-geist-mono` → `--font-mono` | code: Expressive Code, inline code, terminal figures, the homepage project names — never metadata |

The faces are Vercel's Geist from the `geist` npm package (OFL), instanced with fonttools `varLib.instancer` and subset to Latin with `pyftsubset`: `geist-variable-latin.woff2`, `geist-variable-italic-latin.woff2` and `geist-mono-variable-latin.woff2`, roughly 25 KB each. There is no serif in the design — `--font-serif` is kept as an alias of Geist so any stray `font-serif` call site falls through to the one face. The OpenGraph cards (`src/components/OpenGraph/`) render with the same `geist-variable-latin.woff2`; the Reading Room faces (Schibsted Grotesk, Literata, IBM Plex Mono) have been removed.

Article body (`.prose`) is Geist 19px / 1.75 from 640px up, 17px / 1.7 below; paragraphs are separated by `1.65em`, no indents; in-body h2s are 30px/700 (24px on mobile), h3s 20px/700. Pull quotes (`.prose blockquote`) are large italic Geist in mist, indented, no bar. Dates are day-first ("13 Jun 2026") via `FormattedDate.astro`.

The masthead wordmark is the one exception: "russ" (Poppins ExtraBold) and ".cloud" (Poppins Light) exist only as SVG outline paths baked by `scripts/generate-logo.js` — Poppins is never registered or loaded as a font.

The global `h1` rule sets the page-title role (`clamp(2rem, 5vw, 2.75rem)`, weight 800, −0.035em) — never add inline font-size or weight to an `<h1>`. The article title and homepage headings set their own larger sizes through named classes (`.post-title`, `.home-lead-title`, `.home-section-title`).

### Utility classes

- `.rubric` — the quiet meta line: 13px sans in mist, no uppercase, no tracking. Used for datelines, read times, tile meta and the storybar. It is metadata treatment only — never an eyebrow heading above a title.
- `.tag-editorial` — the tag pill: 13px sans on the tinted `--pill` fill, fully rounded, ink text, `--pill-hover` on hover. `getTagColorClasses()` in `src/utils/tags.ts` returns this for every tag (the per-tag pastel palette is retired visually); labels come from `getTagName()`, which strips emoji. Do not build new chip styles.
- `.post-header-tag` — the outlined variant used only in the article header: 13px/500, 32px tall, hairline border, `--rule-strong` border and `--paper-well` fill on hover.
- `.action-pill` — the bordered article-tool button: 13px/600 sans, 8px radius, hairline border on `--color-surface`, filling to `--paper-well` on hover. Shared by the Use with AI trigger, Suggest edits, RSS and Follow on Google so the four read as one control family; a leading `.action-pill-icon` glyph sits at 1rem on every pill in full colour - the multi-colour sparkle, the orange RSS tile and the four-colour Google G are local SVGs in `src/icons/` (astro-icon keeps their fills because they are not monochrome), and the GitHub mark is `simple-icons:github` in brand black via `.action-pill-icon--github`, flipping to GitHub's light foreground on dark. Width is the container's call — the rail and narrow storybar stretch them, the inline storybar lets them size to content.
- `.tag-editorial--sm` — the 12px variant for meta contexts. Nothing renders it at the moment (listing tiles, the rail and the storybar no longer carry tags), but it is kept with its `min-width`/`min-height: 24px` floor so any chip that returns clears the WCAG 2.5.8 target minimum — its type and padding alone come to 21.6px.
- `.page-frame` / `.page-frame--text` / `.page-head` / `.page-lede` — the page shell; see [Layout](#layout-one-frame).
- `.home-section-head` / `.home-section-title` / `.home-section-link` — the homepage section head (the title style is reused for "Previous weeks" on `/tunes/`): a 26px (34px from 640px) bold title with −0.03em tracking, a 15px/600 amber link (`--accent`) beside it, wrapping on narrow screens.
- `.nav-underline` — legacy underline draw-in on hover/focus, kept for editorial links.
- Section heads inside text pages are plain sans: `text-[15px] font-semibold` with `letter-spacing: -0.01em` (see "Often appears with" on the tag hubs).

## Layout: one frame

- **The frame** — `.page-frame` in `global.css`: `max-width: 1320px`, centred, with 16px / 24px / 40px gutters (base / 640px / 1024px) — the same box as the `max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-10` utilities the masthead, footer, homepage and article page use. Every page now sits in it; the 728px column is gone.
- **Text pages** — `.page-frame--text` caps each direct child at 760px, left-aligned in the frame under the logo rather than centred. Only search, the glossary index and glossary terms use it; About, archives and the reading list now use the full frame (the reading-list pages as `.page-frame pb-16`).
- **Listings** — `.feed` is a responsive grid of `PostCard` tiles: one column, two from 640px, three from 1024px, with a 3rem/2rem gap (3.5rem rows from 1024px) and 2.5rem of top padding. Pages with other wide content (cover grids, A–Z clouds) use their own grids inside the frame.

Separation is by surface rather than borders alone: 1px hairlines (`border` + `--color-outline-variant`) still run under the masthead and page heads, around the storybar and along tab baselines, while the homepage and article page add the single `--paper-well` tint (intro band, tunes panel, author card) and hairline-outlined tiles (projects, pills, pagination). No gradients, no glass, no coloured side bars. Shadows appear only on terminal figures and book covers: a soft drop shadow under each cover on the homepage, `/books/` and the About shelf.

**Page head pattern:** `<header class="page-head">` — 1.5rem/2rem padding (2.5rem from 640px) closed by a hairline — holding the `<h1>` (or a `.page-title`) at `clamp(2.25rem, 5.5vw, 3.75rem)`, 800, −0.04em, lh 1.02, then an optional `.page-lede` (mist, 18px / 20px from 640px, max 720px). Any `<p>` in the head is capped at 760px. Hubs open with `BackLink` above the title. Where tabs follow straight on (`/page/N/`, `/tunes/`, `/tunes/page/N/`) the hairline is dropped (`!border-b-0`) so the tab baseline does the job. No eyebrow labels, no emoji in titles.

## The homepage

`src/pages/index.astro` takes the newest `HOME_PAGE_SIZE` (7) posts — the lead plus six tiles — and stacks six sections. `/page/2/` onwards (`page/[...page].astro`) slices from `HOME_PAGE_SIZE`, so the two must agree. It passes `footerTunes={false}` to `BaseLayout`, so the footer drops its "Listened to this week" block here.

1. **Lead** (`HomeLead.astro`) — the newest post as a full-width cover: 16:10 on mobile, 16:9 from 640px, and from 1024px a 580px-tall letterbox with the headline on a page-coloured panel (700px, max 70%, 26px top-right radius) cut into the bottom-left corner. Meta line opens with an amber "Latest" badge (`--accent-fill` on `--on-accent-fill`), then date · read time · up to three tag names (from 640px). The image is the page's LCP element — `loading="eager"`, `fetchpriority="high"`, `decoding="sync"` — and `index.astro` preloads it; both read their `src`/`srcset`/`sizes` from `leadImageAttrs()` in `src/utils/home-lead.ts`, so the preload and the `<img>` cannot drift apart and fetch twice.
2. **Intro** (`HomeIntro.astro`) — a full-width `--paper-well` band: the cartoon avatar, "Hi, I'm Russ…" in 62px/800 (36px on mobile), a lede with live counts (books, posts, the first post's year), and a dark terminal figure (`--terminal-bg`, 14px radius, the one soft shadow) running `russ --now`: **writing** (the lead post, linked), **building** (`NOW_BUILDING` in `src/consts.ts`), **spinning** (the first record of the latest tunes week, via `getTuneCovers()`), **topics** (`FEATURED_TAGS`). The cursor blink stops under reduced motion.
3. **Recent writing** — a `.home-section-head` with `TagTabs.astro` in `variant="pills"` (All + `FEATURED_TAGS`; active pill filled ink, the rest hairline outlines), then six `PostCard` tiles in the `.feed` grid (see [The listing tile](#the-listing-tile)), closed by `Pagination` as page 1 of N, linking on to `/page/2/`.
4. **Tunes** (`HomeTunes.astro`) — this week's tunes entry as a `--paper-well` panel: the AI cover art beside "Listened to this week · date", the title, description, seven record covers (8px radius, 4-across) plus a "+N more" tile, and a foot line with the non-negotiable "AI-generated write-ups · my records" attribution and "All N weeks →".
5. **Books** (`HomeBooks.astro`) — "I also write books", a count lede and "See all N books →" beside the four newest covers, with the soft cover shadow (sorted by `pubDate` descending, as `/books/` and About are).
6. **Projects** (`HomeProjects.astro`) — "Things I've built", a 1/2/3-column grid of hairline-outlined tiles (16px radius, `--paper-well` on hover) from the `PROJECTS` array in `src/consts.ts`. Each entry has `name`, `tag`, `description`, `post` (the blog collection id of the introducing post) and `repo`; tiles link to the post and fall back to the repo if the post id is not found. Names and tags are set in Geist Mono.

## The listing tile

`PostCard.astro` is the one listing card, used for blog and tunes posts on every listing — the homepage's "Recent writing", `/page/N/`, tag, year and author hubs, the tunes pages and "Keep reading". The legacy `variant` values are still accepted but all render the same tile:

- cover — 16:10, `object-fit: cover`, 16px radius on a `--paper-well` placeholder; no LQIP blur
- meta — `.rubric` line: `date · read time`, plus `· AI-generated` on tunes posts
- title — 21px/700 (23px from 640px), −0.02em, amber (`--accent`) on hover or focus; its level comes from `headingLevel`
- description — 15px mist, clamped to three lines (`summary` wins over `description` where a collection has one); the `compact` prop hides it

The whole tile is a single `<a>` — there are no tag chips inside it any more, so there is nothing to nest and no overlay link. Tiles in the first mobile viewport take `priority` (the listing pages pass `priority={index < 2}`), which loads them eagerly with `fetchpriority="high"` and the `thumbnailPriority` preset. Listings place tiles in the `.feed` grid, each wrapped in a `data-entrance` or `data-reveal` div.

`TagTabs.astro` in its default `variant="tabs"` doubles as topic navigation on `/page/N/` — real tags, active state = 1px ink underline sitting on the baseline hairline. The tunes hubs share their own tab row, `TunesTabs.astro` (Latest weeks · Artists · Albums · By year, with artist and album counts): `/tunes/`, both directories and the year pages render it under a borderless `.page-head`. A year page marks By year as its section (`aria-current="true"`) rather than as the page.

**The tunes index** opens with a visible `.page-head` ("Listened to This Week", with a lede giving the week count and noting the posts are written up by AI from Russ's own records) over the tunes tabs. The lead week spans the frame: its image at 16:10 on mobile and 21:9 from 640px (16px radius, 22px from 1024px, LQIP behind it), a 28px/40px 800-weight title, description, a meta line ending `AI-generated` — non-negotiable — an eight-cover strip (square, 3px radius, 4-across on mobile), and the `russ.fm · Last.fm · Discogs` line. "Previous weeks" follows under the `.home-section-title` style as a `.feed` of tiles. `/tunes/page/N/` gets its own visible header too.

**Artist and album directories** (`/tunes/artist/`, `/tunes/album/`, both through `TunesDirectory.astro`): a **Most featured** row first — the six artists or albums that appear in the most weekly posts, numbered with amber rank pills, three across on phones and six from 768px — then a sticky **A–Z bar** (32px mist letter pills that take a tint on hover) pinned under the 68px masthead, then one section per letter: the letter at 34px/800 with a mist count over a hairline, and a grid of tiles at 2 / 3 / 4 / 5 / 6 columns (640 / 768 / 1024 / 1280px). Album tiles are square sleeves at 8px radius with the title (700), artist (ink) and post count (mist); artist tiles are round portraits with centred name and `albums · posts`. A tile without art shows the name's initial on tint. Letter sections set `scroll-margin-top` to clear the masthead and the bar; they deliberately skip `content-visibility`, whose estimated heights made the letter jumps land in the wrong section.

**Tunes by year** (`/tunes/year/`) reuses the archive year card (`.year-card` in `global.css`) in a 1 / 2 / 3-column grid. A year with a Year in Music post — or just its cover, generated ahead of the post with `pnpm run wrapped -- --cover-only` and found by `src/utils/year-in-music.ts` — shows that artwork whole at 16:9 (`.year-art`) in place of the mosaic; other years fall back to the three-cover mosaic of their newest weeks. The rubric reads `N weeks · Year in Music`, `N weeks so far` for the year in progress, and drops a zero week count. **A year page** (`/tunes/year/{year}/`) leads with the Year in Music, when there is one, as a single-link tint panel: the artwork uncropped at 16:9 (12px radius, 14px from 1024px) beside an amber "Year in Music" badge, an 800 title, the description and an ink "Read the review →" pill — stacked below 1024px. The artwork is the page's LCP image, eager and preloaded with the same `src`/`srcset`/`sizes`. The scenes run edge to edge with the year built in, so nothing is laid over them. With only a cover and no post (the year in progress), the same panel is a plain `<div>`: "<year> so far", a line on the weeks so far, and a "Browse the weeks ↓" pill jumping to the feed. "Weekly posts from {year}" follows as a `.feed`, omitted for review-only years.

**Pagination** (`Pagination.astro`) ends every paginated listing, the homepage included: one centred, wrapping row of 44px-tall pills. A Newer step (`← Newer posts`), the numbered pages (outlined in the hairline, `--rule-strong` and `--paper-well` on hover; the current page filled ink with `aria-current="page"`; ellipses in mist), then an Older step (`Older posts →`); tunes swaps in "weeks", the reading list "articles". When there is no page in a direction the step still renders, as a disabled outlined pill in mist with `aria-hidden="true"`, so the row never shifts. Below 640px the step labels collapse to bare arrows (the label stays as the link's `aria-label`). Prev/next carry `rel="prev"`/`rel="next"`. `buildPageList` shows every page up to seven, and beyond that only renders an ellipsis when it hides more than one page.

## Masthead and footer

**Masthead** (`Header.astro`): one 68px row on the opaque page with a 1px bottom hairline, inside the 1320px frame — the brand lockup left, rendered by `Logo.astro` as a single self-contained inline SVG: the iMac mark plus `russ.cloud` in baked Poppins outlines (heavy "russ" in `--ink`, light ".cloud" in `--ink-muted`) and a blinking block cursor sitting on the baseline (`1.1s steps(1, end)`, held solid under `prefers-reduced-motion`). The dot and cursor borrow the mark's own palette via the component's `--logo-punct` variable — its screen blue `#35495E` in light, its base grey `#BDC3C7` in dark — while "russ"/".cloud" ride the ink/mist tokens, so the whole lockup flips with the theme; the mark keeps its own navy/grey fills (per-part classes are in place if a theme override is ever wanted). Right, seven links (Tunes · Books · Reading List · Tags · Archive · About · Source) that rest as glyphs alone — a 15px `Icon.astro` mark each (`headphones`, `book`, `bookOpen`, `tag`, `archive`, `user`, `github`) — the closed book for the Books shelf, the open one for the Reading List beside it held at 62% opacity (`.nav-glyph`); the GitHub mark, the one solid shape among hairlines, sits at 50% instead so it carries the same optical weight. Source is the only external destination (the repo on GitHub) and picks up `target="_blank"` + `rel="noopener noreferrer"` from its `external: true` flag. On hover or `:focus-visible` the glyph reaches full ink and its label (`.nav-label`) unfurls to the right over 150ms `--ease-settle`, easing from `max-width: 0` to the `--nav-label-w` the template sets per item from the word's own length, so the slide stops at the word rather than a guessed maximum. Only the hovered item expands. The collapse lives inside `@media (hover: hover)`, so touch devices keep every label visible; reduced motion drops the transition but keeps the reveal. Then a 16px vertical hairline (`.masthead-divider`) and the icon-only search trigger and theme toggle. Below 768px the links collapse into a burger-menu disclosure — the glyphs come with them as a 16px column against the text rows — with the search icon staying visible beside the burger.

**Search sheet** (`SearchOverlay.astro`, rendered by `Header.astro`): the search trigger is an `<a href="/search/">` that JS upgrades to a native `<dialog>` — a centred 720px panel 8vh from the top (22px radius, hairline border, no shadow) over a page veiled in 32% ink (66% black in dark); below 640px it fills the screen. It hosts `SearchPanel.astro` (`variant="sheet"`), which `/search/` also renders (`variant="page"`, with the input in a bordered 16px-radius field). The panel is built on Pagefind's JS API, not PagefindUI:

- **Field** — a search glyph, a borderless 20px/500 input, a mist "Clear", and an `esc` key cap that closes the sheet (a plain X on touch), over a hairline.
- **Type filters** — outlined pills (All · Posts · Tunes · Books · Glossary) with live counts for the current query; the active one is ink-filled, like the homepage topic pills.
- **Idle state** — "Try" suggestion chips (tint pills that run a query) and "Or browse" outlined links to the hubs.
- **Results** — a count with a Best match / Newest segmented toggle on tint, then rows split by hairlines: a 120px 16:10 cover thumbnail (book jackets shown whole on tint, a mist glyph when there is no image), `Type · date · read time` in 13px mist (the type in ink, amber text on tunes), a 17px/700 title that turns amber on hover, and a two-line 14px mist excerpt with matches marked in 32% `--accent-fill`. Up to two matching sections follow as `#`-prefixed deep links. Rows take a tint fill on hover and focus. Ten load at a time behind a "Show N more" pill.
- **Footer** (sheet, pointer devices) — a tint band of key hints: `↑ ↓` to move, `↵` to open, `esc` to close.

Opens on click, `⌘K`/`Ctrl+K`, or `/`; closes on `Escape`, the key cap, backdrop, or `⌘K`. Arrow keys walk from the input through the result links and back, typing on a result returns to the input, and `Enter` in the input opens the top hit (pointer devices only, so a phone's search key never navigates). Pagefind lazy-loads the first time the panel takes focus.

**Footer** (`Footer.astro`): every view ends the same way. The footer is a `--paper-well` tint with a hairline top, in the 1320px frame. It has one column on phones, two from 640px, and from 1024px four (`1.4fr / 0.8fr / 1.3fr / 1.1fr`), or three when the tunes column is hidden (`.footer-grid--no-tunes`).
- **Brand**: the `Logo` linked home, a one-line blurb ("DevOps, AI coding tools, the Rust CLIs I build and the records I'm playing. Written by Russ McKendrick since 2013."), and a "Subscribe via RSS" pill (`rss-color` glyph via astro-icon, page-coloured with a `--rule-strong` outline).
- **Explore**: a `<nav>` list of the site's sections (Home, Tunes, Books, Reading list, Tags, Archives, Glossary, About), declared as `EXPLORE` in the component. `FOOTER_NAV` in `src/consts.ts` is no longer used by the footer.
- **Elsewhere**: a `<nav>` of every `SOCIAL_LINKS` entry as a 16px `Icon.astro` glyph plus its visible name from `SOCIAL_LABELS` (with " author page" stripped from Amazon's), in two columns, each `target="_blank"` with `rel="noopener noreferrer me"`.
- **Listened to this week**: four 72px covers (6px radius), the latest entry's title and `N weeks of listening →`. The tunes column is controlled by the `showTunes` prop (default `true`), which `BaseLayout` sets from its own `footerTunes` prop; the homepage turns it off because it carries its own tunes panel.

The footer strip, the homepage tunes panel and the tunes lead all get their covers from `getTuneCovers()`, which names each one ("Duke by Genesis") from the post's own gallery entries rather than shipping `alt=""` — nothing beside them says what the records are. Column heads (`.footer-head`) are 13px/700. A hairline bottom bar closes it, with "© year Russ McKendrick" on the left and "Source on GitHub · RSS · Back to top ↑" on the right. The longer bio stays on the About page.

## The article

`BlogPost.astro`, top to bottom:

- **Header** (`.post-header`, in the 1320px frame): up to four outlined tag pills (`.post-header-tag`) → the title (`.post-title`, `clamp(34px, 5.5vw, 64px)`, 800, −0.04em, lh 1.02, capped at 1100px wide). Left-aligned to the hero's edges at every width — never centred. The tags live only here — there is no tag list at the article foot and none in the rail or storybar.
- **Hero**: directly under the title, wide, in the same frame — 16:10 at 16px radius on mobile, 16:9 from 640px, and from 1024px a 560px-tall letterbox at 22px radius. It is still the lightbox's first item (zoom opens the original asset). `HERO_SIZES` is one string shared by the preload `<link>` and the `<img>`, so both pick the same file.
- **Body** (`.post-columns`): from 1200px a three-column grid — `220px | minmax(0, 700px) | 220px` — with `ArticleRail part="contents"` on the left, the text column (`.post-main`) in the middle and `ArticleRail part="tools"` on the right, both rails sticky. Below 1200px both rails are hidden and the text column is a centred 700px.
- **Lede** (`.post-lede`, the head of the text column, closed by a hairline): the post's `description` as a mist **standfirst** (19px, 22px from 640px) → the byline: a 40px circular **tag-based avatar** (the illustrated set in `public/images/avatars/`, first mapped tag wins via `TAG_AVATAR_MAP` in `src/consts.ts`, `anon.svg` fallback; tunes use the AI author's avatar) beside `Russ McKendrick · 19 Jul 2026 · 9 min read · Updated …` (name in ink 600, the rest mist). So the image sits above the description, not below it.
- **StoryBar** (below 1200px only, after the lede): `StoryBar.astro`, the hairline bar of four `.action-pill` buttons — `[✦ Use with AI ▾]`, `[ GitHub Suggest edits]`, `[ RSS]`, `[ G Follow on Google]`, each with its full-colour glyph. Follow on Google is a plain deeplink to Google's source-preferences tool with `russ.cloud` prefilled (`PREFERRED_SOURCE` in `src/consts.ts`) — no `publisher.js`, and the G is the four-colour Google mark from `src/icons/google-color.svg`. Below 640px the actions take a block of their own: the trigger spans the full width, the links split the rows beneath 50/50, and the one left over at the bottom spans rather than sitting at half width (with no `editUrl`, RSS and Follow on Google fill a single row). The storybar and the tools rail are viewport-exclusive, so the two never appear together.
- A 2px amber (`--accent-fill`) **reading-progress rule** fixed to the top viewport edge runs on article pages only — no gradient, no glow.

**Article rail** (`ArticleRail.astro`): one component, rendered twice with a required `part` prop. `part="contents"` is the left column's sticky **On this page** list — 14px mist entries (ink on hover), nested h3s indented, the section currently in view in ink 600 with a 6px amber (`--accent-fill`) dot hung in the left gutter, tracked via IntersectionObserver; it renders entries only when `showToc` is set (tunes cap at h2s), otherwise the column stays empty so the grid holds its shape. `part="tools"` is the right column's sticky **Use this post** block — the four `.action-pill` buttons stacked at the rail's full width: the Use with AI menu, then Suggest edits, RSS and Follow on Google. Neither part shows tags. Below 1200px neither renders; the storybar carries the tools, and headings plus the reading-progress rule carry wayfinding. Contents stays rail-only at every width — there is no inline table of contents.

**Use with AI** (`UseWithAI.astro`): a deliberate card — a bordered pill trigger (the multi-colour sparkle from `src/icons/sparkles-color.svg`, 13px/600 label, rotating chevron in mist) opening a 320px menu with a 2px ink border, 14px radius and six rows, each a 36px hairline icon tile beside a 14px/600 title and a 13px mist subtitle: Copy as Markdown, View as Markdown, then a hairline and Open in ChatGPT / Claude / Perplexity / Gemini. The provider links carry a prefilled prompt pointing at the post's canonical URL — not the `.md` twin, which ChatGPT's reader refuses on content type; the worker negotiates markdown at the canonical URL anyway. Copy fetches the twin to the clipboard and swaps its own subtitle to confirm; both markdown rows need a built site, so they 404 under `pnpm run dev`. The fourth row is Google AI Mode rather than Gemini: the Gemini web app ignores `?q=` and would open an empty box, while AI Mode is the same model reached through Search, which does take a query (`udm=50`). It renders in both the storybar and the tools rail — the two are viewport-exclusive, so only one is ever on screen. The card is a `popover`, placed in viewport coordinates by JS so the rail's `overflow-y: auto` cannot clip it and a 320px card beside the 220px rail stays inside the viewport.

Body links are ink with a 2px amber (`--accent-fill`) underline, amber text on hover. Articles close with the **tombstone** — three amber dots (`.tombstone`, `--accent-fill`); `.prose hr` uses the same three-dot mark in the text-safe `--accent` for section breaks. On non-tunes posts an **author card** (`.post-author`) follows: a `--paper-well` panel at 18px radius with the 72px avatar (56px on mobile), name, a one-line bio, and an ink "About me" button. Then share buttons, the related-terms rubric, **Keep reading** (`RelatedPosts.astro`: a 22px bold head over a two-column grid of `compact` `PostCard` tiles, chosen by shared tags), comments, and post navigation.

## Hub pages

All four use `.page-frame` with a `.page-head` and lede, and lay their content out as card grids in the frame.

**Books** (`books/index.astro`): books sort newest first by `pubDate`. The `order` frontmatter field is still required by the schema but no page reads it any more. The lede is built from the data: the count, the topics joined with `Intl.ListFormat('en-GB')`, the year span and the publishers. A **Latest book** panel follows on the tint at 22px radius. It holds the newest cover (eager, `fetchpriority="high"`, 81:100, 8px radius, soft drop shadow) beside a rubric (an amber "Latest book" label · year · publisher), an 800-weight title, the description, an ink "About the book" button and, when there's a `buyLink`, an outlined "Buy from <publisher> ↗". Then comes **The whole shelf** (`.home-section-title`): a grid of the remaining books, two columns, three from 640px and five from 1024px. Each card shows the cover with the same shadow, a `year · topic` rubric and a 700 title.

**Tags** (`tags/index.astro`): every blog tag, sorted by post count (ties alphabetical), as a card grid of one, two from 640px, three from 1024px and four from 1280px. Each card is outlined at 16px radius and tints to `--paper-well` on hover. It holds:
- the tag's cartoon avatar from `TAG_AVATAR_MAP` at 48px via `getAvatarImageUrl()`, or a "#" placeholder when the tag has no mapping
- the name and "N posts"
- the `TAG_METADATA` description clamped to two lines
- below a hairline, a separate "Latest" link to the tag's newest post

The card's main link and the Latest link are siblings, so nothing nests.

**Archives** (`archives.astro`; the card styles live in `global.css` and are shared with `/tunes/year/`): the lede reads "N entries since <first year> — X posts and Y weeks of tunes, by year." A grid of year cards follows: one column, then two, three and four at 640, 1024 and 1280px, outlined at 18px radius. Each card opens with a 16:9 three-image mosaic, one tall image on the left and two stacked on the right (`aria-hidden`). Blog covers fill it newest first, tunes art fills any gaps, and tint blanks stand in when a year has fewer than three images. Under the mosaic sit the year at 32px/800 and "N posts · M weeks of tunes". Each card links to `/{year}/`.

**Reading list** (`reading/index.astro`, `reading/page/[page].astro`, `reading/tag/[tag].astro`):
- `ReadingHeader.astro` renders a `.page-head` "Reading list" with a lede (the article count, or "N of M articles tagged X", linking to Instapaper). Under it is the topic filter: a `<nav aria-label="Filter by topic">` row of pills with counts, the active one ink-filled, closed by a hairline.
- `ReadingList.astro` groups articles by month. Each month section has a 24px bold head ("August 2026") with a count, then a grid of cards: one column, two from 640px, three from 1024px.
- A card shows the cached 1200:630 OG preview at 14px radius, or a tint placeholder with the site's favicon and domain. Then a `favicon · domain · date` rubric, a three-line title, a two-line description and small tint tag chips (plain text, not links).
- The whole card is one external link (`target="_blank"`, `rel="noopener noreferrer"`).

## The About page

`about.astro` is the credibility surface — the one page carrying the full bio (the footer has only a one-line blurb) and the depth the footer cannot fit.

It opens with a full-width `--paper-well` **intro band**, kept shallow (32px padding, 48px from 1024px):
- The clickable random avatar (84px, 64px below 640px; click to swap, with the poof animation kept) sits beside the h1 "👋 Hi there, my name is Russ." at `clamp(30px, 5vw, 56px)`/800, vertically centred on it; a lede follows.
- From 1024px, beside them, a 2×2 grid of compact **stat tiles** (28–36px numbers): posts, weeks of listening, books and glossary entries. Each links to its hub (`/archives/`, `/tunes/`, `/books/`, `/glossary/`).

**Every number is counted from the collections at build time, never hardcoded**, so the page cannot drift from the archive. The tag frequencies use the same derivation as `/author/russ-mckendrick/`, so the two pages can never disagree about what Russ writes.

Below the band, from 1024px, is a two-column layout: the bio as `.prose` in a 700px column (Geist at body size, ink, not mist; it's the page's content, and mist is only ever for what isn't), and a 360px aside. The aside holds **What I write about**, the twelve most frequent tags as `.tag-editorial` pills with counts linking to their hubs, and **Get in touch**. After that comes **The books**: every cover, newest first, in a shelf of four columns (seven from 640px) with the soft cover shadow, pinned to `aspect-ratio: 81/100` with `object-fit: cover` so rows stay level. Its head carries an "All N with buy links →" link to `/books/`. The page closes with the `HomeProjects` "Things I've built" grid.

The page does **not** re-list the social links — the footer's "Elsewhere" column already carries the full `SOCIAL_LINKS` set on every page. The avatar randomiser re-states the reduced-motion contract in JS (`matchMedia`), because `element.animate()` ignores CSS media queries and would otherwise bypass the global block entirely.

## Motion

One authored moment: listing tiles, page heads and article heads stagger in on page load — `data-entrance` on each wrapper gives an 8px rise over 450ms on `--ease-settle` (`cubic-bezier(.22,.61,.36,1)`) with 60ms sibling steps, pure CSS from first paint (never gated on JS: an opacity pre-hide waiting for a script chunk delays LCP). Article heroes may carry `data-settle` (scale 1.03 → 1). Below-the-fold list wrappers use `data-reveal`, a CSS transition triggered by the tiny inline IntersectionObserver in `RevealInit.astro` (`.is-revealed` on viewport entry, claimed with `data-reveal-bound`; the pre-hide is gated on `@media (scripting: enabled) and (prefers-reduced-motion: no-preference)`).

`data-entrance` and `data-reveal` are the only motion attributes. The legacy `.reveal*` classes are neutered no-ops and must not appear in new markup. All animation sits behind `prefers-reduced-motion: no-preference`. Hovers are colour, border and tint shifts only — no zooms, no lifts, no springs.

Shared-element view transitions: `PostCard`, `HomeLead` and `BlogPost.astro` derive matching `transition:name` values (`post-img-<slug>`, `post-title-<slug>`) from the post URL, so a listing cover morphs into the article hero on navigation.

## Callouts

One definition in `global.css` (`.callout`, `.callout-heading`, variant classes `.callout-note/tip/important/caution/warning`). Each variant sets `--callout-accent` from a per-variant ink (defined light + dark): no side rule, a 14px radius, a 9% `color-mix` tint of the variant colour over the page as the background, and a 15px/700 sans heading in normal case. `Callout.astro` maps `general`/`info` to the note treatment.

The accent ink is also the heading colour, so each variant must clear **4.5:1 against its own 9%-tinted background** — not against the bare page. The heading is 15px bold, below the large-text threshold, so 3:1 does not apply. `warning` uses the text-safe amber (`#8A5A00` light, `#F2B544` dark), about 5:1 on its tint. Re-check the ratio against the tinted blend when changing any accent.

## Third-party surfaces

- **Expressive Code:** editor/code-file frames stay quiet with hairline borders, 12px radius and Geist Mono for both code and UI, via `styleOverrides` in `astro.config.mjs`. **Terminal frames** (`.frame.is-terminal`) are restyled in `global.css` as macOS windows: 10px radius, soft shadow, real red/amber/green traffic lights drawn as pure CSS circles. Terminals always render as a **dark slate-navy profile (Catppuccin Macchiato — matching the author's real terminal)** in *both* site themes: `catppuccin-macchiato` is registered as a third EC theme whose selector never matches page-wide, and terminal frames force its token layer (`var(--2)`) over a `#24273a` body and `#2c3047` titlebar.
- **Giscus:** custom light/dark themes in `public/giscus/light.css` / `dark.css`, loaded with a `?v=` cache-busting query from `Comments.astro`.
- **Pagefind:** no stylesheet of Pagefind's is loaded — `SearchPanel.astro` renders results itself from the JS API (`/pagefind/pagefind.js`) and styles them with the design tokens.
