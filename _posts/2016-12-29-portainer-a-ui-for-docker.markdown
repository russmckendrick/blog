---
author: russmckendrick
comments: true
date: 2016-12-29 18:14:07+00:00
layout: post
link: http://mediaglasses.blog/2016/12/29/portainer-a-ui-for-docker/
slug: portainer-a-ui-for-docker
title: Portainer, a UI for Docker
wordpress_id: 1022
categories:
- Tech
tags:
- DevOps
- Docker
- Docker Swarm
- Portainer
---

Part of my daily routine is to go through Reddit, RSS feeds and also wading through the [MediaGlasses twitter](https://twitter.com/mediaglasses) account where I follow loads of technical people & companies.

Over the lat week or so I have seen Portainer mentioned quite a lot, particularly since it has now had over 1M + pulls on the Docker Hub;

[embed]https://twitter.com/portainerio/status/812717388332351488[/embed]

I decided to check it out. It describes itself as;


<blockquote>The Easiest Way To Manage Docker. Portainer is an open-source, lightweight management UI which allows you to easily manage your docker host or swarm cluster</blockquote>


_I thought I would post a quick update, giving a bit of background on how Portainer came to be (based on comments from Hacker News & Reddit)._

Portainer originally started off life as Docker UI by [Michael Crosby](https://github.com/crosbymichael) who handed the code base off to [Kevan Ahlquist](https://github.com/kevana), at this point, due to trademark concerns, the project is renamed UI For Docker.

Development of UI For Docker continued, but, it [began to slow when Docker introduced features such as Swarm mode to the core Docker Engine and also a change of job for Kevan](https://news.ycombinator.com/item?id=13285203).

At the beginning of December 2016, a notice was [committed](https://github.com/kevana/ui-for-docker/commit/f324a66f74bc6fff2379f59fa014875d206e948c) to the UI For Docker repo stating that it the repo is now deprecated and people should use Portainer.

Portainer was forked from UI For Docker around this time last year, with its [first major release](https://github.com/portainer/portainer/releases/tag/1.0.0) in June 2016.

Since that release the authors estimate around 70% of the code has already been rewritten and over the course of the next six months as well adding new features such as role-based controls and Docker Compose support the developers believe that remaining 30% of the original code will have been rewritten.

Now, let’s crack on with installing it.


#### Local installation


First of all using Docker For Mac lets install it locally and have a poke around. To start off with, let’s pull the image so we can see how large it is;

    
    docker pull portainer/portainer
    docker images


![]({{ site.baseurl }}/assets/posts/52220-1ihpd100cyelupzgn2q_y5g.png)Its tiny !!!
As you can see from the terminal output above, the current version comes in at 9.132MB.

Now we have the image pulled; we can launch the container. As with any container which needs to access the Docker daemon on the host machine, we need to mount the socket file from the host within the container so to run Portainer we need to run the following command;

    
    docker run -d -p 9000:9000 -v /var/run/docker.sock:/var/run/docker.sock portainer/portainer


![]({{ site.baseurl }}/assets/posts/20c6a-1n6ohbqv10pgpneiczg1ykq.png)
Now that Portainer is running you should be able to open your browser and enter [http://localhost:9000/](http://localhost:9000/); you will be greeted by a screen which asks you to set a password for the admin user;
![]({{ site.baseurl }}/assets/posts/65590-1px2cnfrbbxrvfi5diwbbxq.png)

Set the admin password
Setting the password and clicking on **_Validate_** will take you to a login page, once there enter the password you just set with the username of admin and the click on **_Login_**;
![]({{ site.baseurl }}/assets/posts/6de3b-1xuqlpiafabzowuw3jxtwia.png)

Login
Once logged in you will be taken to the initial configuration page where you will be asked to choose between managing the Docker host where the Portainer is running a remote Docker host, for now, select the local Docker instance where Portainer is running and click on **_Connect_**;
![]({{ site.baseurl }}/assets/posts/8d2aa-1ysxakmh4llqcctljvwp75a.png)

What would you like to manage?
Once connected you will be presented with a **_Dashboard_** which looks something like the following;
![]({{ site.baseurl }}/assets/posts/61f04-1jc-zyc0j-rkphecwmos73a.png)

The dashboard
The first impressions you get is that it seems to be quite intuitive, everything you should expect to see from a container manager appears to be present and readily available from the main page.

Let’s launch some containers, using a template. To do this click on **_App Templates_**;
![]({{ site.baseurl }}/assets/posts/6c5a8-1mq7-38mvbz6e8mki6gn5lq.png)

List of templates
Then choose one of the templates presented, here I am going to launch a NGINX container, click on **_Show advanced options_** allows you to map the ports;
![]({{ site.baseurl }}/assets/posts/fa1df-1qccnemlyyilk-cclz14jyg.png)

Launching a container from a template
Once the container has launched you will be shown a list of your running containers;
![]({{ site.baseurl }}/assets/posts/13f62-1jvnusnqzl2fl_xxpftkunq.png)

Running containers
Clicking on the link in the **_Exposed Ports_** column will take you to that port, in a browser. Click on the **_name of the container_** will get a complete overview screen, from here you can see everything you would ever need to know about your newly launched container.
![]({{ site.baseurl }}/assets/posts/08a42-1ga7byxemt-joqulwy-zjpq.png)

All the informations
Clicking on **_Stats_** will show you a real-time breakdown of what is happening within your container;
![]({{ site.baseurl }}/assets/posts/66f0f-15dwybnums7-48ysovuwssa.png)

Real time stats
As this is only using the output of the `docker stats` command data is not stored, refreshing the page restart the graphs.

Clicking on **_Logs_** will render the output of `docker logs`;
![]({{ site.baseurl }}/assets/posts/4dbb5-1aosam5gikklwh3mzxuc3og.png)

Log output
Finally, clicking on **_Console_** will open a terminal, first of all, you have to choose which command you would like to enter the terminal with, as you can see from the screen below I choose `/bin/bash`;
![]({{ site.baseurl }}/assets/posts/12750-1_ilndrr7mrsyvsihleytvg.png)

Web based access to your containers shell
Running a container outside of Portainer will isn’t a problem, as we are hooked into the Docker daemon, it will show up within Portainer. For example, running Apache Bench against our NGINX container by running;

    
    docker run --link=webserver russmckendrick/ab ab -k -n 100000 -c 30 <a href="http://webserver/" target="_blank" data-href="http://webserver/">http://webserver/</a>


Will show up as a stopped container in the list of containers;
![]({{ site.baseurl }}/assets/posts/20b8b-1hloeap5oxyaasvy0o4wqiq.png)

You can see stopped containers as well
Clicking on its name and then logs will show you the results of the Apache Bench run;
![]({{ site.baseurl }}/assets/posts/09cb5-1jygelxfjrseh5pdtyxkyeg.png)

Apache Bench results
On thing you may have noticed when we created the NGINX container using the **_App Templates_** is that you didn’t get too much in the way of configurable options.

Portainer has you covered, going to **_Containers_** and then **_Add container_** exposes all of the options you are used to when launching containers from the command line;
![]({{ site.baseurl }}/assets/posts/c29e3-1okxupiq36npcapivcwyp8a.png)

Manually create a container
There are also screens where you can;



 	
  * Pull and manage images

 	
  * Create, manage and inspect networks

 	
  * Create, manage and inspect volumes


and finally you can get an audit trail of everything your Docker daemon has been up to by clicking on **_Events_**;
![]({{ site.baseurl }}/assets/posts/c73de-1y8vlyv7xncgmb6ktbfoylq.png)

The audit log


#### Docker Swarm Mode


Now let’s see what happens when we attach Portainer to a Docker Swarm cluster (running in Swarm mode and not the legacy standalone cluster).

First, we need to launch our Docker hosts; I ran the commands below to start a three node cluster in Digital Ocean using Docker Machine starting with the Swarm master;

    
    docker-machine create 
      --driver digitalocean 
      --digitalocean-access-token your-do-token-goes-here 
      --digitalocean-region lon1 
      --digitalocean-size 1gb 
    swmaster


and then the two nodes;

    
    docker-machine create 
      --driver digitalocean 
      --digitalocean-access-token your-do-token-goes-here 
      --digitalocean-region lon1 
      --digitalocean-size 1gb 
    swnode01



    
    docker-machine create 
      --driver digitalocean 
      --digitalocean-access-token your-do-token-goes-here 
      --digitalocean-region lon1 
      --digitalocean-size 1gb 
    swnode02


Now that our three Docker hosts are online we can quickly configure Swarm by running the following commands. First, initialize cluster by running;

    
    docker $(docker-machine config swmaster) swarm init --advertise-addr $(docker-machine ip swmaster):2377 --listen-addr $(docker-machine ip swmaster):2377


Once the manager has been configured, you will be given a token;
![]({{ site.baseurl }}/assets/posts/7a764-1d37oivomncep3tanbpua4w.png)

Initialize the manager
Make a note of the token as you will need it to run the following commands which join the remaining two Docker hosts to our cluster;

    
    docker $(docker-machine config swnode01) swarm join $(docker-machine ip swmaster):2377 --token SWMTKN-1-3sx2yobftwdk1ed5bywh3tomlhm46gke4kp887w9uzmmgkhgtw-bv9unn94pva98dhrtx0hrkjzb



    
    docker $(docker-machine config swnode02) swarm join $(docker-machine ip swmaster):2377 --token SWMTKN-1-3sx2yobftwdk1ed5bywh3tomlhm46gke4kp887w9uzmmgkhgtw-bv9unn94pva98dhrtx0hrkjzb


![]({{ site.baseurl }}/assets/posts/12191-10ppcntuiviijucz3azcmxw.png)

Adding the two worker nodes
You can check that all three hosts are part of the Swarm cluster by running;

    
    docker $(docker-machine config swmaster) node ls


![]({{ site.baseurl }}/assets/posts/a0f2c-1sedjrtsmuyn1zfueiw4gga.png)

The Swarm cluster is ready
Next, we need to connect our local Portainer installation to our Docker Swarm, to do this we will need the TLS certificates which Docker Machine created, to get these type the following command;

    
    open ~/.docker/machine/certs/


This will open a finder window with the certificates you will need to upload to Portainer;
![]({{ site.baseurl }}/assets/posts/fe75f-1czt2qfz2verd93blf0qk2g.png)

The certs
Now that we have the certificates we need to the IP address of the Docker Swarm Manager, to get this run the following;

    
    echo $(docker-machine ip swmaster)


Return to your Portainer installation and click on **_Endpoints_**, click **_TLS_** and upload your certificates and give the endpoint details as per the screen below;
![]({{ site.baseurl }}/assets/posts/6a02d-11qwvgorl8ctkqrlrfiec_q.png)

Adding the Swarm Endpoint
Once added you should see your newly added endpoint show up in the **_Active Endpoint_** dropdown list, select it and view will change;
![]({{ site.baseurl }}/assets/posts/ff477-1t3d4nrukvpkkkk7zgzh5-q.png)

Portainer Dashboard with Swarm
As you can see, we have a few additional options. You can view information on your cluster by clicking on **_Swarm_**;
![]({{ site.baseurl }}/assets/posts/72100-1dcpipqilht-cr5zgvg7hva.png)

Swarm overview
You can also add launch services by clicking **_Services_**. Before we launch a service we should create a network for our Service to launched into, click on **_Networks_** and then **_Create_** a network, I called mine “_BlogPost_”;
![]({{ site.baseurl }}/assets/posts/21e40-1s4o0l-ovfgks7bfyaropgq.png)

Create a network
Now that we have our overlay network lets launch a service service by clicking on **_Services_** and then **_Add service, _**enter the following;
![]({{ site.baseurl }}/assets/posts/63e5e-1i342zpjchjlpgyyjvpwvhq.png)

Create the Service
I am using an image called [russmckendrick/cluster](https://hub.docker.com/r/russmckendrick/cluster/), all it does is display a Docker logo and the container ID. Also, make sure you select the network you created using the dropdown list on the **_Network_** tab.

Going to the IP address of any of the three Docker hosts in your Swarm cluster in a browser should present you with something which looks like the following page;
![]({{ site.baseurl }}/assets/posts/254fd-1tpgfrcpip7egdstnulzx2w.png)

The Cluster App
Clicking on the **_Name_** of your service will give you all of the information you would get from the command line along with options to scale, update and change the configuration of the service;
![]({{ site.baseurl }}/assets/posts/9a5b8-1upg1ug2htcycpra4gemthg.png)

Viewing information on the service
For example, you can reduce the number of conatiners within the service by clicking on **_Scale_**, reducing the number down to **_1_** and then click**_ Save changes_**;
![]({{ site.baseurl }}/assets/posts/aeccb-1wyo_nmfnlaj-pdoi_begzw.png)

Reduced the number of replicas


#### Teardown


Don’t forget to remove your Docker Swarm nodes once you have finished playing, you can do this by running;

    
    docker-machine rm swmaster swnode01 swnode02


and also remove your Portainer installation by running;

    
    docker stop name_of_your_portainer_conatiner
    docker rm name_of_your_portainer_conatiner




#### Limitations?


Portainer works exactly as avertised on their splash page;
![]({{ site.baseurl }}/assets/posts/de11b-1y5x_o3tdybl548ikre5f-g.png)

The Portainer homepage
It is probably the best UI to the Docker API I have used, and believe me; I have at one point or another used them all.

For managing multiple individual Docker hosts from a central location this probably the best tool out there at the moment. However, as it just talks to the Docker API you do have the same limitations a running Docker on the command line when it comes to a Docker Swarm cluster.

For example, you can only see containers running on your Swarm manager just like you would if you were running `docker ps -a`;
![]({{ site.baseurl }}/assets/posts/a4672-1vbpzx2w61tuzvcv1zxl0hg.png)

Viewing containers on the Docker Swarm manager
It would be nice to see all of the hosts which make up the Swarm cluster auto-discovered and added to a single view, however it makes sense as to why this feature isn’t already there, after all Portainer has not been designed to be a replacement for [Docker Cloud](https://www.docker.com/products/docker-cloud/) or [Rancher](https://media-glass.es/launching-a-local-rancher-cluster-1422b89b0477#.umi8gcl92).

In all, well recommend if you need a UI to manage either your container hosts or a Docker Swarm cluster.


#### Further Reading


Here are some links you may find interesting …



 	
  * Portainer website [http://www.portainer.io](http://www.portainer.io)

 	
  * Portainer on Twitter [https://twitter.com/portainerio](https://twitter.com/portainerio)

 	
  * Portainer on Slack [http://www.portainer.io/slack](http://www.portainer.io/slack/)

 	
  * Portainer on GitHub [https://github.com/portainer](https://github.com/portainer)

 	
  * Portainer Roadmap [https://github.com/portainer/portainer/projects/2](https://github.com/portainer/portainer/projects/2)/


Also this post [**Neil Cresswell**](https://www.reddit.com/user/neilcresswell)** **on Reddit has some background on why Portainer was written;

[https://www.reddit.com/r/docker/comments/5ked5q/portainer_docker_incs_next_acquisition/dbpdmnu/](https://www.reddit.com/r/docker/comments/5ked5q/portainer_docker_incs_next_acquisition/dbpdmnu/)?

Finally, there is also a good overview by [The Containerizers](https://www.youtube.com/channel/UCFkOoM5xXS6hRs1lpw_8ydQ);

[embed]https://www.youtube.com/watch?v=ZrEllmXDiwo[/embed]
