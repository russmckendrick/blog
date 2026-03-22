# Russ.Cloud Style Guide

This guide documents the visual and interaction conventions used across Russ.Cloud so future UI changes stay consistent with the current site direction.

## Design Principles

- Keep the site content-first. Chrome should support reading, not compete with it.
- Prefer compact navigation and strong content hierarchy over dense UI labels.
- Use clean surfaces, consistent rounded corners, and restrained motion instead of heavy decoration.
- Preserve the existing light-first visual language unless a page has a clear reason to diverge.

## Layout Conventions

- Keep page content inside the established width containers:
  - homepage / tags / tunes: `max-w-7xl`
  - blog posts: `max-w-5xl 2xl:max-w-6xl`
  - blog list / archives / search / about: `max-w-5xl`
  - site shell/header/footer: `max-w-7xl`
- Use rounded cards consistently:
  - all cards and containers: `rounded-xl`
  - smaller pills/chips: fully rounded

## Header And Footer

### Header

- Desktop navigation uses icon + text labels for clarity.
- Every nav link keeps an `aria-label`.
- Keep the theme toggle icon-only on desktop.
- The header always uses a semi-transparent glass background (no transparent mode).
- Mobile navigation uses icon + text labels and follows a disclosure pattern with:
  - `aria-controls`
  - `aria-expanded`
  - a screen-reader-only label that reflects open/closed state

### Footer

- Footer navigation should use icon + text labels for better scanability.
- Footer links can be more explicit than header links because they do not compete with hero content.

## Typography

- Use **Plus Jakarta Sans** (`font-display`) for headings and card titles.
- Use **Inter** (`font-sans`) for body text and UI elements.
- Preserve the high-contrast editorial feel:
  - large, bold page and card titles
  - quieter supporting metadata and summaries using `text-on-surface-variant`
- Avoid introducing additional decorative type styles unless a page has a clear campaign-style purpose.
- Use text labels sparingly in high-traffic chrome. Prefer them in content and support areas.
- See [Design System](./design-system.md) for the full font and token reference.

## Color And Surfaces

- Colors are defined as CSS custom properties in `src/styles/global.css` with automatic light/dark adaptation.
- Use the **tonal layering** approach — separate sections with background shifts (`.surface`, `.surface-container-low`, etc.), not borders.
- Do not use 1px borders for sectioning. Use `.ghost-border` only in prose tables and code blocks.
- Cards use `.surface-container-lowest` with `.shadow-ambient` (no ghost-border on cards).
- Hover states should be visible but restrained. Avoid loud accent fills in navigation.
- See [Design System](./design-system.md) for the full color token reference.

## Motion And Interaction

- Limit transitions to interactive elements and cards.
- Do not apply global transitions to every element.
- **Above-the-fold page-load animations**: Use `.animate-fade-in` (gentle translateY + opacity) with `.animate-delay-1` / `.animate-delay-2` / `.animate-delay-3` for staggered cascades. These are CSS-only and fire on page load without JS.
- **Scroll-reveal animations**: Use `.reveal` (slide up + fade), `.reveal-fade` (fade only), `.reveal-scale` (scale + fade), or `.reveal-slide` (slide from left + fade) for content that scrolls into view. Combine with `.reveal-stagger` on a parent for cascading child reveals.
- Do **not** apply scroll-reveal to above-the-fold content (hero sections, blog post articles) — use `.animate-fade-in` instead.
- **Prose content reveals**: On blog post pages, images get `.reveal-scale`, blockquotes get `.reveal-slide`, and code blocks get `.reveal-fade` — applied via JS. Paragraphs, headings, and lists are never animated to preserve reading flow.
- **Gallery reveals**: Gallery components have a self-contained stagger reveal — items start visible, JS adds `.gallery-reveal-ready` (hiding them) and observes the wrapper, then `.gallery-revealed` triggers a cascading scale+fade via nth-child delays. This avoids race conditions with the global reveal system.
- Respect `prefers-reduced-motion` by disabling:
  - smooth scrolling
  - decorative animations (including `.animate-fade-in`)
  - scroll-reveal animations (all variants)
  - view-transition animations where possible
- Focus states should use `:focus-visible` and appear only on interactive elements.

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
- Design system documentation: [Design System](./design-system.md)
- Header: `src/components/layout/Header.astro`
- Footer: `src/components/layout/Footer.astro`
- Inline image embed: `src/components/embeds/Img.astro`
- Comments embed: `src/components/blog/Comments.astro`
