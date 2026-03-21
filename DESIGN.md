# Design System Strategy: High-End Editorial

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Curated Journal."** 

This system moves away from the rigid, boxy constraints of traditional web templates in favor of a sophisticated, editorial aesthetic that mirrors high-end print magazines. By blending the airy, personal minimalism of `russ.cloud` with the structured power of a newsroom grid, we create an experience that feels both intimate and authoritative. 

The "Curated Journal" avoids the "generic" by leaning into intentional asymmetry, expansive whitespace (using our `16` to `24` spacing tokens), and a typographic scale that values "breathing room" over information density. We don't just display content; we stage it.

---

## 2. Colors
Our palette is rooted in refined neutrals to let high-quality photography lead, supported by deep, intellectual blues.

### Tonal Hierarchy
- **Primary & Secondary:** Use `primary` (#00288e) for high-impact brand moments and `secondary` (#0058be) for interactive elements.
- **The "No-Line" Rule:** This is a fundamental pillar. **1px solid borders are prohibited for sectioning.** To separate the Hero from the Content or the Sidebar from the Feed, use background shifts. Place a `surface_container_low` (#f3f4f5) section against the main `background` (#f8f9fa).
- **Surface Hierarchy & Nesting:** Depth is achieved through "Tonal Layering." 
    - Base: `surface` (#f8f9fa)
    - Card/Component: `surface_container_lowest` (#ffffff)
    - Section Break: `surface_container` (#edeeef)
- **The "Glass & Gradient" Rule:** For floating navigation or over-image labels, use semi-transparent `surface_container_lowest` with a `backdrop-blur` of 12px to 20px. 
- **Signature Textures:** For primary CTAs (e.g., "Read Article"), use a subtle linear gradient from `primary` (#00288e) to `primary_container` (#1e40af) at a 135-degree angle. This adds a "lithographic" depth that flat color cannot provide.

---

## 3. Typography
We utilize a high-contrast pairing: **Plus Jakarta Sans** for structure and **Inter** for sustained reading.

- **Display & Headline (Plus Jakarta Sans):** These are our "Voice." Use `display-lg` (3.5rem) for hero titles. The tight tracking and bold weight of Plus Jakarta Sans convey an "Institutional Modernist" vibe.
- **Title & Body (Inter):** Inter provides the "Clarity." Use `body-lg` (1rem) for article summaries. Its high x-height ensures readability even at smaller scales.
- **Visual Rhythm:** Always maintain a minimum 1.5x line-height for body text to honor the "Editorial" spirit. Hierarchy is established by skipping scales—pair a `display-sm` headline directly with a `label-md` category tag for a sophisticated, non-linear look.

---

## 4. Elevation & Depth
In this system, we don't use shadows to "lift" objects; we use light and layering to "reveal" them.

- **The Layering Principle:** Rather than a shadow, place a `surface_container_lowest` (#ffffff) element on top of a `surface_container_low` (#f3f4f5) background. The subtle contrast creates a natural, soft-touch elevation.
- **Ambient Shadows:** If a floating state is required (e.g., a sticky header), use an extra-diffused shadow: `box-shadow: 0 12px 40px rgba(25, 28, 29, 0.04)`. The color is derived from `on_surface` at 4% opacity, mimicking natural room light.
- **The "Ghost Border" Fallback:** If accessibility requires a container boundary, use the `outline_variant` (#c4c5d5) token at **15% opacity**. It should be felt, not seen.
- **Glassmorphism:** Use for "Action Chips" or "Search Bars" that sit atop imagery. Combine `surface_container_lowest` at 70% opacity with a blur to ensure the image colors bleed through, grounding the UI in the content.

---

## 5. Components

### Buttons
- **Primary:** Gradient-fill (Primary to Primary Container), `full` roundedness, `headline-sm` typography. No border.
- **Secondary:** `surface_container_highest` background with `on_surface` text. 
- **Tertiary:** Text-only with an underline that appears on hover, using `primary` for the stroke.

### Cards (The "Editorial Card")
- **Forbid dividers.** Use spacing `8` (2.75rem) to separate the image from the title.
- Imagery must use `md` (0.375rem) or `lg` (0.5rem) roundedness. 
- Content within the card should utilize a background shift (e.g., the card body uses `surface_container_lowest` while the surrounding page uses `surface`).

### Input Fields
- Use "Underline Only" or "Soft Surface" styles. 
- Soft Surface: Background `surface_container`, no border, `sm` roundedness. On focus, transition background to `surface_container_high`.

### Chips & Tags
- For category tags (e.g., "Culture," "Design"), use `surface_variant` backgrounds with `on_surface_variant` text. 
- Keep them small (`label-sm`) and uppercase with slightly increased letter spacing.

### Progress Indicators (Reading Progress)
- Use a slim (2px) bar at the top of the viewport using the `secondary` (#0058be) token.

---

## 6. Do's and Don'ts

### Do:
- **Use Intentional Asymmetry:** In a grid of three blog posts, let the middle image be slightly taller or offset by `spacing-4`.
- **Embrace Whitespace:** If you think a section needs more content, it probably needs more `spacing-20`.
- **Image-First Design:** Ensure every article card is anchored by a high-resolution, curated image. The UI is the frame; the content is the art.

### Don't:
- **Don't use 100% Black:** Always use `on_surface` (#191c1d) for text to maintain a premium, ink-on-paper feel.
- **Don't use Dividers:** If you feel the need to draw a line between two items, increase the padding to `spacing-10` or change the background tone of one item instead.
- **Don't Crowded the Margins:** The "Editorial" look requires wide gutters. Ensure your main content container has significant horizontal padding on desktop.

---

## 7. Spacing & Grid
- **The Golden Rule:** Use `spacing-16` (5.5rem) for vertical section gaps.
- **The "Nested" Gap:** Use `spacing-2` (0.7rem) for related metadata (e.g., Date and Author).
- **The "Break" Gap:** Use `spacing-6` (2rem) between a Headline and Body text.

By strictly adhering to tonal layering and typographic hierarchy over lines and boxes, this design system transforms a standard blog into a prestigious digital publication.