---
target: the about page
total_score: 15
max_score: 32
na_heuristics: 5,9
p0_count: 1
p1_count: 3
timestamp: 2026-08-10T18-05-24Z
slug: src-pages-about-astro
---
Method: dual-agent (A: design review · B: detector + browser evidence)

Browser caveat: neither agent had the Chrome MCP tools in its context. Assessment B substituted a headless Chrome driven directly over the DevTools Protocol against the live page, injecting the same detector bundle the live server would serve. Real measurements, different transport. No user-visible overlay was left in a browser tab.

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Page never says where it sits in the archive; no sense of place for a deep-link arrival |
| 2 | Match System / Real World | 3 | Plain British voice lands. "Find me online" labels a link dump, not a bio's second act |
| 3 | User Control and Freedom | 2 | 14 new-tab links unannounced; infinite wave with no pause; no way to keep a chosen avatar |
| 4 | Consistency and Standards | 1 | Four DESIGN.md violations in the page's core type/colour, plus a second contact email and 260 lines of re-pasted icons |
| 5 | Error Prevention | n/a | No inputs, no destructive actions |
| 6 | Recognition Rather Than Recall | 3 | Brand glyphs + text labels read instantly |
| 7 | Flexibility and Efficiency | 1 | Terminal page — no route into 183 posts, 14 books, or the music half |
| 8 | Aesthetic and Minimalist Design | 2 | Visually clean, but its largest block duplicates the footer directly below it |
| 9 | Error Recovery | n/a | No error states; the missing `onerror` on the portrait is logged as a minor |
| 10 | Help and Documentation | 1 | For a single-author archive, About *is* the documentation. It explains nothing about what the site holds |
| **Total** | | **15/32 (47%)** | **Poor** |

Read that band carefully: the page is not broken. It is clean, fast, accessible, and correctly proportioned. It scores poorly because it does almost none of the job its own PRODUCT.md assigns it.

## Design Specificity Verdict

**LLM assessment**: this is the one page on russ.cloud you could swap the name on and ship for anybody. A waving emoji, "Hi there, my name is Russ", a randomised cartoon, three hedged paragraphs, and a 15-row wall of social logos — every element is a stock personal-site component.

What is missing is precisely what PRODUCT.md calls the moat: *"183 blog posts, 170 tunes posts, 73 glossary entries, 14 books, a synced reading list, all with real URLs going back years — the part a neighbouring blog cannot copy."* The About page mentions none of it. Not one number, not the 2013 start date, not a single book title.

The damning part is in-repo: `src/pages/author/russ-mckendrick/index.astro` already computes post counts, top tags with frequencies, and renders recent posts — and then links *to* `/about/` labelled "Full bio". The link points from the page with the evidence to the page without it. About is in the masthead and first in every footer; it takes the traffic and carries none of the proof.

**Deterministic scan**: `detect.mjs` returned exit 2 with just 2 findings — `bounce-easing` at `about.astro:257` (real: `cubic-bezier(0.34, 1.56, 0.64, 1)` overshoot) and `broken-image` at `:22` (**false positive** — the regex matched the literal string `<img>` inside a code comment). The in-page browser detector found nothing at all inside the page's own `<section>`; its two hits were the footer rubric and a header nav transition, both out of scope.

That near-clean scan is the point: **no tool will tell you this page is failing.** Mechanically it is in good order. The problem is entirely one of ambition and content.

## Overall Impression

The page is a well-built answer to the wrong question. It answers "where can you find Russ online?" — which the colophon footer already answers on all 183 pages, roughly one scroll below. It does not answer "who is this and why should I trust them?", which is the only question it exists to answer.

The single biggest opportunity: the evidence is already computed, twenty lines away, on a page nobody visits.

## What's Working

1. **Column discipline is correct.** `max-w-[728px] mx-auto px-6` resolves to exactly the 680px measure DESIGN.md mandates — measured at 728px with 24px gutters. It sits in the same room as the articles. That is not automatic; `books/index.astro` uses `max-w-6xl` and doesn't comply.

2. **Hairline and rhythm are house-correct.** One 1px separator value, never varied, on the intro rule and every social row. No cards, no shadows, no gradients. The restraint is real and it's why the page reads calm rather than cheap.

3. **The illustrated portrait solves a genuine brand constraint elegantly.** DESIGN.md forbids a photo of Russ anywhere. An About page normally demands a face; using the illustrated set in a round portrait slot honours the rule instead of fighting it. The *randomisation* is the problem, not the illustration.

## Priority Issues

### [P0] The credibility surface carries no evidence — and the evidence already exists, computed, 40 lines away

**Why it matters.** PRODUCT.md: *"Credibility surface. The public evidence behind the career and the books; the thing people find when they check who Russ is. Success means it holds up to scrutiny."* Under scrutiny the page offers one checkable fact (Node4) and one unverifiable claim ("30 years... various IT roles across multiple industries"). A hiring manager, conference committee, or commissioning editor leaves for LinkedIn — the exact failure the page was meant to prevent.

**Fix.** Lift what `src/pages/author/russ-mckendrick/index.astro` already computes: post count and 2013 start date, top tags with frequencies (which doubles as the missing route into the archive), and a row of the 14 real book covers with publishers. Add one line naming `/tunes/` on-site. Every number is countable in-repo — nothing on PRODUCT.md's never-fabricate list is touched.

**Suggested command**: `/impeccable shape`, then `/impeccable layout`

### [P1] Four DESIGN.md violations, all in the page's core type and colour

Measured, not inferred:

1. **The bio is set in sans.** Every element on the page computes to Schibsted Grotesk; no serif face appears anywhere. DESIGN.md: *"Literata — article body only... Serif never appears in UI; sans never appears in body copy."* About is the only prose surface on the site in UI sans.
2. **The entire bio is mist** (`#6f6a61`). DESIGN.md: *"Ink for titles and body; mist for everything that is not content."* The bio *is* the content. Contrast measures 5.15:1 — it passes AA, so this is a hierarchy fault, not an accessibility one. But the result is inverted: the 15 social labels are ink at 600 weight while the bio is grey. The chrome outranks the content, which is exactly why the page reads "meh".
3. **The accent is spent at rest.** `.about-link` sets `#2b559e` on all three inline links. DESIGN.md: *"Accent appears only as title/link hovers, tag pills, and the tombstone. Nothing else — spend the accent nowhere; its scarcity is the identity."* This is the only page that spends it at rest.
4. **The h1 is not at column width.** The avatar (176px) plus a 32px gap leaves the text column **472px measured** of the 680px measure — ~46–52 characters per line against DESIGN.md's 65–70 target. Every other h1 starts at the column's left edge; this one is indented by a cartoon.

**Why it matters.** A reader arriving from a post meets a different typeface, a different text colour, a different link colour, and a different measure. It reads as a page from before the redesign — because it is one.

**Fix.** Move the bio into `.prose` (Literata, ink) at full 680px; drop `.about-link` and inherit ink-with-accent-on-hover from `global.css`; put the avatar above the h1 so heading and body sit on the column's left edge.

**Suggested command**: `/impeccable typeset`

### [P1] The social wall re-implements code that already exists, and it's the page's largest element

`about.astro:26-41` hardcodes 15 brand SVG paths inline. All 14 non-email paths are **already in `src/components/ui/Icon.astro`**, and the URL list is `SOCIAL_LINKS` from `consts.ts` in the same order — which `Footer.astro` already renders on this very page, one scroll below.

Three failures at once:
- **Redundancy.** DESIGN.md gives the socials to the footer and explicitly reserves the other half for About: *"No bio in the footer — the bio belongs to the About page only."* The page inverted the trade.
- **Drift risk.** Add a network to `SOCIAL_LINKS` and it appears in the footer, in the Person schema's `sameAs`, and on the author page — but not here.
- **Already drifted.** The About page's email is `web.site@mckendrick.email`; `consts.ts` says `AUTHOR_EMAIL = "r@russ.email"`. Two contact addresses ship on one site, and the visible one is hardcoded in a page file.

**Fix.** Delete the inline array and the grid (~260 lines). The footer covers all 14. Keep one email line sourced from `AUTHOR_EMAIL`, and spend the reclaimed space on the P0 evidence block.

**Suggested command**: `/impeccable distill`

### [P1] The avatar animation bypasses `prefers-reduced-motion` entirely

`element.animate()` does not respect CSS media queries, and there is no `matchMedia` guard anywhere in the page — I verified this directly. The site's own reduced-motion block neutralises the wave, the reveals, and view transitions; this script sails past all of it, firing 16 fixed-position particles filled with the accent plus a spring that overshoots to 1.08.

DESIGN.md, Motion: *"One authored moment... Hovers are colour shifts only — no zooms, no lifts, no springs."* This has a zoom, a spring, and confetti in the accent colour on a system whose identity is the accent's scarcity. It is also a regression against the WCAG 2.1 AA baseline PRODUCT.md names as incumbent.

**Fix.** Guard the handler with `matchMedia('(prefers-reduced-motion: reduce)')` and swap the src with no animation. Drop the spring for `--ease-settle`. Honestly: if the evidence block lands, cut the randomiser — the credibility page is the wrong surface for a gag, and it is currently the page's emotional peak.

**Suggested command**: `/impeccable animate`

### [P2] The mobile avatar hit box is 214px wider than the avatar

Measured at 390px: the button box is **342×128** while the visible circle is **128×128**. The clickable and focusable area extends 214px to the right of anything visible, and the focus ring draws as a full-width rectangle around empty space. A keyboard user sees a ring around nothing; a thumb triggers a confetti burst from dead paper.

**Fix.** Make the button `inline-block`/`w-fit` so its box matches the circle.

**Suggested command**: `/impeccable adapt`

## Persona Red Flags

**The skeptical evaluator** (hiring manager, programme committee, commissioning editor) — PRODUCT.md's named credibility case. Sees a randomised cartoon where a photo would be, a waving emoji, "various IT roles across multiple industries", one employer, fifteen logos. No employment history, no book title, no publication date, no post. Leaves for LinkedIn — which is the precise failure, because the page's job was to be the thing that holds up so they don't have to.

**The mobile search arrival** (PRODUCT.md audience 1, "frequently never sees the homepage"). Finished a Terraform post on a phone, tapped About to check credentials. Gets ~340px of greeting furniture, three grey paragraphs, then ~795px of social logos (15 rows × 53px, measured), then a footer repeating those same logos. Total scroll: 2,355px, 2.79 viewports. No post count, no tags, no way back into the archive. Product Principle 1 — *"every page must stand alone and still explain where it sits"* — fails harder here than anywhere else on the site.

**The reduced-motion reader.** Has set the OS preference; the site honours it everywhere else, then fires an unguarded 16-particle burst with a spring the moment they activate the portrait. The label reads "Click to change avatar" — wrong verb for anyone not using a mouse. The image is labelled `alt="Russ McKendrick avatar"` but is a randomly-chosen cartoon, so the label misleads on the one page where identity is the point.

**The LLM crawler** (PRODUCT.md: *"a deliberate first-class audience"*). This page is the canonical Person entity for the whole site. The JSON-LD gives `name`, `url`, `image`, 14 `sameAs`, and 8 hardcoded `knowsAbout` strings — **no `jobTitle`, no `worksFor`, no `description`, no relationship to the 14 books**, while 183 posts of real tag frequencies sit computed and unused on the author page. It also emits an `Organization` schema declaring russ.cloud a company, on a site whose Principle 6 is *"One person, plainly — the site should never dress itself up as an organisation."*

## Minor Observations

- The document's entire native heading tree is **one `h1`**. "Find me online" is a `<p role="heading" aria-level="2">`, and the footer's headings are the same pattern.
- The greeting is stated twice: "👋 Hi there, my name is Russ" then immediately "Hello! I'm Russ, an IT professional...".
- The meta description and the second body paragraph share a verbatim clause ("passionate about Linux, open-source systems, automation, and containers") — visible to the crawler audience as literal repetition.
- "fourteen technical books" here vs "14+" on the author page vs "fourteen" in PRODUCT.md. Three phrasings of one fact.
- The vinyl link goes off-site to russ.fm at peak engagement and never mentions `/tunes/` — 170 posts on this domain, invisible.
- The portrait `<img>` has no `onerror` fallback, unlike every other avatar on the site.
- Three inline body links are 23px tall — under the 44px target at 390px.
- Social row hover moves two things in opposite directions: label ink→accent while icon mist→ink.
- `spawnPoof` computes fixed coordinates at click time, so scrolling during the 500ms animation detaches the dots from the avatar.
- ~6.4 KB of inline JS ships to power the randomiser, and it swaps the portrait — an above-the-fold LCP candidate — on every load.

## Questions to Consider

1. `/author/russ-mckendrick/` links here for the "Full bio", and here has less than there. Which page is actually the credibility surface — and if it's this one, why does the code that proves the claim live somewhere else?
2. DESIGN.md decided the footer carries the socials and About carries the bio. This page took the socials as its dominant element and demoted the bio to three grey paragraphs. Was that a decision, or is About simply the last page the Reading Room redesign never reached?
3. If a reader left this page believing exactly one thing, what should it be? Right now it's "he's on a lot of platforms."
4. On every other page the avatar carries meaning — `TAG_AVATAR_MAP` picks it from the post's subject. Why is the identity page the only place the avatar system stops carrying information?
5. Every page already ends with the colophon. So what is this page *for*, if not the depth the footer can't fit?
