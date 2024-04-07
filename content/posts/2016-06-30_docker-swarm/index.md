---
title: "Docker Swarm"
description: "Discover Docker Swarm on macOS beta, orchestrate services effortlessly, and scale with ease. Step-by-step guide included."
author: "Russ Mckendrick"
date: 2016-06-30T18:30:00.000Z
lastmod: 2021-07-31T12:34:04+01:00

tags:
 - Docker

cover:
    image: "/img/2016-06-30_docker-swarm_0.png" 
images:
 - "/img/2016-06-30_docker-swarm_0.png"
 - "/img/2016-06-30_docker-swarm_1.png"
 - "/img/2016-06-30_docker-swarm_2.png"
 - "/img/2016-06-30_docker-swarm_3.png"
 - "/img/2016-06-30_docker-swarm_4.png"
 - "/img/2016-06-30_docker-swarm_5.png"


aliases:
- "/docker-service-dfad77652d50"

---

As mentioned a few weeks ago I have been part of the Docker for macOS (as its now known) [beta](/2016/05/08/docker-on-mac-osx/) for a while. I didn’t pay much attention to the update last night until I just caught up on the tweets from Docker Con and noticed that they have built in orchestration straight into the core Docker Engine.

They said it was there now and it will take no time to run so I decided to give it ago;

![service01](/img/2016-06-30_docker-swarm_1.png)

As you can see, it was that easy !!! The commands I ran were as follows;

```
docker swarm init
```

This turn my local Docker installation into the Swarm manager, I then created an overlay network called “clusternetwork”;

```
docker network create -d overlay clusternetwork
```

and finally created the service called “cluster”, which was made up of 3 replicas all bound to port 80, by running;

```
docker service create — name cluster — replicas 3 -p:80:80/tcp — network clusternetwork russmckendrick/cluster
```

I already had a container hosted in the [Docker Hub which runs NGINX and shows a page with the containers ID](https://hub.docker.com/r/russmckendrick/cluster/).

Opening my browser and going to [http://localhost/](http://localhost/) showed me the following page;

![service02](/img/2016-06-30_docker-swarm_2.png)

So far so good, lets now forcible remove the container with the ID of “6af0c7d1256b”;

![service03](/img/2016-06-30_docker-swarm_3.png)

As you can see, it was replaced and refreshing my browser now shows that I am connecting to another container in the cluster;

![service04](/img/2016-06-30_docker-swarm_4.png)

Lets try scaling the service, this is as simple as running;

[code gutter=”false”]docker service scale cluster=6[/code]

![more-docker-service04](/img/2016-06-30_docker-swarm_5.png)

All really simple stuff, now imagine if I had more than a single host all of the containers I launched would be nicely distributed amongst them and it should all magically take care of itself.

To remove the service and leave the swarm run the following commands;

```
docker service rm cluster
docker network rm clusternetwork
docker swarm leave — force
```

and for more information on this new feature see the following [blog post](https://blog.docker.com/2016/06/docker-1-12-built-in-orchestration/), at the time of writing the documentation is in the process of being rolled out so I will update this post if anything is wrong :)