---
title: "Slain by Dragons"
description: "Analyzing the online fate of businesses featured on Dragons Den. Insights into website performance under prime-time pressure. Lessons for online resilience and optimization."
author: "Russ Mckendrick"
date: 2015-07-13T19:36:52.000Z
lastmod: 2021-07-31T12:33:14+01:00

tags:
 - "Blog"
 - "Cloud"
 - "Web"

cover:
    image: "/img/2015-07-13_slain-by-dragons_0.png" 
images:
 - "/img/2015-07-13_slain-by-dragons_0.png"
 - "/img/2015-07-13_slain-by-dragons_1.png"
 - "/img/2015-07-13_slain-by-dragons_2.jpg"


aliases:
- "/slain-by-dragons-5f95ac982e69"

---

Last night I did some I haven’t done for a while and watched the opening episode of a new [Dragons Den](http://www.bbc.co.uk/iplayer/episode/b062r0nm/dragons-den-series-13-episode-1) series while it was being aired.

After a short time I found myself less interested in what was happening on screen and more interested in what was happening to the contestants (this is after all a primetime game show isn’t it?) websites during what should be a predicted spike in traffic.

Let the geeky rant begin ….

#### [Fridja](http://fridja.com)

First up was Fridja, it looks like they host their own Wordpress installation. Looking at the site with [BuiltWith](http://builtwith.com/fridja.com) they have quite a few plugins installed, along with using [CloudFlare](https://www.cloudflare.com/).

The site did have a blip where it timed out when trying to load the main homepage but it was quick to recover.

{{< twitter user=russmckendrick id=620314730918506496 >}}

Looking at the list of installed plugins listed by BuiltWith a lot of them are to do with caching, performance and security. So well done Fridja.

#### [Fit Britches](http://www.fitbritches.com)

The second contestant to enter the Den was Fit Britches. During their on screen grilling there wasn’t a blip on the website, it loaded with no issues, slowdown or errors for the entire segment. A few few whois look-ups later and I found that they use the SaaS provider [Shopify](http://www.shopify.co.uk/) to provide their e-commerce site.

#### [The House Crowd](https://www.thehousecrowd.com/)

Judging by the “on tonights episode” and “still to come” bits things weren’t going to go well for The House Crowd, how did their website hold up?

![508-resource-limit-is-reached](/img/2015-07-13_slain-by-dragons_1.png)

As you can see, not well at all, the site was giving “Resource Limit Is Reached” and “Error establishing a database connection” errors for quite a while.

{{< twitter user=russmckendrick id=620332479119912960 >}}

Once things had settled down a quick look at [BuiltWith](http://builtwith.com/?https%3a%2f%2fwww.thehousecrowd.com) show like Fridja they are using a combination of Wordpress with some elements of CloudFlare. However their exposed plugins list doesn’t show any plugins which would help cache the site during a spike caused by prime time TV coverage, on a plus side their Wordpress login screens are [themed to fit in](https://wordpress.org/plugins/theme-my-login/) with the rest of the site.

#### [BeamBlock Yoga](http://beamblockyoga.com/)

Last up were BeamBlock Yoga. Their site just flat out refused to load at any point during their screen time. No errors, just lots of time outs.

When the site eventually started to load and I had a look at it with [BuiltWith](http://builtwith.com/beamblockyoga.com) I found it was yet another Wordpress site. This time there was no CloudFlare or plugins to help cache the site exposed.

#### So what does all this mean?

For a start, Dragons Den isn’t getting any better with age, the false tension and fumbling pitches have all been seen before.

Secondly, if your business is going to be featured on a TV show which regularly pulls in between 2.5 and 3.1 million viewers and you are going to be the primary focus for around 10 minutes oo the show why would you not try and ensure your website and probably primary source of information stays up, surely the increase in traffic shouldn’t come as a surprise !!!!

![o5rwt-1](/img/2015-07-13_slain-by-dragons_2.jpg)
