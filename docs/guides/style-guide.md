# Russ.Cloud Style Guide

This guide documents the visual and interaction conventions used across Russ.Cloud so future UI changes stay consistent with the current site direction: "The Reading Room", a single-author reading room in the spirit of Medium's measured calm — executed in a world that is unmistakably not Medium's.

## Design Principles

- Text leads everywhere. Cover art is subordinate in listings (a small thumbnail flush right) and earns its scale only inside articles and the tunes lead.
- Two text colours only: ink for content, mist for everything that is not content. A second grey is a bug.
- Separate content with 1px hairline rules, never cards, shadows, background shifts, or heavy rules.
- Spend the accent nowhere: hovers, tag-pill tint, tombstone, and reading-progress rule. Its scarcity is the identity. (The logo's dot and cursor are the mark's own colours, not the accent.)
- One column for everything — no sidebars, no rails. The archive's depth lives in the colophon footer.
- Motion is one authored moment (the feed stagger) plus colour-shift hovers. No springs, bounces, zooms, or lifts.
- The dark theme is a second material — warm dark paper with softened ink and accent — not an inversion.
- Visible copy is British English.

## Layout Conventions

- The default content container is `max-w-[728px] mx-auto px-6` — a 680px measure inside 24px gutters, shared by the feed, tunes, articles, and the footer blocks, so browsing and reading feel like the same room.
- Pages with genuinely wide content (cover grids, A–Z clouds) may keep `max-w-5xl`/`max-w-7xl` containers, but adopt the same page-head pattern and hairlines.
- Page heads follow one pattern: `<h1>` (global CSS styles it — sans, `clamp(2rem, 5vw, 2.625rem)`, 700; never add inline size or weight) → optional standfirst `<p class="mt-3 text-lg text-on-surface-variant leading-normal">` → a `border-b` hairline closing the head.
- No uppercase eyebrow labels above titles, no emoji inside headings, no centred hero bands — heads are left-aligned on plain paper.
- Hub pages open with `BackLink.astro` above the `<h1>`, never a hard-coded "← All X". It server-renders the section fallback (`fallbackHref="/tags/"`, `fallbackLabel="All tags"`) so cold arrivals and no-JS readers still get a destination, then rewrites itself to "← Back to the post" / "the feed" / "the archive" and calls `history.back()` when the referrer is a same-origin page outside that section. Going back through history rather than following an href is the point — it keeps the browser's scroll restoration, so a reader who tapped a tag mid-article lands where they left off. Referrers from inside the same section (tag → tag, page 2 → page 1) keep the plain fallback.
- Listing pages that show posts use `<PostCard post={p} headingLevel="..." />` rows — the only listing variant — separated by hairlines, ending in the shared `Pagination.astro` row rather than a browse link.
- A feed row is one click target, but never wrap it in a single `<a>`: the row's tag chips are real links to their hubs, and nesting `<a>` inside `<a>` is invalid. The row gets `position: relative; isolation: isolate` and an empty `<a class="post-row-link" aria-label="Read post: …">` overlaid at `inset: 0; z-index: 1`, with the chips above it at `z-index: 2`. Keep that overlay a direct child of the row — inside the heading it lands in the heading's `view-transition-name` stacking context and the thumbnail swallows clicks. Use the same shape for any new row-style listing.
- Section heads inside a page are `text-[15px] font-semibold` with `letter-spacing: -0.01em` (see "Links" in `Footer.astro`). `.rubric` is metadata treatment, never a section heading.

## Header And Footer

### Header (masthead)

- One 60px row on opaque paper with a 1px bottom hairline — no glass or blur.
- The brand lockup on the left — `Logo.astro`, one self-contained inline SVG: the iMac mark + `russ.cloud` in baked Poppins outlines (heavy ink "russ", light mist ".cloud") with a blinking block cursor on the baseline (1.1s square wave, steady under reduced motion). The dot and cursor take the mark's own colours — screen blue `#35495E` on paper, base grey `#BDC3C7` in the Night edition — and "russ"/".cloud" ride the ink/mist tokens, so the lockup follows the theme on its own. On the right, seven links (Tunes · Books · Reading List · Tags · Archive · About · Source) reduced to their 15px hairline glyphs from `Icon.astro`, held at 62% opacity in mist — the solid GitHub mark on Source at 50%, so it doesn't out-weigh the outlines beside it; hovering one (or tabbing to it) brings that glyph to full ink and unfurls its label to the right of it, the row easing outward over 150ms to the word's own width. Only the hovered item expands, so the items to its left slide along with it while the utility icons stay put. Touch devices skip the collapse and show every label — then a 16px vertical hairline (`.masthead-divider`) separating the utility icons: the search trigger and the icon-only theme toggle. Nav items and their glyphs are declared together in `MASTHEAD_ITEMS` (`src/consts.ts`); add the icon name there, not in the template, along with `external: true` for off-site destinations like Source.
- The search trigger is an `<a href="/search/">` that JS upgrades to open the **search sheet** (`SearchOverlay.astro`) — a native `<dialog>` rendered as a full-width paper band under the top edge, closed by a hairline, with the rest of the page veiled in 78% paper (`::backdrop`). Inside sits a real Pagefind input (autofocused) and a results drawer that scrolls internally; the masthead itself contains no fake input.
- The sheet opens on click, `⌘K`/`Ctrl+K`, or `/` (ignored while typing in a field), and closes on `Escape`, the X button, backdrop click, or `⌘K` again. Pagefind's JS/CSS lazy-load on first open, so pages cost nothing until search is used. On `/search/` itself the shortcuts focus the page's own input instead of opening the sheet.
- Below 768px the links collapse into a burger disclosure with `aria-controls`, `aria-expanded`, and a screen-reader-only label reflecting open/closed state; the burger swaps to an X while open, and the menu closes on `Escape` and outside clicks. Each row keeps its glyph as a 16px column, aligning with the Toggle theme row beneath. The search trigger stays out of the menu as an always-visible icon beside the burger. The breakpoint is `md`, not `sm`, because five icon-and-label pairs plus the logo no longer clear 640px.

### Footer (colophon)

- Every view ends the same way: a hairline, then two blocks in the 728px column (stacking on mobile) — **Links** (all `SOCIAL_LINKS` as 17px monochrome icons, mist at rest, ink on hover, config order; never brand colours; on mobile the icon rows centre in the column while the head stays left) beside **Listened to this week** (four 64px covers — a full-width four-across grid on mobile — latest entry title, `N weeks of listening →`).
- One `.rubric` wayfinding line closes it: `About · Archives · Reading list · Glossary · Tags · Source · RSS · © year`. No bio (the bio belongs to the About page), no location, no typeface credit.

## Typography

- **Schibsted Grotesk** is the site's voice: display and all UI. Titles bold with negative tracking that scales with size; meta small (13px) and never tracked or uppercased.
- **Literata** is article body only: 18px/30px, ~2em paragraph gaps, no indents. Serif never appears in UI; sans never appears in body copy.
- **IBM Plex Mono** is code only — terminal figures and inline code, never metadata.
- The masthead wordmark is baked Poppins outlines inside the logo SVG (`scripts/generate-logo.js`) — Poppins is never loaded as a font, so the two-face rule holds for all live text.
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
