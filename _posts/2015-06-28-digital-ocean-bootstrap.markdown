---
author: russmckendrick
comments: true
date: 2015-06-28 12:23:29+00:00
layout: post
link: http://mediaglasses.blog/2015/06/28/digital-ocean-bootstrap/
slug: digital-ocean-bootstrap
title: Digital Ocean Bootstrap
wordpress_id: 1042
categories:
- Tech
tags:
- CentOS
- Digital Ocean
- Security
---

As I have mentioned a few times on this blog I tend to use [DigtialOcean](https://www.digitalocean.com/?refcode=52ec4dc3647e) to spin up servers for testing and to host some of my projects. I also still [use CentOS 7](https://media-glass.es/2014/08/03/operating-system-snob/) as my preferred OS.

Each time I boot a droplet I run few a couple of tasks to get the server how I prefer it.



 	
  * Run a yum update

 	
  * [Enable swap](https://media-glass.es/2015/03/08/migration-of-server-swap-space/)

 	
  * [Install & configure Fail2Ban](https://media-glass.es/2015/03/29/fail2ban-on-centos-7/)

 	
  * Enable firewalld

 	
  * Install vim-enhanced, deltarpm & enable [EPEL](https://fedoraproject.org/wiki/EPEL)


As I am lazy and sometimes re-launch instances several times when working on a project I decided to [write a quick script to do the above so I don’t have to](https://github.com/russmckendrick/DOBootstrap/blob/master/do-bootstrap.sh).

You can call the script by running;

    
    curl -fsS <a href="https://raw.githubusercontent.com/russmckendrick/DOBootstrap/master/do-bootstrap.sh" target="_blank" data-href="https://raw.githubusercontent.com/russmckendrick/DOBootstrap/master/do-bootstrap.sh">https://raw.githubusercontent.com/russmckendrick/DOBootstrap/master/do-bootstrap.sh</a> | bash


I recommend that you only run this on CentOS 7 droplet.
