---
title: "Tiny Docker Images"
description: "Experience Alpine Linux for ultra-compact Docker images. Drastically reduce container size. Find my images on Docker Hub & GitHub."
author: "Russ Mckendrick"
date: "2016-02-01T18:02:26+01:00"
tags:
  - "Docker"
cover:
  image: "/img/2016-02-01_tiny-docker-images_0.png"
  alt: "Experience Alpine Linux for ultra-compact Docker images. Drastically reduce container size. Find my images on Docker Hub & GitHub."
lastmod: "2021-07-31T12:33:42+01:00"
aliases:
  - "/tiny-docker-images-3348a128be9d"
---

I had a play with the excellent [Alpine Linux](http://www.alpinelinux.org) over the weekend. Alpine describes itself as;

> Alpine Linux is a security-oriented, lightweight Linux distribution based on musl libc and busybox.

And by lightweight they really do mean lightweight, with an 8MB container size and a 130MB bare metal installation it is tiny. Because of this I decided to use it as the new base images for my [Docker Images](https://hub.docker.com/u/russmckendrick/) as some of them were getting a little bloated. As you can see from the table below, the difference in the final image size is staggering …

- ImageName / Before / After
- [Base](https://hub.docker.com/r/russmckendrick/base/) / 244MB / 13MB
- [NGINX-PHP](https://hub.docker.com/r/russmckendrick/nginx-php/) / 446MB / 76MB
- [MariaDB](https://hub.docker.com/r/russmckendrick/mariadb/) / 432MB / 189MB
- [AB](https://hub.docker.com/r/russmckendrick/ab/) / 261MB / 14MB

… even though I have stated before I am quite a [snob when it comes to which Operating System I run](/2014/08/03/operating-system-snob/) I think Apline has definitely changed my mind.

So far I have managed to install everything I need from their [package repo](https://pkgs.alpinelinux.org/packages) with very little in the way of changes to my original [CentOS 7 image](https://hub.docker.com/_/centos/) configuration. Very impressive stuff.

You can find my images on the [Docker Hub](https://hub.docker.com/u/russmckendrick/) or the source on [GitHub](https://github.com/russmckendrick/docker).

