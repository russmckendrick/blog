---
author: russmckendrick
comments: true
date: 2016-06-25 18:30:16+00:00
layout: post
link: http://mediaglasses.blog/2016/06/25/docker-load-balancing-application-bundles/
slug: docker-load-balancing-application-bundles
title: Docker Load Balancing & Application Bundles
wordpress_id: 1005
categories:
- Tech
tags:
- Docker
- Mac
- Swarm
---

Earlier in the week I wrote about the [new Docker Swarm functionality](/2016/06/30/docker-service/), as i didn’t have much time I was just using the [Docker for Mac](https://www.docker.com/products/docker#/mac) beta.


#### Launching a Swarm cluster


To test more of the new features we are going to need a few servers so rather than launching them locally I decided to write an Ansible playbook to launch x number of droplets in [Digital Ocean](https://m.do.co/c/52ec4dc3647e). Once the droplets have launched the playbook goes on to perform the following tasks;



 	
  * Installs a few prerequisites like python 2.7, git and UFW

 	
  * Configures UFW, locking down the Docker services to just our Droplets

 	
  * Installs Docker 1.12rc2 experimental build from [https://experimental.docker.com/](https://experimental.docker.com/)

 	
  * Initializes the Swarm manager and then connects the worker nodes to the manager


The playbook is available on GitHub at [https://github.com/russmckendrick/digitalocean-docker-swarm](https://github.com/russmckendrick/digitalocean-docker-swarm), the [README](https://github.com/russmckendrick/digitalocean-docker-swarm/blob/master/README.md) has instructions on how to run the playbook so I won’t go into detail here, below is a what you should see when you run the playbook for the first time;
![asciicast](https://cdn-images-1.medium.com/max/800/0*wKQvBmcqZBupQTio.png)
Once complete, you should have four droplets launched in [Digital Ocean](https://m.do.co/c/52ec4dc3647e);
![more-docker-service01](https://cdn-images-1.medium.com/max/800/0*eJmWfnqFHtk6kYv0.)


#### Load Balancing


One of the features I wanted to try for myself was the Load Balancing. The documentation describes this as;


<blockquote>The swarm manager uses ingress load balancing to expose the services you want to make available externally to the swarm. The swarm manager can automatically assign the service a PublishedPort or you can configure a PublishedPort for the service in the 30000–32767 range.

External components, such as cloud load balancers, can access the service on the PublishedPort of any node in the cluster whether or not the node is currently running the task for the service. All nodes in the swarm cluster route ingress connections to a running task instance.</blockquote>


Now you have your Docker Swarm cluster up and running we can test the Load Balancing to do this connect to the Manager, the IP is at the end of the playbook output or you can get it from your [Digital Ocean](https://m.do.co/c/52ec4dc3647e) [control panel](https://cloud.digitalocean.com/droplets).

Once connected you can check everything is OK with your cluster by running;

    
    docker node ls


This will show all of the Droplets in the cluster and their current status. Now we have confirm our cluster is working as it should be we can launch some containers. In my previous post I created a service using my [test container](https://hub.docker.com/r/russmckendrick/cluster/) so I will do that again here.

    
    docker network create -d overlay clusternetwork
    docker service create — name cluster -p:80:80/tcp — network clusternetwork russmckendrick/cluster
    docker service ls
    docker service tasks cluster


![more-docker-service02](https://cdn-images-1.medium.com/max/800/0*PwIDbe-rV8k-bzCs.)
As you can see, I have a single container running on the _docker-swarm-manager_ node. Lets try connecting to our container via the IP address of one of the worker nodes;
![more-docker-service03](https://cdn-images-1.medium.com/max/800/0*zSGCUp-Fb_3jrOPW.)
and there we have our container !!!

Last time we tried scaling, so lets try again now. As we have four droplets we can get into double digits;

    
    docker service scale cluster=15
    docker service tasks cluster


![more-docker-service04](https://cdn-images-1.medium.com/max/800/0*mSeRIRhXxPOFnjMp.)
Before looking at anything else lets remove the cluster service;

    
    docker service rm cluster
    docker service ls




#### Docker Distributed Application Bundles (DAB)


While we have our Swarm cluster up and running, lets look at building a distributed application using a Docker Compose file. Docker Distributed Application Bundles are described as;


<blockquote>Distributed Application Bundles is an experimental open file format for bundling up all the artifacts required to ship and deploy multi-container apps: a DAB contains a description of all the services required to run the application and details images to use, ports to expose, and the networks used to link services.</blockquote>


The Docker Compose file we will be using follows;

    
    version: ‘2’
    services:
     wordpress:
     container_name: my-wordpress-app
     image: wordpress
     ports:
     — “80:80”
     environment:
     — “WORDPRESS_DB_HOST=mysql:3306”
     — “WORDPRESS_DB_PASSWORD=password”
     mysql:
     container_name: my-wordpress-database
     image: mysql
     expose:
     — “3306”
     environment:
     — “MYSQL_ROOT_PASSWORD=password”


As you can see the _docker-compose.yml_ file runs a WordPress and MySQL container as well configures networking. On your local machine, check that you are running Docker Compose 1.8rc1, this is included in the latest Docker for Mac beta, by running;

    
    docker-compose — version


Now create a temporary folder and download the docker-compose.yml file;

    
    mkdir ~/Desktop/test
    cd ~/Desktop/test
    curl -O <a href="https://gist.githubusercontent.com/russmckendrick/c6320315431afd19a0ee10132e086673/raw/e3a8019a68c2122141cae14bcb84b4c20ef18fe6/docker-compose.yml" target="_blank" data-href="https://gist.githubusercontent.com/russmckendrick/c6320315431afd19a0ee10132e086673/raw/e3a8019a68c2122141cae14bcb84b4c20ef18fe6/docker-compose.yml">https://gist.githubusercontent.com/russmckendrick/c6320315431afd19a0ee10132e086673/raw/e3a8019a68c2122141cae14bcb84b4c20ef18fe6/docker-compose.yml</a>


Now we have our Docker Compose file, download the images by running;

    
    docker-compose pull


and finally create the bundle by running;

    
    docker-compose bundle -o wordpress.dsb


![more-docker-service06](https://cdn-images-1.medium.com/max/800/0*bywsJwhVX81IErSn.)
a copy of the bundle created above looks like;

[https://gist.github.com/russmckendrick/c6320315431afd19a0ee10132e086673/#file-wordpress-dsb](https://gist.github.com/russmckendrick/c6320315431afd19a0ee10132e086673/#file-wordpress-dsb)

Back on our Swarm manager, we can download the distributed app by running;

    
    curl -O <a href="https://gist.githubusercontent.com/russmckendrick/c6320315431afd19a0ee10132e086673/raw/e3a8019a68c2122141cae14bcb84b4c20ef18fe6/wordpress.dsb" target="_blank" data-href="https://gist.githubusercontent.com/russmckendrick/c6320315431afd19a0ee10132e086673/raw/e3a8019a68c2122141cae14bcb84b4c20ef18fe6/wordpress.dsb">https://gist.githubusercontent.com/russmckendrick/c6320315431afd19a0ee10132e086673/raw/e3a8019a68c2122141cae14bcb84b4c20ef18fe6/wordpress.dsb</a>
    docker deploy wordpress


Now the application has been deployed you can check its status by running;

    
    docker stack tasks wordpress


Finally, we need to know which port our WordPress container has been published on so that we can access it in our browser. To get this information run the following command;

    
    docker service inspect wordpress_wordpress


and make a note of the **PublishedPort** in the _Endpoint_ section.
![more-docker-service07](https://cdn-images-1.medium.com/max/800/0*YElvcDEwbHUjZPys.)
Going to any of your hosts on port 30001 should present you with a WordPress installation screen.

It’s worth noting that this feature is not yet complete and it seems to be quite limiting, for example there doesn’t appear to be a way to mount volumes or define which port is exposed.


#### Tearing down the cluster


As none of us want servers hanging around, not being used but costing us money there is a playbook which terminates the Drops we originally launched, to run it follow the instructions in the [README](https://github.com/russmckendrick/digitalocean-docker-swarm/blob/master/README.md).
![asciicast](https://cdn-images-1.medium.com/max/800/0*3gNpeZqlfewGolSU.png)
