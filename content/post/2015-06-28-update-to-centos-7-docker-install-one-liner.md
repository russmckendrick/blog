---
author: Russ McKendrick
comments: true
date: 2015-06-28 14:38:07+00:00
image: assets/posts/d1934-1gu5dyuug6eixz3r6ml5ggg.png
title: Update to CentOS 7 Docker install one-liner
categories:
    - Tech
tags:
    - Docker
---

**UPDATE 26/07/2015**
In typical fashion, a few weeks after posting this Docker themselves released a much better version than mine, you can install it using the following commands;

    
    curl -sSL <a href="https://get.docker.com/" target="_blank" data-href="https://get.docker.com/">https://get.docker.com/</a> | sh
    systemctl enable docker &amp;&amp; systemctl start docker
    docker run hello-world


What follows is the original, now mostly redundant post.



* * *



It’s been a while since I touched the code for [the one-liner Docker installer I wrote a while back](https://media-glass.es/2014/11/02/latest-docker-centos7/).

Times have moved on, the official CentOS version is more up-to-date than it was once was (it’s currently at 1.6) and Docker now provide [their own RPM](https://docs.docker.com/installation/centos/) for installing the latest version (currently 1.7) on CentOS 7. Also, [docker-compose](https://media-glass.es/2015/03/21/docker-machine-compose-swarm/) has replaced [fig](https://media-glass.es/2014/08/31/docker-fig-reverse-proxy-centos7/).

As I am going to be doing a lot with Docker over the next few months (more on that in the next few weeks) I decided it was time to update the script.

It now downloads a copy of the official RPM from get.docker.com as well as installs the latest version of docker-compose, to help with the muscle memory it creates an alias for fig so that you can still use the command (just remember to call you configuration docker-compose.yml and not fig.yml).

You can see the updated script in action below;
![asciicast](https://cdn-images-1.medium.com/max/800/0*gE5NAZGctMGkyRS4.png)
or run it using;

    
    curl -fsS <a href="https://raw.githubusercontent.com/russmckendrick/docker-install/master/install-offical" target="_blank" data-href="https://raw.githubusercontent.com/russmckendrick/docker-install/master/install-offical">https://raw.githubusercontent.com/russmckendrick/docker-install/master/install-offical</a> | bash


It is also available at [GitHub](https://github.com/russmckendrick/docker-install).
