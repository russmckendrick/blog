---
author: russmckendrick
comments: true
date: 2014-04-27 11:00:00+00:00
layout: post
current: post
class: post-template
cover: assets/posts/docker.png
title: Docker
wordpress_id: 1162
categories:
- Tech
tags:
- Docker
---





![](/assets/posts/d0e23-1dafneoqxt72ycfvuaknbow.png)




Been playing with [Docker](http://docker.io/) again this weekend, this time rather than just doing for the sake of doing it I went for something a little more stable.




I started off by creating a new [DigitalOcean](https://www.digitalocean.com/?refcode=52ec4dc3647e) droplet with the latest CentOS installed to run as a base. I then installed docker using the [Docker Puppet Module](https://forge.puppetlabs.com/garethr/docker).




So now I had Docker installed now what? I looked at some PaaS services, a bulk of them require Ubuntu (which I simply don’t do on servers), however [Shipyard](http://shipyard-project.com/) looked good. It was simple to install;



    
    yum install <a href="http://www.mirrorservice.org/sites/dl.fedoraproject.org/pub/epel/6/i386/epel-release-6-8.noarch.rpm" target="_blank" data-href="http://www.mirrorservice.org/sites/dl.fedoraproject.org/pub/epel/6/i386/epel-release-6-8.noarch.rpm">http://www.mirrorservice.org/sites/dl.fedoraproject.org/pub/epel/6/i386/epel-release-6-8.noarch.rpm</a><br>yum -y install docker-io vim-enhanced<br>vim /etc/sysconfig/docker # Replace other_args=”” with other_args=”-H tcp://127.0.0.1:4243 -H unix:///var/run/docker.sock”<br>service docker start<br>chkconfig docker on<br>docker run -i -t -v /var/run/docker.sock:/docker.sock shipyard/deploy setup




Once installed I added the agent using;



    
    curl <a href="https://github.com/shipyard/shipyard-agent/releases/download/v0.3.1/shipyard-agent" target="_blank" data-href="https://github.com/shipyard/shipyard-agent/releases/download/v0.3.1/shipyard-agent">https://github.com/shipyard/shipyard-agent/releases/download/v0.3.1/shipyard-agent</a> -L -o /usr/local/bin/shipyard-agent<br>chmod +x /usr/local/bin/shipyard-agent <br>shipyard-agent -url http://<shipyard-host>:8000 -register




Once the agent has been registered you should have a key, make a note of this because you need to ensure that the agent is always running, to do this I used [supervisord](http://supervisord.org/);



    
    yum install python-pip<br>pip install “pip>=1.4,<1.5” — upgrade<br>pip install supervisor



    
    cat >> /etc/supervisord.conf << SUPERDUPER<br>[supervisord]



    
    [rpcinterface:supervisor]<br>supervisor.rpcinterface_factory = supervisor.rpcinterface:make_main_rpcinterface



    
    [inet_http_server]<br>port = 127.0.0.1:9001



    
    [supervisorctl]<br>serverurl=http://127.0.0.1:9001



    
    [program:shipyard]<br>command = shipyard-agent -url http://<shipyard-host>:8000 -key <shipyard-key><br>SUPERDUPER



    
    supervisord -c /etc/supervisord.conf




As I needed to checkout PHP 5.5 & MySQL 5.6 on CentOS using [The IUS Community Project](https://iuscommunity.org/pages/About.html) for another project I created the a [GitHub Repo](https://github.com/russmckendrick/docker) and then published it as a [trusted build on the Docker Index](https://index.docker.io/u/russmckendrick/).




