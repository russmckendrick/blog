---
title: "Am I an Operating System snob?"
description: "As an experienced Linux user, I explore my operating system preferences and the factors that have led me to primarily use CentOS on my servers. The post discusses the pros and cons of Fedora, Ubuntu, and other distros, and how newer tools like Docker and Puppet are changing the importance of the underlying OS."
author: "Russ Mckendrick"
date: 2014-08-03T11:00:00.000Z
lastmod: 2021-07-31T12:31:47+01:00

tags:
    - "Linux"
    - "Tools"
cover:
    image: "/img/2014-08-03_am-i-an-operating-system-snob_0.png" 
images:
 - "/img/2014-08-03_am-i-an-operating-system-snob_0.png"


aliases:
- "/am-i-an-operating-system-snob-e12a77808205"

---

Last week I posted about [upgrading my servers to CentOS 7](/2014/07/27/upgrading-my-servers-to-centos-7/), one of the main factors about upgrading to CentOS 7 was the jump in kernel version (from 2.6.x to 3.10.x).

Also, it was so that I could use more modern versions core of software without having to worry about installing numerous additional repos.

The funny thing is that all of the software I have been waiting to use have been available in both [Fedora](http://fedoraproject.org/) and [Ubuntu](http://www.ubuntu.com/server) for quite a while, so why have I waited?

For a start, for almost all my working life I have been using RPM based systems on servers (even the [Cobalt RaQs](http://en.wikipedia.org/wiki/Cobalt_RaQ) were based on RedHat) so I am used to RedHat based Operating Systems such as [CentOS](http://www.centos.org/) and [Amazon Linux](http://aws.amazon.com/amazon-linux-ami/).

Aha, so what about Fedora? Well, the release cycle has always put me off. Typically there is a new release every 6 months with each version only receiving support for around 13 months it is easy to get stuck in a cycle of rebuilding servers or doing distribution upgrades with each new release.

Because of this I always saw Fedora as more of a desktop distribution, rather than a server one. The same can be said about the non LTS releases of Ubuntu.

So what about the LTS release of Ubuntu? I have never really gotten on with the server edition of Ubuntu, while it has some great features I have always found it clunky (it’s way too easy to find yourself in dependency hell with PPAs) and far to different from what I am used to using.

However, with the advent of tools such as [Docker](https://www.docker.com/) and [Puppet](http://puppetlabs.com/) the underlying Operating System I am running should be less of a worry as I am either running just the few services I want to or all I have to do is define the configuration I want and let the orchestration software worry about how the machine gets configured.

I guess this is me becoming more DevOps :).
