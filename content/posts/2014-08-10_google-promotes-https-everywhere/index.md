---
title: "Google promotes HTTPS everywhere"
description: "Unlock the secrets of Google's HTTPS ranking signal and SNI! Learn how to secure your site for maximum visibility."
author: "Russ Mckendrick"
date: 2014-08-10T11:00:00.000Z
lastmod: 2021-07-31T12:31:51+01:00
tags:
    - "Web"
    - "Tools"
cover:
    image: "/img/2014-08-10_google-promotes-https-everywhere_0.png" 
images:
 - "/img/2014-08-10_google-promotes-https-everywhere_0.png"
aliases:
- "/google-promotes-https-everywhere-e5a77c35bb64"

---

Google announced earlier this week that they are going to use [HTTPS as a ranking signal](http://googleonlinesecurity.blogspot.co.uk/2014/08/https-as-ranking-signal_6.html):

> We want to go even further. At Google I/O a few months ago, we called for “HTTPS everywhere” on the web.
> 
>  We’ve also seen more and more webmasters adopting HTTPS (also known as HTTP over TLS, or Transport Layer Security), on their website, which is encouraging.
> 
>  For these reasons, over the past few months we’ve been running tests taking into account whether sites use secure, encrypted connections as a signal in our search ranking algorithms. We’ve seen positive results, so we’re starting to use HTTPS as a ranking signal. For now it’s only a very lightweight signal — affecting fewer than 1% of global queries, and carrying less weight than other signals such as high-quality content — while we give webmasters time to switch to HTTPS. But over time, we may decide to strengthen it, because we’d like to encourage all website owners to switch from HTTP to HTTPS to keep everyone safe on the web.

As you can see this blog is now using a SSL certificate. While I host [media-glass.es](/) on [GitHub Pages](https://pages.github.com/) I am also running [Cloudflare](https://www.cloudflare.com/), they provide a service called [Flexible SSL](https://support.cloudflare.com/hc/en-us/articles/200170516-How-do-I-add-SSL-to-my-site-) which is soon going to be [free to all users](http://blog.cloudflare.com/google-now-factoring-https-support-into-ranking-cloudflare-on-track-to-make-it-free-and-easy), as part of this announcement they say:

> We’re on track to roll out SSL for all CloudFlare customers by mid-October. When we do, the number of sites that support HTTPS on the Internet will more than double. That they’ll also rank a bit higher is pretty cool too.

Which I suppose is one of the reasons why Google are taking this decision, Cloudflare is reported to be [handling around 5% of the internets traffic](http://www.businessinsider.com/cloudflare-is-ready-to-take-on-cisco-2014-8) so going on that statistic there is a lot of unsecured data being transmitted.

As someone who is involved in hosting the first thing that hit me about this news is that there is going to be a lot of people who are going to want more IP addresses for SEO purposes. Just like the [bad old days](http://www.mattcutts.com/blog/myth-busting-virtual-hosts-vs-dedicated-ip-addresses/) when people thought that having a dedicated IP address for each site help with SEO (this hasn’t been the case for at least 12 years).

Luckily a patch adding [SNI (Server Name Indication)](http://en.wikipedia.org/wiki/Server_Name_Indication) to OpenSSL was added in 2004. This allows both [Apache](https://wiki.apache.org/httpd/NameBasedSSLVHostsWithSNI), [NGINX](http://nginx.org/en/docs/http/configuring_https_servers.html) and [other web servers](http://en.wikipedia.org/wiki/Server_Name_Indication#Servers) to host multiple SSL certificates on a single IP address. Also, [cPanel](http://blog.cpanel.net/ssl-improvements-for-cpanel-whm/), [Plesk](http://kb.sp.parallels.com/en/114445) and [Webmin / Virtualmin](https://www.virtualmin.com/node/18136) all now support SNI.

While SNI is not supported on all browsers (such as ones running on Windows XP) there are [work arounds](http://stackoverflow.com/questions/5154596/is-ssl-sni-actually-used-and-supported-in-browsers) to detect unsupported browsers and redirect as needed.

All of this means you can have a secure, highly ranked website without adding to the [IPv4 address exhaustion](http://en.wikipedia.org/wiki/IPv4_address_exhaustion) problem.
