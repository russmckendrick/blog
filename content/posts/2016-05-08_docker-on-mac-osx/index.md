---
title: "Docker on Mac OSX"
description: "Experience Docker on macOS with enhanced speed and reliability. Learn how to install and leverage its native features seamlessly."
author: "Russ Mckendrick"
date: 2016-05-08T16:13:53.000Z
lastmod: 2021-07-31T12:33:51+01:00

tags:
 - Tools
 - Docker
 - macOS

cover:
    image: "/img/2016-05-08_docker-on-mac-osx_0.png" 
    alt: "Experience Docker on macOS with enhanced speed and reliability. Learn how to install and leverage its native features seamlessly."

images:
 - "/img/2016-05-08_docker-on-mac-osx_0.png"
 - "/img/2016-05-08_docker-on-mac-osx_1.png"
 - "/img/2016-05-08_docker-on-mac-osx_2.png"
 - "/img/2016-05-08_docker-on-mac-osx_3.png"
 - "/img/2016-05-08_docker-on-mac-osx_4.png"
 - "/img/2016-05-08_docker-on-mac-osx_5.png"
 - "/img/2016-05-08_docker-on-mac-osx_6.png"
 - "/img/2016-05-08_docker-on-mac-osx_7.png"
 - "/img/2016-05-08_docker-on-mac-osx_8.png"
 - "/img/2016-05-08_docker-on-mac-osx_9.png"


aliases:
- "/docker-on-mac-osx-46a6ede7843"

---

I finally have a beta invite for the native OSX version of Docker, well sort of native OSX version, as you can see from the quote below there is still a virtual machine running …

> Faster and more reliable — No more VirtualBox! On Mac, the Docker Engine runs in an xhyve Virtual Machine (VM) on top of an Alpine Linux distribution. The VM is managed by the native Docker application. On Windows, the Docker Engine is running in a Hyper-V VM. You do not need Docker Machine (docker-machine) to run Docker for Mac and Docker for Windows.

… xhyve is a port of [The BSD Hypervisor](http://www.bhyve.org) which takes advantage of the [hypervisor framework](https://developer.apple.com/library/mac/documentation/DriversKernelHardware/Reference/Hypervisor/index.html) provided by Apple meaning that Docker now has a very small footprint and access to alot of more of the native features of OSX.

Installing it is a breeze, like any other OSX application you download a dmg file, mount and then copy the application to your Applications folder;

![mac-docker-01](/img/2016-05-08_docker-on-mac-osx_1.png)

Once you have the Docker application in your Applications folder it is time to launch it, doing so will prompt you to enter your beta invite token;

![mac-docker-02](/img/2016-05-08_docker-on-mac-osx_2.png)

Once installed, it will check that the token is valid;

![mac-docker-03](/img/2016-05-08_docker-on-mac-osx_3.png)

Clicking **Next** will pop-up a prompt which tells you that Docker needs your password to get escalated privileges;

![mac-docker-04](/img/2016-05-08_docker-on-mac-osx_4.png)

Once Docker finishes configuring the network component and linking the Docker client to the new VM you should receive confirmation that Docker is up and running;

![mac-docker-05](/img/2016-05-08_docker-on-mac-osx_5.png)

And thats its, you now have Docker up and running as natively as you can on a non-Linux machine, as per any new installation, lets run the Hello World container, running ….

```
docker run hello-world
```

…. gave me the following;

![mac-docker-06](/img/2016-05-08_docker-on-mac-osx_6.png)

Now I had Docker installed it was time to test my biggest bug bear of running Docker with Virtualbox, file permissions !!! It has been one of the big selling points of this new more native version;

> Volume mounting for your code and data — Volume data access is fast and works correctly.

A good test is trying to run MariaDB / MySQL container and have the /var/lib/mysql/ folder mounted as a volume from your local machine. If we attempted this with Virtualbox we would have to jump through all sorts of hoops to get it so that permissions are enough for MariaDB / MySQL to even start.

I used the following command to launch MariaDB using my own [MariaDB image](https://hub.docker.com/r/russmckendrick/mariadb/);

```
docker run -d -p 3306:3306 — name=”database” -e MYSQL_DATABASE=wibble -v ~/Projects/permissions/database:/var/lib/mysql russmckendrick/mariadb
```

This would mount ~/Projects/permissions/database to /var/lib/mysql within the container, as you can see from the following terminal session, it worked flawlessly;

![mac-docker-07](/img/2016-05-08_docker-on-mac-osx_7.png)

The MariaDB container is sat there happily making MySQL available on port 3306 on localhost meaning I can connect it using something like [Sequel Pro](http://www.sequelpro.com/) with no drama at all;

![mac-docker-08](/img/2016-05-08_docker-on-mac-osx_8.png)

I can even attach to the container as I would any other container;

![mac-docker-09](/img/2016-05-08_docker-on-mac-osx_9.png)

All of this means that issues like [1.3.0 — Only root can write to OSX volumes / Can’t change permissions within #581](https://github.com/boot2docker/boot2docker/issues/581) which has been open since October 2014 can be finally laid to rest.
