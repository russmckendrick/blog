# Russ.Cloud Style Guide

This guide documents the visual and interaction conventions used across Russ.Cloud so future UI changes stay consistent with the current site direction: "Workbench" — a clean white page, near-black ink, one face (Geist) for everything, and an amber accent, with an image-led homepage and a wide article layout.

## Design Principles

- Cover art leads: the homepage lead cover, the 16:10 listing tiles on every listing, the tunes lead and the article hero.
- Two text colours only: ink for content, mist for everything that is not content. A second grey is a bug.
- Separate content with 1px hairlines, the single `--paper-well` tint surface, or hairline-outlined tiles — never gradients, glass, coloured side bars or drop shadows. The exceptions are terminal figures and book covers, which carry a soft drop shadow.
- Amber is the one accent. As a fill (`--accent-fill`) it marks: the reading-progress bar, the "Latest" badge, the active-contents dot, the tombstone, the prose link underline. As text it is always the darker, text-safe `--accent`. (The logo's dot and cursor are the mark's own colours, not the accent.)
- One frame: every page sits in the same 1320px frame. Hubs lay out card grids in it; only the search and glossary pages cap their content at a 760px measure.
- Motion is one authored moment (the page-load stagger) plus colour and tint hovers. No springs, bounces, zooms, or lifts.
- Light is the default theme. Dark is opt-in from the toggle (stored in `localStorage.theme`) — the system `prefers-color-scheme` is not consulted.
- Visible copy is British English.

## Layout Conventions

- The wide frame is `max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-10` — masthead, footer, the homepage sections and the article's header, hero and three-column body.
- Pages use `.page-frame` from `global.css`, the same frame as a class (16/24/40px gutters). Listings and hubs (`/page/N/`, years, tags, the author hub, tunes and its browse pages, books, archives, the reading list, About) use it bare. Only search, the glossary index and glossary terms add `.page-frame--text`, which caps each child at 760px, left-aligned.
- Inside the article the text column is 700px; from 1200px the contents rail (left) and tools rail (right) flank it as 220px grid columns (`.post-columns` in `global.css`).
- Pages with other wide content (cover grids, A–Z clouds) lay out their own grids inside the frame, but adopt the same page-head pattern and hairlines.
- Page heads follow one pattern: `<header class="page-head">` holding the `<h1>` (sized by `.page-head h1` — `clamp(2.25rem, 5.5vw, 3.75rem)`, 800, −0.04em; never add inline size or weight) → an optional `<p class="page-lede">` (mist, 18px / 20px from 640px) → the head's own hairline. When tabs follow immediately, drop that hairline (`!border-b-0`) and let the tab baseline close the head. Listings get a visible head too — `/page/N/` is "Writing", `/tunes/` "Listened to This Week".
- No uppercase eyebrow labels above titles, no emoji inside headings, no centred hero bands — heads are left-aligned on the plain page (the article title included — it aligns to the hero's left edge).
- Hub pages open with `BackLink.astro` above the `<h1>`, never a hard-coded "← All X". It server-renders the section fallback (`fallbackHref="/tags/"`, `fallbackLabel="All tags"`) so cold arrivals and no-JS readers still get a destination, then rewrites itself to "← Back to the post" / "the feed" / "the archive" and calls `history.back()` when the referrer is a same-origin page outside that section. Going back through history rather than following an href is the point — it keeps the browser's scroll restoration, so a reader who tapped a tag mid-article lands where they left off. Referrers from inside the same section (tag → tag, page 2 → page 1) keep the plain fallback.
- Listing pages that show posts — the homepage's "Recent writing" included — render `<PostCard post={p} headingLevel="..." />` tiles inside the `.feed` grid (1 column, 2 from 640px, 3 from 1024px), ending in the shared `Pagination.astro` row rather than a browse link. Pass `compact` to drop the description in dense contexts ("Keep reading"), and `priority` on the first two tiles of a listing whose tiles open the page.
- Hubs that aren't post listings use their own card grids in the same grammar: the books shelf, tag cards, archive year cards and reading-list cards (see [Design System](./design-system.md#hub-pages)).
- A tile is one `<a>` wrapping cover, meta, title and description. Keep links out of it: a tile that needs tag links or other controls inside it can no longer be a single anchor, since `<a>` inside `<a>` is invalid.
- Section heads inside a text page are `text-[15px] font-semibold` with `letter-spacing: -0.01em` (see "Often appears with" on the tag hubs); homepage sections (and "Previous weeks" on `/tunes/`, "The whole shelf" on `/books/`, "The books" on About) use the shared `.home-section-head` / `.home-section-title` / `.home-section-link` classes in `global.css`. `.rubric` is metadata treatment, never a section heading.

## Header And Footer

### Header (masthead)

- One 68px row on the opaque page, inside the 1320px frame, with a 1px bottom hairline — no glass or blur.
- The brand lockup on the left — `Logo.astro`, one self-contained inline SVG: the iMac mark + `russ.cloud` in baked Poppins outlines (heavy ink "russ", light mist ".cloud") with a blinking block cursor on the baseline (1.1s square wave, steady under reduced motion). The dot and cursor take the mark's own colours — screen blue `#35495E` in light, base grey `#BDC3C7` in dark — and "russ"/".cloud" ride the ink/mist tokens, so the lockup follows the theme on its own. On the right, seven links (Tunes · Books · Reading List · Tags · Archive · About · Source) reduced to their 15px hairline glyphs from `Icon.astro`, held at 62% opacity in mist — the solid GitHub mark on Source at 50%, so it doesn't out-weigh the outlines beside it; hovering one (or tabbing to it) brings that glyph to full ink and unfurls its label to the right of it, the row easing outward over 150ms to the word's own width. Only the hovered item expands, so the items to its left slide along with it while the utility icons stay put. Touch devices skip the collapse and show every label — then a 16px vertical hairline (`.masthead-divider`) separating the utility icons: the search trigger and the icon-only theme toggle. Nav items and their glyphs are declared together in `MASTHEAD_ITEMS` (`src/consts.ts`); add the icon name there, not in the template, along with `external: true` for off-site destinations like Source.
- The search trigger is an `<a href="/search/">` that JS upgrades to open the **search sheet** (`SearchOverlay.astro`) — a native `<dialog>` rendered as a full-width page-coloured band under the top edge, closed by a hairline, with the rest of the page veiled at 78% (`::backdrop`). Inside sits a real Pagefind input (autofocused) and a results drawer that scrolls internally; the masthead itself contains no fake input.
- The sheet opens on click, `⌘K`/`Ctrl+K`, or `/` (ignored while typing in a field), and closes on `Escape`, the X button, backdrop click, or `⌘K` again. Pagefind's JS/CSS lazy-load on first open, so pages cost nothing until search is used. On `/search/` itself the shortcuts focus the page's own input instead of opening the sheet.
- Below 768px the links collapse into a burger disclosure with `aria-controls`, `aria-expanded`, and a screen-reader-only label reflecting open/closed state; the burger swaps to an X while open, and the menu closes on `Escape` and outside clicks. Each row keeps its glyph as a 16px column, aligning with the Toggle theme row beneath. The search trigger stays out of the menu as an always-visible icon beside the burger. The breakpoint is `md`, not `sm`, because five icon-and-label pairs plus the logo no longer clear 640px.

### Footer

- Every view ends the same way: a `--paper-well` tint footer with a hairline top, in the 1320px frame. It has one column on phones, two from 640px, and four from 1024px (three when the tunes column is hidden).
- The columns are **Brand** (the logo, a one-line blurb, a "Subscribe via RSS" pill), **Explore** (Home, Tunes, Books, Reading list, Tags, Archives, Glossary, About), **Elsewhere** (every `SOCIAL_LINKS` entry as icon plus visible name from `SOCIAL_LABELS`, two columns, `rel="noopener noreferrer me"`) and **Listened to this week** (four 72px covers, latest entry title, `N weeks of listening →`).
- The Explore list lives in `Footer.astro` itself; `FOOTER_NAV` in `src/consts.ts` is no longer read by the footer. Social icons stay monochrome — never brand colours.
- The homepage omits **Listened to this week**, since it has its own tunes panel: it passes `footerTunes={false}` to `BaseLayout`, which hands it to `Footer`'s `showTunes` prop (both default to `true`).
- A hairline bottom bar closes it: "© year Russ McKendrick" on the left, "Source on GitHub · RSS · Back to top ↑" on the right. The full bio belongs to the About page.

## Typography

- **Geist** is the one face for everything: UI, headings and article body. Headings are heavy and tight (h1 800 at −0.035em, h2 700 at −0.025em); meta is small (13px) and never tracked or uppercased. There is no serif.
- Article body (`.prose`) is Geist 19px/1.75 (17px/1.7 on mobile), with in-body h2s at 30px/700.
- **Geist Mono** is code only — Expressive Code, inline code, terminal figures — never metadata.
- The masthead wordmark is baked Poppins outlines inside the logo SVG (`scripts/generate-logo.js`) — Poppins is never loaded as a font, so the Geist + Geist Mono pair holds for all live text.
- Use `.rubric` for datelines, read times, and meta lines; `getTagColorClasses()` (which returns `.tag-editorial`) for tag links, with labels from `getTagName()` (no emoji).
- Dates render day-first ("13 Jun 2026") via `FormattedDate.astro`.
- See [Design System](./design-system.md) for the full token and type-role reference.

## Colour And Rules

- Colours are CSS custom properties in `src/styles/global.css` with automatic light/dark adaptation. Never use raw hex values or Tailwind palette colours (`gray-*`, `blue-*`).
- The single accent is amber. `--accent-fill` (`#F2B544`) is for fills only and never text — it fails contrast on white; `--accent` (aliased as `--color-secondary`) is the text-safe shade, `#8A5A00` in light and the full amber in dark.
- Hairlines are always 1px (`border-b`, `border-t`). `--color-outline-variant` is the rule; `--rule-strong` is reserved for hover borders on outlined pills and tiles and the homepage's outlined buttons. Never use `border-b-2`/`border-t-2`.
- Radius rules: fully rounded pills, badges and avatars; 14–22px for covers, listing tiles, hub cards and tint panels (stepping up at 1024px); 8px book covers on `/books/`; 14px callouts; 12px Expressive Code frames; 10px terminal frames; 8px action pills; 3px the tunes-index record strip.
- Hover states are colour, border and tint shifts (mist → ink, ink → amber, hairline → `--rule-strong` with a `--paper-well` fill) and the active-tab ink underline, never shadows or translation.

## Motion And Interaction

- Timing tokens: `--ease-settle` / `--dur-quick` / `--dur-hover` / `--dur-page`. No animation library ships.
- **Page-load stagger**: wrap listing tiles or head elements with `data-entrance` — pure CSS from first paint (8px rise, 450ms, 60ms sibling steps). Never gate it on a script chunk.
- **Scroll reveals**: mark below-the-fold list wrappers with `data-reveal` (fade up once, driven by the inline observer in `src/components/layout/RevealInit.astro`).
- `data-entrance` and `data-reveal` are the **only** motion attributes. The legacy `.reveal`, `.reveal-stagger`, `.animate-fade-in`, and `.animate-delay-*` classes are dead or neutered — remove them on sight, never add them.
- **Shared-element transitions**: listing images/titles and the article hero/title carry matching `transition:name` values derived from the post URL, so the cover morphs into the article hero on navigation.
- Respect `prefers-reduced-motion`: entrance animations and reveal transitions apply only under `no-preference` (reveals additionally require `scripting: enabled`, so no-JS users always see content), and smooth scrolling/view-transition animations are disabled.
- Focus states use `:focus-visible` with a 2px accent outline.

## Accessibility Baseline

- Every layout must expose a skip link to `#main-content`.
- Main content regions should remain focusable with `tabindex="-1"` when needed for skip-link targeting.
- Icon-only controls require accessible names; keep existing names and roles when restyling. Name icon-only **links** with a `sr-only` span (accessible name *and* anchor text), and buttons with `aria-label` — see [accessibility.md](./accessibility.md#naming-icon-only-links).
- Mobile menus and other toggles should be keyboard-operable and close on `Escape`.
- Listing tiles set `headingLevel` so the page outline stays sensible.

## Images And Media

- Prefer stable image layout over purely decorative loading behaviour.
- For inline post images, use `Img` with intrinsic dimensions where possible; when they cannot be inferred, provide `height` and/or `aspectRatio` to prevent CLS.
- Listing tiles sit on a flat `--paper-well` placeholder rather than an LQIP blur; the tunes-index lead still uses an LQIP blur-up behind the Cloudflare-transformed image.
- The LCP image is preloaded with exactly the attributes the `<img>` uses: the article hero shares `HERO_SIZES` in `BlogPost.astro`, and the homepage lead cover reads `leadImageAttrs()` from `src/utils/home-lead.ts` in both `index.astro` and `HomeLead.astro`.
- Reserve space for deferred embeds such as comments or third-party widgets before they load.

## Implementation References

- Design tokens and utility classes: `src/styles/global.css`
- Scroll-reveal observer: `src/components/layout/RevealInit.astro`
- Design system documentation: [Design System](./design-system.md)
- Header: `src/components/layout/Header.astro`
- Footer: `src/components/layout/Footer.astro`
- Listing tile: `src/components/blog/PostCard.astro` (laid out by `.feed` in `global.css`)
- Page frame and heads: `.page-frame`, `.page-frame--text`, `.page-head`, `.page-lede` in `src/styles/global.css`
- Homepage sections: `src/components/home/` (`HomeLead`, `HomeIntro`, `HomeTunes`, `HomeBooks`, `HomeProjects`)
- Feed tabs and homepage pills: `src/components/home/TagTabs.astro` (`variant="tabs"` or `"pills"`)
- Pagination: `src/components/layout/Pagination.astro`
- Article layout: `src/layouts/BlogPost.astro`
- Contents and tools rails: `src/components/blog/ArticleRail.astro` (`part="contents"` / `part="tools"`)
- Below-1200px tools bar: `src/components/blog/StoryBar.astro`
- Inline image embed: `src/components/embeds/Img.astro`
- Comments embed: `src/components/blog/Comments.astro`
