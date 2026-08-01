> **Provenance:** research agent output, 31 Jul 2026, commissioned for the
> "Reading Room" redesign proposal (see [../NOTES.md](../NOTES.md)).
> Forensic teardown of Medium.com's live design system. Method: getComputedStyle/getBoundingClientRect in a real browser (1440x900 desktop, 375x812 mobile) across the landing page, a tag hub, a profile feed, and a full article. All values measured, not inferred.

# Medium.com Visual Design System — Forensic Teardown (measured live, July 2026)

**Method:** All numbers below were measured directly from `getComputedStyle()` / `getBoundingClientRect()` in a real browser session at a 1440×900 viewport (mobile checks at 375×812) on three page types: the logged-out landing page (medium.com), a topic/tag hub (medium.com/tag/programming), a profile feed (ev.medium.com — this is the same list-row component as the logged-in home feed), and a full article (ev.medium.com/making-social-social-again-0126fa5c6ce8). Items I could not verify first-hand are explicitly flagged. Everything else is measured, not inferred.

---

## 1. Typography

### 1.1 Font families and actual CSS stacks (verified via computed styles + `document.fonts`)

| Role | Stack (verbatim from computed style) |
|---|---|
| UI / headlines / feed titles / article titles | `sohne, "Helvetica Neue", Helvetica, Arial, sans-serif` |
| Article body serif (current default) | `source-serif-pro, Georgia, Cambria, "Times New Roman", Times, serif` |
| Display serif (landing hero, newsletter promos) | `gt-super, Georgia, Cambria, "Times New Roman", Times, serif` |
| Legacy/content sans (tag pills, some editor content) | `medium-content-sans-serif-font, -apple-system, "system-ui", "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif` |
| Code blocks | `source-code-pro` (400, 700 + italics) |

**Complete webfont roster actually loaded on an article page** (from `document.fonts`, deduplicated):

- `sohne` — weights **300, 400, 500, 700**, each with italic (Söhne, Klim Type Foundry). This is the workhorse: every UI label, feed title, article title, section heading, caption, byline.
- `source-serif-pro` — 400, 700 + italics. **The current default article body face.** The measured body paragraph resolves to `source-serif-pro`, *not* Charter.
- `charter` — 400, 700 + italics. Still shipped (Matthew Carter's Charter, licensed 2015) — used for legacy posts/author font options, and it's the serif fallback story most teardowns still cite.
- `gt-super` — 400 only (GT Super, Grilli Type). Display serif for the marketing hero and small "Get X's stories in your inbox" promo headings (measured at 18px/21px, ls −0.27px).
- `noe` — 500 (Noe Display; legacy 2017 brand face, still loaded).
- `fell` — 400 + italic (editor font option).
- `opendyslexic` — 400 + italic (accessibility reading option).
- `source-code-pro` — 400, 700 + italics.

Notable: the body font-size baseline for generic UI is **13px sohne**, unusually small, which is part of why the content reads as dominant.

### 1.2 Type scale (all desktop @1440, all measured)

| Element | Font | Size/Line-height | Weight | Letter-spacing | Color |
|---|---|---|---|---|---|
| Landing hero ("Human stories & ideas") | gt-super | **120px / 100px** (lh 0.83!) | 400 | **−6.6px** (−0.055em) | #242424 |
| Article title (h1) | sohne | **42px / 52px** (1.24) | 700 | **−0.462px** (−0.011em) | #242424 |
| Tag-hub page title | sohne | 42px / 52px | **500** | −0.462px | #242424 |
| Article subtitle (h2 kicker) | sohne | **22px / 28px** | 400 | 0 | **#6B6B6B** |
| Article body (p) | source-serif-pro | **20px / 32px** (1.6) | 400 | −0.06px (−0.003em) | #242424 |
| In-body section heading (h3) | sohne | **20px / 24px** | **600** | 0 | #242424; margin-top ≈34px (~1.7em) |
| Feed row title (h2) | sohne | **24px / 30px** (1.25) | 700 | **−0.384px** (−0.016em) | #242424 |
| Feed row excerpt | sohne | **16px / 20px** | 400 | 0 | #6B6B6B, `-webkit-line-clamp: 2` |
| Feed author line (name) | sohne | **13px / 20px** | 400 | 0 | #242424 |
| Feed date / clap / response counts | sohne | 13px / 20px | 400 | 0 | **#6B6B6B** |
| Article byline meta ("8 min read · Dec 12, 2024") | sohne | **14px / 20px** | 400 | 0 | #6B6B6B |
| Figcaption | sohne | 14px / 20px | 400 | 0 | #6B6B6B (centered; container 728px) |
| Grid-card title (tag hub, 2-up cards) | sohne | 20px / 24px | 700 | 0 | #242424 |
| Grid-card description | sohne | 16px / 20px | 400 | 0 | #6B6B6B, clamp 2 |
| Sidebar profile name | sohne | 16px / 20px | 500 | 0 | #242424 |
| Sidebar followers count | sohne | 16px / 24px | 400 | 0 | #6B6B6B |
| Sidebar bio / "Following" list names | sohne | 14px / 20px | 400 | 0 | #6B6B6B |
| Profile tab nav (Home/Lists/About) | sohne | 14px / 20px | 400 | 0 | active #242424, inactive #6B6B6B |
| Header nav links / search input | sohne | 14px | 400 | 0 | #242424 (input placeholder grey) |
| Sign up pill label | sohne | 13px | 400 | 0 | #FFFFFF |

**Mobile (375px) overrides, measured:** article title **32px/38px**; article body **18px/28px**; feed row title **20px/24px**; horizontal page padding **24px**.

**Letter-spacing pattern:** negative tracking scales with size — roughly −0.011em at 42px, −0.016em at 24px, −0.003em at 20px body, −0.055em at 120px display. Small text (≤16px) is never negatively tracked.

**Line-height pattern:** headings sit at ~1.24–1.25; body serif at 1.6 (20/32); small meta text at ~1.5 (13/20). Paragraph rhythm comes from `margin-top` ≈ 42.8px (≈2.14em) between body paragraphs — big paragraph gaps, no indents.

---

## 2. Measure & Layout

### 2.1 Article page
- **Text column: exactly 680px**, centered. At 20px serif that's ~65–70 characters per line.
- Figures/captions run in a **728px** container (images can sit slightly wider than text); mobile column is viewport − 48px (24px each side).
- Title margin-top ≈50px below the byline block; subtitle 20px below title; content starts ~43px below.
- Clap/response **action bars**: `border-top: 1px solid #F2F2F2; border-bottom: 1px solid #F2F2F2`, icons and counts in #6B6B6B — one above the article (below byline), one at the end.
- Body links: **underlined, same ink color #242424** — no blue, no green in running text.
- Tags at article foot: pills, `background: #F2F2F2; border-radius: 100px; padding: 8px 16px`, 36px tall, no border, text rgba(0,0,0,0.8) ~16px.

### 2.2 Overall grid (profile/feed pages — same component as logged-in home)
- Total content container: **1192px**, centered.
- **Main feed column: 680px** (same measure as the article — key trick: one column width across the whole product).
- **Right sidebar: 368px** including `padding: 0 24px 0 40px` (so 304px of content), separated by a **full-height `border-left: 1px solid #F2F2F2`** (min-height: 900px so the rule runs the whole viewport).
- Logged-in homepage structure (corroborated via Medium Help Center + user teardowns, not directly measurable logged-out): same 680/368 split; feed tabs "For you" / "Featured"; sidebar stacks **Staff Picks** (title-only story rows), **Recommended topics** (pill cloud), **Who to follow**, **Reading list**, then tiny footer links at sidebar bottom.

### 2.3 Feed list row anatomy (measured on ev.medium.com; identical pattern to home feed)
Row total: **~193px tall**; **32px vertical gap** between rows; each row ends with a **1px solid #F2F2F2 divider** exactly at its bottom edge. No card, no background, no border, no shadow, no radius — divider only.

Structure, top to bottom:
1. **Author line** (row top, offset 0): 20×20px circular avatar + author name (sohne 13px #242424) + `·` + date (13px **#6B6B6B**). In multi-author feeds this reads "In {Publication} by {Author}" — "In/by" grey, names ink.
2. **16px gap**, then **title**: sohne 24/30 bold, clamped to 2 lines, in a **464px text sub-column**.
3. **8px gap**, then **excerpt**: sohne 16/20 #6B6B6B, `-webkit-line-clamp: 2; overflow: hidden`.
4. **Meta row** at bottom: 13px #6B6B6B — gold **member star (#FFC017)** when member-only, clap count, response count on the left; bookmark/"show less" icons right-aligned, also grey.
5. **Thumbnail: 160×107px (≈3:2), `border-radius: 2px`, flush right** (0px from row's right edge), top edge **36px** below row top — i.e., aligned with the title block, not the author line. Gutter between text column and thumbnail: **56px**.
6. Mobile: thumbnail shrinks to **80×53px**, title to 20/24; excerpt keeps its 2-line clamp.

### 2.4 Tag/topic hub layout
- Centered title (42/52, weight 500), "Topic · 13.8M followers · 438K stories" meta line in grey, black pill Follow button, then a full-width hairline, then "Recommended stories" (sohne ~20px bold) over a card grid (2-up at ~800px; image-top cards with 20px bold titles, grey 16px descriptions, author line above title).
- Horizontal **topic pill bar** under the header: "Explore topics" + scrolling pills (white bg, 1px #F2F2F2-ish border, radius ~100px, 36px tall, 16px text), with the active topic pill outlined.

---

## 3. Color (verified hex values)

| Token | Hex | Where |
|---|---|---|
| Page background | **#FFFFFF** | feed, article, tag pages — flat white everywhere |
| Primary ink | **#242424** (rgb 36,36,36) | all titles, body text, active nav, icons |
| Secondary text | **#6B6B6B** (rgb 107,107,107) | every date, excerpt, count, caption, byline meta, subtitle, inactive tab |
| Hairline | **#F2F2F2** (rgb 242,242,242) | ALL dividers: header border-bottom, feed row dividers, sidebar border-left, article action bars — always 1px solid, never darker |
| Input/quiet fill | **#F9F9F9** | header search pill |
| Tag pill fill | **#F2F2F2** | tag pills (same value as hairlines) |
| Green accent | **#1A8917** (rgb 26,137,23) | **verified on exactly 2 elements on an entire article page: the two "Sign up" buttons.** Not links, not logos, not hovers, not selected states. Membership CTAs elsewhere. That's the whole story of the green. |
| Brand gold | **#FFC017** | member-only star icon only |
| Legacy content text | rgba(0,0,0,0.8) | old content-sans elements, tag pill text |
| Landing cream | **#F7F4ED** | logged-out marketing landing page only (with 120px gt-super hero + green flower illustration + black pill CTA) |

Full SVG icon fill palette found on an article page: `#242424, #000, #FFF, #6B6B6B, #FFC017` — five values, one of them the gold star. Total restraint.

**Buttons:** Follow = solid **#242424** pill, white text, `padding: 9px 16px`, fully rounded. Sign up = solid **#1A8917** pill, white text, `padding: 5px 12px`, 13px. Landing CTA = black pill. There are no outlined/ghost primary buttons in the reading surfaces.

**Dark mode:** verified that the **logged-out web ignores `prefers-color-scheme: dark` entirely** (page stays #FFFFFF under forced dark emulation). Dark theme is a signed-in setting (Light/Dark/System) plus app night mode. The DOM shows tokenized CSS custom properties (e.g. `var(--color-fg-neutral-secondary)` as an SVG fill), so theming is a token swap. Community userstyles report a near-black ~#191919 surface — **unverified first-hand**.

---

## 4. Chrome

- **Header: 57px tall**, white, `border-bottom: 1px solid #F2F2F2`, full-width. Left: serif wordmark + **search pill** (40px tall, `border-radius: 20px`, bg #F9F9F9, 14px sohne, magnifier icon). Right: "Get app" (black pill), "Write" (icon + 14px text link), **"Sign up" (green #1A8917 pill)**, "Sign in" (plain text), avatar placeholder. That is the entire header — no nav links, no dropdown menus, no category bar on article pages. Logged-in: search + Write + bell + avatar, still one 57px row.
- Landing-page-only top bar is 75px on cream with a solid black rule and just: wordmark, Our story, Membership, Write, Sign in, Get started (black pill).
- **Footer:** on the landing page, a single row of 13–14px grey links (Help, Status, About, Careers, Press, Blog, Store, Privacy, Rules, Terms, Text to speech) above/below a hairline. On article/feed pages the footer is essentially absent — sidebar-bottom micro-links do that job. There is no fat footer anywhere.
- **Tags/topics:** always the same object — a grey #F2F2F2 pill, radius 100px, 8px×16px padding, ~36px tall, no border, plain text. Tags are never colored, never counted with badges, never boxed.
- Profile sub-nav: plain 14px text tabs (Home, Lists, About) with active = ink + thin underline, inactive = grey; hairline under the whole tab row.

---

## 5. The 10 copyable decisions (each one verified above)

1. **One column width for everything: 680px.** The article measure and the feed column are the same number, so reading a list and reading a story feel like the same room. Sidebar (368px incl. padding) is strictly navigational furniture behind a 1px rule.
2. **Two text colors do all the work: #242424 and #6B6B6B.** Not black-on-white (softer contrast ~13.9:1), and *everything* that isn't content — dates, counts, captions, subtitles, excerpts, inactive tabs — is the same single grey. No third tint, no colored meta.
3. **One hairline value, used identically everywhere: 1px solid #F2F2F2.** Header edge, row dividers, sidebar rule, action bars. Because it never varies in weight or darkness, the page reads as one continuous surface, not a stack of boxes.
4. **No cards.** Feed rows have no background, border, radius, or shadow — just the hairline divider and 32px of air. Structure comes from spacing (author line → 16px → title → 8px → excerpt) and the 2-line clamps that keep every row the same height (~193px).
5. **Thumbnails are small, right-aligned, and subordinate: 160×107 (80×53 mobile), radius 2px, flush right, top-aligned with the title, 56px away from the text.** Text leads; the image is a footnote. This is the single biggest anti-"blog card" move.
6. **The accent color is almost never used.** Green #1A8917 appeared on exactly two elements per page (Sign up). Links in body copy are ink-colored with underlines; icons are grey; tags are grey. One gold #FFC017 star is the only other chroma. When everything is quiet, the two loud pixels convert.
7. **Serif for reading, one sans for everything else.** Body: source-serif-pro **20px/32px** (1.6, −0.003em, ~2.1em paragraph gaps, ~68ch measure). All chrome, titles, and meta: sohne in exactly four weights (300/400/500/700). The contrast in *role* is absolute — no serif ever appears in UI, no sans in body copy.
8. **Tight display, loose body:** headings at lh ≈1.24 with negative tracking that scales with size (−0.011em at 42px, −0.016em at 24px, −0.055em at 120px); body at 1.6 with none. Titles feel set; paragraphs feel airy.
9. **Meta is a formula, not a design:** `avatar(20px) name · date` on top, `star · claps · responses` on the bottom, all 13px, all grey, middle-dot separated, icons monochrome. "8 min read · Dec 12, 2024" on articles at 14px. No labels ("Published:", "Author:"), no color, no badges.
10. **57px of chrome, then silence.** One-row header (wordmark + search + two actions), hairline, content. No mega-menu, no category nav, no fat footer, no breadcrumbs; even pagination is infinite scroll. Buttons are fully-rounded pills in ink (secondary) or green (the one conversion action), so the chrome vocabulary is 3 shapes total: pill, hairline, circle avatar.

**Bonus verified details worth stealing:** search pill 40px/radius-20/bg-#F9F9F9; tag pill = same grey as hairlines (#F2F2F2) so tags read as "background material"; figcaptions centered grey 14/20; body links underline-only; mobile drops title 42→32 and body 20→18 with 24px gutters; feed excerpt uses real `-webkit-line-clamp: 2`.

---

## Sources

Live computed-style measurement of [medium.com](https://medium.com), [medium.com/tag/programming](https://medium.com/tag/programming), [ev.medium.com](https://ev.medium.com), and [Making "Social" Social Again](https://ev.medium.com/making-social-social-again-0126fa5c6ce8) (July 31, 2026). Corroborating references: [Fonts In Use — Medium.com (2015)](https://fontsinuse.com/uses/12025/medium-com-2015), [Design Your Way — What Font Does Medium Use?](https://www.designyourway.net/blog/what-font-does-medium-use/), [Medium Help Center — Your homepage](https://help.medium.com/hc/en-us/articles/115012586467-Your-homepage), [Feedium — How to Use the New Medium Layout](https://medium.com/feedium/how-to-use-the-new-medium-layout-a-feedium-guide-3dde9e480c48), [E. Ardincaple — New Medium Design Breakdown](https://medium.com/@e.ardincaple/ive-been-upgraded-to-the-new-medium-design-here-s-a-breakdown-of-all-the-changes-with-pictures-708720b4a5c9), [Hustle AM — Dark Mode on Medium Desktop](https://medium.com/write-a-catalyst/how-to-get-dark-mode-on-medium-on-desktop-here-is-the-link-585ab8f19ef8).