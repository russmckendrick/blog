---
title: "More site updates"
description: "Russ Mckendrick improves blog speed, adds Gruntfile features for testing and deployment to Amazon S3 with Cloudflare cache flushing."
author: "Russ Mckendrick"
date: 2015-10-11T17:43:15.000Z
lastmod: 2021-07-31T12:33:28+01:00

tags:
    - "Code"
    - "Tools"

cover:
    image: "/img/2015-10-11_more-site-updates_0.png" 
    alt: "Russ Mckendrick improves blog speed, adds Gruntfile features for testing and deployment to Amazon S3 with Cloudflare cache flushing."

images:
 - "/img/2015-10-11_more-site-updates_0.png"
 - "/img/2015-10-11_more-site-updates_1.png"
 - "/img/2015-10-11_more-site-updates_2.png"


aliases:
- "/more-site-updates-7e2210318999"

---

Since the [last post about the blog](/tags/blog/) I have been playing with the blog a bit more, I have finally got a decent [PageSpeed Insights Score](https://developers.google.com/speed/pagespeed/insights/?url=https%3A%2F%2Fmedia-glass.es&tab=desktop);

![pagespeedinsights](/img/2015-10-11_more-site-updates_1.png)

It’s annoying that the Disqus javascript is keeping me from getting 100/100 but considering before I started to tweak things I was getting a score of 85/100 so I can’t complain too much.

I have also adding the following functionality to my [Gruntfile](https://github.com/russmckendrick/blog/blob/master/Gruntfile.js)

- grunt test — Runs a PageSpeed Insight test from the command line and highlights if either the mobile or desktop test drops below 95/100
- grunt grab — Grabs the external Javascript needed to run the site so I can serve it locally.

I rolled these into the grunt deploy task. The task now does the following when called;

- Clears the previous “prod” folder
- Concatenates and compresses the javascript and CSS files
- Downloads the external javascript dependencies
- Regenerates the entire site putting it into the empty “prod” folder
- Uploads the changed files to [Amazon S3](https://aws.amazon.com/s3/)
- Flushes the [Cloudflare](https://www.cloudflare.com) cache
- Runs a PageSpeed Insights mobile and desktop test on two different URLs

You can see it in action below;

![asciicast](/img/2015-10-11_more-site-updates_2.png)

I also added a [404 page](/404/).
