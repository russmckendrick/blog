---
author: Russ McKendrick
comments: true
date: 2016-05-08 16:13:53+00:00
image: assets/posts/docker-mac.png
title: Docker on Mac OSX
categories:
    - Tech
tags:
    - Docker
    - Mac
---

I finally have a beta invite for the native OSX version of Docker, well sort of native OSX version, as you can see from the quote below there is still a virtual machine running …


<blockquote>Faster and more reliable — No more VirtualBox! On Mac, the Docker Engine runs in an xhyve Virtual Machine (VM) on top of an Alpine Linux distribution. The VM is managed by the native Docker application. On Windows, the Docker Engine is running in a Hyper-V VM. You do not need Docker Machine (docker-machine) to run Docker for Mac and Docker for Windows.</blockquote>


… xhyve is a port of [The BSD Hypervisor](http://www.bhyve.org) which takes advantage of the [hypervisor framework](https://developer.apple.com/library/mac/documentation/DriversKernelHardware/Reference/Hypervisor/index.html) provided by Apple meaning that Docker now has a very small footprint and access to alot of more of the native features of OSX.

Installing it is a breeze, like any other OSX application you download a dmg file, mount and then copy the application to your Applications folder;
![mac-docker-01](https://cdn-images-1.medium.com/max/800/0*tu4mRt0zzvUd7Z7q.png)
Once you have the Docker application in your Applications folder it is time to launch it, doing so will prompt you to enter your beta invite token;
![mac-docker-02](https://cdn-images-1.medium.com/max/800/0*0TDBuqdpiapG65vB.png)
Once installed, it will check that the token is valid;
![mac-docker-03](https://cdn-images-1.medium.com/max/800/0*_a44cYQV1DkDM1U9.png)
Clicking **Next** will pop-up a prompt which tells you that Docker needs your password to get escalated privileges;
![mac-docker-04](https://cdn-images-1.medium.com/max/800/0*utUfnB3CgrSW8kfN.png)
Once Docker finishes configuring the network component and linking the Docker client to the new VM you should receive confirmation that Docker is up and running;
![mac-docker-05](https://cdn-images-1.medium.com/max/800/0*eCN6MBXEDH-VB4GY.png)
And thats its, you now have Docker up and running as natively as you can on a non-Linux machine, as per any new installation, lets run the _Hello World_ container, running ….

    
    docker run hello-world


…. gave me the following;
![mac-docker-06](https://cdn-images-1.medium.com/max/800/0*pEeqqEYCIQBFUFii.png)
Now I had Docker installed it was time to test my biggest bug bear of running Docker with Virtualbox, file permissions !!! It has been one of the big selling points of this new more native version;


<blockquote>Volume mounting for your code and data — Volume data access is fast and works correctly.</blockquote>


A good test is trying to run MariaDB / MySQL container and have the /var/lib/mysql/ folder mounted as a volume from your local machine. If we attempted this with Virtualbox we would have to jump through all sorts of hoops to get it so that permissions are enough for MariaDB / MySQL to even start.

I used the following command to launch MariaDB using my own [MariaDB image](https://hub.docker.com/r/russmckendrick/mariadb/);

    
    docker run -d -p 3306:3306 — name=”database” -e MYSQL_DATABASE=wibble -v ~/Projects/permissions/database:/var/lib/mysql russmckendrick/mariadb


This would mount _~/Projects/permissions/database_ to _/var/lib/mysql_ within the container, as you can see from the following terminal session, it worked flawlessly;
![mac-docker-07](https://cdn-images-1.medium.com/max/800/0*6REdPg0nEnWF2tJ6.png)
The MariaDB container is sat there happily making MySQL available on port 3306 on localhost meaning I can connect it using something like [Sequel Pro](http://www.sequelpro.com/) with no drama at all;
![mac-docker-08](https://cdn-images-1.medium.com/max/800/0*5VfPiocKbQyyr0Us.png)
I can even attach to the container as I would any other container;
![mac-docker-09](https://cdn-images-1.medium.com/max/800/0*byPbjPXQX4ChXC4F.png)
All of this means that issues like [1.3.0 — Only root can write to OSX volumes / Can’t change permissions within #581](https://github.com/boot2docker/boot2docker/issues/581) which has been open since October 2014 can be finally laid to rest.
