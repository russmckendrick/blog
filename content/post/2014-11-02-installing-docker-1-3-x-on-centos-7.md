---
author: Russ McKendrick
comments: true
date: 2014-11-02 12:00:00+00:00
image: assets/posts/docker5.png
title: Installing Docker 1.3.x on CentOS 7
categories:
    - Tech
tags:
    - CentOS
    - Docker
---

When [Docker 1.3](http://blog.docker.com/2014/10/docker-1-3-signed-images-process-injection-security-options-mac-shared-directories/) was released a few weeks ago I was interested in using the process injection docker exec functionality.

Unfortunately, all of the repos which provide RPMs for Docker are out of date, the documentation suggests a [manual installation](https://docs.docker.com/installation/centos/#manual-installation-of-latest-version) of the binary which is turns out to be straight forward:

    
    # Download the binary & set the permissions
    curl -L <a href="https://get.docker.com/builds/Linux/x86_64/docker-latest" target="_blank" data-href="https://get.docker.com/builds/Linux/x86_64/docker-latest">https://get.docker.com/builds/Linux/x86_64/docker-latest</a> > /usr/bin/docker; chmod +x /usr/bin/docker



    
    # Download the systemd files
    curl -L <a href="https://raw.githubusercontent.com/docker/docker/master/contrib/init/systemd/docker.service" target="_blank" data-href="https://raw.githubusercontent.com/docker/docker/master/contrib/init/systemd/docker.service">https://raw.githubusercontent.com/docker/docker/master/contrib/init/systemd/docker.service</a> > /usr/lib/systemd/system/docker.service
    curl -L <a href="https://raw.githubusercontent.com/docker/docker/master/contrib/init/systemd/docker.socket" target="_blank" data-href="https://raw.githubusercontent.com/docker/docker/master/contrib/init/systemd/docker.socket">https://raw.githubusercontent.com/docker/docker/master/contrib/init/systemd/docker.socket</a> > /usr/lib/systemd/system/docker.socket



    
    # Enable & start the service
    systemctl enable docker
    systemctl start docker



    
    # Install Fig as well
    curl -L <a href="https://github.com/docker/fig/releases/download/1.0.0/fig-%60uname" target="_blank" data-href="https://github.com/docker/fig/releases/download/1.0.0/fig-`uname">https://github.com/docker/fig/releases/download/1.0.0/fig-`uname</a> -s`-`uname -m` > /usr/local/bin/fig; chmod +x /usr/local/bin/fig


now to check it works:

    
    [root@docker ~]# docker -v
    Docker version 1.3.1, build 4e9bbfa
    [root@docker ~]# systemctl status docker
    docker.service ??? Docker Application Container Engine
     Loaded: loaded (/usr/lib/systemd/system/docker.service; enabled)
     Active: active (running) since Sat 2014???11???01 10:51:52 EDT; 22h ago
     Docs: <a href="http://docs.docker.com" target="_blank" data-href="http://docs.docker.com">http://docs.docker.com</a>
     Main PID: 8737 (docker)
     CGroup: /system.slice/docker.service
     ??????8737 /usr/bin/docker -d -H fd://



    
    Nov 01 10:51:52 docker.server.io docker[8737]: [info] Listening for HTTP on fd ()
    Nov 01 10:51:53 docker.server.io docker[8737]: [cc69a548] +job init_networkdriver()
    Nov 01 10:51:53 docker.server.io docker[8737]: [cc69a548] -job init_networkdriver() = OK (0)
    Nov 01 10:51:53 docker.server.io docker[8737]: [info] Loading containers:
    Nov 01 10:51:53 docker.server.io docker[8737]: [info] : done.
    Nov 01 10:51:53 docker.server.io docker[8737]: [cc69a548] +job acceptconnections()
    Nov 01 10:51:53 docker.server.io docker[8737]: [cc69a548] -job acceptconnections() = OK (0)
    Nov 01 10:52:03 docker.server.io docker[8737]: [info] GET /v1.15/containers/json
    Nov 01 10:52:03 docker.server.io docker[8737]: [cc69a548] +job containers()
    Nov 01 10:52:03 docker.server.io docker[8737]: [cc69a548] -job containers() = OK (0)
    [root@docker ~]#


This should do until CentOS manage to catch-up with the latest Docker releases, which shouldn???t be too long hopefully ???.

[embed]https://twitter.com/BitIntegrity/status/521815263163863040[/embed]
