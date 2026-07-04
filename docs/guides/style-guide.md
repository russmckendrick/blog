# Russ.Cloud Style Guide

This guide documents the visual and interaction conventions used across Russ.Cloud so future UI changes stay consistent with the current site direction: "The Print Edition", a high-end print journal on screen.

## Design Principles

- Keep the site content-first and image-led. Chrome should read like quiet magazine furniture; the cover imagery and type carry the personality.
- Separate content with hairline rules, not cards, shadows, or background shifts.
- Square corners everywhere; the only exceptions are circular avatar portraits and terminal code blocks (styled as macOS windows — rounded, shadowed, with real traffic lights).
- Motion is choreographed but calm — "the magazine, filmed". No springs, bounces, or hover lifts.
- Preserve the light-first paper/ink language; dark mode swaps ink and paper, it is not a separate theme.

## Layout Conventions

- Keep page content inside the established width containers:
  - homepage / tags / tunes: `max-w-7xl`
  - blog posts: `max-w-5xl` (prose constrained to `max-w-[72ch]`, hero full container width)
  - blog list / archives / search / about: `max-w-5xl`
  - site shell/header/footer: `max-w-7xl`
- Page headers follow one pattern: `.rubric` kicker → Source Serif heading → standfirst paragraph → heavy closing rule (`border-b-2` with `--rule-strong`).
- Listings are index entries: dateline, hairline-framed cover, Source Serif headline, standfirst, hairline separator.

## Header And Footer

### Header (masthead)

- Opaque paper background with a 1px bottom rule — no glass or blur.
- Desktop navigation is text-only `.rubric` labels with `.nav-underline` draw-in hovers.
- Keep the theme toggle icon-only on desktop.
- Mobile navigation uses icon + text labels and follows a disclosure pattern with `aria-controls`, `aria-expanded`, and a screen-reader-only label that reflects open/closed state.

### Footer (colophon)

- Hairline top rule, centred small-caps nav, italic copyright/colophon line.

## Typography

- One serif does everything, newspaper-style: **Source Serif 4** for body text (weight 400, 1.125rem/1.75) and for the masthead, headings, and card titles at bold weights — 700 for display/h1, 660 for headings, 620 for h3, with slight negative tracking on the biggest sizes only.
- Use **IBM Plex Mono** (`font-mono`) for code and all metadata: datelines, reading time, rubrics.
- Use `.rubric` for any label or dateline; `.tag-editorial` for tag-like links.
- Dates render day-first ("13 Jun 2026") via `FormattedDate.astro` and uppercase inside rubrics.
- See [Design System](./design-system.md) for the full font and token reference.

## Color And Rules

- Colors are defined as CSS custom properties in `src/styles/global.css` with automatic light/dark adaptation. Never use raw hex values or Tailwind palette colours (`gray-*`, `blue-*`).
- The single accent is burnt orange (`--color-secondary` for links/active, `--color-primary` for hover/filled), lifting to muted salmon in dark mode. There is no blue.
- Separate sections with hairline rules (`--color-outline-variant`); use heavy rules (`--rule-strong`) only for page headers and featured spreads.
- Frame all images with a 1px hairline.
- Hover states are colour shifts (ink → accent) and underline draw-ins, never shadows or translation.

## Motion And Interaction

- All motion runs through `src/scripts/motion.ts` (vanilla Motion) and the timing tokens `--ease-settle` / `--dur-quick` / `--dur-hover` / `--dur-page`.
- **Page-load entrances**: mark elements with `data-entrance` for the staggered fade/rise cascade (used on page headers and the article journal header).
- **Hero settle**: mark the article hero figure with `data-settle` (scale 1.03 → 1 with fade).
- **Scroll reveals**: mark below-the-fold entries with `data-reveal` (fade up once); `data-reveal="rule"` draws a rule in horizontally. The legacy `.reveal*` classes are neutered no-ops — do not use them in new code.
- **Shared-element transitions**: listing images/titles and the article hero/title carry matching `transition:name` values derived from the post URL, so the cover morphs into the article hero on navigation.
- **Image hovers**: slow zoom (`scale(1.04)`, ~700ms, ease-out) inside the hairline frame.
- Respect `prefers-reduced-motion`: the Motion helpers no-op, the `[data-entrance]`/`[data-settle]` hidden states are lifted, and smooth scrolling/view-transition animations are disabled.
- Focus states use `:focus-visible` with a 2px accent outline.

## Accessibility Baseline

- Every layout must expose a skip link to `#main-content`.
- Main content regions should remain focusable with `tabindex="-1"` when needed for skip-link targeting.
- Icon-only controls require accessible names.
- Mobile menus and other toggles should be keyboard-operable and close on `Escape`.

## Images And Media

- Prefer stable image layout over purely decorative loading behavior.
- For inline post images, use `Img` with intrinsic dimensions where possible.
- When intrinsic dimensions cannot be inferred, provide `height` and/or `aspectRatio` to prevent CLS.
- Reserve space for deferred embeds such as comments or third-party widgets before they load.

## Implementation References

- Design tokens and utility classes: `src/styles/global.css`
- Motion helpers: `src/scripts/motion.ts`
- Design system documentation: [Design System](./design-system.md)
- Header: `src/components/layout/Header.astro`
- Footer: `src/components/layout/Footer.astro`
- Post cards: `src/components/blog/PostCard.astro`
- Article layout: `src/layouts/BlogPost.astro`
- Inline image embed: `src/components/embeds/Img.astro`
- Comments embed: `src/components/blog/Comments.astro`
