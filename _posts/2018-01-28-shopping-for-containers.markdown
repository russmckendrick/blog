---
author: russmckendrick
comments: true
date: 2018-01-28 16:07:18+00:00
excerpt: Token container photo in the header
layout: post
current: post
class: post-template
cover: assets/posts/0bf88-1_zj2vrrdtqkpwzwr9weflq.png
link: http://mediaglasses.blog/2018/01/28/shopping-for-containers/
slug: shopping-for-containers
title: Shopping for Containers
wordpress_id: 1020
categories:
- Tech
tags:
- Containers
- Docker
- Docker Store
---

Over the last six months the Docker Store, which was first introduced as a private beta nearly a year and a half ago in June 2016, has come on leaps and bounds.

It has quickly, but without much fanfare, become a one-stop shop for all things Docker, with both the documentation and home pages linking back to content now hosted on the store.
![]({{ site.baseurl }}/assets/posts/a2c8c-1tjvbr_bypbt7qiivbdjzcg.png)

The store front-page


### So what is the Docker Store?


In short, it is a marketplace for containers, plugins and also Docker itself there is a mixture of free and also paid content from both Docker themselves as well as third party providers.

As you can see from the screenshot above, there are currently four main sections.

**Docker EE**, you can find Docker Enterprise Edition installers for all supported platforms here, from Red Hat Enterprise Linux to Windows Server 2016, you will be able to find the installation media here, as well also the option to purchase a subscription.

**Docker CE**, if you are happy with the community edition of Docker then this is where you will find all of the various installers, included here are;



 	
  * [Docker for Mac](https://store.docker.com/editions/community/docker-ce-desktop-mac)

 	
  * [Docker for Windows](https://store.docker.com/editions/community/docker-ce-desktop-windows)

 	
  * [Docker for AWS](https://store.docker.com/editions/community/docker-ce-aws)

 	
  * [Docker for Azure](https://store.docker.com/editions/community/docker-ce-azure)

 	
  * As well as [CentOS](https://store.docker.com/editions/community/docker-ce-server-centos), [Ubuntu](https://store.docker.com/editions/community/docker-ce-server-ubuntu), [Debian](https://store.docker.com/editions/community/docker-ce-server-debian) and [Fedroa](https://store.docker.com/editions/community/docker-ce-server-fedora)


**Containers**, here is where the bulk of the store content is. Here you will find a mixture of free, licensed and subscription-based container images. We will look into this section in more detail in a moment.

**Plugins**, here you will find the container images used to power the Docker Engine managed plugin system. For example, if you wanted to install the Weave Net plugin into your Docker Swarm cluster you would run;

    
    $ docker plugin install store/weaveworks/net-plugin:2.0.1


This would download the container which contains the plugin from [https://store.docker.com/plugins/weave-net-plugin](https://store.docker.com/plugins/weave-net-plugin).
![]({{ site.baseurl }}/assets/posts/4037b-1f_4qbwofl-ezcje1jp7bg.png)

The Weave Net Docker plugin page on the Docker Store
At the time of writing, all but one of the plugins listed it Docker Certified.

Docker Certified containers mean that the publisher of the container image has submitted to Docker for certification. This gives you, as the consumer of the container, assurances that the container image is fully compatible with Docker Enterprise Edition and also that it is built to accepted best practices.


### Containers


As mentioned in the previous section, the bulk of the content on the Docker Store is, no surprises, containers.

The Docker Store is now the official home for all of the core containers curated by Docker themselves. While these containers are still available at the Docker Hub, they are slowly being moved to the Docker Store.
![]({{ site.baseurl }}/assets/posts/494fe-12-jdc4y-z6f2xye5jcpqva.png)

PHP on the Docker Hub
As you can see from the screen above of the [official image for PHP from the Docker Hub](https://hub.docker.com/_/php/), there is a link to the Docker Store at the top of the page. The [Docker Store page for PHP](https://store.docker.com/images/php) gives you the same view, all be it with a few additions;
![]({{ site.baseurl }}/assets/posts/f1158-18egttyc-o156nsovsfhdgw.png)

PHP on the Docker Store
You will notice that the Docker Store page has the price of $0.00 and also it highlights the fact that the image is an Offical Image.

The instructions for pulling the image are the same on both the Docker Hub and Docker Store;

    
    $ docker pull php


Hopefully, they will update both the Nub and Store to use the command`docker image pull`, but that is just me wanting to use the new Docker client commands :)

Let’s take a look at another image, [Couchbase on the Docker Hub](https://hub.docker.com/_/couchbase/) looks like any other official image;
![]({{ site.baseurl }}/assets/posts/65894-1cyjp972k59_qwj8verw1nw.png)

Couchbase on the Docker Hub
However, it’s listing on the Docker Store gives a different story;
![]({{ site.baseurl }}/assets/posts/8336b-1mnlkbbjzytigdlxaak0ela.png)

Couchbase on the Docker Store
Here we can see the image is actually maintained by Couchbase Inc, who, from clicking on the [link](https://store.docker.com/publishers/couchbaselabs), we can tell a verified publisher. You will also notice that there are no commands like`docker pull` listed on the store, instead, there is a **Proceed to Checkout** button, as this image is $0.00 let's try checking it out.

Clicking on the Checkout button takes you to a page which asks for your name, company name, phone number and email address. Once filled in click on Get Content and you will be taken to your subscription page;
![]({{ site.baseurl }}/assets/posts/81187-1-i6qwkxemsd1o67n2qgutw.png)

Couchbase subscription page
Let’s try pulling the image from an un-authenticated Docker client by running;

    
    $ docker pull store/couchbase/couchbase:3.1.5


![]({{ site.baseurl }}/assets/posts/43eb9-1ehy2yyfsfz7ynqgnkc0rlw.png)

Access denied !!!
Logging in using the `docker login` command then trying to `docker pull` the image has a lot more success;
![]({{ site.baseurl }}/assets/posts/861eb-18jghw9onytv8kpwz-ejnsq.png)

It works when logged in !!!
From there I could for example run the following command to launch Couchbase;

    
    $ docker container run -d store/couchbase/couchbase:3.1.5


As you can see, I have had to use the full image name and version to ensure that the image from the Docker Store will be used.

Please note, the commands above are not the best ones to launch a Couchbase container, they are purely for example. If you want to know how to run Couchbase in a container I recommend reviewing [the offical documentation](https://developer.couchbase.com/documentation/server/5.0/getting-started/do-a-quick-install.html).

Another type of purchase from the Docker Store is a Developer Tier one, a good example of this is the Oracle Database Enterprise Edition container, to attach the subscription to your Docker Store account you need to agree to the following;


<blockquote>I agree that my use of each program in this Content, including any subsequent updates or upgrades, shall be governed by my existing Oracle license agreement for the program (subject to quantity and license type restrictions in my program license); or, if I don’t have an existing license agreement for the program, then by separate license terms, if any, stated in the program; or, if I don’t have an existing Oracle license agreement for a program and no separate license terms are stated, then by the terms of the Oracle license agreement [here](http://www.oracle.com/technetwork/licenses/standard-license-152015.html).</blockquote>


I don’t have access to an Oracle entitlement so I didn’t agree (don’t want Larry and his lawyers after me) if I had then the process for pulling would be exactly the same as the Couchbase example.

There is a lot of the additional content which you will not find in the Docker Hub on the Docker Store, I recommend [browsing the Docker Store](https://store.docker.com/search?source=verified&type=image) and see what are you missing out on.
