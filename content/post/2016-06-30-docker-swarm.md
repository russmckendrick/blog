---
author: Russ McKendrick
comments: true
date: 2016-06-30 18:30:00+00:00
image: assets/posts/c633b-1vzrrt9_ld5aja_krbw73ww.png
title: Docker Swarm
categories:
    - Tech
tags:
    - Docker
    - Mac
    - Swarm
---

As mentioned a few weeks ago I have been part of the Docker for macOS (as its now known) [beta](/2016/05/08/docker-mac/) for a while. I didn’t pay much attention to the update last night until I just caught up on the tweets from Docker Con and noticed that they have built in orchestration straight into the core Docker Engine.

They said it was there now and it will take no time to run so I decided to give it ago;
![service01](https://cdn-images-1.medium.com/max/800/0*Oi_CQ-J_rxz-HP-j.png)
As you can see, it was that easy !!! The commands I ran were as follows;

    
    docker swarm init


This turn my local Docker installation into the Swarm manager, I then created an overlay network called “clusternetwork”;

    
    docker network create -d overlay clusternetwork


and finally created the service called “cluster”, which was made up of 3 replicas all bound to port 80, by running;

    
    docker service create — name cluster — replicas 3 -p:80:80/tcp — network clusternetwork russmckendrick/cluster


I already had a container hosted in the [Docker Hub which runs NGINX and shows a page with the containers ID](https://hub.docker.com/r/russmckendrick/cluster/).

Opening my browser and going to [http://localhost/](http://localhost/) showed me the following page;
![service02](https://cdn-images-1.medium.com/max/800/0*u0f_PAL82H3alAw1.png)
So far so good, lets now forcible remove the container with the ID of “6af0c7d1256b”;
![service03](https://cdn-images-1.medium.com/max/800/0*buZkPbgVn41ZZXoS.png)
As you can see, it was replaced and refreshing my browser now shows that I am connecting to another container in the cluster;
![service04](https://cdn-images-1.medium.com/max/800/0*6MS8PErFJW8aWPDx.png)
Lets try scaling the service, this is as simple as running;

[code gutter=”false”]docker service scale cluster=6[/code]
![more-docker-service04](https://cdn-images-1.medium.com/max/800/0*Ffnz06-UGiQDygRF.png)
All really simple stuff, now imagine if I had more than a single host all of the containers I launched would be nicely distributed amongst them and it should all magically take care of itself.

To remove the service and leave the swarm run the following commands;

    
    docker service rm cluster
    docker network rm clusternetwork
    docker swarm leave — force


and for more information on this new feature see the following [blog post](https://blog.docker.com/2016/06/docker-1-12-built-in-orchestration/), at the time of writing the documentation is in the process of being rolled out so I will update this post if anything is wrong :)
