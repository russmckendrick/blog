---
author: russmckendrick
comments: true
date: 2014-08-25 12:09:00+00:00
layout: post
link: http://mediaglasses.blog/2014/08/25/connecting-to-docker-containers/
slug: connecting-to-docker-containers
title: Connecting to Docker Containers
wordpress_id: 1227
categories:
- Tech
tags:
- CentOS
- Docker
---






![]({{ site.baseurl }}/assets/posts/56951-1oyjv-fjf15cxlx6eelodqq.png)




I have been installing and exposing SSH on most of the containers I have deployed, which I know is wrong.




As I have been trying to do things in a more “devops” way I decided to do a little reading on how I can enter and leave running containers on my CentOS 7 instance without having to expose SSH or configure users.




This is when I came across [nsenter](https://github.com/jpetazzo/nsenter/) & [docker-enter](https://github.com/jpetazzo/nsenter/blob/master/docker-enter). As you can see from the following instructions and terminal session installing nsenter and then using docker-enter to connect to a running container is a breeze;



    
    docker run — rm jpetazzo/nsenter cat /nsenter > /tmp/nsenter<br>mv /tmp/nsenter /usr/local/bin/<br>chmod 755 /usr/local/bin/nsenter<br>nsenter -V<br>nsenter — help<br>curl -o /usr/local/bin/docker-enter <a href="https://raw.githubusercontent.com/jpetazzo/nsenter/master/docker-enter" target="_blank" data-href="https://raw.githubusercontent.com/jpetazzo/nsenter/master/docker-enter">https://raw.githubusercontent.com/jpetazzo/nsenter/master/docker-enter</a> <br>chmod 755 /usr/local/bin/docker-enter




Now you have installed nsenter and docker-enter you need to lauch a container to conect to;



    
    docker run -d -p 3306:3306 — name testing russmckendrick/mariadb<br>docker logs testing<br>docker-enter testing # Enters the container, type exit to exit o_O<br>docker-enter testing ls -lha /var/lib/mysql/ # Lists the contents of /var/lib/mysql/<br>docker-enter testing ps -aux # Shows the running processes




You can view this process in the embedded terminal session below or on my [asciinema profile](https://asciinema.org/a/11696)


[embed]https://asciinema.org/a/11696[/embed]


