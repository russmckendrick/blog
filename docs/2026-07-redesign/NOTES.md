# 2026-07 redesign — decision notes

**Status: proposal.** Russ is sleeping on it (31 Jul 2026). Nothing in the
site has changed; the live design system is still the Print Edition described
in the repo root `DESIGN.md`.

## The brief

> "I have never really been happy with it… I would like it to look and feel
> like Medium — but not look like a rip off… it needs to look professional as
> it represents me."

Decisions Russ made explicitly when asked, before any pixels:

| Question | Decision |
|---|---|
| Continuity with the Print Edition? | **Clean break** — new palette, nothing carried over (the burnt-orange accent retired) |
| Homepage shape? | **Full Medium-style list feed** — text-led rows, small right thumbnails, maximum calm (not the hybrid big-lead option) |
| Typography? | **Sans headlines + serif body** — a characterful grotesque (explicitly not Inter), Charter-like serif for reading |

Steers given during iteration, all reflected in the mockup:

- Bring the **iMac-with-glasses SVG logo** back into the masthead.
- **Burger menu on mobile** (full-width panel, hairline rows, becomes an X when open).
- **"Don't need my face everywhere"** — avatars stripped from the masthead and article byline; the sidebar bio portrait is now the only photo of Russ on the site.
- **"Suggest edits" restored** (the old PaperMod-era feature) — sits in the story toolbar; in the real build it deep-links to the post's source on GitHub.
- Tag-tabs as the homepage's only navigation: **approved**.
- "Read as Markdown" in the story toolbar (surfacing the agent-readable pipeline as a user feature): **approved**.
- **Tunes section included** as a third view, same grammar as the rest of the site.
- **Footer slimmed to a dedicated Links section** (1 Aug 2026) — the name + bio block came out ("we don't need a bio on every page" — it belongs to About); the left footer block is now just a "Links" head over the social icon set. The fineprint also lost its location and typeface credit, and the wayfinding + © merged into one closing line.
- **Full social links in the footer** (1 Aug 2026) — the footer bio's four text links became the complete 14-profile `SOCIAL_LINKS` set rendered with the real `Icon.astro` glyphs: 17px monochrome icons in mist (ink on hover), config order, two wrapped rows, real URLs. No brand colours — the icons obey the two-text-colour rule like everything else.
- **Sidebar removed — "everything to the footer"** (1 Aug 2026) — Russ wasn't a fan of the sidebar; offered three re-homings, he chose the purest: single centred column everywhere, with the bio, this week's records, and wayfinding moving to a shared two-block colophon footer that closes every view. The tunes sidebar's record grid became an eight-cover film strip under the weekly banner. Side effect, consistent with the avatar steer: there is now no photo of Russ anywhere in the design.
- **Pagination mocked in place of "Browse all →" links** (1 Aug 2026) — both listings end in a quiet numeral row (current page in ink with the active-tab underline, ellipsis to the last page, `Older posts/weeks →` right-aligned).
- **Tag-based avatars restored, byline flattened to one line** (1 Aug 2026) — the byline carries the current site's illustrated tag avatar (per `TAG_AVATAR_MAP`, first tag wins: tools → `cables.svg` for the mockup post) at 36px beside a single line `Russ McKendrick · 9 min read · 19 Jul 2026`. Cartoon avatars don't break the "no face everywhere" rule; the sidebar portrait remains the only photo.
- **Body type sized down after a side-by-side with Medium** (1 Aug 2026) — Literata's big x-height made the nominal 20px body read a size larger than Medium's 20px Source Serif ("it's sooo big"). Body is now 18px/30px (17px mobile), pull quote 22px, in-body h2 22px; ~65–70 characters per line in the 680px column, matching Medium's density. Recorded in DESIGN.md so implementation doesn't "helpfully" bump it back to 20px.
- **Table of contents and reading tracker restored** (1 Aug 2026) — the Contents block returns as a native `<details>` between hero and prose (hairline rules, chevron summary, anchor links with smooth scroll), and the reading progress bar returns as a 2px accent rule fixed to the top viewport edge, article pages only. The mockup's story body gained the post's real remaining sections ("What I deliberately skipped", "Everything else that shipped", "Installing") so the contents have real anchors.

## What the research found

Medium was measured live (computed styles on medium.com, a tag hub, a
profile feed, and an article — including Russ's own cross-published posts).
The load-bearing numbers, all honoured in the mockup:

- **One column width for everything: 680px** — the feed and the article share the same measure, so browsing and reading feel like the same room. Sidebar 368px behind a single full-height 1px rule.
- **Two text colours do all the work** (#242424 / #6B6B6B in Medium's case): every non-content element is the same single grey. No third tint anywhere.
- **One hairline value** (1px #F2F2F2) used identically everywhere.
- **No cards** — rows separated by whitespace + hairline; structure from spacing and 2-line clamps.
- **Thumbnails subordinate**: 160×107, flush right, title-aligned — the single biggest anti-"blog card" move.
- **The accent is almost never used** (Medium's green appears ~twice per page). Body links are ink-coloured and underlined.
- **Serif for reading, one sans for everything else**, with absolute role separation. Tight display (lh ≈1.24, negative tracking scaling with size), loose body (20/32).
- Meta is a formula, not a design: middle-dot separated, 13px, grey, no labels.
- **57px of chrome, then silence** — no mega-menu, no fat footer, no breadcrumbs.

A parallel survey of ~17 professional personal sites (Stamatiou, Abramov,
Rauch, MacWright, Evans, Willison, iA, Stripe, Chimero, et al.) distilled the
differentiation levers used here: accent-hue commitment, paper temperature,
wordmark-as-single-flourish, a designed list schema, and a materialised (not
inverted) dark mode. It also produced the font shortlist — **Schibsted
Grotesk** (newsroom-commissioned, Söhne-adjacent, unsaturated) over
Inter/Instrument/Public Sans, and **Literata** was runner-up to **Source
Serif 4** for the body; Literata won for warmth and because a clean break
argued against keeping the incumbent body face.

## Deliberately Medium vs deliberately ours

**Kept from the canon:** 680px shared column · two text colours · one
hairline · no cards · small right thumbnails · meta formula · tab row with
ink underline · search pill in the masthead · grey-pill tags (ours are
ink-tinted) · underlined ink body links · minimal chrome top and bottom.

**Deliberately not Medium:**

- **Warm paper** (#FBFAF7) with warm ink, instead of clinical white — reads print, not app. Night edition is warm dark paper, not black.
- **Type**: Schibsted Grotesk + Literata, not Söhne + Charter/Source Serif.
- **Accent**: blue-black "pen ink" (#2B559E) — not Medium green, not default blue, not the old burnt orange. Spent on almost nothing: wordmark dot, hovers, pill tint, tombstone.
- **The sidebar is the archive, not engagement furniture**: bio + fourteen-books line, this week's album covers, topics, quiet wayfinding — no Staff Picks, no follower counts, no claps anywhere.
- **Signature details**: iMac logo + `russ.cloud` wordmark with the ink dot; the three-dot tombstone closing every article; macOS terminal figures (Catppuccin Macchiato) carried over from the Print Edition because they depict Russ's real terminal.
- **"Read as Markdown" + "Suggest edits"** in the story toolbar — the agent-readable pipeline and the GitHub-backed archive surfaced as reader features. Medium cannot ship either.
- **Tunes**: the weekly record with visible **AI-generated attribution** (brand commitment), 21:9 cover-art lead, archive browse tabs with real counts (Artists 512 · Albums 952), and a russ.fm module.

## What the mockup implements

`russcloud-redesign-mockup.html` — fully self-contained (~1.5 MB): all images
inlined as data URIs, and both typefaces embedded as **static-weight woff2
instances** (Schibsted Grotesk 400/500/600/700, Literata 400/400i/600, latin
subset, instanced from the Google variable fonts with fonttools, opsz pinned
at 20). Embedding happened after the original Google-Fonts `<link>` rendered
everything bold in at least one viewer — variable fonts let a bad viewer
collapse every weight onto one instance, static faces can't; `font-synthesis:
none` guards the rest. This is mockup portability only: the real site
self-hosts fonts through Astro's Fonts API exactly as it does today. The
floating pill (mockup tooling, not part of the design) switches:

- **Feed** — tag-tabs, six real posts (titles, deks, dates, read times, real cover thumbnails), pagination (1–5 … 21 · Older posts →), and the shared colophon footer (bio + this week's records + wayfinding + © line).
- **Story** — the Token Use post with real body copy: balanced 42px title, standfirst, avatar-less byline, storybar (Read as Markdown · Suggest edits · RSS), reading-progress rule, hero + caption, Contents block with working anchors, Literata prose across h2/h3 sections, pull quote, terminal figure with the real brew commands, tombstone, tag pills, two more-from rows.
- **Tunes** — Week 30 lead with 21:9 banner and AI-generated meta, the eight-cover records film strip with a russ.fm · Last.fm · Discogs line, four real previous weeks, pagination.
- **Night** — the second edition across all three views (also follows `prefers-color-scheme` on load).
- Responsive: single column at every width; under 640px the masthead collapses to logo + burger, deks hide, thumbnails drop to 100×67, title 32px, body 17px, the records strip goes 4-across, and the footer blocks stack.

Process notes: an independent review pass produced five material fixes, all
applied (sidebar reflow instead of hiding, single copyright, wordmark returns
home, clickable thumbnails, stateful theme/burger icons) plus the tombstone
suggestion. The impeccable design detector reports zero findings. Fabricated
content: none — every title, count, description, cover and claim is real
repo content; the only invented strings are UI labels.

## Known trade-offs and deferred items

- **Cover art is demoted on the homepage** (artwork → 160px footnote). Russ chose this knowingly; it's the one aesthetic cost of the text-led feed. Covers still lead inside articles and on the tunes lead.
- Deferred to implementation: real `alt` text, `:focus-visible` styles, Pagefind search wiring, pagination, tag/year/archive/books/glossary/reading pages, tunes artist/album/year hubs, OG image style refresh to match the new world.
- Open: whether tunes hub pages (artist/album/year) need their own mockup or just inherit the grammar (rows + pills). Recommendation: inherit; no new grammar needed.

## Implementation sketch (when approved)

1. **Fonts**: swap Source Serif 4 + IBM Plex Mono for Schibsted Grotesk + Literata via Astro's Fonts API (self-hosted, same mechanism as today). Mono goes system.
2. **Tokens**: replace the paper/ink primitives in `src/styles/global.css` (the Material-alias layer keeps old components compiling during the transition).
3. **Templates**: masthead + burger, homepage feed + tabs, sidebar, article layout (byline, storybar, tombstone), tunes index. Terminal frames (Expressive Code config) untouched.
4. **Rewrite root `DESIGN.md`** from this folder's proposal, and update `docs/guides/design-system.md` + `docs/guides/style-guide.md`.
5. **Must not change**: URL structure, RSS paths, `llms.txt` + markdown twins + content negotiation, publishing scripts and their assumptions, performance budget (two font families, minimal JS — the burger and theme toggle are the only scripted UI), WCAG AA baseline.

## Files in this folder

| File | What it is |
|---|---|
| [`russcloud-redesign-mockup.html`](./russcloud-redesign-mockup.html) | The interactive mockup — open in any browser |
| [`DESIGN.md`](./DESIGN.md) | Proposed design system (replaces root DESIGN.md if approved) |
| `NOTES.md` | This file — decisions, research digest, trade-offs, implementation sketch |

### `research/` — the full research pack, unabridged

The digest above summarises; these are the complete agent reports the
proposal was built on:

| File | What it is |
|---|---|
| [`research/medium-teardown.md`](./research/medium-teardown.md) | Forensic Medium.com teardown — every font stack, size, colour, and layout value measured live via computed styles, plus "the 10 copyable decisions" |
| [`research/peer-sites-survey.md`](./research/peer-sites-survey.md) | ~17 professional personal sites profiled: shared DNA, differentiation levers, dated-signals catalogue, and the full Google Fonts typeface evaluation |
| [`research/current-site-audit.md`](./research/current-site-audit.md) | The incumbent Print Edition system audited: tokens, fonts, nav, homepage anatomy, and which infrastructure is theme-independent |
| [`research/content-inventory.md`](./research/content-inventory.md) | Real content used in the mockup: tunes entry, counts, bio, identity, routes |
| [`research/content-inventory-posts.json`](./research/content-inventory-posts.json) | The six most recent posts (titles, descriptions, dates, tags, hero image paths) |
| [`research/completeness-critique.md`](./research/completeness-critique.md) | The gap-check pass: what the four reports missed and the follow-up measurements that filled it (incl. Medium's #1A8917 green and feed-row spacing) |
| [`research/finish-review.md`](./research/finish-review.md) | Independent review of the finished mockup: verdict, the five material fixes (all applied), and the adopted tombstone suggestion |
