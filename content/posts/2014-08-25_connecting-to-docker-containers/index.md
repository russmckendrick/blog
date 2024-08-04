---
title: "Connecting to Docker Containers"
description: "Learn how I seamlessly access and manage containers without SSH using nsenter and docker-enter on CentOS 7, making DevOps simpler."
author: "Russ Mckendrick"
date: "2014-08-25T12:09:00+01:00"
tags:
  - "Docker"
  - "Tools"
cover:
  image: "/img/2014-08-25_connecting-to-docker-containers_0.png"
  alt: "Learn how I seamlessly access and manage containers without SSH using nsenter and docker-enter on CentOS 7, making DevOps simpler."
lastmod: "2021-07-31T12:31:55+01:00"
aliases:
  - "/connecting-to-docker-containers-34954cb33ce5"
---

I have been installing and exposing SSH on most of the containers I have deployed, which I know is wrong.

As I have been trying to do things in a more “devops” way I decided to do a little reading on how I can enter and leave running containers on my CentOS 7 instance without having to expose SSH or configure users.

This is when I came across [nsenter](https://github.com/jpetazzo/nsenter/) & [docker-enter](https://github.com/jpetazzo/nsenter/blob/master/docker-enter). As you can see from the following instructions and terminal session installing nsenter and then using docker-enter to connect to a running container is a breeze;

{{< terminal title="Connecting to Docker Containers 1/2" >}}
```
docker run — rm jpetazzo/nsenter cat /nsenter > /tmp/nsenter
mv /tmp/nsenter /usr/local/bin/
chmod 755 /usr/local/bin/nsenter
nsenter -V
nsenter — help
curl -o /usr/local/bin/docker-enter https://raw.githubusercontent.com/jpetazzo/nsenter/master/docker-enter 
chmod 755 /usr/local/bin/docker-enter
```
{{< /terminal >}}

Now you have installed nsenter and docker-enter you need to lauch a container to conect to;

{{< terminal title="Connecting to Docker Containers 2/2" >}}
```
docker run -d -p 3306:3306 — name testing russmckendrick/mariadb
docker logs testing
docker-enter testing # Enters the container, type exit to exit o_O
docker-enter testing ls -lha /var/lib/mysql/ # Lists the contents of /var/lib/mysql/
docker-enter testing ps -aux # Shows the running processes
```
{{< /terminal >}}

You can view this process in the embedded terminal session below or on my [asciinema profile](https://asciinema.org/a/11696)

[Installing nsenter](https://asciinema.org/a/11696 "https://asciinema.org/a/11696")
