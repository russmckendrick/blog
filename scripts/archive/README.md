# Archived scripts

Retired scripts kept for reference. They are not maintained, and their relative
paths no longer resolve from this directory - do not run them.

- `fal-cover-generator.js` - old main blog cover generator (title/description/tags → GPT prompt with style guardrails and tag themes → FAL). Superseded by `scripts/generate-cover.js`, which reads the full post content and imposes no style constraints.
- `fal-cover-config.json` - its prompt, guardrail, and tag-theme config.
- `regenerate-cover.js` - wrapper that re-ran the old generator against an existing post. `scripts/generate-cover.js` now handles this directly.
