---
title: "UIs for Docker, a follow-up post"
description: "Explore UI options for Docker management including Portainer, Docker Datacenter, Shipyard, Rancher, Kubernetes Dashboard, RedHat OpenShift, DC/OS, and AWS ECS."
author: "Russ Mckendrick"
date: "2017-01-15T14:07:10+01:00"
tags:
  - "Docker"
  - "DevOps"
  - "Kubernetes"
cover:
  image: "/img/2017-01-15_uis-for-docker-a-followup-post_0.png"
  alt: "Explore UI options for Docker management including Portainer, Docker Datacenter, Shipyard, Rancher, Kubernetes Dashboard, RedHat OpenShift, DC/OS, and AWS ECS."
lastmod: "2021-07-31T12:34:47+01:00"
aliases:
  - "/uis-for-docker-a-follow-up-post-79a2dacc16fa"
---

Following on from the post I wrote on Portainer;

[Portainer, a UI for Docker](https://media-glass.es/portainer-the-ui-for-docker-d067f6335f23 "https://media-glass.es/portainer-the-ui-for-docker-d067f6335f23")

There was a lot of great feedback, like the following from [Aleksandr Blekh, Ph.D.](https://medium.com/u/5625f8147e92);

> Great post, thank you! Could you briefly clarify why/when one would want to prefer Portainer to Rancher and vice versa. It would be great, if you could also touch on benefits of using Docker UIs versus Kubernetes-based PaaS, specifically OpenShift (which has UI for Docker container management).

So rather than edit the post I thought I would write a follow-up, now this is purely my opinion; also I have missed chunks of the container ecosystem, such as CoreOS based technologies.

### Overview

![diagram](/img/2017-01-15_uis-for-docker-a-followup-post_1.png)

As you can see, at the top we have the Docker Engine which would be running on a single host. You then have your orchestration/scheduler interacting, with typically, several Docker Engines.

- Green; this is a command line tool / interface, we won’t be covering those in this post but it is important to acknowledge them as the web interfaces tend to require a basic working knowledge of these.
- Blue; Web Interface, this is what we are going to be covering in the post.
- Purple; Desktop App, I have included this as it is typically part of peoples journey into using Docker.

### Kitematic (Docker Engine)

Kitematic is a desktop interface for Docker by Docker, it works on macOS and Windows, it assumes you have Docker Engine installed and that it is hooked up to a Docker host;

![graphical user interface, text](/img/2017-01-15_uis-for-docker-a-followup-post_2.png)

As you can see, it has quite a simple interface and is quite intuitive, but basic. For more information, please see [https://kitematic.com/](https://kitematic.com/) or the projects GitHub page;

[docker/kitematic](https://github.com/docker/kitematic "https://github.com/docker/kitematic")

### Docker Datacenter (Docker Swarm)

Docker Datacenter is Dockers own SaaS offering; it allows you to launch Docker hosts either on-prem or in your public cloud account. Once your hosts have been initiated, you can create and manage containers on them using the web interface.

![graphical user interface, application, website](/img/2017-01-15_uis-for-docker-a-followup-post_3.png)

Docker Datacentre is a commercial SaaS offering, for more detail and pricing see the following [https://www.docker.com/products/docker-datacenter/](https://www.docker.com/products/docker-datacenter/).

### Portainer (Docker Engine & Docker Swarm)

I am going to assume you have read my previous post, so I am not going to go into any detail here if you haven’t already then [check it out](https://media-glass.es/portainer-the-ui-for-docker-d067f6335f23#.emde9b4j3).

![graphical user interface](/img/2017-01-15_uis-for-docker-a-followup-post_4.png)

One of the aims of the Portainer project is to have as much coverage of the Docker API as possible. The means that your Portainer installation can not only manage a single Docker host but it can also connect to and deploy containers into your Docker Swarm cluster, assuming you have launched your cluster in Docker Swarm mode (introduced in Docker 1.12).

![graphical user interface, application](/img/2017-01-15_uis-for-docker-a-followup-post_5.png)

However, as portainer is just an interface to the Docker API (for the time being) you can’t bootstrap a Docker host from within the UI like you can with some of the other tools mentioned in this post.

You can find out more about Portainer at [http://www.portainer.io/](http://www.portainer.io/) or the project page;

[portainer/portainer](https://github.com/portainer/portainer "https://github.com/portainer/portainer")

### Shipyard (Docker Swarm)

For those of you running an older Docker Swarm cluster Shipyard wraps your cluster in a nice web-based UI;

![graphical user interface, text, application, email](/img/2017-01-15_uis-for-docker-a-followup-post_6.png)

However, development has seemed to have slowed down, especially since the introduction of Swarm mode. For more information on please see [http://shipyard-project.com/](http://shipyard-project.com/) or the project page;

[shipyard/shipyard](https://github.com/shipyard/shipyard "https://github.com/shipyard/shipyard")

### Rancher (Kubernetes, Mesos & Docker Swarm)

Rancher described themselves as “A complete Platform for Running Containers”, and they are not wrong.

As you may have noticed in the overview, Rancher allows you manage all three main container orchestration tools and schedulers allowing you not only deploy but also manage both Kubernetes and Docker Swarm Clusters;

A recent release has also added support for Mesos Clusters as well;

Rancher takes off all the heavy lifting out of deploying orchestration tools and schedulers by connecting to public API’s of cloud services such as Amazon Web Services, Microsoft Azure, Digital Ocean, Packet as well as offer support to add your on-premise hosts.

Once your cluster has been bootstrapped by Rancher you are presented with an interface where you have options to deploy containers. While the interface adapts depending on the type of cluster being managed it does its best to remain consistent meaning that if you use Rancher with Docker Swarm, then you shouldn’t have any problems switching to Kubernetes or Mesos.

For more information on Rancher see [http://rancher.com/](http://rancher.com/) or the project page at;

[rancher/rancher](https://github.com/rancher/rancher "https://github.com/rancher/rancher")

### Dashboard (Kubernetes)

Dashboard is the Web UI which comes with most Kubernetes by default, it is developed alongside Kubernetes and is a practical web-based implementation of the kubectl command-line client.

![graphical user interface, application](/img/2017-01-15_uis-for-docker-a-followup-post_7.png)

As you can see from the screen above it has been styled using Googles Material Design, and it feels like the control panel which powers Google Cloud.

Google ran a survey to find out what users though of Dashboard at KubeCon 2016, you can see the results here;

[Kubernetes UX Survey Infographic](http://blog.kubernetes.io/2017/01/kubernetes-ux-survey-infographic.html "http://blog.kubernetes.io/2017/01/kubernetes-ux-survey-infographic.html")

For more detail on Dashboard see the project page at;

[kubernetes/dashboard](https://github.com/kubernetes/dashboard "https://github.com/kubernetes/dashboard")

### RedHat OpenShift (Kubernetes)

OpenShift is a little different from the other tools mentioned in this post, it is a combination of web and command line based tools, it is has been designed to be a fully functional PaaS been built on top of Kubernetes 1.3 and Docker 1.10. Rather than go into any detail here have a watch of the following video;

and for a more detailed walkthrough see;

Like all Red Hat products, OpenShift comes as open source and commerically support versions,which is certified and supported. For the enterprise version see;

[OpenShift: PaaS by Red Hat, Built on Docker and Kubernetes](https://www.openshift.com "https://www.openshift.com")

and for the open source version please see;

[OpenShift Origin — Open Source Container Application Platform](https://www.openshift.org "https://www.openshift.org")

### DC/OS (Mesos)

On the face of it DC/OS is similar to Kubernetes in that it is a scheduler/orchestration tool as opposed to a management tool for Docker;

> DC/OS is based on the production proven Apache Mesos distributed systems kernel, combining years of real-life experience with best practices for building and running modern applications in production.

You will notice that the description doesn’t mention conatiners, though it does talk about distributed systems. The container managment isn’t actually handled by DC/OS or Mesos, Marathon is deployed as part of an initial DC/OS installation.

[Marathon: A container orchestration platform for Mesos and DC/OS](https://github.com/mesosphere "https://github.com/mesosphere")

This video gives a better overview than I ever can;

and this is what it looks like;

![graphical user interface](/img/2017-01-15_uis-for-docker-a-followup-post_8.jpeg)

For more information on DC/OS please see;

[The Definitive Platform for Modern Apps | DC/OS](https://dcos.io "https://dcos.io")

### Amazon Console (ECS)

Personally, I am not a fan of Amazon ECS, it feels to me like alot of other tools have pulled ahead of it in terms of ease of use and features. As you can see from the description below;

> Amazon EC2 Container Service (ECS) is a highly scalable, high performance [container](https://aws.amazon.com/containers/) management service that supports [Docker](https://aws.amazon.com/docker/) containers and allows you to easily run applications on a managed cluster of Amazon EC2 instances. Amazon ECS eliminates the need for you to install, operate, and scale your own cluster management infrastructure. With simple API calls, you can launch and stop Docker-enabled applications, query the complete state of your cluster, and access many familiar features like security groups, Elastic Load Balancing, EBS volumes, and IAM roles. You can use Amazon ECS to schedule the placement of containers across your cluster based on your resource needs and availability requirements.

Its strength lies in working with other AWS services where it seamlessly works alongside them in the excellent AWS API. The version availabile through the Amazon Console will feel instantly familiar to AWS users;

![graphical user interface, website](/img/2017-01-15_uis-for-docker-a-followup-post_9.png)

But as mentioned, it is starting to feel a little clunky. For more information on Amazon ECS please see;

[Amazon EC2 Container Service - Docker Management - AWS](https://aws.amazon.com/ecs/ "https://aws.amazon.com/ecs/")

### Summary

While these are all interfaces to Docker, however, as you can see from the picture below some of the UIs have an entire orchestration/scheduler stack to work through before reaching Docker so comparing them isn’t going to be an exact science

![graphical user interface, website](/img/2017-01-15_uis-for-docker-a-followup-post_10.png)

My personal recommendations would be …

- I want an easy to use interface for a Docker host - **Portainer**
- I want an easy to use interface for an existing Docker Swarm Cluster - **Portainer**
- I want to use Kubernetes - **Dashboard** & **kubectl**
- I want to use Mesos - **DC/OS** & **DC/OS Cli**
- I want an easy to use interface to launch and bootstrap my “xyz” cluster - **Rancher**
- I want a full on PaaS - **Red Hat OpenShift**
- I want to use AWS ECS - use the **AWS Cli**
