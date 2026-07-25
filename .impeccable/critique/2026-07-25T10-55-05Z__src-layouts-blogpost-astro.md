---
target: blog post page
total_score: 22
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 2
timestamp: 2026-07-25T10-55-05Z
slug: src-layouts-blogpost-astro
---
Method: dual-agent (A: design review, isolated · B: detector + browser evidence, isolated)

Target: `src/layouts/BlogPost.astro`, reviewed live against three posts (2025-10-04 n8n, 2026-04-19 agent-ready, 2026-07-19 token-use) at 375 / 768 / 1280 / 1536+ in light and dark. Visitor mode: **Read**.

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Reading progress divides by `document.scrollHeight`, so it reads **77.2%** at the true end of the article body (92.1% on the n8n post) — it measures the appendix, not the article |
| 2 | Match System / Real World | 3 | Strong print metaphor, but "SUGGEST CHANGES" sits inside the dateline between reading time and tags, where publication metadata belongs; it means "edit this MDX on GitHub" and says nothing of the sort |
| 3 | User Control and Freedom | 2 | From the foot of a 21,650px tutorial the only exits are chronological `← PREVIOUS` and the footer; the tag chips are 20,000px behind you |
| 4 | Consistency and Standards | 2 | Masthead nav is icon-only, footer nav is text-only, for the same eight destinations; byline avatar is a real portrait on one post and a tag-derived cartoon on another; Giscus renders in a foreign design language |
| 5 | Error Prevention | 2 | An 18-code-block install guide from Oct 2025 carries no `updatedDate`, no "last verified", no version pin — nothing warns a reader running nine-month-old instructions |
| 6 | Recognition Rather Than Recall | 2 | Nine unlabelled masthead glyphs (headphones = Tunes, archive box = Archives are unguessable), and the inline TOC is a `<details>` collapsed by default |
| 7 | Flexibility and Efficiency | 2 | Expert paths exist — markdown twin, edit-on-GitHub, Pagefind, sticky TOC — but only the edit link is exposed, and the sticky TOC + glossary are gated at `2xl` (≥1536px) so a 1280px laptop gets none of it |
| 8 | Aesthetic and Minimalist Design | 3 | Body is genuinely restrained; the ending is not — nine share icons hovering to raw brand hex including three blues, in a system whose spec says "there is no blue" |
| 9 | Error Recovery | 2 | Thin. A broken `#anchor` from a shared TOC link lands silently at the top with no indication; recovery is limited to an `onerror` avatar fallback and Giscus's own failure UI |
| 10 | Help and Documentation | 2 | The glossary sidebar is exactly the right idea and is invisible below 1536px; inline glossary links are styled identically to outbound links, so a reader cannot tell a definition from a trip off-site |
| **Total** | | **22/40** | **Acceptable — significant improvements needed** |

All ten heuristics applied. Heuristic 10 is scored rather than `n/a` because this surface genuinely ships a help layer (73-entry glossary, inline term links, sticky glossary panel) — it just doesn't deliver it at the widths most readers use.

**Cognitive load: 5 of 8 checks failed — CRITICAL.**

| Check | Result | Evidence |
|---|---|---|
| Single focus | FAIL | The closing region presents five competing blocks with no primacy: Share (9), Further Reading (3), Comments (a form), Previous (1), Footer nav (8) |
| Chunking ≤4 | FAIL | The byline is one flat dot-separated run of **8 elements** — avatar, name, date, reading time, Suggest Changes, three tag chips |
| Visual grouping | FAIL | That same row mixes identity, publication metadata, a contributor action, and taxonomy at identical weight, colour and typeface |
| Visual hierarchy | PASS | Prose hierarchy is excellent — rules above `h2`, weight-differentiated `h3`, small-caps `h4`, drop cap opening |
| One thing at a time | PASS | The body is a single linear column with no interstitials |
| Minimal choices ≤4 | FAIL | Four decision points blow the limit: masthead (9, icon-only), share row (9), footer nav (8), byline row (5 links) |
| Working memory | FAIL | Below 1536px the collapsed TOC scrolls away after ~1,300px and never returns — on the n8n post that leaves 20,000px with no map |
| Progressive disclosure | PASS | The `<details>` TOC and lazy Giscus are real progressive disclosure — though the TOC hides the wrong thing |

## Design Specificity Verdict

**LLM assessment.** The reading column is unmistakably this product. Everything below the last paragraph is a stock blog template.

From the H1 down to the final `</p>` this could not be another blog: a hairline rule above every `h2`, a real `initial-letter: 3` drop cap with a float fallback, an asterism dinkus for `hr`, small-caps serif `h4`, mono datelines, hairline-framed plates, terminal blocks drawn as actual macOS windows, and burnt orange reserved for links alone. That is an authored page, not a theme.

Then the article ends and the page becomes generic. A nine-platform share row including Pinterest, Tumblr and Facebook on a DevOps blog. A Giscus block with rounded corners, system sans-serif, and a GitHub-green button dropped whole into a radius-0 paper system. Swap the fonts and the appendix is a 2018 Hugo theme.

Three drifts from the system's own spec, in the file meant to embody it:

- DESIGN.md specifies the article journal header as "dateline rubric … title … byline, editorial tag line, **heavy rule**". `BlogPost.astro:236-290` has no dateline rubric above the title, no separate tag line, and **no heavy rule at all** — the header just stops.
- DESIGN.md: "prose measure ~72ch". Live: **99ch at 1280px, 106ch at 1542px**.
- DESIGN.md: masthead is "always-visible small-caps mono nav … no icons on desktop". `Header.astro:36-51` ships an icon-only rail of nine glyphs whose labels animate open on hover.

The larger miss: this site has per-post markdown twins, `llms.txt`, content-negotiated `text/markdown`, JSON-LD, and a glossary — a genuinely unusual machine-readable posture that PRODUCT.md names a first-class audience. **None of it is visible on the page.** No "read as markdown", no copy-for-LLM control, no sign the article has a machine twin. The most distinctive thing about this product is invisible on its main surface.

**Deterministic scan.** CLI detector exit code 2. **5 advisory findings, all design-token drift**: `design-system-font-size` at `BlogPost.astro:239` (`clamp(2.25rem, 5vw, 3.5rem)` endpoint off the ramp), `StickyTableOfContents.astro:47` and `:88` (`0.6875rem`, `0.75rem`), `StickyGlossary.astro:34` (`0.6875rem`), and `design-system-radius` at `StickyTableOfContents.astro:107` (`border-radius: 3px` in a radius-0 system). Twelve of the fifteen composing components scanned clean.

In-page detection across the three posts returned 46 / 43 / 53 findings, dominated by **34 / 33 / 41 instances of "line length too long"** — independent confirmation of the measure bug, found without seeing the design review. Also real: `#reading-progress` animates the `width` property (layout-triggering), and a bounce/elastic easing on `body` in a system whose spec says "no springs, bounces".

Confirmed false positives: "low contrast text" and "undersized functional text" both target `div#astro-webvitals-debug`, the dev-only WebVitals panel gated behind `import.meta.env.DEV` — not shipped. "All-caps body text" targets the breadcrumb rubric label, which is the rule's own stated exemption. "Text occluded" targets a syntax-highlight token inside an Expressive Code block. "Image hover transform" flags the slow `scale(1.04)` zoom that DESIGN.md explicitly sanctions.

**Measured facts that clear the page.** Contrast passes everywhere in both themes — body prose 6.90:1 light and 8.22:1 dark, prose links 5.06:1 and 7.96:1, h1 16.10:1 and 14.36:1. A 169-element sweep found four failures and every one was inside the dev-only debug panel. No skipped heading levels. No horizontal overflow at 375px — all 16 overhanging elements are inside `overflow-x` scrollers, which is correct. Visible focus indicators on all 11 real tab stops (`2px solid` with `2px` offset). Zero console errors, all requests 200.

**Visual overlays.** Injection succeeded and the overlay rendered during the run, but the live server has since been stopped, so **no overlay is currently visible in your browser**. Worth flagging honestly: the overlay's `printSummary` threw a circular-structure `TypeError` in the console bridge, so per-finding console lines were lost; the full finding set was recovered by calling `window.impeccableDetect({overlay:false})` directly, so nothing is missing from this report.

**One thing the scan caught that the review missed.** On the n8n post, 7 images carry empty `alt=""` — all lightgallery thumbnails, each wrapped in an `a.astro-lightgallery-*` link. They are interactive-but-unlabelled, not decorative, so a screen reader announces seven unnamed links.

## Overall Impression

The prose is a genuinely designed reading experience and the rest of the page hasn't caught up with it. Somebody made real decisions about the column — the drop cap, the rules, the dinkus, the terminal frames — and then the surrounding chrome was assembled from defaults. The gap between those two halves is the whole critique.

The single biggest opportunity is also the cheapest: a CSS specificity bug is rendering every one of 183 posts 38% wider than the design system specifies. Fixing one rule makes the site's primary purpose measurably better everywhere, and it makes several other problems (the flush hero, the sidebar breakpoint) resolvable rather than stuck.

## What's Working

**The alt text is the best writing on the page, and it is strategically correct.** Every prose image carries a 25–40 word description of actual content — *"The desktop Coach Report tab showing an overall grade of C at 77 out of 100, 19 of 28 rules clean, and score cards for Prompt Quality 73, Session Hygiene 66, Code Review 80, and Tool Mastery 100"*. This serves two of the three stated audiences with one artefact: a screen-reader user gets a real description instead of "screenshot", and the LLM crawler audience gets the numbers that are locked inside the image. It is doing a figure caption's job, which is exactly why its absence for sighted readers stings.

**The prose system earns the "Print Edition" name through restraint, not decoration.** The hairline rule above each `h2` does a card's work at zero chrome. The drop cap is a real `initial-letter: 3` with a `@supports` float fallback, not a faked span. `h4` is small-caps serif rather than another size step. These compound, they cost nothing, and none of them are reachable by picking a theme.

**The 1536px sidebar is the one place the product's actual shape becomes the interface.** Sticky TOC with `IntersectionObserver` scroll-spy, and beneath it a glossary block computed by intersecting this post's tags against the 73-entry glossary collection (`BlogPost.astro:145-152`). No generic blog produces that, because no generic blog has a glossary to intersect. Correct instinct, executed well, and then hidden from most readers.

## Priority Issues

### [P0] The article measure is 99–106 characters, not the 72 the system specifies. It's a CSS specificity bug.

`BlogPost.astro:326` sets `class="prose mx-auto max-w-[72ch] article-body"`. `global.css:576-579` declares `.prose { @apply max-w-none; … }`. Because that's a plain component rule rather than a utility-layer rule, `max-w-none` wins on source order and the live computed value is `max-width: none`. Measured: prose box **944px at 1280px viewport** (≈99ch), **1008px at 1542px** (≈106ch). The intended `72ch` at this font and size computes to **685.6px** — the column is 38% over.

**Why it matters:** This is a Read surface. Line length is the single mechanism by which the page delivers its value. Past roughly 85ch the eye loses its return sweep and starts re-reading lines. It affects all 183 posts, on the most common desktop widths, silently, and it contradicts the written spec so convincingly that nobody has noticed. Perversely it means the phone renders the article *better* than the laptop — the experience degrades as the screen gets bigger, right up until 1536px where the sidebar rescues it. Both assessments landed on this independently; the detector flagged it 34–41 times per post.

**Fix:** Move the `.prose` block into `@layer components` in `global.css` so utilities win, or drop `@apply max-w-none` and set width per-surface. Verify `getComputedStyle(document.querySelector('.prose')).maxWidth` returns `685.578px`, not `none`. The same rule is why the hero `<figure>` and the prose share an identical 944px column — once prose is 72ch, the full-width hero becomes a deliberate contrast instead of an accident.

**Suggested command:** `/impeccable layout`

### [P1] No standfirst and no author identity, so the page fails Product Principle #1 on its own terms.

`description` exists in frontmatter, renders in `<meta>`, in the OG image, and in the "Further Reading" cards *on this same page* — and never on the article itself. There is no deck under the H1. Separately, the byline `<span class="rubric">RUSS MCKENDRICK</span>` (`BlogPost.astro:256`) is not a link, there is no author note at the foot, and `getDefaultAvatar()` frequently substitutes a tag-derived cartoon for the real portrait (verified: illustrated robot on the Token Use post, real photo on the Agent-Ready post).

**Why it matters:** Principle #1 says every page must "stand alone and still explain where it sits". A reader lands on "Token Use: Coach Mode and a Week of Releases" from Google. Nothing above the fold says Token Use is a Rust CLI and desktop app. Nothing anywhere says who Russ is. The page explains *when* it sits and not *what* or *who*. For a product whose first stated purpose is "credibility surface", finishing an entire article without learning the author's credentials is a structural miss — the fourteen books are invisible at exactly the moment they'd count.

**Fix:** Render `description` as a standfirst under the H1 — Source Serif, ~1.375rem, `--ink-muted`, `max-width: 60ch` — then close the header with the `border-b-2 --rule-strong` heavy rule DESIGN.md already specifies and the code omits. Link the byline name to `/author/russ-mckendrick/`. Add a two-sentence colophon-style author note between the last paragraph and Share: real portrait, "Practice Manager of SRE & DevOps at Node4, author of fourteen technical books", link to `/about/`.

**Suggested command:** `/impeccable clarify`

### [P1] Below 1536px, a 27-screen tutorial has no map and a progress bar that lies.

Three compounding failures. (a) The inline `TableOfContents` is a `<details>` **closed by default**, and its state persists in a single global `localStorage['toc-open']` key shared across all 183 posts. (b) The sticky TOC and glossary `<aside>` are `hidden 2xl:block` — invisible from 0 to 1535px, which is most laptops. (c) `#reading-progress` divides by `document.documentElement.scrollHeight`, which includes Share, Further Reading, the Giscus iframe, prev/next and the footer — measured **77.2%** at the true end of the article body.

**Why it matters:** The n8n post is **21,650px tall with 18 code blocks across 6 sections**. At 1280px a reader gets a collapsed "CONTENTS" line and then twenty thousand pixels of nothing. They can't see how many steps remain, can't jump back to "Preparing the environment" after fumbling a Docker command, and are told they're 77% done when they've finished. For the "useful reference that ranks" purpose — where the job is following instructions, not reading linearly — that's the difference between a reference and a wall.

**Fix:** Open the `<details>` by default when `headings.length >= 4`, and key the persisted state per-post rather than globally. Drop the sticky sidebar breakpoint from `2xl` (1536) to `xl` (1280) — once prose is 72ch there's room. Compute progress against the `.prose` element's bounds rather than `scrollHeight`, and switch `#reading-progress` off animating `width` (layout-triggering, flagged by the detector) onto a `transform: scaleX()`.

**Suggested command:** `/impeccable adapt`

### [P2] The closing sequence undoes the reading experience.

After the last paragraph, in order: (a) `SHARE` with nine 28×28px icons — X, LinkedIn, Reddit, Hacker News, Tumblr, Pinterest, Facebook, Bluesky, Mastodon — each hovering to a hard-coded brand hex (`ShareButtons.astro:18-74` carries nine raw hex values including three blues, in a system that states "there is no blue" and "never introduce raw hex values"). (b) A Giscus block with rounded corners, system sans, grey borders, a green "Sign in with GitHub" button, and **"0 comments"**. (c) `← PREVIOUS`, chronological, with no topical alternative.

**Why it matters:** Peak-end. The most-remembered moment of a long read is its last one, and this one is an empty form in a foreign design language. After 11 minutes of someone's best writing, the closing beat is a small public record that nobody replied. That's the same ending on all 183 posts. Pinterest and Tumblr on a DevOps blog are noise that dilutes the two channels that actually matter here.

**Fix:** Cut the share row to three — Mastodon, LinkedIn, Hacker News — with visible mono labels instead of glyphs, routing hover through `--accent` rather than brand hex. Collapse Giscus behind a rule-topped `.rubric`-labelled disclosure ("DISCUSS THIS POST — 0 comments") so the empty state is a stated fact rather than a displayed void, and pass Giscus a paper/ink theme. Promote Further Reading to the final block and add a topical exit beside `← PREVIOUS` pointing at the primary tag hub.

**Suggested command:** `/impeccable distill`

### [P2] Labels that exist in the DOM but not on screen — icon-only masthead, and appendices invisible to heading navigation.

Two defects, one root cause. (a) `Header.astro` renders nine desktop nav items as icons with `.nav-label` set to `max-width: 0; opacity: 0`, expanding only on `:hover`/`:focus-visible` (`global.css:545-563`) — directly contradicting DESIGN.md. On touch the hover reveal never fires. (b) `SHARE`, `FURTHER READING` and `COMMENTS` are `.rubric` spans, not headings — while the three related post titles inside Further Reading **are `<h3>`**, rendered at 30px, identical to `h2`. The live outline reads `… H2 Takeaways → H3 Updating my blog using CrewAI → H3 Token Use… → H3 A Catch-Up…`, so three unrelated articles appear to be subsections of this article's conclusion. Add the 7 empty-`alt` lightgallery links on the n8n post and a screen-reader user gets seven unnamed links on top of a broken outline.

**Why it matters:** For a keyboard and screen-reader user, three whole regions have no landmark and the document outline actively misleads. For a first-time visitor, a headphones glyph and an archive-box glyph aren't guessable. And the same broken outline is what a crawler parses — which touches the agent-readable audience the product treats as first-class.

**Fix:** Show the mono labels at `lg:` and above as the design system specifies; keep icons for `md`–`lg` only. Promote Further Reading and Comments to real `<h2>`s (visually still `.rubric`) and demote related-post titles to `<h3>` beneath them — or better, make related titles non-heading links so they stop polluting the outline. Give the lightgallery thumbnail links accessible names.

**Suggested command:** `/impeccable audit`

## Persona Red Flags

**Jordan (Confused First-Timer)** — arrived from Google, doesn't know Russ.
- The 5-second test fails. H1 reads "Token Use: Coach Mode and a Week of Releases", no standfirst, and "Token Use" parses as an ordinary noun phrase rather than a product name. Nothing on the first viewport says it's a Rust CLI for tracking AI coding spend.
- "SUGGEST CHANGES" is a trap — styled identically to reading time, sitting in the dateline, meaning "open this post's `.mdx` on GitHub". A non-GitHub reader who clicks it lands on a raw MDX file view and is gone.
- Nine icon-only nav items with no text and no `aria-label`; labels are `max-width: 0` spans that animate open on hover only.
- No answer to "who is this person" anywhere on the page — plain-span byline, cartoon avatar, no bio, no `/author/` link, no mention of the books.

**Sam (Screen reader + keyboard, may zoom to 200%)**
- Broken outline in the appendices: three unrelated articles announced as sub-parts of the conclusion; `SHARE` / `FURTHER READING` / `COMMENTS` are spans, so three regions have zero heading landmarks.
- 7 lightgallery thumbnail links on the n8n post carry `alt=""` inside `<a>` wrappers — seven unnamed links.
- 51 non-inline tap targets under 44×44: nine header nav links at 18×35, theme toggle 18×30, nine share buttons at 28×28, breadcrumb links 35×23, tag chips 23px tall, code copy button 32×32.
- Glossary vs outbound is conveyed by a glyph only — internal glossary terms and external links share identical accent-orange underlines, differentiated by a small `↗` that isn't in the accessible name.
- `localStorage['toc-open']` is a single global key, so closing the TOC once hides structure on all 183 articles with no visible cause.
- **Genuine passes worth stating:** focus ring is a real `2px solid` with `2px` offset on all 11 real tab stops; skip link works and moves focus to `#main-content` with `tabindex="-1"`; contrast is comfortable in both themes (6.90:1 light body, 8.22:1 dark); alt text is exceptional; `prefers-reduced-motion` is honoured.

**Casey (One thumb, distracted, possibly slow connection)**
- Dense screenshots are unreadable and the lightbox is invisible: a ~1219px-wide dashboard of numbers rendered into a 343px column is a grey smear. It *is* wrapped in a lightGallery trigger, but there's no caption, no zoom affordance, nothing on touch that suggests it opens. Casey concludes the images are decorative and scrolls past the evidence.
- The breadcrumb's last separator collapses at 375px — `HOME/ 2026 TOKEN USE: COACH MODE AND A…` reads as one run-on string because the truncating `<li>` carries `min-w-0` (`Breadcrumbs.astro:29-30`), and the truncated title occupies 70% of the row while conveying nothing the H1 doesn't.
- The masthead is permanently pinned at 64px — 8% of an 812px viewport — for all 12,055px of scrolling, with nothing in it Casey needs mid-article.
- 12,055px to 21,650px of thumb-scrolling with the TOC collapsed and the sidebar hidden; if interrupted, only browser scroll restoration, no section anchor.
- Giscus lazy-loads on scroll, so on a slow connection a third-party iframe lands exactly as Casey reaches the end, to display "0 comments".

**Priya (the deep-link search arrival — PRODUCT.md audience #1)** — lands on the n8n install guide from Google in July 2026, wants it working tonight.
- The page explains *when* it sits, not *where*. Breadcrumb reads `HOME / 2025 / INSTALL N8N LOCALLY USING CLOUDFLARE` — "2025" is a year hub. It places the post on a calendar, not in a body of work, and says nothing about whether the site has twelve more Cloudflare posts.
- No staleness signal on a nine-month-old install guide with 18 shell blocks. No `updatedDate`, no "last verified", no version pin. For the "useful reference that ranks" purpose, that's the trust question, and the page declines to answer it.
- No topical escape hatch where she needs it. Stall at screen 14 of 27 and there's no path to the glossary entry for the confusing term, no "other Cloudflare posts", no way back to the section list. The sticky glossary that would solve this exactly is hidden until 1536px.
- The site's machine-readable superpower is invisible to her too — she could paste the URL into an LLM and get clean markdown via content negotiation, and nothing says so.
- **What works for her:** the shared-element view transition, the generated cover, and the prose typography — but the view transition only fires from a listing page, which by definition she never sees.

## Minor Observations

- **The hero plate has no caption.** DESIGN.md calls the generated cover "the artwork of the page rather than decoration". A print edition captions or credits its plates; this one is a bare framed image whose only description is `alt={cover?.alt || title}`, frequently just the title again.
- **No `<figcaption>` on any prose image anywhere.** `global.css:837` styles `.prose figcaption` and nothing ever uses it — while the `alt` attributes contain paragraph-quality descriptions. The sighted reader gets strictly *less* information from an image than a screen-reader user does.
- **The `updatedDate` rubric opts out of the rubric.** `BlogPost.astro:281` applies `italic normal-case tracking-normal` to a `.rubric` — the only place in the codebase that neutralises the treatment. Reads as a bug rather than emphasis.
- **Emoji inside `.tag-editorial`** (`TOOLS 🧰`, `AI 🤖`, `CODE 🐛`). The design intent is "a quiet classification stamp"; emoji is the loudest available glyph and the only emoji on the page.
- **Five design-token drift findings from the CLI scan**, all advisory: off-ramp font sizes at `BlogPost.astro:239`, `StickyTableOfContents.astro:47`/`:88`, `StickyGlossary.astro:34`, and a `border-radius: 3px` at `StickyTableOfContents.astro:107` in a radius-0 system.
- **A bounce/elastic easing on `body`**, in a system whose spec says "no springs, bounces, or translate-lift hovers".
- **The masthead nav and footer nav are the same eight destinations rendered two different ways** — icons above, mono text below. The footer version is the one the design system asked for.
- **Agent-audience note:** JSON-LD is comprehensive (BlogPosting + BreadcrumbList + conditional FAQ/HowTo) and the heading hierarchy inside `.prose` is clean — a crawler parses this well. The one structural wrinkle for machines is the same one that hurts Sam: related-post `<h3>`s make the article appear to have three extra subsections after "Takeaways".

## Questions to Consider

1. **What if the standfirst were mandatory and the H1 were allowed to be short?** Titles currently do double duty — name the thing *and* explain it — which is why they run to nine words and still fail. A guaranteed deck would let "Coach Mode" be the title and let the deck carry the explanation.
2. **The alt text is better writing than most figure captions. Why is it hidden?** What if `alt` *were* the caption, rendered visibly under every plate? It fixes Casey's illegible screenshots, fills the unused `figcaption` convention, and turns an accessibility win into a design feature.
3. **The site's most unusual asset is that machines can read it. Why is that invisible to humans?** What would a "READ AS MARKDOWN" control in the dateline do to how this site is perceived — by engineers, and by the agents that keep arriving?
4. **What is the ending actually for?** If the honest answer is "let people find the next thing", Further Reading should be the last block, not the third of five, and an empty comment form should not be the final impression on 183 posts.
5. **Would a 2013 post survive this layout?** The archive runs back to 2013 — short, image-light, no hero, three paragraphs. With a full-bleed plate slot, a drop cap, a nine-icon share row and an empty comment box, a 300-word post from 2014 is 90% appendix. Is there a second, shorter template hiding in here?
6. **The glossary sidebar is the most product-specific thing on the page and roughly nobody sees it. What if it inverted?** Instead of a sidebar that appears at 1536px, what if inline glossary links carried a distinct treatment — dotted underline, definition on hover — so the glossary lived in the prose at every width, and the sidebar became the enhancement rather than the only delivery?
7. **What would "last verified" cost, and what would it buy?** One frontmatter field and one rubric line. On a site whose second purpose is being a reference that ranks, it may be the highest-trust-per-byte change available.
