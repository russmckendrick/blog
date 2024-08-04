---
title: "Docker Machine, Compose & Swarm"
description: "Unlock the full potential of Docker with Machine, Compose, & Swarm. Learn how to orchestrate containers, and create clusters across different platforms!"
author: "Russ Mckendrick"
date: "2015-03-21T16:16:25+01:00"
tags:
  - "Docker"
cover:
  image: "/img/2015-03-21_docker-machine-compose-swarm_0.png"
  alt: "Unlock the full potential of Docker with Machine, Compose, & Swarm. Learn how to orchestrate containers, and create clusters across different platforms!"
lastmod: "2021-07-31T12:32:49+01:00"
aliases:
  - "/docker-machine-compose-swarm-4180ceff6afa"
---

Since I last properly [wrote about Docker](/2014/08/31/docker-fig-nginx-reverse-proxies-and-centos-7/"Docker, Fig, NGINX Reverse Proxies and CentOS 7") a lot has changed. Docker have introduced some new command line tools which allow for easy orchestration of Docker instances, clusters and container management. These are;

- [Docker Machine](https://docs.docker.com/machine/ "Docker Machine") — Allows you to easily deploy Docker instances to a lot of different platforms.
- [Docker Compose](https://docs.docker.com/compose/ "Docker Compose") — A replacement for [Fig](https://fig.sh "Fig").
- [Docker Swarm](https://docs.docker.com/swarm/ "Docker Swarm") — Native clustering for your Docker instances.

Out of these three technologies, Swarm is not really suitable for production use so I won’t go into it in too much detail in this post.

#### Docker Machine

Rather than downloading the pre-compiled binary I decided to use the [Homebrew](http://brew.sh "Brew") formula (this assumes you have [Cask installed](/2014/10/20/yosemite-installation/ "Cask"));

{{< terminal title="Docker Machine, Compose & Swarm 1/39" >}}
```
 # Make sure everything is up-to-date
 brew update
 brew doctor
 brew cask update
 brew cask doctor
 # install docker-machine
 brew cask install docker-machine
```
{{< /terminal >}}

This will install docker-machine;

{{< terminal title="Docker Machine, Compose & Swarm 2/39" >}}
```
 docker-machine -v
 docker-machine version 0.1.0
 docker-machine ls
 NAME ACTIVE DRIVER STATE URL SWARM
```
{{< /terminal >}}

I already have [VirtualBox](https://www.virtualbox.org "VirtualBox") installed so lets create a machine called “Testing”;

{{< terminal title="Docker Machine, Compose & Swarm 3/39" >}}
```
 docker-machine create — driver virtualbox testing
 INFO[0000] Creating SSH key…
 INFO[0000] Creating VirtualBox VM…
 INFO[0006] Starting VirtualBox VM…
 INFO[0006] Waiting for VM to start…
 INFO[0038] “testing” has been created and is now the active machine.
 INFO[0038] To point your Docker client at it, run this in your shell: $(docker-machine env testing)
```
{{< /terminal >}}

docker-machine comes with a few commands which will help you connect using the locally installed docker client;

{{< terminal title="Docker Machine, Compose & Swarm 4/39" >}}
```
 docker-machine env testing
 export DOCKER_TLS_VERIFY=yes
 export DOCKER_CERT_PATH=/Users/russ/.docker/machine/machines/testing
 export DOCKER_HOST=tcp://192.168.99.100:2376
 docker-machine config testing
 — tls — tlscacert=/Users/russ/.docker/machine/machines/testing/ca.pem — tlscert=/Users/russ/.docker/machine/machines/testing/cert.pem — tlskey=/Users/russ/.docker/machine/machines/testing/key.pem -H=”tcp://192.168.99.100:2376
```
{{< /terminal >}}

Thats it, I now have a Virtual Machine launched and ready for me to start using Docker;

{{< terminal title="Docker Machine, Compose & Swarm 5/39" >}}
```
 docker-machine ls
 NAME ACTIVE DRIVER STATE URL SWARM
 testing * virtualbox Running tcp://192.168.99.100:2376
```
{{< /terminal >}}

As with any new installation, lets run a [“Hello World”](http://en.wikipedia.org/wiki/%22Hello,_World!%22_program "Hello World");

{{< terminal title="Docker Machine, Compose & Swarm 6/39" >}}
```
 docker $(docker-machine config testing) run busybox echo hello world
 Unable to find image ‘busybox:latest’ locally
 511136ea3c5a: Pull complete
 df7546f9f060: Pull complete
 ea13149945cb: Pull complete
 4986bf8c1536: Pull complete
 busybox:latest: The image you are pulling has been verified. Important: image verification is a tech preview feature and should not be relied on to provide security.

Status: Downloaded newer image for busybox:latest
 hello world
```
{{< /terminal >}}

Finally you can SSH to the Virtual Machine using docker-machine ssh machine-name;

{{< terminal title="Docker Machine, Compose & Swarm 7/39" >}}
```

 docker-machine ssh testing
 Boot2Docker version 1.5.0, build master : a66bce5 — Tue Feb 10 23:31:27 UTC 2015
 Docker version 1.5.0, build a8a31ef
 docker@testing:~$ uname -a
 Linux testing 3.18.5-tinycore64 #1 SMP Sun Feb 1 06:02:30 UTC 2015 x86_64 GNU/Linux
 docker@testing:~$ cat /etc/*release
 NAME=Boot2Docker
 VERSION=1.5.0
 ID=boot2docker
 ID_LIKE=tcl
 VERSION_ID=1.5.0
 PRETTY_NAME=”Boot2Docker 1.5.0 (TCL 5.4); master : a66bce5 — Tue Feb 10 23:31:27 UTC 2015"
 ANSI_COLOR=”1;34"
 HOME_URL=”http://boot2docker.io"
 SUPPORT_URL=”https://github.com/boot2docker/boot2docker"
 BUG_REPORT_URL=”https://github.com/boot2docker/boot2docker/issues"
 docker@testing:$ exit
```
{{< /terminal >}}

Great, so I now have a Virtual Machine running on my local computer, what more is there?

docker-machine is designed to be used with the following public and private cloud providers (more are being added all of the time);

- Amazon EC2
- Microsoft Azure
- Digital Ocean
- Google Compute Engine
- Rackspace
- SoftLayer
- OpenStack
- VMWare vCloud Air
- VMWare vSphere

Lets use docker-machine to launch a [Digital Ocean](https://www.digitalocean.com/?refcode=52ec4dc3647e "Digital Ocean") droplet. To do this you will need to generate a Personal Access Token, you can do this by [following these instructions](https://www.digitalocean.com/community/tutorials/how-to-use-the-digitalocean-api-v2). Once have the token launch the droplet as follows;

{{< terminal title="Docker Machine, Compose & Swarm 8/39" >}}
```
 docker-machine create \
 → — driver digitalocean \
 → — digitalocean-access-token cdb81ed0575b5a8d37cea0d06c9690daa074b1276892fc8473bdda97eb7c65ae \
 → dotesting
 INFO[0000] Creating SSH key…
 INFO[0000] Creating Digital Ocean droplet…
 INFO[0004] Waiting for SSH…
 INFO[0071] Configuring Machine…
 INFO[0120] “dotesting” has been created and is now the active machine.
 INFO[0120] To point your Docker client at it, run this in your shell: $(docker-machine env dotesting)
```
{{< /terminal >}}

(and no, that is not my Digital Ocean Personal Access Token, it’s just a random string)

So what just happened? docker-machine accessed my Digital Ocean account via the API and launched the following Droplet;

- OS = Ubuntu 14.04 x64
- RAM = 512MB
- HDD = 20GB SSD
- Region = NYC3

These defaults can be over-ridden by providing more options, run docker-machine create — help for a full break down of the options along with example arguments.

Once the droplet had finished booting, docker-machine connected to the droplet via SSH installed, configured and started the latest version of Docker.

So, we now have two machines launched, one locally and one in Digital Ocean;

{{< terminal title="Docker Machine, Compose & Swarm 9/39" >}}
```
 docker-machine ls
 NAME ACTIVE DRIVER STATE URL SWARM
 dotesting * digitalocean Running tcp://45.55.134.248:2376
 testing virtualbox Running tcp://192.168.99.100:2376
```
{{< /terminal >}}

lets run the “hello world” again, but this time use the droplet which has just been launched;

{{< terminal title="Docker Machine, Compose & Swarm 10/39" >}}
```
 docker $(docker-machine config dotesting) run busybox echo hello world
 Unable to find image ‘busybox:latest’ locally
 511136ea3c5a: Pull complete
 df7546f9f060: Pull complete
 ea13149945cb: Pull complete
 4986bf8c1536: Pull complete
 busybox:latest: The image you are pulling has been verified. Important: image verification is a tech preview feature and should not be relied on to provide security.

Status: Downloaded newer image for busybox:latest
 hello world
```
{{< /terminal >}}

and finally SSH into the machine;

{{< terminal title="Docker Machine, Compose & Swarm 11/39" >}}
```

 docker-machine ssh dotesting
 Welcome to Ubuntu 14.04.1 LTS (GNU/Linux 3.13.0–43-generic x86_64)

Documentation: https://help.ubuntu.com/

System information as of Sat Mar 21 07:24:02 EDT 2015

System load: 0.43 Processes: 72
 Usage of /: 11.4% of 19.56GB Users logged in: 0
 Memory usage: 12% IP address for eth0: 45.55.134.248
 Swap usage: 0% IP address for docker0: 172.17.42.1

Graph this data and manage this system at:
 https://landscape.canonical.com/

root@dotesting:~# docker images
 REPOSITORY TAG IMAGE ID CREATED VIRTUAL SIZE
 busybox latest 4986bf8c1536 11 weeks ago 2.433 MB
 root@dotesting:~# docker ps -a
 CONTAINER ID IMAGE COMMAND CREATED STATUS PORTS NAMES
 b8a83077d858 busybox:latest “echo hello world” 4 minutes ago Exited (0) 4 minutes ago kickass_almeida
 root@dotesting:~# exit
 logout
```
{{< /terminal >}}

Finally, you can stop and remove machines using docker-machine stop machine-name and docker-machine rm machine-name, be careful when using rm as it does not prompt you if you are sure;

{{< terminal title="Docker Machine, Compose & Swarm 12/39" >}}
```
 docker-machine ls
 NAME ACTIVE DRIVER STATE URL SWARM
 dotesting * digitalocean Running tcp://45.55.134.248:2376
 testing virtualbox Running tcp://192.168.99.100:2376
 docker-machine stop dotesting
 docker-machine ls
 NAME ACTIVE DRIVER STATE URL SWARM
 dotesting * digitalocean Stopped tcp://45.55.134.248:2376
 testing virtualbox Running tcp://192.168.99.100:2376
 docker-machine rm dotesting
 docker-machine ls
 NAME ACTIVE DRIVER STATE URL SWARM
 testing virtualbox Running tcp://192.168.99.100:2376
```
{{< /terminal >}}

So thats a quick overview of docker-machine. As you can see, it is a a really convenient way to bootstrap Docker server instances across many different providers and tear them down all using a single command from your local machine.

#### Docker Compose

Docker Compose started life as Fig which is something [I have written about before in a previous post](/2014/08/31/docker-fig-nginx-reverse-proxies-and-centos-7/"Docker, Fig, NGINX Reverse Proxies and CentOS 7"), the currently release doesn’t add too much in the way of new functionality, but it does start laying the foundations for working with docker-swam, [click here](https://github.com/docker/compose/releases/tag/1.1.0 "Docker Compose 1.1.0 release notes") for the full release notes.

Like docker-machine I installed it using a [Homebrew](http://brew.sh/ "Homebrew") formula;

{{< terminal title="Docker Machine, Compose & Swarm 13/39" >}}
```
 brew install docker-compose
 ==> Downloading https://homebrew.bintray.com/bottles/fig-1.1.0.yosemite.bottle.1.tar.gz
 ################################################################## 100.0%
 ==> Pouring fig-1.1.0.yosemite.bottle.1.tar.gz
 ==> Caveats
 Bash completion has been installed to:
 /usr/local/etc/bash_completion.d
 ==> Summary
 /usr/local/Cellar/fig/1.1.0: 186 files, 2.2M
```
{{< /terminal >}}

So using docker-machine lets create a Docker server instance to use docker-compose with;

{{< terminal title="Docker Machine, Compose & Swarm 14/39" >}}
```
 docker-machine create — driver virtualbox compose
 INFO[0001] Creating SSH key…
 INFO[0001] Creating VirtualBox VM…
 INFO[0007] Starting VirtualBox VM…
 INFO[0008] Waiting for VM to start…
 INFO[0041] “compose” has been created and is now the active machine.
 INFO[0041] To point your Docker client at it, run this in your shell: $(docker-machine env compose)
```
{{< /terminal >}}

as docker-compose doesn’t interact directly with docker-machine we need to tell the main docker client the details of the server instance which has just been launched;

{{< terminal title="Docker Machine, Compose & Swarm 15/39" >}}
```
 $(docker-machine env compose)
```
{{< /terminal >}}

this command injects the environment variables needed for the docker client to connect to the server instance, to see these you can just run docker-machine env machine-name on it’s own;

{{< terminal title="Docker Machine, Compose & Swarm 16/39" >}}
```
 docker-machine env compose
 export DOCKER_TLS_VERIFY=yes
 export DOCKER_CERT_PATH=/Users/russ/.docker/machine/machines/compose
 export DOCKER_HOST=tcp://192.168.99.100:2376
```
{{< /terminal >}}

From here, it is just like Fig, apart from fig.yml file should now be called docker-compose.yml, I had a fig.yml file from a previous post still on my machine;

{{< terminal title="Docker Machine, Compose & Swarm 17/39" >}}
```
web:
 cover:
    image: russmckendrick/nginx-php
 volumes:
 — ./web:/var/www/html/
 ports:
 — 80:80
 environment:
 PHP_POOL: mywebsite
 links:
 — db:db
db:
 cover:
    image: russmckendrick/mariadb
 ports:
 — 3306
 privileged: true
 environment:
 MYSQL_ROOT_PASSWORD: wibble
 MYSQL_DATABASE: wibble
 MYSQL_USER: wibble
 MYSQL_PASSWORD: wibble
```
{{< /terminal >}}

It launches two containers and links them together along with mounting the ./web folder in the NGINX container. The directory structure of the folder I am going to be running docker-compose from looks like;

{{< terminal title="Docker Machine, Compose & Swarm 18/39" >}}
```
 tree -a
 .
 ├── \[russ 356] docker-compose.yml
 └── \[russ 102] web
 └── \[russ 67] index.php

1 directory, 2 files
```
{{< /terminal >}}

To start with I pulled the images which are going to be launched, you can ignore this part, it just makes showing whats going on in this post more straight forward;

{{< terminal title="Docker Machine, Compose & Swarm 19/39" >}}
```
 docker-compose pull
 Pulling db (russmckendrick/mariadb:latest)…
 Pulling web (russmckendrick/nginx-php:latest)…
```
{{< /terminal >}}

Now the images have been pulled down it’s time to launch the containers;

{{< terminal title="Docker Machine, Compose & Swarm 20/39" >}}
```
 docker-compose up -d
 Creating example_db_1…
 Creating example_web_1…
```
{{< /terminal >}}

We now have two running containers;

{{< terminal title="Docker Machine, Compose & Swarm 21/39" >}}
```
 docker-compose ps
 Name Command State Ports
 — — — — — — — — — — — — — — — — — — — — — — — — — — — — — — — — 
 example_db_1 /usr/local/bin/run Up 0.0.0.0:49154->3306/tcp
 example_web_1 /usr/local/bin/run Up 0.0.0.0:80->80/tcp
```
{{< /terminal >}}

You can also open your browser using;

{{< terminal title="Docker Machine, Compose & Swarm 22/39" >}}
```
 open http://$(docker-machine ip)
```
{{< /terminal >}}

In my example I see a [phpinfo()](http://php.net/manual/en/function.phpinfo.php "PHPInfo") page.

![phpinfo](/img/2015-03-21_docker-machine-compose-swarm_1.png)

Once the containers are running you can connect to them using docker exec;

{{< terminal title="Docker Machine, Compose & Swarm 23/39" >}}
```

 docker exec -it example_web_1 bash
 [root@997bbe6b5c80 /]# ps aux
 USER PID %CPU %MEM VSZ RSS TTY STAT START TIME COMMAND
 root 1 0.2 1.5 115200 15360 ? Ss 13:59 0:01 /usr/bin/python /usr/bin/supervisord -n
 root 16 0.0 3.2 382876 33624 ? S 13:59 0:00 php-fpm: master process (/etc/php-fpm.conf)
 root 17 0.0 0.2 110016 2096 ? Ss 13:59 0:00 nginx: master process nginx
 nginx 18 0.0 0.5 110472 5568 ? S 13:59 0:00 nginx: worker process
 webserv+ 19 0.0 1.5 383132 16284 ? S 13:59 0:00 php-fpm: pool mywebsite
 webserv+ 20 0.0 0.8 382876 8848 ? S 13:59 0:00 php-fpm: pool mywebsite
 webserv+ 21 0.0 0.8 382876 8848 ? S 13:59 0:00 php-fpm: pool mywebsite
 webserv+ 22 0.0 0.8 382876 8848 ? S 13:59 0:00 php-fpm: pool mywebsite
 webserv+ 23 0.0 0.8 382876 8852 ? S 13:59 0:00 php-fpm: pool mywebsite
 root 95 0.0 0.4 91540 4740 ? Ss 13:59 0:00 /usr/libexec/postfix/master -w
 postfix 97 0.0 0.6 91712 6508 ? S 13:59 0:00 qmgr -l -t unix -u
 postfix 200 0.0 0.6 91644 6232 ? S 14:05 0:00 pickup -l -t unix -u
 root 234 2.3 0.2 11748 2968 ? S 14:07 0:00 bash
 root 250 1.0 1.1 110012 11616 ? S 14:07 0:00 nginx
 root 251 0.0 0.2 19756 2212 ? R+ 14:07 0:00 ps aux
 [root@997bbe6b5c80 /]# exit
 exit
```
{{< /terminal >}}

Finally you can stop and remove the containers, and the Docker instance;

{{< terminal title="Docker Machine, Compose & Swarm 24/39" >}}
```
 docker-compose stop && docker-compose rm — force
 Stopping example_web_1…
 Stopping example_db_1…
 Going to remove example_web_1, example_db_1
 Removing example_db_1…
 Removing example_web_1…
 docker-machine rm compose
 docker-machine ls
 NAME ACTIVE DRIVER STATE URL SWARM
```
{{< /terminal >}}

### Docker Swarm

Before going any further, the documentation warns ….

> Note: Swarm is currently in beta, so things are likely to change. We don’t recommend you use it in production yet.

Now that’s out of the way lets use [Homebrew](https://brew.sh/) to install docker-swarm;

{{< terminal title="Docker Machine, Compose & Swarm 25/39" >}}
```
brew install docker-swarm
 ==> Downloading https://homebrew.bintray.com/bottles/docker-swarm-0.1.0.yosemite.bottle.tar.gz
 ################################################################## 100.0%
 ==> Pouring docker-swarm-0.1.0.yosemite.bottle.tar.gz
 /usr/local/Cellar/docker-swarm/0.1.0: 4 files, 8.7M
```
{{< /terminal >}}

As we already have docker-machine installed I will be using it to locally create the cluster, first of all we need to launch an instance and run the swarm container;

{{< terminal title="Docker Machine, Compose & Swarm 26/39" >}}
```
 docker-machine ls
 NAME ACTIVE DRIVER STATE URL SWARM
 docker-machine create -d virtualbox local
 INFO[0001] Creating SSH key…
 INFO[0001] Creating VirtualBox VM…
 INFO[0006] Starting VirtualBox VM…
 INFO[0006] Waiting for VM to start…
 INFO[0039] “local” has been created and is now the active machine.
 INFO[0039] To point your Docker client at it, run this in your shell: $(docker-machine env local)
 $(docker-machine env local)
 docker run swarm create
 Unable to find image ‘swarm:latest’ locally
 511136ea3c5a: Pull complete
 ae115241d78a: Pull complete
 f49087514537: Pull complete
 fff73787bd9f: Pull complete
 97c8f6e912d7: Pull complete
 33f9d1e808cf: Pull complete
 62860d7acc87: Pull complete
 bf8b6923851d: Pull complete
 swarm:latest: The image you are pulling has been verified. Important: image verification is a tech preview feature and should not be relied on to provide security.

Status: Downloaded newer image for swarm:latest
 63e7a1adb607ce4db056a29b1f5d30cf
```
{{< /terminal >}}

As you can see, I got a token when the container launched 63e7a1adb607ce4db056a29b1f5d30cf I will need this to add more nodes, but first we will need to create a Swarm master;

{{< terminal title="Docker Machine, Compose & Swarm 27/39" >}}
```
docker-machine create \
 → -d virtualbox \
 → — swarm \
 → — swarm-master \
 → — swarm-discovery token://63e7a1adb607ce4db056a29b1f5d30cf \
 → swarm-master
 INFO[0000] Creating SSH key…
 INFO[0000] Creating VirtualBox VM…
 INFO[0006] Starting VirtualBox VM…
 INFO[0006] Waiting for VM to start…
 INFO[0038] Configuring Swarm…
 INFO[0043] “swarm-master” has been created and is now the active machine.
 INFO[0043] To point your Docker client at it, run this in your shell: $(docker-machine env swarm-master)
```
{{< /terminal >}}

We then need to connect the Docker client to the swarm, this is done by adding — swarm to the $(docker-machine env machine-name) command;

{{< terminal title="Docker Machine, Compose & Swarm 28/39" >}}
```
 $(docker-machine env — swarm swarm-master)
```
{{< /terminal >}}

Now lets add another node;

{{< terminal title="Docker Machine, Compose & Swarm 29/39" >}}
```
 docker-machine create \
 → -d virtualbox \
 → — swarm \
 → — swarm-discovery token://63e7a1adb607ce4db056a29b1f5d30cf \
 → swarm-node-00
 INFO[0000] Creating SSH key…
 INFO[0000] Creating VirtualBox VM…
 INFO[0006] Starting VirtualBox VM…
 INFO[0006] Waiting for VM to start…
 INFO[0039] Configuring Swarm…
 INFO[0048] “swarm-node-00” has been created and is now the active machine.
```
{{< /terminal >}}

We now have a 2 node cluster called “swarm-master”;

{{< terminal title="Docker Machine, Compose & Swarm 30/39" >}}
```
 docker-machine ls
 NAME ACTIVE DRIVER STATE URL SWARM
 local virtualbox Running tcp://192.168.99.100:2376
 swarm-master virtualbox Running tcp://192.168.99.101:2376 swarm-master (master)
 swarm-node-00 * virtualbox Running tcp://192.168.99.102:2376 swarm-master
```
{{< /terminal >}}

Using docker info gives more information about the cluster;

{{< terminal title="Docker Machine, Compose & Swarm 31/39" >}}
```
 docker info
 Containers: 3
 Nodes: 2
 swarm-master: 192.168.99.101:2376
 └ Containers: 2
 └ Reserved CPUs: 0 / 4
 └ Reserved Memory: 0 B / 999.9 MiB
 swarm-node-00: 192.168.99.102:2376
 └ Containers: 1
 └ Reserved CPUs: 0 / 4
 └ Reserved Memory: 0 B / 999.9 MiB
```
{{< /terminal >}}

Great, so what does all of this mean?

Lets pull some images down;

{{< terminal title="Docker Machine, Compose & Swarm 32/39" >}}
```
 docker -H 192.168.99.101:2376 pull redis
 docker -H 192.168.99.102:2376 pull mysql
```
{{< /terminal >}}

Notice how I have pulled redis on “swarm-master” and mysql on “swarm-node-00”, I can now make sure that containers only launch on a node where the image is available;

{{< terminal title="Docker Machine, Compose & Swarm 33/39" >}}
```
 docker run -d — name redis1 -e affinity:image==redis redis
 af66148bbbc8dcd799d82448dfd133b968d34eb7066a353108bf909ea3324a58
 docker run -d — name mysql -e affinity:image==mysql -e MYSQL_ROOT_PASSWORD=mysecretpassword -d mysql
 70b2d93d6f83aa99f5ad4ebe5037e228a491a4b570609840f3f4be9780c33587
 docker ps
 CONTAINER ID IMAGE COMMAND CREATED STATUS PORTS NAMES
 70b2d93d6f83 mysql:latest “/entrypoint.sh mysq 3 seconds ago Up Less than a second 3306/tcp swarm-node-00/mysql
 af66148bbbc8 redis:latest “/entrypoint.sh redi 2 minutes ago Up 2 minutes 6379/tcp swarm-master/redis1
```
{{< /terminal >}}

another example would be ports being used on a node, lets pull my NGINX & PHP image on both nodes;

{{< terminal title="Docker Machine, Compose & Swarm 34/39" >}}
```
 docker -H 192.168.99.101:2376 pull russmckendrick/nginx-php
 docker -H 192.168.99.102:2376 pull russmckendrick/nginx-php
```
{{< /terminal >}}

Now lets launch the a container and bind it to port 80;

{{< terminal title="Docker Machine, Compose & Swarm 35/39" >}}
```
 docker run -d -p 80:80 russmckendrick/nginx-php
 2d066b2ccf28d2a1fa9edad8ac7b065266f29ecb49a8753b972780051ff83587
```
{{< /terminal >}}

and again;

{{< terminal title="Docker Machine, Compose & Swarm 36/39" >}}
```
 docker run -d -p 80:80 russmckendrick/nginx-php
 40f5fee257bb2546a639a5dc5c2d30f8fa0ac169145e431c534f85d8db51357f
```
{{< /terminal >}}

Nothing special there you say? Well, normally, when trying to launch the second container you would have gotten the following error as you can not bind two containers to the same port;

{{< terminal title="Docker Machine, Compose & Swarm 37/39" >}}
```
 docker run -d -p 80:80 russmckendrick/nginx-php
 FATA[0000] Error response from daemon: unable to find a node with port 80 available
```
{{< /terminal >}}

However, in this case as Docker is aware of what is running on the nodes wothin the cluster including which ports are in use. Docker via Swarm simply launched the container on “swarm-node-00” and it knew that port 80 was already in use on “swarm-master”;

{{< terminal title="Docker Machine, Compose & Swarm 38/39" >}}
```
 docker ps
 CONTAINER ID IMAGE COMMAND CREATED STATUS PORTS NAMES
 40f5fee257bb russmckendrick/nginx-php:latest “/usr/local/bin/run” 4 seconds ago Up Less than a second 192.168.99.101:80->80/tcp swarm-master/elated_einstein
 2d066b2ccf28 russmckendrick/nginx-php:latest “/usr/local/bin/run” 8 seconds ago Up Less than a second 192.168.99.102:80->80/tcp swarm-node-00/drunk_mestorf
 70b2d93d6f83 mysql:latest “/entrypoint.sh mysq 26 minutes ago Up 26 minutes 3306/tcp swarm-node-00/mysql
 af66148bbbc8 redis:latest “/entrypoint.sh redi 29 minutes ago Up 29 minutes 6379/tcp swarm-master/redis1
```
{{< /terminal >}}

All of this was done with no prompting or special commands, it helpfully just got on with it

As you can see, docker-swarm is still very much in-development and there are some deal breakers, like containers not being able to talk to each other across nodes. However, with the news that [socketplane.io](http://socketplane.io "SocketPlane") (they produce a container based software defined networking solution using Open vSwitch) is [joining Docker](http://blog.docker.com/2015/03/socketplane-excited-to-be-joining-docker-to-collaborate-with-networking-ecosystem/ "Socketplane Excited To Be Joining Docker To Collaborate With Networking Ecosystem") I don’t think it will be too long before this problem is resolved.

Finally, lets remove the running instances;

{{< terminal title="Docker Machine, Compose & Swarm 39/39" >}}
```
 docker-machine rm local swarm-master swarm-node-00
```
{{< /terminal >}}

That’s it for now, expect a follow up post in the next few months as these tools are updated.
