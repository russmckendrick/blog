---
version: "1.0"
name: "Russ.Cloud — The Reading Room"
description: "Medium-calm editorial design system for the Russ.Cloud Astro blog and music site."
colors:
  paper: "#FBFAF7"
  paper-well: "#F3F1EB"
  ink: "#1E1C18"
  mist: "#6F6A61"
  hairline: "#ECE8E1"
  accent: "#2B559E"
  pill: "#EDF1F8"
  pill-hover: "#E2E9F5"
  terminal: "#24273A"
  terminal-bar: "#1E2030"
  dark-paper: "#161411"
  dark-paper-well: "#211E1A"
  dark-ink: "#E8E3DA"
  dark-mist: "#A69D8F"
  dark-hairline: "#2B2721"
  dark-accent: "#9FBCEB"
  dark-pill: "#20242E"
  dark-pill-hover: "#272D3B"
  terminal-light-red: "#ED8796"
  terminal-light-amber: "#EED49F"
  terminal-light-green: "#A6DA95"
  terminal-comment: "#939AB7"
  terminal-shadow: "rgba(15, 14, 20, 0.55)"
typography:
  article-title:
    fontFamily: "Schibsted Grotesk, -apple-system, Helvetica Neue, Arial, sans-serif"
    fontSize: 42px
    fontWeight: 700
    lineHeight: 1.19
    letterSpacing: "-0.011em"
  standfirst:
    fontFamily: "Schibsted Grotesk, sans-serif"
    fontSize: 21px
    fontWeight: 400
    lineHeight: 1.38
  feed-title:
    fontFamily: "Schibsted Grotesk, sans-serif"
    fontSize: 24px
    fontWeight: 700
    lineHeight: 1.375
    letterSpacing: "-0.014em"
  lead-title:
    fontFamily: "Schibsted Grotesk, sans-serif"
    fontSize: 27px
    fontWeight: 700
    lineHeight: 1.24
    letterSpacing: "-0.014em"
  prose-h2:
    fontFamily: "Schibsted Grotesk, sans-serif"
    fontSize: 22px
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.012em"
  body:
    fontFamily: "Literata, Georgia, Times New Roman, serif"
    fontSize: 18px
    fontWeight: 400
    lineHeight: 1.67
    letterSpacing: "-0.003em"
  dek:
    fontFamily: "Schibsted Grotesk, sans-serif"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.4
  meta:
    fontFamily: "Schibsted Grotesk, sans-serif"
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.55
  pull-quote:
    fontFamily: "Literata, serif"
    fontSize: 22px
    fontWeight: 400
    fontStyle: italic
    lineHeight: 1.45
  prose-h3:
    fontFamily: "Schibsted Grotesk, sans-serif"
    fontSize: 18px
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.008em"
  ui-small:
    fontFamily: "Schibsted Grotesk, sans-serif"
    fontSize: 15px
    fontWeight: 400
    lineHeight: 1.45
  caption:
    fontFamily: "Schibsted Grotesk, sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.45
  count:
    fontFamily: "Schibsted Grotesk, sans-serif"
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.4
  code:
    fontFamily: "IBM Plex Mono, ui-monospace, Consolas, monospace"
    fontSize: 13.5px
    lineHeight: 1.7
mobile:
  article-title: 32px
  body: "17px / 1.65"
  feed-title: 16px
  thumbnail: "full-width 2:1 banner"
rounded:
  image: 3px
  figure: 4px
  terminal: 10px
  search-input: 20px
  pill: 9999px
  portrait: 9999px
layout:
  column: 680px
  masthead: 60px
  logo-lockup: "28px-tall SVG, fixed at all widths"
  thumbnail: "160×107 (full-width 2:1 banner mobile)"
  mobile-gutter: 24px
---

# The Reading Room — design system

## Overview

Russ.Cloud set as a **single-author reading room**: Medium's measured calm —
one column width for everything, two text colours, one hairline value, no
cards — executed in a world that is unmistakably not Medium's. Text leads
everywhere; cover art is subordinate in listings and artwork inside articles.
There are **no sidebars anywhere** — the archive's depth (author, the week's
records, wayfinding) lives in a shared colophon footer that closes every
page, so even a search arrival deep in the archive ends on who writes here.

## Tokens and naming

- **Paper** `#FBFAF7` is the page — warm off-white, never pure white.
  `paper-well` is the only fill (search input, inline code). The Night edition
  is a second material — warm dark paper `#161411`, softened ink and accent —
  not an inversion.
- **Ink** `#1E1C18` for titles and body; **mist** `#6F6A61` for *everything*
  that is not content — deks, dates, read times, captions, inactive tabs,
  subtitles. There is no third text tint. Both pass 4.5:1 on paper in both
  editions.
- **Hairline** `#ECE8E1`, always 1px, is the only separator: masthead edge,
  feed-row dividers, the full-height sidebar rule, story action bars, tab
  baseline. Never varied in weight.
- **Accent** `#2B559E` — blue-black "pen ink" — appears only as: title/link
  hovers, the tinted tag pills, and the article tombstone. Nothing else —
  the wordmark's dot and cursor use the logo mark's own palette, not the
  accent. No burnt orange anywhere (clean break from Print Edition).
- **Radius:** 3px listing thumbnails, 4px article figures, full pills, round
  portrait. (A deliberate break from Print Edition's radius-0 rule.)

## Typography

Two faces, self-hosted through Astro's Fonts API:

- **Schibsted Grotesk** — display and all UI. Titles bold with negative
  tracking that scales with size (−0.011em at 42px, −0.014em at 22–27px);
  headings tight at lh ≈ 1.2–1.27; meta small (13px) and never tracked.
  Commissioned for a newsroom, so the editorial DNA is native, not borrowed.
- **Literata** — article body only, **18px/30px** (17px mobile), ~2em
  paragraph gaps, no indents. Literata's large x-height means 18px here is
  optically what Source Serif is at 20px — set it nominally larger and the
  page reads large-print (calibrated against Medium side-by-side, 1 Aug
  2026); ~65–70 characters per line in the 680px column is the target. Serif never appears in UI; sans never appears in body
  copy. Pull quotes are large italic Literata in mist, indented, no bar.
- **IBM Plex Mono** appears only inside terminal figures and inline code —
  never as metadata costume.
- The masthead wordmark is **not a live face**: "russ" (Poppins ExtraBold)
  and ".cloud" (Poppins Light) are baked to SVG outline paths by
  `scripts/generate-logo.js`, so Poppins is never loaded and the two-face
  rule holds for all live text.

## Layout

One centred **680px column** for everything — feed, tunes, and article share
the same measure (728px incl. 24px gutters), so browsing and reading feel
like the same room. No sidebars, no rails. Masthead is one 60px row: the
brand lockup left — one self-contained SVG (`Logo.astro`): the iMac mark +
`russ.cloud` in baked Poppins outlines (heavy ink "russ", light mist
".cloud") with the dot and a blinking block cursor on the baseline in the
mark's own colours — its screen blue `#35495E` on paper, its base grey
`#BDC3C7` in the Night edition (1.1s square wave, steady under reduced
motion); seven links
(Tunes · Books · Reading List · Tags · Archive · About · Source — the last
off-site to the repo) resting as glyphs alone — a 15px
hairline mark at 62% opacity, its label collapsed to nothing until hover or
keyboard focus unfurls it to the right over 150ms and the glyph comes up to
full ink with it (labels stay visible on touch, where there is no hover to
give them) — then a 16px vertical hairline
and the icon-only search trigger and theme toggle right; burger menu below
768px with the search icon staying beside it. Search is not a widget in the bar:
the icon (a plain link to `/search/`, JS-upgraded) opens the **search
sheet** — a native dialog rendered as a full-width paper band under the top
edge, closed by a hairline, the page behind veiled in 78% paper. Inside the
728px measure sit a 13px mist label, a real autofocused Pagefind input
(20px radius, the `paper-well` fill), and an internally scrolling results
drawer. `⌘K`/`Ctrl+K` or `/` opens it; `Esc`, the X, or the veil closes
it; Pagefind's assets lazy-load on first open. No card, no shadow — the
sheet reads as the masthead unfolding. Then silence until the colophon
footer.

## The feed

Rows, not cards: full-width title (2-line clamp) over a two-column lower
band — dek (full text, never truncated; hidden on mobile) → meta `date · read time · tags`
on the left, a 160×107 thumbnail flush right, bottom edge on the meta
baseline, 3px radius. Mobile stacks each row as three full-width lines —
16px title, then the meta line, then a full-width centre-cropped 2:1
banner (3/4 of the natural 3:2 height) closing the row; the title is
never squeezed into a side column. The whole row is one click target — an
empty labelled link laid over it, not a wrapping anchor, so the tag chips
in the meta line stay real links to their hubs like everywhere else.
Hairline between rows, ~30px padding. Tab row
(`Latest · AI · Tools · Code …`) doubles as topic navigation — real tags,
active state = ink underline on the baseline hairline. Tunes reuses the exact
grammar with a 21:9 lead banner for the current week and `Artists 512 ·
Albums 952 · By year` as its tab row; **AI-generated attribution stays in the
lead meta line — non-negotiable brand commitment.** Under the lead meta, the
week's records appear as an eight-cover **film strip** (square, 3px radius,
4-across on mobile) with a quiet `The records themselves live at russ.fm ·
Last.fm · Discogs` line beneath.

Listings end in **pagination**, not a browse link: a quiet 14px sans row —
numerals in mist centred in the column, current page in ink 600 with a 1px
ink underline (the active-tab idiom), an ellipsis to the last page, `← Newer
posts` flush left and `Older posts →` flush right. Both steps are always
present; the one with no page in that direction renders as static mist at
40% opacity rather than disappearing. Below 640px the Older/Newer labels
collapse to bare arrows so the row keeps to one line.

## The colophon footer

Every view ends the same way: a hairline, then a two-block footer in the
680px column (stacking on mobile) — **Links** (the full `SOCIAL_LINKS` set
as 17px monochrome icons from `Icon.astro` — mist at rest, ink on hover,
config order, wrapping to two tidy rows; never brand colours; on mobile
the icon rows centre in the column while the Links head stays left) beside
**Listened to this week** (four 64px covers — a full-width four-across
grid on mobile — entry title, `171 weeks of listening →`) — closed by one single line: `About · Archives ·
Reading list · Glossary · Tags · Source · RSS · © 2026 Russ McKendrick`.
No bio in the footer — the bio belongs to the About page only; no location,
no typeface credit, nothing else. This footer is the
archive's identity block; there is no photo of Russ anywhere in the design
(the byline avatars are the illustrated tag set).

## The article

Balanced sans title (42px), then directly a single-line byline (no
standfirst — the description belongs to feed rows and meta tags only): a
36px circular **tag-based avatar** (the illustrated set in
`public/images/avatars/`, chosen per `TAG_AVATAR_MAP` in `src/consts.ts` —
cartoons, so the no-photos rule holds — there is no photo anywhere in the
design) beside `Russ McKendrick · 9 min read · 19 Jul 2026` (name in
ink 500, the rest mist, one line). Then a hairline **storybar**
(`StoryBar.astro`): tags left, `Read as Markdown · Suggest edits · RSS`
right, rendered below 1200px only — it carries what the rail would show if
there were a margin to put it in, so the two never appear together. Hero figure at
column width with a centred mist caption. A **reading-progress rule** — 2px
of accent, fixed to the top viewport edge, no gradient, no glow — runs on
article pages only. An **article rail** (`ArticleRail.astro`) sits open and sticky in the right
margin beside the centred column on viewports ≥1200px — hairline-left, three
headed sections: **Contents** (13px mist entries, current section in ink 600
via IntersectionObserver, only when `showToc`), **Tags** (small tinted pills,
`.tag-editorial--sm`), and **Actions** (Read as Markdown · Suggest edits ·
RSS). Below 1200px the rail disappears and the storybar takes over its tags
and actions under the byline; Contents stays rail-only, so headings and the
progress rule carry wayfinding and there is still no inline table of
contents. Feed-row metas show up to three small tag pills. Body in Literata with ink-coloured
underlined links (accent on hover only). Terminal code figures carry over
from Print Edition unchanged — macOS window (10px radius), traffic lights in
the Catppuccin Macchiato reds/ambers/greens documented in the token
frontmatter, in both editions; they are figures, not chrome, and the one
permitted shadow (`terminal-shadow`). The mockup's floating view switcher is
tooling, not part of this system — its colours are exempt from the palette. Articles close with a **three-dot accent tombstone**, then
tag pills, then two "More from the archive" rows.

## Motion

One authored moment: feed rows stagger in on load (8px rise, 450ms,
`cubic-bezier(.22,.61,.36,1)`, 60ms steps), gated behind
`prefers-reduced-motion: no-preference`. Hovers are colour shifts only — no
zooms, no lifts, no springs.

## Do's and don'ts

- Do keep everything that is not content in mist — a second grey is a bug.
- Do spend the accent nowhere; its scarcity is the identity.
- Do keep the feed text-led; the covers earn their scale inside articles and
  the tunes lead only.
- Don't reintroduce cards, shadows (terminal figures excepted), gradients,
  glass, coloured side-bars, or eyebrow labels.
- Don't let any UI face drift into the body serif or vice versa.
- Don't hide the AI-generated byline on tunes, and don't add engagement
  chrome (claps, share rows, subscriber counts) — the colophon footer carries
  the archive instead.
- Don't reintroduce sidebars or rails; the column is the whole page.
