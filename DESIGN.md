---
version: "2.0"
name: "Russ.Cloud — Workbench"
description: "Clean, light-by-default design system for the Russ.Cloud Astro blog: one face (Geist), white page, near-black ink, an amber accent, and big cover art."
colors:
  page: "#FFFFFF"
  tint: "#F4F4F5"
  ink: "#0B0B0C"
  mist: "#5E5E66"
  rule: "#E6E6E9"
  rule-strong: "#D4D4D8"
  accent-fill: "#F2B544"
  on-accent-fill: "#0B0B0C"
  accent-text: "#8A5A00"
  terminal: "#1B1D27"
  terminal-bar: "#14161E"
  dark-page: "#0B0B0C"
  dark-tint: "#151517"
  dark-ink: "#EDEDEF"
  dark-mist: "#A1A1A6"
  dark-rule: "#26262A"
  dark-rule-strong: "#333338"
  dark-accent-text: "#F2B544"
  terminal-light-red: "#ED8796"
  terminal-light-amber: "#EED49F"
  terminal-light-green: "#A6DA95"
  terminal-comment: "#939AB7"
typography:
  home-intro:
    fontFamily: "Geist, -apple-system, Helvetica Neue, Arial, sans-serif"
    fontSize: 62px
    fontWeight: 800
    lineHeight: 1.02
    letterSpacing: "-0.04em"
  article-title:
    fontFamily: "Geist, sans-serif"
    fontSize: 58px
    fontWeight: 800
    lineHeight: 1.04
    letterSpacing: "-0.04em"
  lead-title:
    fontFamily: "Geist, sans-serif"
    fontSize: 48px
    fontWeight: 800
    lineHeight: 1.04
    letterSpacing: "-0.035em"
  section-title:
    fontFamily: "Geist, sans-serif"
    fontSize: 34px
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.03em"
  prose-h2:
    fontFamily: "Geist, sans-serif"
    fontSize: 30px
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  tile-title:
    fontFamily: "Geist, sans-serif"
    fontSize: 23px
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  standfirst:
    fontFamily: "Geist, sans-serif"
    fontSize: 21px
    fontWeight: 400
    lineHeight: 1.45
  body:
    fontFamily: "Geist, sans-serif"
    fontSize: 19px
    fontWeight: 400
    lineHeight: 1.75
    letterSpacing: "-0.005em"
  ui-small:
    fontFamily: "Geist, sans-serif"
    fontSize: 15px
    fontWeight: 400
    lineHeight: 1.5
  meta:
    fontFamily: "Geist, sans-serif"
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.55
  code:
    fontFamily: "Geist Mono, ui-monospace, Consolas, monospace"
    fontSize: 14px
    lineHeight: 1.75
mobile:
  home-intro: 36px
  article-title: 34px
  lead-title: 32px
  body: "17px / 1.7"
  tile: "single column, 16:10 image"
rounded:
  tile-image: 16px
  lead-image: 22px
  panel: 22px
  callout: 14px
  terminal: 14px
  code-block: 12px
  pill: 9999px
  portrait: 9999px
layout:
  frame: 1320px
  gutters: "16px / 24px (sm) / 40px (lg)"
  text-column: 700px
  masthead: 68px
  article-columns: "220px | 700px | 220px from 1200px"
  logo-lockup: "28px-tall SVG, fixed at all widths"
---

# Workbench — design system

## Overview

Russ.Cloud as **a builder's workbench**: a clean white page, near-black type,
one grey, one tint, and an amber accent, with the cover art finally given room
to work. It replaced "The Reading Room" (Medium-calm paper and serif) in
October 2026. The homepage says who writes here and what they build before it
asks anyone to read; the article page is a wide hero over a single 700px text
column flanked by contents and tools.

**Light is the default.** Dark applies only once a reader has chosen it with the
toggle (`localStorage.theme === 'dark'`); the system `prefers-color-scheme` is
deliberately not consulted. Dark is a near-black second material, not an
inversion.

## Tokens and naming

The primitives keep their historic names in `global.css` (`--paper`, `--ink`,
`--rule` …) and the Material-style `--color-*` aliases still resolve through
them, so older components restyle without edits.

- **Page** `#FFFFFF` (`--paper`). **Tint** `#F4F4F5` (`--paper-well`) is the one
  fill: the homepage intro band, the tunes panel, the author card, pills,
  inline code, image placeholders. Dark: `#0B0B0C` page, `#151517` tint — the
  tint lifts rather than sinks.
- **Ink** `#0B0B0C` for titles and body; **mist** `#5E5E66` for everything that
  is not content (dates, read times, descriptions, captions, inactive UI). No
  third text grey. Both pass 4.5:1 on page and tint in both themes.
- **Rule** `#E6E6E9` for hairlines and outlined controls; **rule-strong**
  `#D4D4D8` for their hover state and the few outlines that must read on tint.
- **Amber** comes in two tokens and they are not interchangeable:
  - `--accent-fill` `#F2B544` is for **marks only** — the reading-progress
    bar, the "Latest" badge, the active-contents dot, the tombstone dots and
    the prose link underline. Text on it is `--on-accent-fill` (ink). It fails
    contrast as text on white, so it never is.
  - `--accent` is the **text-safe** shade: `#8A5A00` in light, `#F2B544` in
    dark. Link and title hovers, section links ("See all 14 books →"), the
    tunes label, the warning callout.
- **Terminal** `#1B1D27` / bar `#14161E`: terminal figures (the homepage
  `russ --now` window and Expressive Code terminal frames) are dark windows in
  both themes, with Catppuccin Macchiato traffic lights and text colours.
- **Radius:** 16px tiles, 22px lead/hero images and panels (16–18px below
  1024px), 14px callouts and terminals, 12px code blocks, full pills, round
  portraits.
- **Shadow:** two soft drops, both for physical objects — the terminal
  figure, and book covers (homepage shelf, `/books/`, About). Nothing else
  casts.

## Typography

Two faces, self-hosted through Astro's Fonts API, both Vercel's **Geist**
(OFL, from the `geist` npm package), instanced and subset to Latin with
fonttools (~24 KB each):

- **Geist** (variable 400–800, plus italic 400–700) — everything: UI,
  headings and article body. There is no serif. Headings are heavy and tight:
  800 weight at display sizes with tracking from −0.035em to −0.04em, 700 for
  section and tile titles at −0.02em to −0.03em. Meta is 13px mist, never
  tracked.
- **Body** is 19px/1.75 in the 700px column (17px/1.7 on mobile) — roughly
  70 characters a line.
- **Geist Mono** (400–700) — code, terminals, and the project names and tags
  on the homepage. Never as decoration elsewhere.
- The masthead wordmark is **not a live face**: "russ" (Poppins ExtraBold)
  and ".cloud" (Poppins Light) are baked to SVG outline paths by
  `scripts/generate-logo.js`, so Poppins is never loaded.
- The OpenGraph cards render with the same Geist file, so there is no
  second family anywhere; the Reading Room faces have been removed.

## Layout

A **1320px frame** with 16 / 24 / 40px gutters (base / sm / lg) holds every
page: masthead, homepage, listings, article and footer (`.page-frame`).
Reading happens in a **700px text column** inside it on articles; text pages
(about, archives, reading list, glossary, search) cap their content at a
left-aligned **760px** measure (`.page-frame--text`). Listing pages open with
a `.page-head` — an 800-weight title up to 60px, a mist `.page-lede`, closed
by a hairline.

Masthead is one 68px row: the brand lockup left — one self-contained SVG
(`Logo.astro`): the iMac mark + `russ.cloud` in baked Poppins outlines with
the dot and a blinking block cursor in the mark's own colours (screen blue
`#35495E` light, base grey `#BDC3C7` dark; 1.1s square wave, steady under
reduced motion); seven links (Tunes · Books · Reading List · Tags · Archive ·
About · Source — the last off-site) resting as **glyphs alone** — a 15px
hairline mark at 62% opacity whose label **slides out** to the right over
150ms on hover or keyboard focus while the glyph comes up to full ink (labels
stay visible on touch) — then a 16px vertical hairline and the icon-only
search trigger and theme toggle. Burger menu below 768px with the search icon
beside it. The search icon opens the **search sheet** — a native dialog as a
centred 720px panel (22px radius, hairline, no shadow; full screen on phones)
over an ink-veiled page: an autofocused input, type filter pills with live
counts, and result rows of 16:10 thumbnail, `Type · date · read time`, a
700 title and an amber-marked excerpt, closed by a tint band of key hints.
`/search/` renders the same panel. `⌘K`/`Ctrl+K` or `/` opens it, `Esc`, the
key cap or the veil closes it, and Pagefind lazy-loads on first focus.

## The homepage

Six sections, top to bottom (`src/pages/index.astro`, components in
`src/components/home/`):

1. **Lead** (`HomeLead`) — the newest post's cover at full frame width. From
   1024px it is a 580px letterbox with the headline on a page-coloured panel
   cut into the bottom-left corner (top-right radius 26px), so the type reads
   as part of the page rather than laid over the art; below that the panel
   stacks under a 16:10 / 16:9 image. An amber **Latest** badge leads the meta
   line. This image is the page's LCP element: eager, `fetchpriority="high"`,
   and preloaded from `index.astro` with the same attributes
   (`leadImageAttrs()` in `src/utils/home-lead.ts`).
2. **Intro band** (`HomeIntro`) — full-bleed tint: cartoon avatar, "Hi, I'm
   Russ. I build small tools and write up what I learn." at 62px/800, a lede
   with live counts (books, posts, the year writing began), and beside it the
   dark **`russ --now`** terminal. Its lines come from content at build time —
   `writing` (latest post), `spinning` (this week's first record), `topics`
   (`FEATURED_TAGS`) — plus `building` from `NOW_BUILDING` in `consts.ts`.
3. **Recent writing** — six `PostTile`s (16:10 image, date · read time,
   title, three-line description) in a 1/2/3-column grid, headed by the topic
   pills (`TagTabs variant="pills"`: an ink-filled **All** and outlined
   featured tags). A "Browse all N posts" pill button to `/archives/` closes
   it; the homepage has no pagination row (`/page/2/` onward still exists and
   picks up after `HOME_PAGE_SIZE` = 7).
4. **Tunes** (`HomeTunes`) — a tint panel: the week's AI cover art beside its
   title, description, seven record covers and a "+N more" tile.
   **"AI-generated write-ups · my records" stays visible — non-negotiable.**
5. **Books** (`HomeBooks`) — the four newest covers beside "I also write
   books".
6. **Things I've built** (`HomeProjects`) — outlined tiles from `PROJECTS` in
   `consts.ts`: a Geist Mono name, a small mono tag, one line of description.
   Each links to the post that introduced the project.

Shared section heads (`.home-section-head`, `.home-section-title`,
`.home-section-link`) live in `global.css`. The footer drops its "Listened to
this week" block on the homepage (`BaseLayout footerTunes={false}`), which has
its own.

## Listings and pagination

Every post list — `/page/N/`, tag hubs, years, the author page, tunes weeks,
artists and albums — is a **`.feed` grid of `PostCard` tiles**: one column on
phones, two from 640px, three from 1024px. A tile is one link: 16:10 cover
(16px radius), `date · read time` (plus `AI-generated` on tunes), a 700-weight
title and a three-line description in mist; `compact` drops the description
(the article's two-up "Keep reading"). The first two tiles on a page are
`priority` (eager, high fetch priority).

**Pagination** (`Pagination.astro`) closes every paginated list, the homepage
included: one centred row of 44px pills — `← Newer`, the page numbers
(outlined, current page ink-filled, ellipses past seven pages), `Older →`. A
step with nowhere to go stays as a disabled mist pill so the row never jumps;
below 640px the labels collapse to arrows.

## The article

`src/layouts/BlogPost.astro`:

- **Header** in an 860px measure, centred from 640px: outlined tag pills,
  the title at up to 58px/800, the post's `description` as a **standfirst** in
  mist, then a one-line byline — 40px tag-based cartoon avatar (the
  illustrated set in `public/images/avatars/`, chosen per `TAG_AVATAR_MAP`;
  there is no photo anywhere) beside `Russ McKendrick · date · read time`.
- **Hero** at frame width — 16:10 on phones, 16:9 from 640px, a 560px
  letterbox from 1024px, 22px radius. It is still the lightbox's first item
  and the LCP element (preloaded with the same `HERO_SIZES`).
- **Three columns from 1200px** (`.post-columns`: 220px | 700px | 220px): the
  left `ArticleRail part="contents"` is a sticky **On this page** list (13–14px
  mist, the current section in ink 600 with an amber dot, only when
  `showToc`); the right `ArticleRail part="tools"` is a sticky **Use this
  post** stack (Use with AI · Suggest edits · RSS · Follow on Google). Below
  1200px both rails drop out and the `StoryBar` opens the text column with the
  same tools; headings and the 2px amber **reading-progress bar** carry
  wayfinding.
- **Prose**: Geist 19px/1.75, 30px/700 section heads, ink links with a 2px
  amber underline (amber text on hover). Callouts are rounded tint panels —
  no side bar — with a bold sans heading in the variant colour. Code blocks
  are 12px-radius Expressive Code frames in Geist Mono; terminal frames keep
  the macOS window treatment.
- **Close**: three amber tombstone dots, then (human posts) an **author
  card** on tint — avatar, name, one-line bio, an ink "About me" button —
  then share buttons, related glossary terms, "More from the archive",
  comments and previous/next.

## Hub pages

- **Books** — newest first. A tint "Latest book" panel (eager cover, label ·
  year · publisher, 800 title, description, ink "About the book" and outlined
  "Buy" buttons), then "The whole shelf": cover cards with `year · topic` and
  a 700 title, 2 / 3 / 5 columns.
- **Tags** — outlined cards ordered by post count (1 / 2 / 3 / 4 columns):
  the tag's cartoon avatar, name, count, two-line description, and a
  hairline-separated link to its newest post.
- **Archives** — year cards (1 / 2 / 3 / 4 columns): a 16:9 three-image
  mosaic from that year's covers, the year at 32px/800, and post and tunes
  counts.
- **Tunes hubs** — one tab row (Latest weeks · Artists · Albums · By year).
  The artist and album directories open with a numbered "Most featured" row,
  then a sticky A–Z bar and letter sections of 2–6-column tiles: square 8px
  sleeves for albums, round portraits for artists. `/tunes/year/` uses the
  archive year card with the Year in Music artwork in place of the mosaic;
  a year page leads with that artwork uncropped on a tint panel beside the
  review's title and an ink "Read the review" pill.
- **Reading list** — pill filters (ink-filled when active), then month
  sections of 1 / 2 / 3-column cards: the article's preview image (or a tint
  tile with favicon and domain), domain · date, title, description, tag chips.
  The first row's previews load eagerly.
- **About** — a shallow full-width tint band like the homepage intro (the
  clickable random avatar beside "Hi there, my name is Russ.", a lede, and
  compact 2×2 stat tiles counted at build time), then 700px prose beside a topics/contact aside, the
  books shelf, and "Things I've built".

## The colophon footer

Every page ends with a tint footer in the 1320px frame, four columns from
1024px (two below 1024px, one on phones): the **logo** with a one-line description and
a "Subscribe via RSS" pill; **Explore** (the site's sections); **Elsewhere**
(every `SOCIAL_LINKS` entry as icon + name, two columns); and **Listened to
this week** (four covers, the entry title, `N weeks of listening →`; dropped
on the homepage, which has its own panel). A hairline bar closes it:
`© 2026 Russ McKendrick` left, `Source on GitHub · RSS · Back to top ↑`
right.

## OpenGraph cards

`src/components/OpenGraph/` renders every card in the same system: white
page, Geist 800 headlines, mist rubric, amber marks.

- **Cover card** (posts and hubs): the homepage lead as a card — the cover
  inset 32px with a 28px radius, the lockup on a white pill in its top-left,
  and the headline plus `date · read time · tag` on a white panel cut into the
  cover's bottom-left corner. No scrim; the words sit on the page.
- **Plate** (coverless fallback): white page, lockup, headline, standfirst,
  and a tint footer band with an amber dot and the rubric.
- **Tunes record** (albums and artists): sleeve and disc on white, an amber
  pill for `Album`/`Artist`, the name at 800.

Bump the `og-design:` salt in the `*-og.png.ts` routes after any card
change, or CI's cache keeps serving the old renders.

## Motion

- Homepage tiles and article header lines stagger in on load (8px rise,
  450ms, `cubic-bezier(.22,.61,.36,1)`, 60ms steps), gated behind
  `prefers-reduced-motion: no-preference`.
- The masthead labels slide out on hover/focus (150ms).
- The logo cursor and the `russ --now` cursor blink (1.1s square wave),
  steady under reduced motion.
- Hovers are colour, border or tint shifts — no zooms, no lifts, no springs.

## Do's and don'ts

- Do keep everything that is not content in mist — a second grey is a bug.
- Do use `--accent-fill` only for marks and `--accent` for text; never set
  amber `#F2B544` text on white.
- Do give the cover art room: full frame on the lead and hero, 16:10 tiles.
- Do keep the LCP image eager, `fetchpriority="high"`, preloaded with the
  exact `src`/`srcset`/`sizes` it renders with, and everything below it lazy.
- Don't add a third font family or reintroduce a serif.
- Don't add shadows (the terminal figure excepted), gradients or glass.
- Don't hide the AI-generated attribution on tunes, and don't add engagement
  chrome (claps, subscriber counts).
- Don't follow the system colour scheme by default — light is the default.
