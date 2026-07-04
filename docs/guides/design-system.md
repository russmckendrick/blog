# Design System — "The Print Edition"

The site is styled as a high-end print journal: paper tones, serif typography, hairline rules instead of cards, mono metadata, and image-led layouts. The canonical token reference is [DESIGN.md](../../DESIGN.md) at the repo root; this guide covers how the system is implemented in code.

## Where things live

- **Tokens:** `src/styles/global.css` — CSS custom properties in `:root` (light/"paper") and `.dark` (ink and paper swapped).
- **Fonts:** registered in `astro.config.mjs` via Astro's Fonts API (`fontProviders.local()`), woff2 files in `src/assets/fonts/`, `<Font>` tags in `src/components/layout/BaseHead.astro`, Tailwind mapping in the `@theme inline` block of `global.css`.
- **Motion helpers:** `src/scripts/motion.ts` (vanilla [Motion](https://motion.dev) — no React islands).
- **Expressive Code theming:** `styleOverrides` in `astro.config.mjs` only; late CSS cannot override its build-time styles.

## Tokens

Primitives (preferred in new code):

| Token | Light | Dark | Use |
|---|---|---|---|
| `--paper` | `#F5F1E8` | `#16130E` | page background |
| `--paper-bright` | `#FBF8F1` | `#100E0A` | code frames, link previews |
| `--paper-shade` → `--paper-deepest` | `#EFE9DB`…`#D4CAB2` | `#1D1912`…`#363023` | quiet fills, hovers |
| `--ink` | `#1F1C17` | `#E9E2D2` | headings, primary copy |
| `--ink-muted` | `#5A5348` | `#B5AC97` | prose, metadata |
| `--rule` | `rgba(31,28,23,.18)` | `rgba(233,226,210,.16)` | hairline rules, frames |
| `--rule-strong` | `rgba(31,28,23,.55)` | `rgba(233,226,210,.5)` | heavy editorial rules |
| `--accent` | `#96432F` | `#D99C82` | links, active states |
| `--accent-strong` | `#7A2E20` | `#E5B29C` | hovers, filled buttons |
| `--accent-highlight` | `#8A6D1F` | `#C9A94E` | text highlights only |

**Legacy aliases:** the Material-style names (`--color-surface`, `--color-surface-container-*`, `--color-on-surface`, `--color-on-surface-variant`, `--color-primary`, `--color-secondary`, `--color-outline-variant`) are aliases of the primitives so older components keep working. `--shadow-ambient` is `none`, `--glass-bg` is opaque paper, and `--ghost-border` is a hairline — the utilities that consume them are inert by design. Never add raw hex values or Tailwind palette colours (`gray-*`, `blue-*`).

## Typography

| Face | Variable | Role |
|---|---|---|
| Fraunces | `--font-display` (`font-display`) | masthead, headlines, drop caps — weight 560 display / 540 headings / 500 h3 |
| Source Serif 4 | `--font-serif` (`font-serif`) | body at 1.125rem/1.75, prose measure ~72ch |
| IBM Plex Mono | `--font-mono` (`font-mono`) | code + metadata: datelines, rubrics |

No negative letter-spacing on headings. Dates are day-first ("13 Jun 2026") via `FormattedDate.astro`.

### Utility classes

- `.rubric` — the standard label treatment: mono, 0.8125rem, uppercase, 0.08em tracking, muted ink. Used for datelines, section rubrics, nav items, and "Previous/Next" labels.
- `.tag-editorial` — tag-like links: small mono caps with a hairline underline, accent on hover. `getTagColorClasses()` in `src/utils/tags.ts` returns this for every tag (the per-tag pastel palette is retired visually).
- `.nav-underline` — underline draw-in on hover/focus (scaleX from the left).

## Rules instead of cards

No cards, shadows, glass, gradients, or border radius (circular avatar portraits are the sole exception). Separation comes from:

- hairline rules between list entries and around every image (`border` + `--color-outline-variant`)
- heavy rules (`border-t-2`/`border-b-2` + `--rule-strong`) above featured spreads and closing page headers
- the page-header pattern: rubric line → Fraunces heading → standfirst → heavy rule

Listings are index entries: dateline, framed cover, Fraunces headline, standfirst, hairline below.

## Motion

All motion runs through `src/scripts/motion.ts` and the timing tokens `--ease-settle`, `--dur-quick` (150ms), `--dur-hover` (400ms), `--dur-page` (600ms). No springs or lift hovers.

| Attribute | Effect |
|---|---|
| `data-entrance` | staggered fade + 14px rise on page load (dateline → title → byline → hero) |
| `data-settle` | image settles from scale 1.03 with fade (article heroes) |
| `data-reveal` | fades up once when scrolled into view |
| `data-reveal="rule"` | rule draws in horizontally |

`initPageMotion()` is called from `BaseLayout.astro` and `BlogPost.astro` on load and `astro:page-load`; elements are claimed with `data-motion-claimed` so client-side navigations don't double-animate. `[data-entrance]`/`[data-settle]` start hidden only under `@media (scripting: enabled)` and are forced visible under `prefers-reduced-motion`.

Shared-element view transitions: `PostCard` and `BlogPost.astro` derive matching `transition:name` values (`post-img-<slug>`, `post-title-<slug>`) from the post URL, so the listing cover morphs into the article hero on navigation.

## Callouts

One definition in `global.css` (`.callout`, `.callout-heading`, variant classes `.callout-note/tip/important/caution/warning`). Each variant sets `--callout-accent` from a per-variant ink (defined light + dark): 2px accent left rule, 5% `color-mix` tint background, small-caps mono heading. `Callout.astro` maps `general`/`info` to the note treatment.

## Third-party surfaces

- **Expressive Code:** square corners, hairline borders, paper-tinted frames — all via `styleOverrides` in `astro.config.mjs`.
- **Giscus:** custom paper/ink themes in `public/giscus/light.css` / `dark.css`, loaded with a `?v=` cache-busting query from `Comments.astro`.
- **Pagefind:** `--pagefind-ui-*` variables + square-corner overrides in `src/pages/search.astro`.
