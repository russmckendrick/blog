---
author: Russ McKendrick
comments: true
date: 2016-02-01 18:02:26+00:00
image: assets/posts/4c336-1l-_-alrjfqwlb-em6j3e4w.png
title: Tiny Docker Images
categories:
  - Tech
tags:
  - Docker
---

I had a play with the excellent [Alpine Linux](http://www.alpinelinux.org) over the weekend. Alpine describes itself as;


<blockquote>Alpine Linux is a security-oriented, lightweight Linux distribution based on musl libc and busybox.</blockquote>


And by lightweight they really do mean lightweight, with an 8MB container size and a 130MB bare metal installation it is tiny. Because of this I decided to use it as the new base images for my [Docker Images](https://hub.docker.com/u/russmckendrick/) as some of them were getting a little bloated. As you can see from the table below, the difference in the final image size is staggering …



 	
  * ImageName / Before / After

 	
  * 
[Base](https://hub.docker.com/r/russmckendrick/base/) / 244MB / 13MB

 	
  * 
[NGINX-PHP](https://hub.docker.com/r/russmckendrick/nginx-php/) / 446MB / 76MB

 	
  * 
[MariaDB](https://hub.docker.com/r/russmckendrick/mariadb/) / 432MB / 189MB

 	
  * 
[AB](https://hub.docker.com/r/russmckendrick/ab/) / 261MB / 14MB


… even though I have stated before I am quite a [snob when it comes to which Operating System I run](/2014/08/03/operating-system-snob/) I think Apline has definitely changed my mind.

So far I have managed to install everything I need from their [package repo](https://pkgs.alpinelinux.org/packages) with very little in the way of changes to my original [CentOS 7 image](https://hub.docker.com/_/centos/) configuration. Very impressive stuff.

You can find my images on the [Docker Hub](https://hub.docker.com/u/russmckendrick/) or the source on [GitHub](https://github.com/russmckendrick/docker).
