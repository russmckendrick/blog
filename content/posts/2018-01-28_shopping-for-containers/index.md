---
title: "Shopping for Containers"
author: "Russ Mckendrick"
date: 2018-01-28T16:07:18.553Z
lastmod: 2021-07-31T12:35:10+01:00
tags:
 - Docker
 - Tools
cover:
    image: "/img/2018-01-28_shopping-for-containers_0.png" 
images:
 - "/img/2018-01-28_shopping-for-containers_0.png"
 - "/img/2018-01-28_shopping-for-containers_1.png"
 - "/img/2018-01-28_shopping-for-containers_2.png"
 - "/img/2018-01-28_shopping-for-containers_3.png"
 - "/img/2018-01-28_shopping-for-containers_4.png"
 - "/img/2018-01-28_shopping-for-containers_5.png"
 - "/img/2018-01-28_shopping-for-containers_6.png"
 - "/img/2018-01-28_shopping-for-containers_7.png"
 - "/img/2018-01-28_shopping-for-containers_8.png"
 - "/img/2018-01-28_shopping-for-containers_9.png"
aliases:
- "/shopping-for-containers-f510da15fc9e"

---

Over the last six months the Docker Store, which was first introduced as a private beta nearly a year and a half ago in June 2016, has come on leaps and bounds.

It has quickly, but without much fanfare, become a one stop shop for all things Docker, with the both the documentation and home pages linking back to content now hosted on the store.

![](/img/2018-01-28_shopping-for-containers_1.png)

### So what is the Docker Store?

In short, it is a market place for containers, plugins and also Docker itself there is a mixture of free and also paid content from both Docker themselves as well as third part providers.

As you can see from the screenshot above, there are currently four main sections.

**Docker EE**, you can find Docker Enterprise Edition installers for all supported platforms here, from Red Hat Enterprise Linux to Windows Server 2016, you will be able to find the installation media here, as well also the option to purchase a subscription.

**Docker CE**, if you are happy with the community edition of Docker then this is where you will find all of the various installers, included here are;

- [Docker for Mac](https://store.docker.com/editions/community/docker-ce-desktop-mac)
- [Docker for Windows](https://store.docker.com/editions/community/docker-ce-desktop-windows)
- [Docker for AWS](https://store.docker.com/editions/community/docker-ce-aws)
- [Docker for Azure](https://store.docker.com/editions/community/docker-ce-azure)
- As well as [CentOS](https://store.docker.com/editions/community/docker-ce-server-centos), [Ubuntu](https://store.docker.com/editions/community/docker-ce-server-ubuntu), [Debian](https://store.docker.com/editions/community/docker-ce-server-debian) and [Fedroa](https://store.docker.com/editions/community/docker-ce-server-fedora)

**Containers**, here is where the bulk of the store content is. Here you will find a mixture of free, licensed and subscription based container images. We will look into this section in more detail in a moment.

**Plugins**, here you will find the container images used to power the Docker Engine managed plugin system. For example if you wanted to install the Weave Net plugin into your Docker Swarm cluster you would run;

```
$ docker plugin install store/weaveworks/net-plugin:2.0.1
```

This would download the container which contains the plugin from [https://store.docker.com/plugins/weave-net-plugin](https://store.docker.com/plugins/weave-net-plugin).

![](/img/2018-01-28_shopping-for-containers_2.png)

At the time of writing, all but one of the plugins listed it Docker Certified.

Docker Certified containers mean that the publisher of the container image has submitted to Docker for certification. This gives you, as the consummer of the container, assurances that the container image is fully compatible with Docker Enterprise Edition and also that it is built to accepted best practises.

### Containers

As mentioned in the previous section, the bulk of the content on the Docker Store is, no surprises, containers.

The Docker Store is now the offical home for all of the core containers currated by Docker themselves. While these containers are still available at the Docker Hub, they are slowly being moved to the Docker Store.

![](/img/2018-01-28_shopping-for-containers_3.png)

As you can see from the screen above of the [official image for PHP from the Docker Hub](https://hub.docker.com/_/php/), there is a link to the Docker Store at the top of the page. The [Docker Store page for PHP](https://store.docker.com/images/php) gives you the same view, all be it with a few additions;

![](/img/2018-01-28_shopping-for-containers_4.png)

You will notice that the the Docker Store page has the price of $0.00 and also it highlights the fact that the image is an Offical Image.

The instuctions for pulling the image are the same on both the Docker Hub and Docker Store;

```
$ docker pull php
```

Hopefully they will update both the Nub and Store to use the `docker image pull` command, but that is just me wanting to use the new Docker client commands :)

Let’s take a look at another image, [Couchbase on the Docker Hub](https://hub.docker.com/_/couchbase/) looks like any other official image;

![](/img/2018-01-28_shopping-for-containers_5.png)

However, it’s listing on the Docker Store gives a different story;

![](/img/2018-01-28_shopping-for-containers_6.png)

Here we can see the image is actually maintained by Couchbase Inc, who, from clicking on the [link](https://store.docker.com/publishers/couchbaselabs), we can tell a verified publisher. You will also notice that there are no `docker pull` command listed on the store, instead there is a **Proceed to Checkout** button, as this image is $0.00 lets try checking it out.

Clicking on on the Checkout button takes you to a page which asks for your name, company name, phone number and email address. Once filled in click on Get Content and you will be take to your subscription page;

![](/img/2018-01-28_shopping-for-containers_7.png)

Let’s try pulling the image from an un-authenciated Docker client by running;

```
$ docker pull store/couchbase/couchbase:3.1.5
```

![](/img/2018-01-28_shopping-for-containers_8.png)

Logging in using the `docker login` command then trying to `docker pull` the image has a lot more success;

![](/img/2018-01-28_shopping-for-containers_9.png)

From there I could for example run the following command to launch Couchbase;

```
$ docker container run -d store/couchbase/couchbase:3.1.5
```

As you can see, I have had to use the full image name and version to ensure that the image from the Docker Store will be used.

Please note, the commands above are not the best ones to launch a Couchbase container, they are purely for example. If you want to know how to run Couchbase in a container I recommend reviewing [the offical documentation](https://developer.couchbase.com/).

Another type of purchase from the Docker Store is a Developer Tier one, a good example of this is the Oracle Database Enterprise Edition container, to attach the subscription to your Docker Store account you need to agree to the following;

> I agree that my use of each program in this Content, including any subsequent updates or upgrades, shall be governed by my existing Oracle license agreement for the program (subject to quantity and license type restrictions in my program license); or, if I don’t have an existing license agreement for the program, then by separate license terms, if any, stated in the program; or, if I don’t have an existing Oracle license agreement for a program and no separate license terms are stated, then by the terms of the Oracle license agreement [here](http://www.oracle.com/technetwork/licenses/standard-license-152015.html).

I don’t have access to an Oracle entitlement so I didn’t agree (don’t want Larry and his lawers after me), if I had then the process for pulling would be exactly the same as the Couchbase example.

There is a lot of the additional content which you will not find in the Docker Hub on the Docker Store, I recommend [browsing the Docker Store](https://store.docker.com/search?source=verified&type=image) and see what are you missing out on.
