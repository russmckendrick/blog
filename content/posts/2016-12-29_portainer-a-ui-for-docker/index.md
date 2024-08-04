---
title: "Portainer, a UI for Docker"
description: "Discover Portainer: Simplify Docker management (150k+ pulls). Open-source tool streamlines container deployment, management & monitoring for devs & DevOps."
author: "Russ Mckendrick"
date: "2016-12-29T18:14:07+01:00"
tags:
  - "Docker"
  - "DevOps"
  - "Tools"
cover:
  alt: "Discover Portainer: Simplify Docker management (150k+ pulls). Open-source tool streamlines container deployment, management & monitoring for devs & DevOps."
  image: "/img/2016-12-29_portainer-a-ui-for-docker_0.png"
aliases:
  - "/portainer-the-ui-for-docker-d067f6335f23"
lastmod: "2021-07-31T12:34:35+01:00"
---

Part of my daily routine is to go through Reddit, RSS feeds and also wading through the [MediaGlasses twitter](https://twitter.com/mediaglasses) account where I follow loads of technical people & companies.

Over the lat week or so I have seen Portainer mentioned quite a lot, particularly since it has now had over 1M + pulls on the Docker Hub;

{{< twitter user=russmckendrick id=812717388332351488 >}}

I decided to check it out. It describes itself as;

> The Easiest Way To Manage Docker. Portainer is an open-source, lightweight management UI which allows you to easily manage your docker host or swarm cluster

I thought I would post a quick update, giving a bit of background on how Portainer came to be (based on comments from Hacker News & Reddit).

Portainer originally started off life as Docker UI by [Michael Crosby](https://github.com/crosbymichael) who handed the code base off to [Kevan Ahlquist](https://github.com/kevana), at this point, due to trademark concerns, the project is renamed UI For Docker.

Development of UI For Docker continued, but, it [began to slow when Docker introduced features such as Swarm mode to the core Docker Engine and also a change of job for Kevan](https://news.ycombinator.com/item?id=13285203).

At the beginning of December 2016, a notice was [committed](https://github.com/kevana/ui-for-docker/commit/f324a66f74bc6fff2379f59fa014875d206e948c) to the UI For Docker repo stating that it the repo is now deprecated and people should use Portainer.

Portainer was forked from UI For Docker around this time last year, with its [first major release](https://github.com/portainer/portainer/releases/tag/1.0.0) in June 2016.

Since that release the authors estimate around 70% of the code has already been rewritten and over the course of the next six months as well adding new features such as role-based controls and Docker Compose support the developers believe that remaining 30% of the original code will have been rewritten.

Now, let’s crack on with installing it.

#### Local installation

First of all using Docker For Mac lets install it locally and have a poke around. To start off with, let’s pull the image so we can see how large it is;

```
docker pull portainer/portainer
docker images
```

![text](/img/2016-12-29_portainer-a-ui-for-docker_1.png)

As you can see from the terminal output above, the current version comes in at 9.132MB.

Now we have the image pulled; we can launch the container. As with any container which needs to access the Docker daemon on the host machine, we need to mount the socket file from the host within the container so to run Portainer we need to run the following command;

```
docker run -d -p 9000:9000 -v /var/run/docker.sock:/var/run/docker.sock portainer/portainer
```

![text](/img/2016-12-29_portainer-a-ui-for-docker_2.png)

Now that Portainer is running you should be able to open your browser and enter [http://localhost:9000/](http://localhost:9000/); you will be greeted by a screen which asks you to set a password for the admin user;

![graphical user interface, application](/img/2016-12-29_portainer-a-ui-for-docker_3.png)

Setting the password and clicking on **Validate** will take you to a login page, once there enter the password you just set with the username of admin and the click on **Login**;

![graphical user interface, application](/img/2016-12-29_portainer-a-ui-for-docker_4.png)

Once logged in you will be taken to the initial configuration page where you will be asked to choose between managing the Docker host where the Portainer is running a remote Docker host, for now, select the local Docker instance where Portainer is running and click on **Connect**;

![graphical user interface, text, application](/img/2016-12-29_portainer-a-ui-for-docker_5.png)

Once connected you will be presented with a **Dashboard** which looks something like the following;

![graphical user interface](/img/2016-12-29_portainer-a-ui-for-docker_6.png)

The first impressions you get is that it seems to be quite intuitive, everything you should expect to see from a container manager appears to be present and readily available from the main page.

Let’s launch some containers, using a template. To do this click on **App Templates**;

![graphical user interface, application](/img/2016-12-29_portainer-a-ui-for-docker_7.png)

Then choose one of the templates presented, here I am going to launch a NGINX container, click on **Show advanced options** allows you to map the ports;

![graphical user interface, application](/img/2016-12-29_portainer-a-ui-for-docker_8.png)

Once the container has launched you will be shown a list of your running containers;

![graphical user interface](/img/2016-12-29_portainer-a-ui-for-docker_9.png)

Clicking on the link in the **Exposed Ports** column will take you to that port, in a browser. Click on the **name of the container** will get a complete overview screen, from here you can see everything you would ever need to know about your newly launched container.

![graphical user interface, application](/img/2016-12-29_portainer-a-ui-for-docker_10.png)

Clicking on **Stats** will show you a real-time breakdown of what is happening within your container;

![graphical user interface, application](/img/2016-12-29_portainer-a-ui-for-docker_11.png)

As this is only using the output of the `docker stats` command data is not stored, refreshing the page restart the graphs.

Clicking on **Logs** will render the output of `docker logs`;

![graphical user interface, text](/img/2016-12-29_portainer-a-ui-for-docker_12.png)

Finally, clicking on **Console** will open a terminal, first of all, you have to choose which command you would like to enter the terminal with, as you can see from the screen below I choose `/bin/bash`;

![graphical user interface, text](/img/2016-12-29_portainer-a-ui-for-docker_13.png)

Running a container outside of Portainer will isn’t a problem, as we are hooked into the Docker daemon, it will show up within Portainer. For example, running Apache Bench against our NGINX container by running;

```
docker run --link=webserver russmckendrick/ab ab -k -n 100000 -c 30 http://webserver/
```

Will show up as a stopped container in the list of containers;

![graphical user interface, table](/img/2016-12-29_portainer-a-ui-for-docker_14.png)

Clicking on its name and then logs will show you the results of the Apache Bench run;

![graphical user interface, text, application, email](/img/2016-12-29_portainer-a-ui-for-docker_15.png)

On thing you may have noticed when we created the NGINX container using the **App Templates** is that you didn’t get too much in the way of configurable options.

Portainer has you covered, going to **Containers** and then **Add container** exposes all of the options you are used to when launching containers from the command line;

![graphical user interface, application](/img/2016-12-29_portainer-a-ui-for-docker_16.png)

There are also screens where you can;

- Pull and manage images
- Create, manage and inspect networks
- Create, manage and inspect volumes

and finally you can get an audit trail of everything your Docker daemon has been up to by clicking on **Events**;

![graphical user interface](/img/2016-12-29_portainer-a-ui-for-docker_17.png)

#### Docker Swarm Mode

Now let’s see what happens when we attach Portainer to a Docker Swarm cluster (running in Swarm mode and not the legacy standalone cluster).

First, we need to launch our Docker hosts; I ran the commands below to start a three node cluster in Digital Ocean using Docker Machine starting with the Swarm master;

```
docker-machine create \
  --driver digitalocean \
  --digitalocean-access-token your-do-token-goes-here \
  --digitalocean-region lon1 \
  --digitalocean-size 1gb \
swmaster
```

and then the two nodes;

```
docker-machine create \
  --driver digitalocean \
  --digitalocean-access-token your-do-token-goes-here \
  --digitalocean-region lon1 \
  --digitalocean-size 1gb \
swnode01

docker-machine create \
  --driver digitalocean \
  --digitalocean-access-token your-do-token-goes-here \
  --digitalocean-region lon1 \
  --digitalocean-size 1gb \
swnode02
```

Now that our three Docker hosts are online we can quickly configure Swarm by running the following commands. First, initialize cluster by running;

```
docker $(docker-machine config swmaster) swarm init --advertise-addr $(docker-machine ip swmaster):2377 --listen-addr $(docker-machine ip swmaster):2377
```

Once the manager has been configured, you will be given a token;

![text](/img/2016-12-29_portainer-a-ui-for-docker_18.png)

Make a note of the token as you will need it to run the following commands which join the remaining two Docker hosts to our cluster;

```
docker $(docker-machine config swnode01) swarm join $(docker-machine ip swmaster):2377 --token SWMTKN-1-3sx2yobftwdk1ed5bywh3tomlhm46gke4kp887w9uzmmgkhgtw-bv9unn94pva98dhrtx0hrkjzb

docker $(docker-machine config swnode02) swarm join $(docker-machine ip swmaster):2377 --token SWMTKN-1-3sx2yobftwdk1ed5bywh3tomlhm46gke4kp887w9uzmmgkhgtw-bv9unn94pva98dhrtx0hrkjzb
```

![text](/img/2016-12-29_portainer-a-ui-for-docker_19.png)

You can check that all three hosts are part of the Swarm cluster by running;

```
docker $(docker-machine config swmaster) node ls
```

![a screenshot of a computer](/img/2016-12-29_portainer-a-ui-for-docker_20.png)

Next, we need to connect our local Portainer installation to our Docker Swarm, to do this we will need the TLS certificates which Docker Machine created, to get these type the following command;

```
open ~/.docker/machine/certs/
```

This will open a finder window with the certificates you will need to upload to Portainer;

![text, table](/img/2016-12-29_portainer-a-ui-for-docker_21.png)

Now that we have the certificates we need to the IP address of the Docker Swarm Manager, to get this run the following;

```
echo $(docker-machine ip swmaster)
```

Return to your Portainer installation and click on **Endpoints**, click **TLS** and upload your certificates and give the endpoint details as per the screen below;

![graphical user interface, application, email](/img/2016-12-29_portainer-a-ui-for-docker_22.png)

Once added you should see your newly added endpoint show up in the **Active Endpoint** dropdown list, select it and view will change;

![graphical user interface, application](/img/2016-12-29_portainer-a-ui-for-docker_23.png)

As you can see, we have a few additional options. You can view information on your cluster by clicking on **Swarm**;

![table](/img/2016-12-29_portainer-a-ui-for-docker_24.png)

You can also add launch services by clicking **Services**. Before we launch a service we should create a network for our Service to launched into, click on **Networks** and then **Create** a network, I called mine “BlogPost”;

![graphical user interface, text, application, email](/img/2016-12-29_portainer-a-ui-for-docker_25.png)

Now that we have our overlay network lets launch a service service by clicking on **Services** and then **Add service,**enter the following;

![graphical user interface, application](/img/2016-12-29_portainer-a-ui-for-docker_26.png)

I am using an image called [russmckendrick/cluster](https://hub.docker.com/r/russmckendrick/cluster/), all it does is display a Docker logo and the container ID. Also, make sure you select the network you created using the dropdown list on the **Network** tab.

Going to the IP address of any of the three Docker hosts in your Swarm cluster in a browser should present you with something which looks like the following page;

![graphical user interface](/img/2016-12-29_portainer-a-ui-for-docker_27.png)

Clicking on the **Name** of your service will give you all of the information you would get from the command line along with options to scale, update and change the configuration of the service;

![graphical user interface, application](/img/2016-12-29_portainer-a-ui-for-docker_28.png)

For example, you can reduce the number of conatiners within the service by clicking on **Scale**, reducing the number down to **1** and then click**Save changes**;

![graphical user interface, table](/img/2016-12-29_portainer-a-ui-for-docker_29.png)

#### Teardown

Don’t forget to remove your Docker Swarm nodes once you have finished playing, you can do this by running;

```
docker-machine rm swmaster swnode01 swnode02
```

and also remove your Portainer installation by running;

```
docker stop name_of_your_portainer_conatiner
docker rm name_of_your_portainer_conatiner
```

#### Limitations?

Portainer works exactly as avertised on their splash page;

![a screenshot of a computer](/img/2016-12-29_portainer-a-ui-for-docker_30.png)

It is probably the best UI to the Docker API I have used, and believe me; I have at one point or another used them all.

For managing multiple individual Docker hosts from a central location this probably the best tool out there at the moment. However, as it just talks to the Docker API you do have the same limitations a running Docker on the command line when it comes to a Docker Swarm cluster.

For example, you can only see containers running on your Swarm manager just like you would if you were running `docker ps -a`;

![graphical user interface, text, application, email](/img/2016-12-29_portainer-a-ui-for-docker_31.png)

It would be nice to see all of the hosts which make up the Swarm cluster auto-discovered and added to a single view, however it makes sense as to why this feature isn’t already there, after all Portainer has not been designed to be a replacement for [Docker Cloud](https://www.docker.com/) or [Rancher](https://media-glass.es/launching-a-local-rancher-cluster-1422b89b0477#.umi8gcl92).

In all, well recommend if you need a UI to manage either your container hosts or a Docker Swarm cluster.

#### Further Reading

Here are some links you may find interesting …

- Portainer website [http://www.portainer.io](http://www.portainer.io)
- Portainer on Twitter [https://twitter.com/portainerio](https://twitter.com/portainerio)
- Portainer on Slack [http://www.portainer.io/slack](http://www.portainer.io/slack/)
- Portainer on GitHub [https://github.com/portainer](https://github.com/portainer)
- Portainer Roadmap [https://github.com/portainer/portainer/projects/2](https://github.com/portainer/portainer/projects/2)/

Also this post [**Neil Cresswell**](https://www.reddit.com/user/neilcresswell)on Reddit has some background on why Portainer was written;

[https://www.reddit.com/r/docker/comments/5ked5q/portainer_docker_incs_next_acquisition/dbpdmnu/](https://www.reddit.com/r/docker/comments/5ked5q/portainer_docker_incs_next_acquisition/dbpdmnu/)?

Finally, there is also a good overview by [The Containerizers](https://www.youtube.com/channel/UCFkOoM5xXS6hRs1lpw_8ydQ);
