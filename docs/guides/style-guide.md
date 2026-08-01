# Russ.Cloud Style Guide

This guide documents the visual and interaction conventions used across Russ.Cloud so future UI changes stay consistent with the current site direction: "The Reading Room", a single-author reading room in the spirit of Medium's measured calm — executed in a world that is unmistakably not Medium's.

## Design Principles

- Text leads everywhere. Cover art is subordinate in listings (a small thumbnail flush right) and earns its scale only inside articles and the tunes lead.
- Two text colours only: ink for content, mist for everything that is not content. A second grey is a bug.
- Separate content with 1px hairline rules, never cards, shadows, background shifts, or heavy rules.
- Spend the accent nowhere: the wordmark dot, hovers, tag-pill tint, tombstone, and reading-progress rule. Its scarcity is the identity.
- One column for everything — no sidebars, no rails. The archive's depth lives in the colophon footer.
- Motion is one authored moment (the feed stagger) plus colour-shift hovers. No springs, bounces, zooms, or lifts.
- The dark theme is a second material — warm dark paper with softened ink and accent — not an inversion.
- Visible copy is British English.

## Layout Conventions

- The default content container is `max-w-[728px] mx-auto px-6` — a 680px measure inside 24px gutters, shared by the feed, tunes, articles, and the footer blocks, so browsing and reading feel like the same room.
- Pages with genuinely wide content (cover grids, A–Z clouds) may keep `max-w-5xl`/`max-w-7xl` containers, but adopt the same page-head pattern and hairlines.
- Page heads follow one pattern: `<h1>` (global CSS styles it — sans, `clamp(2rem, 5vw, 2.625rem)`, 700; never add inline size or weight) → optional standfirst `<p class="mt-3 text-lg text-on-surface-variant leading-normal">` → a `border-b` hairline closing the head.
- No uppercase eyebrow labels above titles, no emoji inside headings, no centred hero bands — heads are left-aligned on plain paper.
- Listing pages that show posts use `<PostCard post={p} headingLevel="..." />` rows — the only listing variant — separated by hairlines, ending in the shared `Pagination.astro` row rather than a browse link.
- Section heads inside a page are `text-[15px] font-semibold` with `letter-spacing: -0.01em` (see "Links" in `Footer.astro`). `.rubric` is metadata treatment, never a section heading.

## Header And Footer

### Header (masthead)

- One 60px row on opaque paper with a 1px bottom hairline — no glass or blur.
- Logo + `russ.cloud` wordmark (the dot is the one accent character), then the search pill (a quiet `--paper-well` well linking to `/search/`), then four plain text links (Tunes · Books · Archive · About) in mist, ink on hover, and the icon-only theme toggle.
- Below 640px the links collapse into a burger disclosure with `aria-controls`, `aria-expanded`, and a screen-reader-only label reflecting open/closed state; the burger swaps to an X while open, and the menu closes on `Escape` and outside clicks.

### Footer (colophon)

- Every view ends the same way: a hairline, then two blocks in the 728px column (stacking on mobile) — **Links** (all `SOCIAL_LINKS` as 17px monochrome icons, mist at rest, ink on hover, config order; never brand colours) beside **Listened to this week** (four 64px covers, latest entry title, `N weeks of listening →`).
- One `.rubric` wayfinding line closes it: `About · Archives · Reading list · Glossary · Tags · Source · RSS · © year`. No bio (the bio belongs to the About page), no location, no typeface credit.

## Typography

- **Schibsted Grotesk** is the site's voice: display and all UI. Titles bold with negative tracking that scales with size; meta small (13px) and never tracked or uppercased.
- **Literata** is article body only: 18px/30px, ~2em paragraph gaps, no indents. Serif never appears in UI; sans never appears in body copy.
- **IBM Plex Mono** is code only — terminal figures and inline code, never metadata.
- Use `.rubric` for datelines, read times, and meta lines; `getTagColorClasses()` (which returns `.tag-editorial`) for tag links, with labels from `getTagName()` (no emoji).
- Dates render day-first ("13 Jun 2026") via `FormattedDate.astro`.
- See [Design System](./design-system.md) for the full token and type-role reference.

## Colour And Rules

- Colours are CSS custom properties in `src/styles/global.css` with automatic light/dark adaptation. Never use raw hex values or Tailwind palette colours (`gray-*`, `blue-*`).
- The single accent is blue-black pen ink (`--accent`, aliased as `--color-secondary`), lifting to a soft blue in dark mode. There is no burnt orange anywhere — that was the Print Edition.
- Hairlines are always 1px `--color-outline-variant` (`border-b`, `border-t`). Never use `border-b-2`/`border-t-2` or `var(--rule-strong)` — heavy rules are retired.
- Radius rules: 3px listing thumbnails, 4px article figures, fully rounded pills and portraits, 10px terminal frames. Nothing else is rounded.
- Hover states are colour shifts (mist → ink, ink → accent) and the active-tab ink underline, never shadows or translation.

## Motion And Interaction

- Timing tokens: `--ease-settle` / `--dur-quick` / `--dur-hover` / `--dur-page`. No animation library ships.
- **Page-load stagger**: wrap feed rows or head elements with `data-entrance` — pure CSS from first paint (8px rise, 450ms, 60ms sibling steps). Never gate it on a script chunk.
- **Scroll reveals**: mark below-the-fold list wrappers with `data-reveal` (fade up once, driven by the inline observer in `src/components/layout/RevealInit.astro`).
- `data-entrance` and `data-reveal` are the **only** motion attributes. The legacy `.reveal`, `.reveal-stagger`, `.animate-fade-in`, and `.animate-delay-*` classes are dead or neutered — remove them on sight, never add them.
- **Shared-element transitions**: listing images/titles and the article hero/title carry matching `transition:name` values derived from the post URL, so the cover morphs into the article hero on navigation.
- Respect `prefers-reduced-motion`: entrance animations and reveal transitions apply only under `no-preference` (reveals additionally require `scripting: enabled`, so no-JS users always see content), and smooth scrolling/view-transition animations are disabled.
- Focus states use `:focus-visible` with a 2px accent outline.

## Accessibility Baseline

- Every layout must expose a skip link to `#main-content`.
- Main content regions should remain focusable with `tabindex="-1"` when needed for skip-link targeting.
- Icon-only controls require accessible names; keep existing `aria-label`s and roles when restyling.
- Mobile menus and other toggles should be keyboard-operable and close on `Escape`.
- Listing rows set `headingLevel` so the page outline stays sensible.

## Images And Media

- Prefer stable image layout over purely decorative loading behaviour.
- For inline post images, use `Img` with intrinsic dimensions where possible; when they cannot be inferred, provide `height` and/or `aspectRatio` to prevent CLS.
- Listing thumbnails and the tunes lead use LQIP blur-up backgrounds behind the Cloudflare-transformed image.
- Reserve space for deferred embeds such as comments or third-party widgets before they load.

## Implementation References

- Design tokens and utility classes: `src/styles/global.css`
- Scroll-reveal observer: `src/components/layout/RevealInit.astro`
- Design system documentation: [Design System](./design-system.md)
- Header: `src/components/layout/Header.astro`
- Footer: `src/components/layout/Footer.astro`
- Feed row: `src/components/blog/PostCard.astro`
- Feed tabs: `src/components/home/TagTabs.astro`
- Pagination: `src/components/layout/Pagination.astro`
- Article layout: `src/layouts/BlogPost.astro`
- Contents block: `src/components/blog/TableOfContents.astro`
- Inline image embed: `src/components/embeds/Img.astro`
- Comments embed: `src/components/blog/Comments.astro`
