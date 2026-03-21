# Design System — "The Curated Journal"

The blog uses a design system called "The Curated Journal," an editorial aesthetic inspired by high-end print magazines. It prioritises tonal layering over borders, generous whitespace, and a typographic hierarchy that gives content room to breathe.

All design tokens are defined as CSS custom properties in `src/styles/global.css` and automatically adapt between light and dark modes via the `.dark` class on `<html>`.

## Colors & Surface Hierarchy

Depth is achieved through **tonal layering** — shifting background colors rather than drawing borders.

### Light Mode (`:root`)

| Token | Value | Usage |
|---|---|---|
| `--color-primary` | `#00288e` | High-impact brand moments, blockquote borders |
| `--color-primary-container` | `#1e40af` | CTA gradient endpoint |
| `--color-secondary` | `#0058be` | Links, interactive accents, reading progress bar |
| `--color-surface` | `#f8f9fa` | Page background (`<body>`) |
| `--color-surface-container-lowest` | `#ffffff` | Cards, article containers |
| `--color-surface-container-low` | `#f3f4f5` | Footer, author info box, mobile menu, pagination |
| `--color-surface-container` | `#edeeef` | Section breaks, inline code bg, `<hr>` |
| `--color-surface-container-high` | `#e2e3e5` | Hover states |
| `--color-surface-container-highest` | `#d6d8db` | Active pagination page |
| `--color-on-surface` | `#191c1d` | Primary text (never pure black) |
| `--color-on-surface-variant` | `#44474f` | Secondary text, metadata, descriptions |

### Dark Mode (`.dark`)

All tokens are redefined for dark surfaces. The surface scale inverts so "higher" containers become lighter:

| Token | Value |
|---|---|
| `--color-surface` | `#111418` |
| `--color-surface-container-lowest` | `#0b0e12` |
| `--color-on-surface` | `#e2e2e6` |
| `--color-primary` | `#a4c8ff` |
| `--color-secondary` | `#8ecaff` |

See `src/styles/global.css` for the complete dark mode token set.

### The "No-Line" Rule

**1px solid borders are not used for sectioning.** Separation between regions (header, content, footer, pagination) is achieved through background color shifts. For example, the footer uses `.surface-container-low` against the page `.surface` background.

When accessibility requires a visible container boundary, use the **ghost border**: `outline: var(--ghost-border)` — a 15% opacity outline that is felt, not seen.

## Elevation & Depth

Shadows are used sparingly for floating elements, not for general card elevation.

| Token | Value | Usage |
|---|---|---|
| `--shadow-ambient` | `0 12px 40px rgba(25,28,29,0.04)` | Cards, header |
| `--shadow-ambient-hover` | `0 16px 48px rgba(25,28,29,0.08)` | Card hover states |
| `--ghost-border` | `1px solid rgba(196,197,213,0.15)` | Subtle container boundaries |
| `--glass-bg` | `rgba(255,255,255,0.7)` | Glassmorphic header |
| `--glass-blur` | `blur(16px)` | Backdrop blur for glass elements |

## Typography

Two font families provide a high-contrast pairing:

| Role | Font | Tailwind Class | CSS Variable |
|---|---|---|---|
| Display / Headlines | Plus Jakarta Sans | `font-display` | `--font-display` |
| Body / UI | Inter | `font-sans` | `--font-sans` |
| Code | JetBrains Mono | `font-mono` | `--font-mono` |
| Decorative / Serif | Crimson Pro | `font-serif` | `--font-serif` |

Font files are self-hosted in `public/fonts/`:
- Plus Jakarta Sans: weights 400, 500, 600, 700, 800 (latin woff2)
- Inter: variable font (latin woff2)
- JetBrains Mono: weights 400, 500, 600
- Crimson Pro: weights 400, 500, 600 + italic 400, 500

Body text uses 17px / 1.7 line-height. Headings use `font-display` with tight tracking.

## Utility Classes

These classes are defined in `src/styles/global.css` and map directly to design tokens:

### Surfaces
- `.surface` — page background
- `.surface-container-lowest` — cards
- `.surface-container-low` — footer, author box, mobile menu
- `.surface-container` — section breaks, theme toggle area
- `.surface-container-high` — hover states
- `.surface-container-highest` — active states

### Text
- `.text-on-surface` — primary text
- `.text-on-surface-variant` — secondary/metadata text

### Effects
- `.glass` — glassmorphic background + backdrop blur
- `.shadow-ambient` — diffused ambient shadow
- `.ghost-border` — subtle outline boundary

## Component Patterns

### Header (`src/components/layout/Header.astro`)
- Non-transparent state: `.glass .shadow-ambient` (no border)
- Transparent state (blog posts): gradient overlay for readability over hero images
- Scrolled state: glassmorphic with ambient shadow, defined in `.header-scrolled` CSS
- Mobile menu: `.surface-container-low` background shift (no `border-t`)

### Footer (`src/components/layout/Footer.astro`)
- `.surface-container-low` background shift (no `border-t`)
- Text uses `.text-on-surface-variant`

### Post Cards (`src/components/blog/PostCard.astro`)
Four variants (vertical, featured, grid, horizontal), all sharing:
- `.surface-container-lowest` background
- `.ghost-border` outline
- `.shadow-ambient` elevation
- Hover: `shadow-[0_16px_48px_rgba(25,28,29,0.08)]` + translate
- Headings: `.font-display`
- Date accent: `color: var(--color-secondary)`
- Tag colors: per-tag system from `consts.ts` (preserved, not overridden by design tokens)

### Blog Post Layout (`src/layouts/BlogPost.astro`)
- Article card: `.surface-container-lowest .shadow-ambient .ghost-border`
- Author info box: `.surface-container-low .ghost-border` (no colored border)
- Title: `.font-display` with `clamp(2.25rem, 5vw, 3.5rem)`
- Hero gradient: dynamic colors from `hero-colors.json`, terminal color uses `var(--color-surface)`

### Pagination (`src/components/layout/Pagination.astro`)
- `.surface-container-low` background with rounded corners (no `border-t`)
- Active page: `.surface-container-highest` background
- Hover: `.surface-container-high` background

### Reading Progress Bar
- 2px fixed bar at viewport top, `z-index: 9999`
- Color: `var(--reading-progress-color)` (secondary in light, lighter blue in dark)
- Scroll-tracking script in both `BaseLayout.astro` and `BlogPost.astro`

### Prose Content (`src/styles/global.css` `.prose` block)
- Headings: `var(--font-display)`, `var(--color-on-surface)`
- Body text: `var(--color-on-surface-variant)`
- Links: `var(--color-secondary)` with 40% opacity underline
- Blockquotes: `var(--color-primary)` left border, `var(--color-surface-container-low)` background
- Tables: ghost-border outlines (no solid cell borders)
- `<hr>`: 1px background-based separator, no border
- Inline code: `var(--color-surface-container)` background

## Do's and Don'ts

### Do
- **Use tonal layering** — separate sections by shifting background colors, not adding borders
- **Embrace whitespace** — generous padding and section gaps
- **Image-first design** — every article card should be anchored by a curated hero image
- **Use `--color-on-surface`** for text — never pure `#000000`

### Don't
- **Don't use 1px borders** for sectioning — use background shifts or ghost borders
- **Don't use dividers** — increase padding or change background tone instead
- **Don't crowd margins** — maintain wide gutters on desktop

## Preserved Systems

These existing systems are not overridden by the design tokens:

- **Tag colors** — per-tag color pairs defined in `src/consts.ts` (`TAG_METADATA`)
- **Hero gradients** — dynamic color extraction from post images (`src/data/hero-colors.json`)
- **Dark mode toggle** — class-based (`.dark` on `<html>`), localStorage persistence
- **Focus rings** — Tailwind `ring-blue-500/50` (functional, not decorative)
