# Russ.Cloud Style Guide

This guide documents the visual and interaction conventions used across Russ.Cloud so future UI changes stay consistent with the current site direction.

## Design Principles

- Keep the site content-first. Chrome should support reading, not compete with it.
- Prefer compact navigation and strong content hierarchy over dense UI labels.
- Use soft gradients, large rounded surfaces, and restrained motion instead of heavy decoration.
- Preserve the existing light-first visual language unless a page has a clear reason to diverge.

## Layout Conventions

- Keep page content inside the established width containers:
  - primary content: `max-w-6xl`
  - site shell/header/footer: `max-w-7xl`
- Favor generous vertical spacing around hero cards, post grids, and section transitions.
- Use rounded cards consistently:
  - featured surfaces: `rounded-3xl`
  - standard cards: `rounded-2xl`
  - smaller pills/chips: fully rounded or subtle rounded corners

## Header And Footer

### Header

- Desktop navigation stays icon-only to keep the header visually light.
- Every desktop icon link must keep an `aria-label`.
- Do not add custom hover tooltips to desktop nav by default.
- Keep the theme toggle icon-only on desktop.
- Mobile navigation should use icon + text labels and follow a disclosure pattern with:
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
- Do not use 1px borders for sectioning. Use `.ghost-border` only when accessibility requires a visible boundary.
- Cards use `.surface-container-lowest` with `.shadow-ambient` and `.ghost-border`.
- Hero gradients are dynamically extracted from post images and blend into `var(--color-surface)`.
- Hover states should be visible but restrained. Avoid loud accent fills in navigation.
- See [Design System](./design-system.md) for the full color token reference.

## Motion And Interaction

- Limit transitions to interactive elements and cards.
- Do not apply global transitions to every element.
- Respect `prefers-reduced-motion` by disabling:
  - smooth scrolling
  - decorative animations
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
