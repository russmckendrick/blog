---
title: "Update to CentOS 7 Docker install one-liner"
description: "Discover the updated one-liner Docker installer for CentOS 7. Install Docker 1.7 and docker-compose effortlessly with the official RPM and a single command."
author: "Russ Mckendrick"
date: "2015-06-28T14:38:07+01:00"
tags:
  - "Linux"
  - "Docker"
cover:
  image: "/img/2015-06-28_update-to-centos-7-docker-install-oneliner_0.png"
  alt: "Discover the updated one-liner Docker installer for CentOS 7. Install Docker 1.7 and docker-compose effortlessly with the official RPM and a single command."
lastmod: "2021-07-31T12:33:10+01:00"
aliases:
  - "/update-to-centos-7-docker-install-one-liner-c2627cf62db1"
---

**UPDATE 26/07/2015**
In typical fashion, a few weeks after posting this Docker themselves released a much better version than mine, you can install it using the following commands;

```
curl -sSL https://get.docker.com/ | sh
systemctl enable docker &amp;&amp; systemctl start docker
docker run hello-world
```

What follows is the original, now mostly redundant post.

It’s been a while since I touched the code for [the one-liner Docker installer I wrote a while back](/2014/11/02/installing-docker-1.3.x-on-centos-7/ "Installing Docker 1.3.x on CentOS 7").

Times have moved on, the official CentOS version is more up-to-date than it was once was (it’s currently at 1.6) and Docker now provide [their own RPM](https://docs.docker.com/engine/install/centos/ "Offical Docker Docs - "Linux"") for installing the latest version (currently 1.7) on CentOS 7. Also, [docker-compose](/2015/03/21/docker-machine-compose-swarm/ "Docker Machine, Compose & Swarm") has replaced [fig](/2014/08/31/docker-fig-nginx-reverse-proxies-and-centos-7/"Docker, Fig, NGINX Reverse Proxies and CentOS 7").

As I am going to be doing a lot with Docker over the next few months (more on that in the next few weeks) I decided it was time to update the script.

It now downloads a copy of the official RPM from get.docker.com as well as installs the latest version of docker-compose, to help with the muscle memory it creates an alias for fig so that you can still use the command (just remember to call you configuration docker-compose.yml and not fig.yml).

You can see the updated script in action below;

![asciicast](/img/2015-06-28_update-to-centos-7-docker-install-oneliner_1.png)

or run it using;

```
curl -fsS https://raw.githubusercontent.com/russmckendrick/docker-install/master/install-offical | bash
```

It is also available at [GitHub](https://github.com/russmckendrick/docker-install "docker-install").
