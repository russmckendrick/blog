---
version: "alpha"
name: "Russ.Cloud Print Edition"
description: "Editorial paper-and-ink design system for the Russ.Cloud Astro blog and music site."
colors:
  primary: "#8F2D00"
  primary-container: "#BF3B00"
  secondary: "#BF3B00"
  on-primary: "#FFFFFF"
  surface: "#F6F6F6"
  surface-container-lowest: "#FFFFFF"
  surface-container-low: "#EDEDED"
  surface-container: "#E4E4E4"
  surface-container-high: "#D8D8D8"
  surface-container-highest: "#C9C9C9"
  on-surface: "#1A1A1A"
  on-surface-variant: "#555555"
  accent-highlight: "#8A6D1F"
  dark-primary: "#E5B29C"
  dark-primary-container: "#D99C82"
  dark-secondary: "#D99C82"
  dark-on-primary: "#2A1109"
  dark-surface: "#16130E"
  dark-surface-container-lowest: "#100E0A"
  dark-surface-container-low: "#1D1912"
  dark-surface-container: "#221E16"
  dark-surface-container-high: "#2A251B"
  dark-surface-container-highest: "#363023"
  dark-on-surface: "#E9E2D2"
  dark-on-surface-variant: "#B5AC97"
  dark-accent-highlight: "#C9A94E"
typography:
  headline-display:
    fontFamily: "Source Serif 4, Georgia, Times New Roman, serif"
    fontSize: 56px
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.01em"
  headline-lg:
    fontFamily: "Source Serif 4, Georgia, Times New Roman, serif"
    fontSize: 40px
    fontWeight: 660
    lineHeight: 1.15
    letterSpacing: "-0.01em"
  headline-md:
    fontFamily: "Source Serif 4, Georgia, Times New Roman, serif"
    fontSize: 30px
    fontWeight: 660
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  headline-sm:
    fontFamily: "Source Serif 4, Georgia, Times New Roman, serif"
    fontSize: 24px
    fontWeight: 620
    lineHeight: 1.25
  body-lg:
    fontFamily: "Source Serif 4, Georgia, Times New Roman, serif"
    fontSize: 18px
    fontWeight: 400
    lineHeight: 1.75
  body-md:
    fontFamily: "Source Serif 4, Georgia, Times New Roman, serif"
    fontSize: 18px
    fontWeight: 400
    lineHeight: 1.75
  body-sm:
    fontFamily: "Source Serif 4, Georgia, Times New Roman, serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
  rubric:
    fontFamily: "IBM Plex Mono, ui-monospace, Cascadia Code, Consolas, monospace"
    fontSize: 13px
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.08em"
  code-sm:
    fontFamily: "IBM Plex Mono, ui-monospace, Cascadia Code, Consolas, monospace"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.6
rounded:
  none: 0px
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
  index-entry:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-md}"
    rounded: "{rounded.none}"
  section-head:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.headline-lg}"
    rounded: "{rounded.none}"
  dateline:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface-variant}"
    typography: "{typography.rubric}"
  inline-code:
    backgroundColor: "{colors.surface-container}"
    textColor: "{colors.on-surface}"
    typography: "{typography.code-sm}"
    rounded: "{rounded.none}"
    padding: "{spacing.xxs}"
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
    typography: "{typography.rubric}"
    rounded: "{rounded.none}"
    padding: "{spacing.sm}"
  skip-link:
    backgroundColor: "{colors.on-surface}"
    textColor: "{colors.surface}"
    typography: "{typography.rubric}"
    rounded: "{rounded.none}"
    padding: "{spacing.sm}"
---

# Russ.Cloud Print Edition Design System

## Overview

Russ.Cloud is set as "The Print Edition": a high-end print journal adapted for a technical blog and music archive. The interface should read like a well-set magazine — paper tones, serif typography, hairline rules instead of cards, dated-journal metadata, and image-led layouts where the AI-generated cover art is the artwork. Chrome stays quiet; type, rules, and imagery carry the personality.

The site is light-first ("paper") with a class-based dark mode that swaps ink and paper rather than becoming a separate theme. Motion is choreographed but calm — "the magazine, filmed".

## Tokens and naming

The CSS custom properties in `src/styles/global.css` define paper/ink primitives (`--paper`, `--paper-bright`…`--paper-deepest`, `--ink`, `--ink-muted`, `--rule`, `--rule-strong`, `--accent`, `--accent-strong`, `--accent-highlight`). **The legacy Material-style names (`--color-surface`, `--color-surface-container-*`, `--color-on-surface*`, `--color-primary`, `--color-secondary`, `--color-outline-variant`) are kept as aliases of those primitives** so existing components keep working. Prefer the primitives (or the aliases) in new code; never introduce raw hex values or Tailwind palette colours (`gray-*`, `blue-*`).

- **Paper hierarchy:** `surface` is the page. `surface-container-lowest` is bright paper (code frames, link previews). The deeper paper tones are for quiet fills and hovers only — most separation comes from rules, not background shifts.
- **Ink:** `on-surface` for headings and primary copy, `on-surface-variant` for body prose and metadata.
- **Rules:** `--color-outline-variant` (alias of `--rule`) is the hairline; `--rule-strong` is the heavy editorial rule used above section heads and page headers (`border-t-2`).
- **Accent:** a single burnt orange — `secondary` (#BF3B00) for links and active states, `primary` (#8F2D00) for hovers and filled buttons; dark mode lifts it to a muted salmon. Muted ochre `--accent-highlight` is reserved for text highlights/marks. There is no blue.

## Typography

Two faces, all self-hosted through Astro's Fonts API (`astro.config.mjs`) — one sturdy text serif does everything, differentiated by weight, like a real newspaper:

- **Source Serif 4** (`--font-serif`, also `--font-display`) — body copy at 1.125rem/1.75 (weight 400), prose measure ~72ch; headlines bold via the variable axis: 700 for display/h1 (letter-spacing -0.015em), 660 for section and card headings (-0.01em), 620 for h3.
- **IBM Plex Mono** (`--font-mono`) — code, and promoted to metadata duty: datelines, reading time, rubrics.

The `.rubric` utility (mono, 0.8125rem, uppercase, 0.08em tracking, muted ink) is the standard treatment for labels, datelines, and section rubrics. Dates render day-first ("13 Jun 2026") via `FormattedDate` and uppercase inside rubrics.

`--font-sans` is a bare system-ui stack kept only as a fallback for tiny chrome; do not reintroduce webfont sans-serifs.

## Layout

Stable max-width containers with generous gutters: shell and listing pages at `max-w-7xl`, article pages at `max-w-5xl` with prose constrained to `max-w-[72ch]` (heroes run the full container width). Page headers follow one pattern: rubric line, Source Serif heading, standfirst paragraph, closed by a heavy `border-b-2` rule (`--rule-strong`).

## Rules instead of cards

There are no cards, shadows, glass, or gradients. Separation comes from:

- **Hairline rules** (`1px solid var(--color-outline-variant)`) between list entries, under the masthead, above footers and article appendices.
- **Heavy rules** (`2px solid var(--rule-strong)`, or `border-t-2`) closing page headers; the homepage featured spread is rule-free.
- **Hairline frames** around all images (listing covers, article heroes, book covers, prose images).
- **Radius 0 everywhere.** Two intentional exceptions: circular avatar portraits (a print convention — article byline, tag hub, about page), and terminal code blocks, which are drawn as macOS windows (rounded corners, soft drop shadow, red/amber/green traffic lights, always a dark slate-navy Catppuccin Macchiato profile in both site themes — matching the author's real terminal). A terminal frame depicts a real app window, so it reads as a figure, not chrome.

Listings are index entries: dateline, framed cover image, Source Serif headline, standfirst, rule below. Tags render through `getTagColorClasses()` → the single `.tag-editorial` treatment (small-caps mono with a hairline underline, accent on hover); the per-tag pastel palette in `TAG_METADATA` is retired visually but the titles/emojis/descriptions remain in use.

## Motion — "the magazine, filmed"

Built on the vanilla **Motion** library via `src/scripts/motion.ts`; no React islands for animation. Timing vocabulary lives in tokens: `--ease-settle` (cubic-bezier(0.22, 0.61, 0.36, 1)), `--dur-quick` 150ms, `--dur-hover` 400ms, `--dur-page` 600ms. No springs, bounces, or translate-lift hovers.

- **Entrances:** elements marked `data-entrance` stagger in (fade + 14px rise) on page load — dateline → title → byline → hero.
- **Hero settle:** `data-settle` images ease from scale 1.03 to 1, like a plate settling onto the page.
- **Scroll reveals:** `data-reveal` fades entries up once in view; `data-reveal="rule"` draws rules in horizontally. (The old `.reveal*` classes are neutered no-ops.)
- **Shared-element view transitions:** listing images/titles carry `transition:name` (`post-img-*` / `post-title-*`) matched by the article layout, so the cover you click becomes the article hero.
- **Hovers:** underline draw-ins (`.nav-underline`), slow image zooms (scale 1.04 over 700ms), headline colour shifts to accent.
- All motion respects `prefers-reduced-motion`, including the `[data-entrance]`/`[data-settle]` hidden initial states.

## Components

- **Masthead:** opaque paper, 1px bottom rule, bold Source Serif wordmark, always-visible small-caps mono nav with underline draw-in hovers. No glass, no icons on desktop.
- **Footer:** colophon — hairline top rule, centred small-caps nav, italic copyright line.
- **Pagination:** a rule-topped line of plain mono numerals with rubric Previous/Next; current page in accent.
- **Article:** sits directly on paper. Journal header (dateline rubric, left-aligned bold Source Serif title, one-line byline with small round avatar, editorial tag line, heavy rule), hairline-framed hero, drop cap on the opening paragraph (`.article-body`, `initial-letter` with float fallback; not applied to tunes posts).
- **Prose:** h2 carries a hairline rule above; h4+ use small-caps serif. Blockquotes are bare italic pull-quotes with a 2px ink rule. Tables use strong rules top/bottom, small-caps headers, hairline rows, no fills. `hr` renders as a centred asterism dinkus. Code frames (Expressive Code) are square with hairline borders and paper-tinted chrome, themed via `styleOverrides` in `astro.config.mjs` only.
- **Callouts:** one definition (`.callout`), seven variants via per-variant accent inks (`--callout-note/tip/important/caution/warning`, light + dark): 2px accent left rule, 5% `color-mix` tint, small-caps mono heading.
- **Reading progress:** a 2px accent rule. No gradient, no glow.

## Do's and Don'ts

- Do use hairline rules for separation; a background shift is the exception, not the default.
- Do keep layouts image-led — the covers are the artwork; frame them with hairlines and let them breathe on paper.
- Do use `.rubric` for any label or dateline; use `.tag-editorial` for tag-like links.
- Do route all colour through tokens; light and dark must both come free.
- Don't reintroduce border radius, shadows, glass, gradients, pastel chips, or Tailwind grey/blue utilities.
- Don't add new fonts or tight negative letter-spacing.
- Don't animate with springs or scale-bounces; use `--ease-settle` and the Motion helpers, and always honour `prefers-reduced-motion`.
