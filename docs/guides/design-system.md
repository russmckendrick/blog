# Design System — "The Reading Room"

The site is styled as a single-author reading room: warm paper, two text colours, one hairline value, a pen-ink accent spent almost nowhere, and one column width shared by browsing and reading. The canonical token reference is [DESIGN.md](../../DESIGN.md) at the repo root; this guide covers how the system is implemented in code.

## Where things live

- **Tokens:** `src/styles/global.css` — CSS custom properties in `:root` (light, "paper") and `.dark` (the Night edition — a second material, not an inversion).
- **Fonts:** registered in `astro.config.mjs` via Astro's Fonts API (`fontProviders.local()`), woff2 files in `src/assets/fonts/`, `<Font>` tags in `src/components/layout/BaseHead.astro`, Tailwind mapping in the `@theme inline` block of `global.css`.
- **Brand lockup:** `src/components/layout/Logo.astro` renders one inline SVG from generated path data in `src/data/logo-lockup.json` (plus the mark-only `public/favicon.svg`) — both baked by `scripts/generate-logo.js`, never hand-edited.
- **Scroll reveals:** `src/components/layout/RevealInit.astro` (inline IntersectionObserver + CSS transitions — no animation library, no React islands).
- **Expressive Code theming:** `styleOverrides` in `astro.config.mjs` only; late CSS cannot override its build-time styles.

## Tokens

Primitives (preferred in new code):

| Token | Light | Dark | Use |
|---|---|---|---|
| `--paper` | `#FBFAF7` | `#161411` | the page — warm off-white, never pure white |
| `--paper-well` | `#F3F1EB` | `#211E1A` | the only fill: search input, inline code |
| `--ink` | `#1E1C18` | `#E8E3DA` | titles and body |
| `--ink-muted` | `#6F6A61` | `#A69D8F` | "mist" — everything that is not content: deks, dates, read times, captions, inactive tabs |
| `--rule` | `#ECE8E1` | `#2B2721` | the hairline — always 1px, the only separator |
| `--accent` | `#2B559E` | `#9FBCEB` | pen ink — hovers, tombstone, reading-progress rule (the logo's dot and cursor use the mark's palette, not the accent) |
| `--pill` / `--pill-hover` | `#EDF1F8` / `#E2E9F5` | `#20242E` / `#272D3B` | tag pill fill |

There is no third text tint — a second grey is a bug. Both ink and mist pass 4.5:1 on paper in both editions.

**Legacy aliases:** the Material-style names (`--color-surface`, `--color-surface-container-*`, `--color-on-surface`, `--color-on-surface-variant`, `--color-primary`, `--color-secondary`, `--color-outline-variant`) are aliases of the paper/ink primitives so older components keep working — `--color-outline-variant` *is* the hairline, `--color-secondary` *is* the accent. `--rule-strong` now aliases the plain hairline (heavy rules are retired), `--shadow-ambient` is `none`, `--glass-bg` is opaque paper, and `--ghost-border` is a hairline — the utilities that consume them are inert by design. Never add raw hex values or Tailwind palette colours (`gray-*`, `blue-*`).

**Radius:** 3px listing thumbnails and cover strips, 4px article/lead figures, full (`9999px`) pills and circular portraits, 20px search input (the Pagefind field in the search sheet and on `/search/`), 10px terminal frames. Nothing else is rounded.

## Typography

| Face | Variable | Role |
|---|---|---|
| Schibsted Grotesk | `--font-sans` + `--font-display` | display and all UI: titles bold with negative tracking that scales with size (−0.011em at 42px, −0.014em at 22–27px), headings tight at lh ≈ 1.2–1.27, meta small (13px) and never tracked |
| Literata | `--font-serif` | article body only, 18px/30px (1.125rem, lh 1.67), ~2em paragraph gaps, no indents, ~65–70 characters per line in the 680px column |
| IBM Plex Mono | `--font-mono` | code only: terminal figures and inline code — never metadata |

Serif never appears in UI; sans never appears in body copy; mono is never a metadata costume. Pull quotes (`.prose blockquote`) are large italic Literata in mist, indented, no bar. Dates are day-first ("13 Jun 2026") via `FormattedDate.astro`.

The masthead wordmark is the one exception that proves the rule: "russ" (Poppins ExtraBold) and ".cloud" (Poppins Light) exist only as SVG outline paths baked by `scripts/generate-logo.js` — Poppins is never registered or loaded as a font.

The global `h1` rule sets the page-title role (sans, `clamp(2rem, 5vw, 2.625rem)`, weight 700, −0.011em) — never add inline font-size or weight to an `<h1>`.

### Utility classes

- `.rubric` — the quiet meta line: 13px sans in mist, no uppercase, no tracking. Used for datelines, read times, feed-row meta, the storybar, and the footer wayfinding line. It is metadata treatment only — never an eyebrow heading above a title.
- `.tag-editorial` — the tag pill: 13px sans on the tinted `--pill` fill, fully rounded, ink text, `--pill-hover` on hover. `getTagColorClasses()` in `src/utils/tags.ts` returns this for every tag (the per-tag pastel palette is retired visually); labels come from `getTagName()`, which strips emoji. Do not build new chip styles.
- `.nav-underline` — legacy underline draw-in on hover/focus, kept for editorial links.
- Section heads inside a page are plain sans: `text-[15px] font-semibold` with `letter-spacing: -0.01em` (see the "Links" head in `Footer.astro`).

## Layout: one column, rules not cards

One centred column does everything: `max-w-[728px] mx-auto px-6` (680px of text inside 24px gutters) for the feed, tunes, articles, and the footer blocks. There are no sidebars or rails anywhere — the archive's depth lives in the colophon footer instead. Pages with genuinely wide content (cover grids, A–Z clouds) may keep wider containers but use the same head pattern and hairlines.

No cards, shadows (terminal figures excepted), gradients, glass, or coloured side-bars. Separation comes from the single 1px hairline (`border` + `--color-outline-variant`): masthead edge, feed-row dividers, storybar, tab baselines, Contents block, footer top.

**Page head pattern:** `<h1>` (globally styled) → optional standfirst `<p class="mt-3 text-lg text-on-surface-variant leading-normal">` → a `border-b` hairline closing the head. No eyebrow labels, no emoji in titles, no centred hero bands.

## The feed row

`PostCard.astro` renders the one listing row (the legacy variants all collapse onto it):

- title — sans 24px/700 (16px below `sm`), −0.014em, 2-line clamp, accent on group hover; spans the full row width at every breakpoint. Sizes live in the unlayered `.feed-title` rule in `global.css` — the global `h2` element rule outranks Tailwind's layered size utilities, so utility classes cannot set this size
- dek — 16px mist, full text (no clamp), hidden on mobile
- meta — `.rubric` line: `date · read time · tags` (tag names hide below 480px), plus `· AI-generated` on tunes rows; bottom-anchored so it sits on the thumbnail's bottom edge (`sm+`; below `sm` it sits directly under the title, above the banner)
- thumbnail — 160×107 flush right in the lower band, bottom-aligned with the meta line, 3px radius, LQIP blur-up; below `sm` the row stacks vertically instead — full-width title, then the meta line, then a full-width centre-cropped 2:1 banner (`aspect-[2/1]`, 3/4 of the natural 3:2 height) closing the row (the image never sits beside the title)

A hairline separates rows. Listing pages compose rows inside the 728px column, with `headingLevel` set for the page's outline. The home tab row (`TagTabs.astro`) doubles as topic navigation — real tags, active state = 1px ink underline sitting on the baseline hairline. The tunes index reuses the same grammar with a 21:9 lead banner, the eight-cover film strip (square, 3px radius, 4-across on mobile), and the `russ.fm · Last.fm · Discogs` line; the AI-generated attribution stays in the lead meta line — non-negotiable.

Listings end in **pagination** (`Pagination.astro`), not a browse link: a quiet 14px sans row laid out as a `1fr auto 1fr` grid — the numeral cluster centred in the column, current page in ink 600 with a 1px ink underline (the active-tab idiom), ellipses toward the ends, `← Newer posts` flush left and `Older posts →` flush right (tunes swaps in "weeks", the reading list in "articles"). Both steps render on every page: when there is no page in that direction the step is a static span dimmed to 40% opacity instead of a link. Below 640px the Older/Newer labels collapse to bare arrows (the full label stays as the link's accessible name) so the row keeps to one line; prev/next carry `rel="prev"`/`rel="next"`, and an ellipsis is only rendered when it hides more than one page.

## Masthead and colophon footer

**Masthead** (`Header.astro`): one 60px row on opaque paper with a 1px bottom hairline — the brand lockup left, rendered by `Logo.astro` as a single self-contained inline SVG: the iMac mark plus `russ.cloud` in baked Poppins outlines (heavy "russ" in `--ink`, light ".cloud" in `--ink-muted`) and a blinking block cursor sitting on the baseline (`1.1s steps(1, end)`, held solid under `prefers-reduced-motion`). The dot and cursor borrow the mark's own palette via the component's `--logo-punct` variable — its screen blue `#35495E` on paper, its base grey `#BDC3C7` in the Night edition — while "russ"/".cloud" ride the ink/mist tokens, so the whole lockup flips with the theme; the mark keeps its own navy/grey fills (per-part classes are in place if a theme override is ever wanted). Right, four text links (Tunes · Books · Archive · About) in mist, a 16px vertical hairline (`.masthead-divider`), then the icon-only search trigger and theme toggle. Below 640px the links collapse into a burger-menu disclosure with the search icon staying visible beside it. Then silence until the footer.

**Search sheet** (`SearchOverlay.astro`, rendered by `Header.astro`): the search trigger is an `<a href="/search/">` that JS upgrades to a native `<dialog>` — a full-width paper band pinned to the top edge, closed by a hairline, the page behind veiled in 78% paper. A quiet 13px mist "Search the archive" label and X button head the column (728px, matching the site measure); beneath, the real Pagefind input (20px radius, `--paper-well`) stays pinned while the results drawer scrolls internally. Opens on click, `⌘K`/`Ctrl+K`, or `/`; closes on `Escape`, X, backdrop, or `⌘K`. Pagefind assets lazy-load on first open; Pagefind UI variables are themed on `body` in `global.css` (not `:root`, which pagefind-ui.css would override at runtime) so both the sheet and `/search/` follow the palette in both editions. No card, no shadow — the sheet is the masthead unfolding, not a floating box.

**Colophon footer** (`Footer.astro`): every view ends the same way — a hairline, then two blocks in the 728px column (stacking on mobile): **Links** (the full `SOCIAL_LINKS` set as 17px monochrome `Icon.astro` icons — mist at rest, ink on hover, config order; never brand colours; on mobile the icon rows centre in the column while the head stays left) beside **Listened to this week** (four 64px covers — a full-width four-across grid on mobile — latest entry title, `N weeks of listening →`). One `.rubric` line closes it: `About · Archives · Reading list · Glossary · Tags · Source · RSS · © year`. No bio, no location, no typeface credit — and no photo of Russ anywhere in the design.

## The article

`BlogPost.astro`: balanced sans title → mist standfirst → single-line byline — a 36px circular **tag-based avatar** (the illustrated set in `public/images/avatars/`, first mapped tag wins via `TAG_AVATAR_MAP` in `src/consts.ts`, `anon.svg` fallback; tunes use the AI author's avatar) beside `Russ McKendrick · 9 min read · 19 Jul 2026` (name in ink, the rest mist). Then the hairline **storybar**: tags left, `Read as Markdown · Suggest edits · RSS` right, both as `.rubric` lines. Hero figure at column width, 4px radius. A 2px accent **reading-progress rule** fixed to the top viewport edge runs on article pages only — no gradient, no glow.

**Article rail** (`ArticleRail.astro`): an always-open, sticky utility column in the right margin beside the centred article column on viewports ≥1200px. Hairline left rule and three headed sections (13px/600 heads): **Contents** — 13px mist entries (ink on hover), nested h3s indented, the section currently in view highlighted in ink 600 via IntersectionObserver, rendered only when `showToc` is set (tunes cap at h2s); **Tags** — small tinted pills (`.tag-editorial--sm`); **Actions** — Read as Markdown, Suggest edits, RSS. Below 1200px the rail doesn't render — tags remain at the article foot, and headings plus the reading-progress rule carry wayfinding. Feed-row meta lines show up to three `.tag-editorial--sm` pills.

Body links are ink with a real underline, accent on hover only. Articles close with the **tombstone** — three accent dots (`.tombstone`), the same mark `.prose hr` uses for section breaks — then tag pills, the related-terms rubric, and two "More from the archive" rows.

## Motion

One authored moment: feed rows stagger in on page load — `data-entrance` on each row wrapper gives an 8px rise over 450ms on `--ease-settle` (`cubic-bezier(.22,.61,.36,1)`) with 60ms sibling steps, pure CSS from first paint (never gated on JS: an opacity pre-hide waiting for a script chunk delays LCP). Article heads reuse the same attribute; article heroes may carry `data-settle` (scale 1.03 → 1). Below-the-fold list wrappers use `data-reveal`, a CSS transition triggered by the tiny inline IntersectionObserver in `RevealInit.astro` (`.is-revealed` on viewport entry, claimed with `data-reveal-bound`; the pre-hide is gated on `@media (scripting: enabled) and (prefers-reduced-motion: no-preference)`).

`data-entrance` and `data-reveal` are the only motion attributes. The legacy `.reveal*` classes are neutered no-ops and must not appear in new markup. All animation sits behind `prefers-reduced-motion: no-preference`. Hovers are colour shifts only — no zooms, no lifts, no springs.

Shared-element view transitions: `PostCard` and `BlogPost.astro` derive matching `transition:name` values (`post-img-<slug>`, `post-title-<slug>`) from the post URL, so the listing cover morphs into the article hero on navigation.

## Callouts

One definition in `global.css` (`.callout`, `.callout-heading`, variant classes `.callout-note/tip/important/caution/warning`). Each variant sets `--callout-accent` from a per-variant ink (defined light + dark): 2px accent left rule, 5% `color-mix` tint background, small-caps mono heading. `Callout.astro` maps `general`/`info` to the note treatment.

## Third-party surfaces

- **Expressive Code:** editor/code-file frames stay quiet with hairline borders and paper-tinted chrome, via `styleOverrides` in `astro.config.mjs`. **Terminal frames** (`.frame.is-terminal`) are the one deliberate exception to the flat, shadowless language — restyled in `global.css` as macOS windows: 10px radius, soft shadow (the only shadow in the system), real red/amber/green traffic lights drawn as pure CSS circles. Terminals always render as a **dark slate-navy profile (Catppuccin Macchiato — matching the author's real terminal)** in *both* site themes: `catppuccin-macchiato` is registered as a third EC theme whose selector never matches page-wide, and terminal frames force its token layer (`var(--2)`) over a `#24273a` body and `#2c3047` titlebar.
- **Giscus:** custom paper/ink themes in `public/giscus/light.css` / `dark.css`, loaded with a `?v=` cache-busting query from `Comments.astro`.
- **Pagefind:** `--pagefind-ui-*` variables in `src/pages/search.astro`.
