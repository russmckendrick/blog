---
title: "Deploying a Stable Docker Setup on CentOS with Shipyard"
author: "Russ Mckendrick"
date: 2014-04-27T11:00:00.000Z
lastmod: 2021-07-31T12:31:19+01:00
tags:
    - "Docker"
    - "Tools"
cover:
    image: "/img/2014-04-27_been-playing-with-docker-again-this-weekend-this-time-rather-than-just-doing-for-the-sake-of-doing_0.png" 
images:
 - "/img/2014-04-27_been-playing-with-docker-again-this-weekend-this-time-rather-than-just-doing-for-the-sake-of-doing_0.png"


aliases:
- "/been-playing-with-docker-again-this-weekend-this-time-rather-than-just-doing-for-the-sake-of-doing-e16eebf37069"

---

Been playing with [Docker](http://docker.io/) again this weekend, this time rather than just doing for the sake of doing it I went for something a little more stable.

I started off by creating a new [DigitalOcean](https://www.digitalocean.com/?refcode=52ec4dc3647e) droplet with the latest CentOS installed to run as a base. I then installed docker using the [Docker Puppet Module](https://forge.puppetlabs.com/garethr/docker).

So now I had Docker installed now what? I looked at some PaaS services, a bulk of them require Ubuntu (which I simply don’t do on servers), however [Shipyard](http://shipyard-project.com/) looked good. It was simple to install;

```
yum install http://www.mirrorservice.org/sites/dl.fedoraproject.org/pub/epel/6/i386/epel-release-6-8.noarch.rpm
yum -y install docker-io vim-enhanced
vim /etc/sysconfig/docker # Replace other_args=”” with other_args=”-H tcp://127.0.0.1:4243 -H unix:///var/run/docker.sock”
service docker start
chkconfig docker on
docker run -i -t -v /var/run/docker.sock:/docker.sock shipyard/deploy setup
```

Once installed I added the agent using;

```
curl https://github.com/shipyard/shipyard-agent/releases/download/v0.3.1/shipyard-agent -L -o /usr/local/bin/shipyard-agent
chmod +x /usr/local/bin/shipyard-agent 
shipyard-agent -url http://<shipyard-host>:8000 -register
```

Once the agent has been registered you should have a key, make a note of this because you need to ensure that the agent is always running, to do this I used [supervisord](http://supervisord.org/);

```
yum install python-pip
pip install “pip>=1.4,<1.5” — upgrade
pip install supervisor

cat >> /etc/supervisord.conf << SUPERDUPER
[supervisord]

[rpcinterface:supervisor]
supervisor.rpcinterface_factory = supervisor.rpcinterface:make_main_rpcinterface

[inet_http_server]
port = 127.0.0.1:9001

[supervisorctl]
serverurl=http://127.0.0.1:9001

[program:shipyard]
command = shipyard-agent -url http://<shipyard-host>:8000 -key <shipyard-key>
SUPERDUPER

supervisord -c /etc/supervisord.conf
```

As I needed to checkout PHP 5.5 & MySQL 5.6 on CentOS using [The IUS Community Project](https://iuscommunity.org/pages/About.html) for another project I created the a [GitHub Repo](https://github.com/russmckendrick/docker) and then published it as a [trusted build on the Docker Index](https://index.docker.io/u/russmckendrick/).
