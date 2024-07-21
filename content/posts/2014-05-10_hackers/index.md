---
title: "Hackers"
description: "Highlighting the critical need for server security with personal experiences of port scans and brute-force attacks, and how Fail2Ban provided protection."
author: "Russ Mckendrick"
date: 2014-05-10T11:00:00.000Z
lastmod: 2021-07-31T12:31:25+01:00

tags:
    - "Code"
    - "Tools"
    - "Security"

cover:
    image: "/img/2014-05-10_hackers_0.png" 
    alt: "Highlighting the critical need for server security with personal experiences of port scans and brute-force attacks, and how Fail2Ban provided protection."

images:
 - "/img/2014-05-10_hackers_0.png"


aliases:
- "/hackers-e525ac91a517"

---

Since I have been playing with [Docker](/2014/05/04/yet-more-docker/) for the past [few weeks](/2014/04/27/deploying-a-stable-docker-setup-on-centos-with-shipyard/) I have had more servers on-line. I don’t have a static IP address at home so while I have a jump host setup I found I was still being port scanned and brute forced.

I only caught a sniff of it in the logs while looking at another problem, even though password authentication is disabled and I only use keys I decided install [Fail2Ban](http://www.fail2ban.org/) to start blocking people, just in-case. As I use [Puppet](https://github.com/russmckendrick/puppet) I installed a module and enabled it. Since then I have been flooded with emails !!!

Across both of the machines I am currently running it has been triggered over 150 times in the last 48 hours, and thats just SSH. Considering that this machine is nothing than a test server I would hate to be actually running anything of worth.
