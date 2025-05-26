---
title: "Doom or Vibe Coding"
author: "Russ McKendrick"
date: 2025-05-26T11:29:35+01:00
description: "A look at the exciting AI announcements from Google I/O, Microsoft Build, and Anthropic's Claude 4 launch, plus a new Doom game."
draft: false
showToc: true
cover:
    image: "cover.png"
    relative: true
    alt: "Doom or Vibe Coding cover image"
tags:
  - "AI"
---

This week was an interesting one in the world of AI - we had all of Google's announcements at [Google I/O](https://io.google/2025/explore/?focus_areas=AI), some announcements from Microsoft at their [Build](https://news.microsoft.com/build-2025-book-of-news/) conference, and the most exciting of all \- the launch of [Claude 4](https://www.anthropic.com/news/claude-4) from Anthropic; and to top it off, there is a new [Doom](https://doom.bethesda.net/en-US/the-dark-ages) game out!!!

## Gaming or coding

While I am not much of a gamer, game releases like Doom prick up my ears - as most of you will know I am a macOS user, so Doom isn't out for that. This is one of the reasons why I subscribe to Nvidia's [GeForce Now](https://geforcenow.com) service, so I started playing Doom: The Dark Ages, but, I do like puzzles, so when Anthropic announced Claude 4 I decided to park Doom and give it a go.  

{{< youtube oqUclC3gqKs >}}

## RussTools

A few weeks ago I used [Cursor](https://cursor.com) to create a single-page app to help with my day job. The first of the two tools was a [network design tool](https://www.russ.tools/network-designer/), the second was an [Azure Resource Naming tool](https://www.russ.tools/azure-naming). I decided to make use of one of the nearly fifty domains I've accumulated since 2001 and stuck them on [russ.tools](https://russ.tools). To create these tools I have used a combination of Claude 3.5 Sonnet and Google's Gemini 2.5 Pro, and while the two tools were functional, they were very obviously created by two different models - there wasn't much consistency, both style-wise and with the code itself.

### Finishing off some existing code

After the announcement of Claude 4 and after seeing a few posts about its code improvements, I decided to use it to finish off the third tool, which was a [Cron Job Expression Builder/Validator](https://www.russ.tools/cron/). While the code I already had in place was mostly non-functional and full of placeholders, this was enough for Claude 4 Sonnet to pick up where Gemini left off and finish the tool off with a single prompt; not only that, it rebuilt the interface to be more user-friendly and added a few extra features without me asking it to do anything!

### More tools

Colour me impressed - so with a long weekend I decided to add some more tools: first an [SSL Certificate Checker](https://www.russ.tools/ssl-checker/), then a [DNS Lookup Tool](https://www.russ.tools/dns-lookup/www.russ.tools), and then a [WHOIS Lookup Tool](https://www.russ.tools/whois-lookup/104.21.112.1).

### What is missing

At this point, I had quite a good little collection of tools. I fed Claude the [README](https://github.com/russmckendrick/russ-tools/blob/main/README.md) file and asked it what other tools would complement the existing ones, and we came up with ...

* [Data Format Converter](https://www.russ.tools/data-converter); Convert between JSON, YAML, and TOML formats with validation and formatting  
* [Base64 Encoder/Decoder](https://www.russ.tools/base64/); Encode and decode text and files using Base64 encoding with multiple variants  
* [JWT Decoder/Validator](https://www.russ.tools/jwt/); Decode JWT tokens and validate signatures without sending to external services

### Bringing it all together

While everything was pretty consistent, there were a few design issues. Not a problem, though - I asked Claude to review screenshots of each of the tools and [write then implement a style guide](https://github.com/russmckendrick/russ-tools/blob/main/src/components/tools/STYLE_GUIDE.md) giving them a consistent look and feel across the site.

{{< gallery match="images/tools/*" sortOrder="assc" rowHeight="200" margins="5" thumbnailResizeOptions="600x600 q90 Lanczos" showExif=true previewType="blur" embedPreview=true loadJQuery=true >}}

## Why?

While the new Doom game is fun, I actually find puzzles more interesting. Not being a developer by trade, the whole vibe coding trend is quite a lot of fun, and I find it a lot more relaxing than Doom \- errors are interesting to debug, and finding the right prompt is very satisfying when you get it right first time.

## Summary

While the new Doom game offers its own kind of thrill, I found myself drawn to the intellectual puzzles of "vibe coding" with these cutting-edge AI tools. I've been building out my 'RussTools' collection, a series of single-page apps for my day job, using a mix of AI models. It's been an interesting journey, especially seeing the inconsistencies when different models were involved. However, Claude 4 truly impressed me, not only finishing off a tricky bit of code with a single prompt but also intuitively improving the UI and adding features I hadn't even asked for!

This success spurred me on to create even more tools, like an SSL Certificate Checker and DNS/WHOIS lookup tools. The final touch was having Claude help implement a consistent style guide across the entire site, bringing everything together beautifully. Ultimately, for me, this 'vibe coding' isn't just about building; it's about the satisfying challenge of debugging errors and crafting the perfect prompt – a far more relaxing and engaging pursuit than the chaos of Doom!

{{< audio mp3="2025-05-26-doom-or-vibe-coding.mp3" >}}