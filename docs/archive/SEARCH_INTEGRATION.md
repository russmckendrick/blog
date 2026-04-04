# Music Research Tools Integration with LangChain Agents

This document explains the **LangChain agent architecture** for improved music album research quality in the tunes blog post generator, with support for multiple search providers.

## Overview

The tunes generator now uses **LangChain agents with pluggable search tools** - an autonomous agent that decides when and how to search for information, then synthesizes it into engaging blog content. This is far superior to manually orchestrating search APIs.

## What Changed

### 1. **Search Provider Priority**
- **Perplexity AI** (recommended) - Search-augmented LLM (combines search + synthesis)
- **Exa AI** (alternative) - Semantic search with music journalism focus
- **Tavily** (fallback) - General web search
- **No search** - Falls back gracefully if none are configured

### 2. **LangChain Agent Architecture** 🤖

Instead of manually orchestrating search → synthesis → writing, we now use **autonomous agents**:

**What is a LangChain Agent?**
- An AI that has access to tools (like search APIs)
- Makes its own decisions about when/how to use tools
- Thinks step-by-step through complex tasks
- Autonomously researches, analyzes, and writes

**How It Works:**
1. **Agent receives task**: "Research and write about [album] by [artist]"
2. **Agent decides**: "I need to search for information about this album"
3. **Agent uses tool**: Calls search tool with optimized query
4. **Agent analyzes**: Reads search results from music journalism
5. **Agent extracts**: Identifies key facts, reviews, context, legacy
6. **Agent writes**: Produces engaging blog section with proper structure
7. **Agent returns**: Final markdown content with H2/H3 headers and emojis

**Benefits of Agent Approach:**
- ✅ **Autonomous**: LLM decides when to search (not hardcoded)
- ✅ **Intelligent**: Can make multiple searches if needed
- ✅ **Context-aware**: Uses search results naturally in writing
- ✅ **Flexible**: Adapts approach based on available information
- ✅ **Single step**: One agent call replaces multi-step pipelines

**Search Tool Features:**

**Perplexity AI (Recommended):**
- **Search + LLM**: Combines web search with LLM synthesis in one API call
- **Model**: `llama-3.1-sonar-large-128k-online`
- **Quality**: Best for factual, comprehensive research
- **Speed**: Faster than separate search + synthesis steps
- **Temperature**: 0.2 for factual accuracy

**Exa AI (Alternative):**
- **Semantic search**: Understands "album legacy" vs "album sales"
- **Music journalism focus**: Prioritizes Pitchfork, AllMusic, Rolling Stone, NME, etc.
- **Rich context**: Returns 5 results with up to 3000 chars each
- **Quality filtering**: Domain filtering ensures authoritative sources

**Tavily (Fallback):**
- **General web search**: Broad coverage of web sources
- **Max results**: 5 per query

### 3. **Cost Optimization - Search Cache**
To balance quality and cost, a caching system has been implemented:
- **Location**: `scripts/.research-cache/` (git-ignored)
- **Duration**: 30 days
- **Key**: MD5 hash of artist + album + provider
- **Behavior**:
  - Cache hit = No API call, instant results
  - Cache miss = API call, then cached for future use
- **Control**: Set `ENABLE_SEARCH_CACHE=false` to disable

### 4. **Files Created/Modified**
- `scripts/lib/perplexity-tool.js` - **NEW**: LangChain tool wrapper for Perplexity search
- `scripts/lib/exa-tool.js` - **NEW**: LangChain tool wrapper for Exa search
- `scripts/lib/content-generator.js` - Refactored to use agent architecture with pluggable providers
- `scripts/lib/search-cache.js` - Cache utility (30-day TTL)
- `.env.example` - Added `PERPLEXITY_API_KEY`, `EXA_API_KEY`, `TAVILY_API_KEY`, and `ENABLE_SEARCH_CACHE`
- `.gitignore` - Added `scripts/.research-cache/`
- `.github/workflows/weekly-tunes.yml` - Added cache restoration and provider API keys

**Architecture Comparison:**

**Old (Manual Orchestration):**
```
researchAlbum()
  → Call Search API
  → Format results
  → Call LLM to synthesize
  → Call LLM to write blog
  → Return content
```

**New (Agent-Based):**
```
researchAlbum()
  → Create agent with search tool
  → Agent autonomously:
    - Calls search tool
    - Analyzes results
    - Writes blog section
  → Return content
```

## Setup

### 1. Get API Keys

**Perplexity AI (Recommended):**
1. Sign up at https://www.perplexity.ai/
2. Get your API key from the API settings
3. Pricing: Pay-as-you-go

**Exa AI (Alternative):**
1. Sign up at https://exa.ai/
2. Get your API key from the dashboard
3. Free tier includes $10 initial credit

**Tavily (Fallback):**
1. Sign up at https://tavily.com/
2. Get your API key

### 2. Configure Environment
Add to your `.env` file (choose at least one provider):
```bash
# Perplexity AI - Search-augmented LLM (best quality, recommended)
PERPLEXITY_API_KEY=your-perplexity-api-key

# Exa AI - Semantic search with music journalism focus
EXA_API_KEY=your-exa-api-key

# Tavily API - Alternative search provider
TAVILY_API_KEY=your-tavily-api-key

# Optional: Control caching (enabled by default)
ENABLE_SEARCH_CACHE=true
```

### 3. Run Generator
```bash
# Normal usage
npm run tunes

# Custom week
npm run tunes -- --week_start=2025-11-17

# Debug mode (single album)
npm run tunes -- --debug
```

## Cost Estimates

### Agent-Based Approach Pricing

**Perplexity AI:**
- **Search-augmented LLM**: Pay-as-you-go pricing
- **Model**: `llama-3.1-sonar-large-128k-online`
- **Advantage**: Single API call for search + synthesis
- **LLM Agent**: ~$0.02-0.05 per album (GPT-4o-mini/Claude for final writing)
- **Total per album**: ~$0.05-0.10 per album

**Exa AI:**
- **Exa Search**: $5 per 1,000 searches (5 results per album)
- **Exa Content**: $5 per 1,000 pages read
- **LLM Agent**: ~$0.02-0.05 per album (GPT-4o-mini/Claude for research + writing)
- **Total per album**: ~$0.015-0.020 (Exa) + ~$0.02-0.05 (LLM) = **~$0.04-0.07 per album**

**Tavily:**
- **Search**: $1-3 per 1,000 searches
- **LLM Agent**: ~$0.02-0.05 per album
- **Total per album**: ~$0.03-0.08 per album

**Cost Benefits of Agent Approach:**
- Single LLM call instead of 2+ calls
- Agent decides if search is needed (can skip for well-known albums)
- More efficient token usage
- Perplexity combines search + synthesis (saves one LLM call)

### With Caching
If you generate weekly posts (11 albums/week):
- **First run**: 11 albums × ~$0.08 = ~$0.88
- **Re-runs**: $0 (cached for 30 days, includes synthesized research)
- **Monthly cost**: ~$3.52 (4 weeks × $0.88)
- **Annual cost**: ~$42

### Free Tier
- **Exa**: $10 credit → ~180-250 album researches
- **Perplexity**: Pay-as-you-go (no free tier)
- **Tavily**: Limited free requests
- Sufficient for 5+ months of weekly posts with caching (Exa)

## Quality Improvements

### Before (Manual Search Orchestration)
- ❌ Raw search results dumped into context
- ❌ Generic web results, often Wikipedia/social media
- ❌ Limited music journalism sources
- ❌ Shallow, outdated content
- ❌ Multi-step manual process (search → synthesize → write)
- ❌ No intelligence about when to search

### After (LangChain Agent with Search Tools)
- ✅ **Autonomous research**: Agent decides when/how to search
- ✅ **High-quality sources**: Perplexity (search + LLM) or Exa (music journalism)
- ✅ **Authoritative sources**: Pitchfork, AllMusic, Rolling Stone, NME, etc.
- ✅ **Intelligent analysis**: Agent extracts and synthesizes information
- ✅ **Natural writing**: Search results integrated naturally into prose
- ✅ **Structured output**: Proper H2/H3 headers, emojis, engaging style
- ✅ **Quality focus**: Factual, interesting, well-researched content
- ✅ **Single-step**: One agent call does everything
- ✅ **Pluggable providers**: Easy to switch between search tools

**Example Agent Reasoning (Perplexity):**
```
Agent receives: "Research Around the World in a Day by Prince"
Agent thinks: "I should search for reviews and analysis of this album"
Agent calls: perplexity_music_search("Around the World in a Day by Prince recording history and critical reception")
Agent reads: Comprehensive research summary from Perplexity (search + synthesis)
Agent writes: Engaging blog section with facts, context, and legacy
Agent returns: Polished markdown content ready to publish
```

**Example Agent Reasoning (Exa):**
```
Agent receives: "Research Around the World in a Day by Prince"
Agent thinks: "I should search for reviews and analysis of this album"
Agent calls: exa_music_search("Around the World in a Day Prince review critical analysis")
Agent reads: 5 authoritative sources from music journalism
Agent writes: Engaging blog section with facts, context, and legacy
Agent returns: Polished markdown content ready to publish
```

## Cache Management

### View Cache Stats
```javascript
import { SearchCache } from './scripts/lib/search-cache.js'
const cache = new SearchCache()
await cache.init()
const stats = await cache.stats()
console.log(stats) // { enabled: true, count: 42 }
```

### Clear Cache
```bash
# Manual cleanup
rm -rf scripts/.research-cache/*.json
```

Or programmatically:
```javascript
import { SearchCache } from './scripts/lib/search-cache.js'
const cache = new SearchCache()
await cache.clear()
```

### Disable Cache
Set in `.env`:
```bash
ENABLE_SEARCH_CACHE=false
```

## Fallback Behavior

The system gracefully falls back in this order:
1. **Perplexity AI** (if `PERPLEXITY_API_KEY` is set)
2. **Exa AI** (if `EXA_API_KEY` is set)
3. **Tavily** (if `TAVILY_API_KEY` is set)
4. **No search** (continues without web context)

**Provider Selection Logging:**
The system logs which provider is being used at startup:
```
Using Perplexity AI - search-augmented LLM for research
```
or
```
Using Exa AI with LangChain agent architecture
```

## Troubleshooting

### "Search error" / API errors
- Check your API key is correct
- Verify you have API credits remaining (Exa, Perplexity)
- Check network connectivity
- Review provider-specific error messages

### Cache not working
- Ensure `ENABLE_SEARCH_CACHE` is not set to `false`
- Check `scripts/.research-cache/` directory exists
- Verify write permissions

### Content quality issues

**Problem: Output is too verbose/academic**
- Symptom: 500+ word sections, phrases like "sources indicate", "critics note"
- Solution: The prompts in `content-generator.js` enforce 150-250 word limit and conversational tone
- Tuning: Adjust `systemPrompt` at line 210-233 to modify voice/length

**Problem: Content is repetitive across albums**
- Symptom: Same structure/phrases for every album
- Solution: Prompt includes voice examples (✅/❌) to guide variety
- Improvement: Can add more example phrases or adjust temperature in LLM config

**Problem: Missing interesting stories**
- Symptom: Generic facts instead of anecdotes
- Solution: Perplexity combines search + synthesis for richer context; Exa searches specifically for "review critical analysis legacy influence"
- Improvement: Adjust research prompt in `perplexity-tool.js` (line 30-41) or adjust search query in `exa-tool.js`

**Prompt Engineering Tips:**
1. **Be explicit about length**: "150-250 words total" works better than "brief"
2. **Show examples**: ✅/❌ comparisons teach the LLM your voice
3. **Prohibit bad patterns**: "Skip: academic tone" prevents verbose output
4. **Use personality**: "Write like chatting with a friend" >> "write professionally"
5. **Repeat constraints**: Mention word limits multiple times in prompt

## Additional Resources

**Perplexity AI:**
- [Perplexity Documentation](https://docs.perplexity.ai/)
- [Perplexity Pricing](https://www.perplexity.ai/pricing)
- [API Reference](https://docs.perplexity.ai/reference)

**Exa AI:**
- [Exa AI Documentation](https://docs.exa.ai/)
- [Exa Pricing](https://exa.ai/pricing)
- [Exa Dashboard](https://dashboard.exa.ai/)
- [Node.js SDK](https://github.com/exa-labs/exa-js)

**Tavily:**
- [Tavily Documentation](https://docs.tavily.com/)
- [Tavily Pricing](https://tavily.com/pricing)

**LangChain:**
- [LangChain Tools Documentation](https://js.langchain.com/docs/modules/agents/tools/)
- [LangChain Agent Concepts](https://js.langchain.com/docs/modules/agents/concepts)
