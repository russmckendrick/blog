---
author: Russ McKendrick
comments: true
date: 2015-10-11 17:43:15+00:00

image: assets/posts/aff9c-1kz6uxkclhalseignd09phg.png
link: http://mediaglasses.blog/2015/10/11/more-site-updates/
slug: more-site-updates
title: More site updates
wordpress_id: 1203
categories:
- Tech
tags:
- Blog
- Grunt
---

Since the [last post about the blog](/2015/09/29/web-site-update/) I have been playing with the blog a bit more, I have finally got a decent [PageSpeed Insights Score](https://developers.google.com/speed/pagespeed/insights/?url=https%3A%2F%2Fmedia-glass.es&tab=desktop);
![pagespeedinsights](https://cdn-images-1.medium.com/max/800/0*rknVxr_QqSq1k41W.png)
It’s annoying that the Disqus javascript is keeping me from getting 100/100 but considering before I started to tweak things I was getting a score of 85/100 so I can’t complain too much.

I have also adding the following functionality to my [Gruntfile](https://github.com/russmckendrick/blog/blob/master/Gruntfile.js)



 	
  * grunt test — Runs a PageSpeed Insight test from the command line and highlights if either the mobile or desktop test drops below 95/100

 	
  * grunt grab — Grabs the external Javascript needed to run the site so I can serve it locally.


I rolled these into the grunt deploy task. The task now does the following when called;

 	
  * Clears the previous “prod” folder

 	
  * Concatenates and compresses the javascript and CSS files

 	
  * Downloads the external javascript dependencies

 	
  * Regenerates the entire site putting it into the empty “prod” folder

 	
  * Uploads the changed files to [Amazon S3](https://aws.amazon.com/s3/)

 	
  * Flushes the [Cloudflare](https://www.cloudflare.com) cache

 	
  * Runs a PageSpeed Insights mobile and desktop test on two different URLs


You can see it in action below;
![asciicast](https://cdn-images-1.medium.com/max/800/0*S23sEKnT1LdlDsHn.png)
I also added a [404 page](/404.html).
