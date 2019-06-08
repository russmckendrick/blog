---
author: russmckendrick
comments: true
date: 2018-01-06 16:22:39+00:00
layout: post
link: http://mediaglasses.blog/2018/01/06/docker-kubernetes/
slug: docker-kubernetes
title: Docker + Kubernetes
wordpress_id: 998
categories:
- Tech
tags:
- Containers
- Docker
- Docker For Mac
- Kubernetes
- Mac
---

This morning, like a lot of the Docker community, I receieved an email I had been waiting for since November, confirmation that Kubernetes on Docker for Mac had made its way through to a public edge release.
![]({{ baseurl }}/assets/posts/ce39a-1ho6tjwifr2p0nk8yjlolkw.png)I also won£2.84 on last nights Euro Millions :)
The version of Docker I was running was on the stable channel;
![]({{ baseurl }}/assets/posts/f4eae-1m1nieu6lrbx1ws1b5bwcaq.png)

Docker for Mac version 17.09.1-ce-mac42 (21090)
The first thing I did was open up the preferences;
![]({{ baseurl }}/assets/posts/df002-19tjag3rvc2iq_s3u7q8eug.png)

The Docker for Mac Preferences pane
and used the [switch to edge link](https://docs.docker.com/docker-for-mac/install/) in there to go straight to the Docker for Mac download page;
![]({{ baseurl }}/assets/posts/c1631-1yuhkm9bcz5knuhztv2tu9q.png)

Downloading Docker for Mac from docs.docker.com
Once there, I clicked on the **Get Docker for Mac (Edge)** button which went onto download the latest disk image, once downloaded I double clicked it and was presented with the drag & drop installer;
![]({{ baseurl }}/assets/posts/f95c8-1rmv2ssygb2vmpg_0wfouug.png)

The Drag and Drop Docker for Mac installation
I quit Docker, and dragged the Docker application to my Applications folder. Once it had copied across I reopened Docker which gave me the following warning;
![]({{ baseurl }}/assets/posts/2f39e-1rpkfbk3olsrvaceywfih_g.png)

Its going to trash everything !!!
I was fine with that, so clicked on **Reset and Restart**, to be able to do this Docker needed my password;
![]({{ baseurl }}/assets/posts/90a37-1chtsouatctbh2b3z4z4miq.png)

This is your last chance to change your mind about everything getting trashed
After a few minutes, Docker for Mac started up, the first thing I did was open the About Docker window to confirm the version;
![]({{ baseurl }}/assets/posts/fd812-1i0ictnrqo2rksty3vuvv6q.png)

Docker for Mac version 12.12.0-ce-mac45 (21669)
As you can see, this window now shows the version numbers of all of the Docker components installed and available. What we are insterested in is Kubernetes v.1.8.2. I also checked the version on the command line using the Docker client ;

    
    $ docker version
    $ docker-compose version
    $ docker-machine version


![]({{ baseurl }}/assets/posts/69f4e-1b8thdqlom6ychrkvcxd_7w.png)

Checking all the versions
As you can see from the results above, everything matched. So lets take a look at Kubernetes, which by default is disabled.

To enable Kubernetes open the preferences and click on the Kubernetes icon;
![]({{ baseurl }}/assets/posts/3cd16-1fkktnfjnmrofsqp0jo5yeg.png)

Enabling Kubernetes
Once in there tick **Enable Kubernetes** and then click on the **Apply** button;
![]({{ baseurl }}/assets/posts/023c0-16hcexbhk2w8-w2tns0tx8q.png)

It will take a few minutes
This will present you with a message informing you that Docker will need a few minutes to install and configure the cluster, as well as an internet connection so it can download the compoents.
![]({{ baseurl }}/assets/posts/475c9-1qlls6diufz_9tssvomn_rw.png)

Waiting around …
After a few minutes you should see the following message;
![]({{ baseurl }}/assets/posts/ec627-1uftuvuuzmksqdysmhin8ow.png)

All done
Docker for Mac also installs the Kubernetes command line client, _kubectl_, you can check this is installed by running;

    
    $ kubectl version


![]({{ baseurl }}/assets/posts/9c5f8-1awlfh9oizqnqoovlmppymg.png)

kubectl version
Running the following command will give you information about the nodes running in your Kubernetes cluster, we should see just the one;

    
    $ kubectl get nodes


![]({{ baseurl }}/assets/posts/9a841-1zlugcmmjbf8k1awzh9nfxw.png)

Getting a list of cluster nodes
Now that we have a single node cluster up and running lets dig a little deeper into how Docker have done their deployment. You may remember in the Kubernetes preferences pane there is an option which allows you to **Show system containers**, tick this and click **Apply**;
![]({{ baseurl }}/assets/posts/b378d-14lcrcohzmgvb4_pdmdk7ja.png)

Enable Show system containers
Running the following command will list of the running containers, but only show the container name, image used and the command which was executed;

    
    $ docker container ls --format "table{{.Names}}t{{.Image }}t{{.Command}}"


You can see the results below;
![]({{ baseurl }}/assets/posts/ed611-1cselvaop5_pf3-hxzunvnq.png)

List of the containers which go to make up the Docker for Mac Kubernetes cluster
One thing to note is that only one of the container images is from Docker themselves, the rest are from Google. You can find out more information on how these images are built at the following page;

[embed]https://github.com/kubernetes/kubernetes/tree/master/build[/embed]

We can find out a little more on the installation itself by running the following commands;

    
    $ kubectl get namespaces
    $ kubectl get pods --namespace kube-system


As you can see from the terminal output below, this lists all of the pods which containers below belong to;
![]({{ baseurl }}/assets/posts/475b1-15lb4k43nixycixeh07jrdq.png)

The default namespaces and pods
The one service which is missing is the Kubernetes Dashboard, this would be a good excuse to install it.

Installing the Dashboard is quite a simple task, running the following command will deploy it your Kubernetes cluster;

    
    $ kubectl create -f <a href="https://raw.githubusercontent.com/kubernetes/dashboard/master/src/deploy/recommended/kubernetes-dashboard.yaml" target="_blank" data-href="https://raw.githubusercontent.com/kubernetes/dashboard/master/src/deploy/recommended/kubernetes-dashboard.yaml">https://raw.githubusercontent.com/kubernetes/dashboard/master/src/deploy/recommended/kubernetes-dashboard.yaml</a>


After a minute or two you should be able to run the following commands to view the deployments and services running in the **kube-system** namespace;

    
    $ kubectl get deployments --namespace kube-system
    $ kubectl get services --namespace kube-system


![]({{ baseurl }}/assets/posts/046d1-1-idbrjnbby0jqonex_iiig.png)

As you can see, the dashboard is running
Now that the Dashboard is running you can access it through the proxy service provided by _kubectl_, to start this service simply run;

    
    $ kubectl proxy


![]({{ baseurl }}/assets/posts/424b0-1-hgvrikxg9mvfoiqhtwjpg.png)

Starting up the Kubernetes proxy service with kubectl
Once the proxy has started open the following URL in your browser;

[http://localhost:8001/api/v1/namespaces/kube-system/services/https:kubernetes-dashboard:/proxy/](http://localhost:8001/api/v1/namespaces/kube-system/services/https:kubernetes-dashboard:/proxy/)

This should show you a login page;
![]({{ baseurl }}/assets/posts/fa6d6-121rou0ndbq_qidsxbok4la.png)

The Kubernetes Dashboard login page
As we are connected via the proxy we do not need to sign in using either Kubeconfig or with a Token, so just press **Skip**, this will take you straight to the Dashboard;
![]({{ baseurl }}/assets/posts/ed879-1tag3sea6izadp6vqvjy47w.png)

The Overview Page
![]({{ baseurl }}/assets/posts/2825b-17tms5d4lijrqoid8wiiqpw.png)

The Cluster Nodes
Docker also provide an example application, lets take a look at deploying it.

The Docker Compose file, yes you read that right we are going be using Docker Compose, looks like the following;

[https://gist.github.com/russmckendrick/bc16ba1af9247f6cb8db8bc6e35a98bb](https://gist.github.com/russmckendrick/bc16ba1af9247f6cb8db8bc6e35a98bb)

Running the following command;

    
    $ docker stack deploy --compose-file stack.yml demo


Will launch a demo application which was origininally used during European DockerCon 17.
![]({{ baseurl }}/assets/posts/009d0-1ogw3zu60lwukgde3kylz_a.png)

Launching the demo stack
Once the stack is stable and running you can check run;

    
    $ kubectl get pods


![]({{ baseurl }}/assets/posts/ad30f-1k3gfaxvq2csyfvfegx0bpw.png)
As you can see, this has launched several pods, we can also check the deployment and services by running;

    
    $ kubectl get deployments
    $ kubectl get services


![]({{ baseurl }}/assets/posts/57219-1fnp0i_cpjwnbds5h4rmixg.png)
As you see, the web service has a type of **LoadBalancer**, while the Exteral-IP address is shown as <pending> you should be able to open your browser and go to [http://localhost/](http://localhost/) where you should be able to see the demo application;
![]({{ baseurl }}/assets/posts/3cf07-1ddimylajd_oaerris-4naw.png)

Try refreshing the screen a few times
Running the following command will stop and remove the example service;

    
    $ docker stack remove demo


If you want to remove the Kubernetes Dashboard you can run;

    
    $ kubectl delete deployment kubernetes-dashboard --namespace kube-system


As you can see, Kubernetes on Docker for Mac is quite straight forward, and so far I have to say I much prefer it to running [Minikube](https://media-glass.es/launching-a-local-kubernetes-lab-using-minikube-39560f792889), having everything all in a single place really makes things straight foward.

[https://gph.is/1c614EN](https://gph.is/1c614EN)
