---
author: russmckendrick
comments: true
date: 2014-09-07 12:34:12+00:00
layout: post
current: post
class: post-template
cover: assets/posts/00c1e-1m-jjxgrypzbiwx2s9qhmaw.png
link: http://mediaglasses.blog/2014/09/07/very-basic-coreos/
slug: very-basic-coreos
title: Very basic CoreOS
wordpress_id: 1137
categories:
- Tech
tags:
- CoreOS
- Digital Ocean
- Docker
---

On Friday [DigitalOcean announced the availability](https://www.digitalocean.com/company/blog/coreos-now-available-on-digitalocean/) of [CoreOS](https://coreos.com/) on their platform.

CoreOS is a very optimized Operating System which is designed to just run containers. While it has some very powerful clustering elements made up of ….



 	
  * [etcd](https://coreos.com/using-coreos/etcd/)

 	
  * [fleet](https://coreos.com/using-coreos/clustering/)

 	
  * [systemmd](https://coreos.com/using-coreos/systemd/)


…. I decided my first step should be to do the opposite of every blog post I have read about CoreOS and run a single instance with the tools I am used to using.

The first thing you will notice about CoreOS when you first access it is that it is very stripped down and the bulk of the operating system is installed on read-only partitions, this is due to the way [CoreOS provide updates](https://coreos.com/using-coreos/updates/), rather than providing patches to packages they deploy an updated version of the entire operating system in one go.

This philosophy makes things interesting when it comes to installing Fig, nsenter & docker-enter. As you can see from the following, we install all of the tools into a read / write partition in the core users home directory;

    
    mkdir -p tools/bin
    docker run — rm jpetazzo/nsenter cat /nsenter > tools/bin/nsenter
    curl -L <a href="https://raw.githubusercontent.com/jpetazzo/nsenter/master/docker-enter" target="_blank" data-href="https://raw.githubusercontent.com/jpetazzo/nsenter/master/docker-enter">https://raw.githubusercontent.com/jpetazzo/nsenter/master/docker-enter</a> > tools/bin/docker-enter
    curl -L <a href="https://github.com/docker/fig/releases/download/0.5.2/linux" target="_blank" data-href="https://github.com/docker/fig/releases/download/0.5.2/linux">https://github.com/docker/fig/releases/download/0.5.2/linux</a> > tools/bin/fig
    chmod +x tools/bin/*


Once our basic toolset is installed we have to add the binaries to the system paths;

    
    mv .bashrc .bashrc-original
    curl -L <a href="https://raw.githubusercontent.com/russmckendrick/coreos/master/bashrc" target="_blank" data-href="https://raw.githubusercontent.com/russmckendrick/coreos/master/bashrc">https://raw.githubusercontent.com/russmckendrick/coreos/master/bashrc</a> > ~/.bashrc
    sudo curl -L <a href="https://raw.githubusercontent.com/russmckendrick/coreos/master/bashrc" target="_blank" data-href="https://raw.githubusercontent.com/russmckendrick/coreos/master/bashrc">https://raw.githubusercontent.com/russmckendrick/coreos/master/bashrc</a> > ~/.bashrc
    sudo ln -s /root/.bashrc /root/.bash_profile
    source ~/.bashrc


and thats it, we can now use fig, nsenter and docker-enter as the “core” & “root” users.

Next up is to add our [NGINX proxy](https://registry.hub.docker.com/u/russmckendrick/nginx-proxy/), rather than use fig for this I will use systemd;

    
    sudo curl -o /etc/systemd/system/nginx-proxy.service <a href="https://raw.githubusercontent.com/russmckendrick/coreos/master/nginx-proxy.service" target="_blank" data-href="https://raw.githubusercontent.com/russmckendrick/coreos/master/nginx-proxy.service">https://raw.githubusercontent.com/russmckendrick/coreos/master/nginx-proxy.service</a>
    sudo systemctl enable /etc/systemd/system/nginx-proxy.service 
    sudo systemctl start nginx-proxy.service
    sudo systemctl status nginx-proxy.service


and thats it, we have a stripped down Operating System which is geared to running just containers while maintaining a tool-set we know. However, as with everything cloud, this is a massive single point of failure. When I next post about CoreOS I will cover how to do it properly and create a cluster.
