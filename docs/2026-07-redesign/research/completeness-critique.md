> **Provenance:** research agent output, 31 Jul 2026, commissioned for the
> "Reading Room" redesign proposal (see [../NOTES.md](../NOTES.md)).
> Completeness critique that ran over the four research reports, identified three gaps (post content, Medium chrome measurements incl. the #1A8917 green, current-site chrome), and filled them with further live measurement.

# Completeness Critique — 3 Critical Gaps (now filled)

The pack is strong on tokens and typography but three things a designer cannot infer were missing: the actual post content to populate the mockup (the inventory's blog-post section was truncated out), Medium's page chrome (the anatomy report cut off mid-section 2.2, before header/feed-grid/sidebar/footer), and the current site's own chrome and homepage structure (the audit stopped inside the motion section). All three answered below from the repo and a live browser measurement session.

---

## Gap 1 — Real blog-post content for the feed mockup (missing "Latest posts" section of the content inventory)

The inventory references "the 6 post hero paths above" but the section itself was cut. Verified from `/Users/russ.mckendrick/Code/blog/src/content/blog/`, newest first (read time = words/230 per the inventory's own rule):

| Date | Title | Description (verbatim) | Tags | ~Read |
|---|---|---|---|---|
| 2026-07-19 | Token Use: Coach Mode and a Week of Releases | "A week after Token Use hit 1.0.0 by cutting features, it's on 1.2.2. Coach mode, a Rust port of Microsoft's AI-Engineering-Coach rules, full-text scrollback, an MCP server, and a 3D graph." | tools, ai, code | 9 min |
| 2026-07-12 | A Catch-Up: terminal-svg and Token Use v1 | "Two projects worth writing about: terminal-svg, a new Rust tool for pixel-perfect terminal screenshots, and Token Use finally reaching v1" | tools, ai, code | 7 min |
| 2026-06-13 | Playing with Headroom: Compressing the Context Going to My AI Coding Agents | "I spent a few days running Headroom, a local proxy that promises to cut the tokens your AI coding agent sends to the provider. The savings are real, but they're not where the dashboard first makes you think they are." | ai, tools, macos | 9 min |
| 2026-05-10 | codebase-memory-mcp: Giving Claude Code (and Codex) a Map | "A short look at codebase-memory-mcp, an MCP server that indexes your codebase into a queryable knowledge graph so Claude Code or Codex can answer structural questions without grepping every file." | ai, code, tools | 7 min |
| 2026-05-01 | Counting the Cost of Vibe Coding | "A local-first dashboard for tracking AI coding tool spend across Claude Code, Codex, Cursor, Copilot, and Gemini CLI - with a TUI, a desktop app, and zero API keys required." | ai, tools, macos, linux, code | 14 min |
| 2026-04-19 | Is my blog Agent-Ready? | "Running russ.cloud through isitagentready.com and wiring up the checks that actually make sense for a static blog - Link headers, Content Signals, agent-skills discovery, llms.txt, and a tiny Cloudflare Worker to serve markdown on demand." | ai, blog | 6 min |

Hero images all follow `src/assets/<slug>/blog-cover-<slug>.png` (e.g. `/Users/russ.mckendrick/Code/blog/src/assets/2026-07-19-token-use-coach-mode-and-a-week-of-releases/blog-cover-2026-07-19-token-use-coach-mode-and-a-week-of-releases.png` — all six verified on disk via frontmatter `cover.image`). URLs are date-based: `/2026/07/19/token-use-coach-mode-and-a-week-of-releases/`. All posts have `showToc: true`; dates render day-first ("19 Jul 2026").

## Gap 2 — Medium's page chrome: header, feed grid, sidebar, row anatomy, footer (report truncated mid-"2.2 Overall grid")

Measured live via `getComputedStyle`/`getBoundingClientRect` on ev.medium.com, July 31 2026, 946px-wide viewport (values marked * are viewport-dependent; the report's own 1440 measurements put the article column at 680px):

- **Header**: `position: sticky`, exactly **57px tall**, white `#FFFFFF`, **1px solid `#F2F2F2` bottom hairline** (on an inner element, not the sticky wrapper), 24px horizontal padding. Left: wordmark. Right: plain-text links ("Write", "Sign in" — 14px `#6B6B6B`) + one pill CTA.
- **The green the anatomy report never captured**: Medium's CTA pill is **`#1A8917`** (measured `rgb(26,137,23)`), 13px white sohne, fully rounded (radius ~1300px), padding **5px 12px**. This is Medium's only surviving accent hue — important for the "don't clone" brief: russ.cloud's burnt orange `#BF3B00` should do zero CTA-pill duty.
- **Two-column grid**: main feed column (546px content at 946px viewport*; grows toward ~680–728px at 1440 — inferred, not re-measured) + right **sidebar 352px wide** (incl. its 24px left padding), separated by **`border-left: 1px solid #F2F2F2`** — the only vertical rule on the page. Sidebar stacks: avatar, name, follower count, bio, green Follow button, "Following" avatar list, then the site footer links.
- **Feed rows**: **no hairline dividers between rows** on the profile/home feed — separation is pure whitespace, measured **~32px gap** between articles (rows ~173–193px tall). Byline row uses a **20×20px circular avatar**. Thumbnail sits right-aligned: **160×107px, border-radius 2px**. So Medium's calm = whitespace-separated rows; russ.cloud's Print Edition idiom (hairline rule between entries) is already a differentiator worth keeping.
- **Footer**: there is no page-wide footer on feed pages — the links (**Help, Status, About, Careers, Press, Blog, Privacy, Rules, Terms**) live at the bottom of the right sidebar, 13–16px grey.

## Gap 3 — Current russ.cloud chrome + homepage structure (site audit cut off before layout anatomy)

From `/Users/russ.mckendrick/Code/blog/src/components/layout/Header.astro`, `Footer.astro`, `/Users/russ.mckendrick/Code/blog/src/pages/index.astro`, and `src/components/home/HeroSection.astro`:

- **Masthead**: 64px bar (`h-16`) inside a **max-w-7xl (1280px)** container, px-4/6/8 responsive. Left: `logo.svg` (rendered 40×32) + wordmark `Russ McKendrick` in `font-display` serif at 20px (`text-xl`). Right (desktop): all 8 nav items rendered as **18px icon + label pairs in the `.rubric` treatment** (mono, uppercase, 0.8125rem) with `nav-underline` hover, 16–20px gaps, then a sun/moon theme toggle. Mobile: hamburger opening an inline drawer (not overlay), hairline-ruled. The header class is `masthead … surface` — flat paper, no sticky positioning.
- **Homepage** (`index.astro`): one **featured post** (PostCard `variant="featured"`, side-by-side layout, LCP-preloaded hero) + **6 grid posts** in `grid-cols-1 md:2 lg:3`, `gap-x-8 gap-y-10`, each wrapped in `data-reveal` staggered entrances; then numbered Pagination (9/page on `/page/N/`). Total 7 posts on page one.
- **Footer**: `border-t` hairline on `--color-outline-variant`, centered: footer nav repeating all NAVIGATION_ITEMS in `.rubric` style, then an italic colophon — `© 2026 Russ McKendrick · Set in Source Serif & IBM Plex Mono`.
- **Mockup implication**: a Medium-feel redesign would likely narrow max-w-7xl toward a single reading column and demote the icon-heavy 8-item nav — but the wordmark-in-serif, rubric mono-caps metadata, hairline rules, and the colophon line are the existing identity moves the mockup should carry through rather than replace with Medium's whitespace-only chrome.

---

**Not flagged as critical** (inferable or non-blocking): the audit's truncated motion-system detail (a static HTML mockup can reuse the named timing tokens already given); the peer-sites report's truncated daringfireball "avoid" list (the pattern was already established); Medium's mobile bottom-bar behaviour (mobile overrides for type were already captured).