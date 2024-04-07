---
title: "Digital Ocean Bootstrap"
description: "Bootstrap your CentOS 7 DigitalOcean droplet quickly with essential tasks: update, swap enablement, Fail2Ban installation, firewalld activation, and EPEL repository setup."
author: "Russ Mckendrick"
date: 2015-06-28T12:23:29.000Z
lastmod: 2021-07-31T12:33:08+01:00

tags:
 - "Cloud"
 - "Linux"
 - "Security"

cover:
    image: "/img/2015-06-28_digital-ocean-bootstrap_0.png" 
images:
 - "/img/2015-06-28_digital-ocean-bootstrap_0.png"


aliases:
- "/digital-ocean-bootstrap-64fbb20a4f99"

---

As I have mentioned a few times on this blog I tend to use [DigtialOcean](https://www.digitalocean.com/?refcode=52ec4dc3647e) to spin up servers for testing and to host some of my projects. I also still [use CentOS 7](/2014/08/03/operating-system-snob/ "Am I an Operating System snob?") as my preferred OS.

Each time I boot a droplet I run few a couple of tasks to get the server how I prefer it.

- Run a yum update
- [Enable swap](/2015/03/08/migration-of-server-swap-space/ "Migration of Server & Swap Space")
- [Install & configure Fail2Ban](/2015/03/29/fail2ban-on-centos-7/ "Fail2Ban on CentOS 7")
- Enable firewalld
- Install vim-enhanced, deltarpm & enable [EPEL](https://fedoraproject.org/wiki/EPEL "EPEL")

As I am lazy and sometimes re-launch instances several times when working on a project I decided to [write a quick script to do the above so I don’t have to](https://github.com/russmckendrick/DOBootstrap/blob/master/do-bootstrap.sh).

You can call the script by running;

```
curl -fsS https://raw.githubusercontent.com/russmckendrick/DOBootstrap/master/do-bootstrap.sh | bash
```

I recommend that you only run this on CentOS 7 droplet.
