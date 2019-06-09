---
author: russmckendrick
comments: true
date: 2014-05-04 11:00:00+00:00
layout: post
link: http://mediaglasses.blog/2014/05/04/yet-more-docker/
slug: yet-more-docker
title: Yet More Docker
wordpress_id: 1123
categories:
- Tech
tags:
- Docker
---






![](/assets/posts/0ff71-1jqfagxkj3i_godvoykjazg.png)




Since [my last post about Docker](/2014/04/27/more-docker/) I have been playing a lot more, rather than use a GUI like [Shipyard](http://shipyard-project.com/) I decided to use @garethr’s [excellent Puppet Module](https://forge.puppetlabs.com/garethr/docker) to manage and deploy my containers. This allowed me to take a better look at the builds I had over at the [Docker Index](https://index.docker.io/). The following is a list of builds I have deployed so far …..




#### General Containers






  * 
[Base](https://index.docker.io/u/russmckendrick/base/) — Base build for use with other Docker build


  * <del>Jump Host</del>- Build which can be used as a SSH jump host




#### Database Containers






  * <del>MySQL 5.5</del> — Build which runs MySQL 5.5


  * <del>MySQL 5.6</del> — Build which runs MySQL 5.6




#### PHP Containers






  * <del>Apache & PHP 5.4</del> — Build which runs Apache with PHP 5.4


  * <del>Apache & PHP 5.5</del> — Build which runs Apache with PHP 5.5


  * <del>NGINX & PHP 5.4</del> — Build which runs NGINX with PHP 5.4 & PHP-FPM


  * <del>NGINX & PHP 5.5</del> — Build which runs NGINX with PHP 5.5 & PHP-FPM




See the [GitHub Repo](https://github.com/russmckendrick/docker) and my [Docker Index Profile](https://index.docker.io/u/russmckendrick/) for more information.




