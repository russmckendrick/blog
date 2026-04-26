---
version: "alpha"
name: "Russ.Cloud Curated Journal"
description: "Editorial, content-first design system for the Russ.Cloud Astro blog and music site."
colors:
  primary: "#00288E"
  primary-container: "#1E40AF"
  secondary: "#0058BE"
  on-primary: "#FFFFFF"
  surface: "#F8F9FA"
  surface-container-lowest: "#FFFFFF"
  surface-container-low: "#F3F4F5"
  surface-container: "#EDEEEF"
  surface-container-high: "#E2E3E5"
  surface-container-highest: "#D6D8DB"
  on-surface: "#191C1D"
  on-surface-variant: "#44474F"
  dark-primary: "#A4C8FF"
  dark-primary-container: "#00408F"
  dark-secondary: "#8ECAFF"
  dark-on-primary: "#003063"
  dark-surface: "#111418"
  dark-surface-container-lowest: "#0B0E12"
  dark-surface-container-low: "#191C20"
  dark-surface-container: "#1D2024"
  dark-surface-container-high: "#272A2F"
  dark-surface-container-highest: "#32353A"
  dark-on-surface: "#E2E2E6"
  dark-on-surface-variant: "#C4C6D0"
typography:
  headline-display:
    fontFamily: "Plus Jakarta Sans, Inter, system-ui, sans-serif"
    fontSize: 56px
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.035em"
  headline-lg:
    fontFamily: "Plus Jakarta Sans, Inter, system-ui, sans-serif"
    fontSize: 40px
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.025em"
  headline-md:
    fontFamily: "Plus Jakarta Sans, Inter, system-ui, sans-serif"
    fontSize: 30px
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.015em"
  headline-sm:
    fontFamily: "Plus Jakarta Sans, Inter, system-ui, sans-serif"
    fontSize: 24px
    fontWeight: 600
    lineHeight: 1.25
  body-lg:
    fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: 18px
    fontWeight: 400
    lineHeight: 1.7
  body-md:
    fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: 17px
    fontWeight: 400
    lineHeight: 1.7
  body-sm:
    fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
  label-md:
    fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: 14px
    fontWeight: 600
    lineHeight: 1.4
  code-sm:
    fontFamily: "JetBrains Mono, Fira Code, Monaco, Consolas, monospace"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.6
rounded:
  none: 0px
  sm: 4px
  md: 6px
  lg: 8px
  xl: 12px
  full: 9999px
spacing:
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 40px
  xxxl: 48px
  section: 64px
components:
  page-surface:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-md}"
  article-card:
    backgroundColor: "{colors.surface-container-lowest}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-md}"
    rounded: "{rounded.xl}"
    padding: "{spacing.lg}"
  prose-muted:
    backgroundColor: "{colors.surface-container-lowest}"
    textColor: "{colors.on-surface-variant}"
    typography: "{typography.body-lg}"
  section-band:
    backgroundColor: "{colors.surface-container-low}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-md}"
    rounded: "{rounded.xl}"
    padding: "{spacing.lg}"
  inline-code:
    backgroundColor: "{colors.surface-container}"
    textColor: "{colors.on-surface}"
    typography: "{typography.code-sm}"
    rounded: "{rounded.md}"
    padding: "{spacing.xs}"
  control-hover:
    backgroundColor: "{colors.surface-container-high}"
    textColor: "{colors.on-surface}"
    typography: "{typography.label-md}"
    rounded: "{rounded.md}"
    padding: "{spacing.sm}"
  active-tonal-state:
    backgroundColor: "{colors.surface-container-highest}"
    textColor: "{colors.on-surface}"
    typography: "{typography.label-md}"
    rounded: "{rounded.full}"
    padding: "{spacing.sm}"
  link:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.secondary}"
    typography: "{typography.body-md}"
  link-hover:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
    typography: "{typography.body-md}"
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label-md}"
    rounded: "{rounded.full}"
    padding: "{spacing.sm}"
  button-primary-hover:
    backgroundColor: "{colors.primary-container}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label-md}"
    rounded: "{rounded.full}"
    padding: "{spacing.sm}"
  skip-link:
    backgroundColor: "{colors.on-surface}"
    textColor: "{colors.surface}"
    typography: "{typography.label-md}"
    rounded: "{rounded.xl}"
    padding: "{spacing.sm}"
  dark-page-surface:
    backgroundColor: "{colors.dark-surface}"
    textColor: "{colors.dark-on-surface}"
    typography: "{typography.body-md}"
  dark-article-card:
    backgroundColor: "{colors.dark-surface-container-lowest}"
    textColor: "{colors.dark-on-surface}"
    typography: "{typography.body-md}"
    rounded: "{rounded.xl}"
    padding: "{spacing.lg}"
  dark-prose-muted:
    backgroundColor: "{colors.dark-surface-container-lowest}"
    textColor: "{colors.dark-on-surface-variant}"
    typography: "{typography.body-lg}"
  dark-section-band:
    backgroundColor: "{colors.dark-surface-container-low}"
    textColor: "{colors.dark-on-surface}"
    typography: "{typography.body-md}"
    rounded: "{rounded.xl}"
    padding: "{spacing.lg}"
  dark-inline-code:
    backgroundColor: "{colors.dark-surface-container}"
    textColor: "{colors.dark-on-surface}"
    typography: "{typography.code-sm}"
    rounded: "{rounded.md}"
    padding: "{spacing.xs}"
  dark-control-hover:
    backgroundColor: "{colors.dark-surface-container-high}"
    textColor: "{colors.dark-on-surface}"
    typography: "{typography.label-md}"
    rounded: "{rounded.md}"
    padding: "{spacing.sm}"
  dark-active-tonal-state:
    backgroundColor: "{colors.dark-surface-container-highest}"
    textColor: "{colors.dark-on-surface}"
    typography: "{typography.label-md}"
    rounded: "{rounded.full}"
    padding: "{spacing.sm}"
  dark-link:
    backgroundColor: "{colors.dark-surface}"
    textColor: "{colors.dark-secondary}"
    typography: "{typography.body-md}"
  dark-button-primary:
    backgroundColor: "{colors.dark-primary}"
    textColor: "{colors.dark-on-primary}"
    typography: "{typography.label-md}"
    rounded: "{rounded.full}"
    padding: "{spacing.sm}"
  dark-button-primary-hover:
    backgroundColor: "{colors.dark-primary-container}"
    textColor: "{colors.dark-on-surface}"
    typography: "{typography.label-md}"
    rounded: "{rounded.full}"
    padding: "{spacing.sm}"
---

# Russ.Cloud Curated Journal Design System

## Overview

Russ.Cloud uses "The Curated Journal," an editorial design system inspired by high-end print magazines and adapted for a technical blog and music archive. The interface should feel calm, literate, image-led, and easy to read for long sessions. Chrome stays compact and useful; content, imagery, headings, and metadata carry the personality.

The site is light-first, with a class-based dark mode that preserves the same hierarchy instead of becoming a separate theme. When extending the UI, keep the design content-first: generous whitespace, strong typographic rhythm, tonal separation, and restrained motion.

## Colors

The palette is built around tonal layering. Use background shifts between surface levels instead of hard lines for sectioning.

- **Primary (`#00288E` light, `#A4C8FF` dark):** High-impact brand moments, primary action fills, blockquote rules, and active states.
- **Primary container (`#1E40AF` light, `#00408F` dark):** CTA gradient endpoints and stronger hover states.
- **Secondary (`#0058BE` light, `#8ECAFF` dark):** Links, metadata accents, reading-progress color, and subtle interactive emphasis.
- **Surface hierarchy:** `surface` is the page background. `surface-container-lowest` is for cards and article shells. `surface-container-low` supports footer, author boxes, menus, and quiet bands. Higher container tones are for hover and active states.
- **Text:** `on-surface` is primary copy and headings; `on-surface-variant` is metadata, descriptions, and quiet prose.

Dark mode is implemented by redefining the same CSS custom properties under `.dark`. Keep new color usage token-based so the theme adapts automatically.

## Typography

Use Plus Jakarta Sans for display typography and Inter for body/UI. This pairing gives the site its editorial contrast: assertive, tightly tracked headlines with quieter, highly legible long-form text.

- **Display headlines:** Use `headline-display` for post titles and major page titles. In code, these often resolve to responsive clamp sizes rather than one fixed size.
- **Section and card headings:** Use `headline-lg`, `headline-md`, and `headline-sm` with tight tracking and generous surrounding whitespace.
- **Body copy:** Use `body-md` for the global 17px baseline and `body-lg` for prose paragraphs.
- **Metadata and controls:** Use `body-sm` or `label-md`; keep supporting text calm and scannable.
- **Code:** Use JetBrains Mono through `code-sm`, with tonal backgrounds instead of high-contrast code chips.

Crimson Pro exists as a decorative serif family in the CSS theme, but it should remain rare and intentional rather than becoming a default post or UI style.

## Layout

Layouts use stable max-width containers and generous gutters. Keep the shell and broad listing pages at `max-w-7xl`; blog posts use `max-w-5xl`, expanding to a wider layout only when the table of contents is present.

Spacing follows a 4px-derived scale, with the common working rhythm landing on 16px, 24px, 32px, 40px, 48px, and 64px. Cards and article sections should have enough internal padding to let images, titles, summaries, and metadata breathe. Avoid dense dashboard-like grouping unless the page is explicitly a tool.

## Elevation & Depth

Depth comes first from tonal layers, then from soft ambient shadows. Cards and the header use diffused shadows, but general section hierarchy should not rely on stacked shadows.

Use the glass treatment for the site header: semi-transparent surface color, backdrop blur, and ambient shadow. Use the ghost border only when a boundary must be perceivable for structured content such as prose tables and code blocks.

## Shapes

The shape language is rounded but controlled. Cards, article shells, author boxes, pagination wrappers, and large media use `rounded-xl` (12px). Smaller controls use `rounded-md` or `rounded-full` depending on whether they are rectangular nav items or pills/chips.

Do not add extra decorative framing around cards. A card gets a tonal surface, one radius, and its own content rhythm.

## Components

- **Header:** Always use glass background plus ambient shadow. Desktop navigation is compact, icon-led, and reveals labels on hover/focus. Mobile navigation uses a disclosure pattern with icon and text labels.
- **Footer:** Use `surface-container-low` as a full-width tonal band with quiet variant text.
- **Post cards:** Use `surface-container-lowest`, `rounded-xl`, ambient shadow, image-first layout, display typography, and a restrained hover lift.
- **Article layout:** Use a single article card with an edge-to-edge hero image, centered display title, and a tonal author information box.
- **Pagination:** Use a rounded tonal wrapper. Page controls are pill-shaped; active states may use the primary color or highest tonal container depending on prominence.
- **Prose:** Use display headings, variant body text, secondary-color links with subtle underlines, tonal blockquotes with primary left rules, tonal inline code, and ghost-bordered tables/code blocks.
- **Tags:** Preserve the per-tag color system defined in `src/consts.ts`; do not flatten tag colors into the global palette.

## Do's and Don'ts

- Do use tonal layering for visual separation; use background shifts before borders or dividers.
- Do keep article and card layouts image-led when source content provides a meaningful image.
- Do use `on-surface` and `on-surface-variant` for text; avoid pure black and pure gray one-offs.
- Do keep motion restrained: hover lifts, fade-ins, and scroll reveals should support reading, not compete with it.
- Do respect `prefers-reduced-motion` for all decorative animation.
- Don't use 1px solid borders for sectioning; use tonal surfaces or the ghost border for structured content only.
- Don't put ghost borders on normal cards.
- Don't introduce new decorative type styles unless the page has a clear campaign-style purpose.
