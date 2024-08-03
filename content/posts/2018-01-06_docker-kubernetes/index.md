---
title: "Docker + Kubernetes"
description: "Discover Docker and Kubernetes integration on Mac, enabling easy deployment and management of containerized applications."
author: "Russ Mckendrick"
date: 2018-01-06T16:22:39.751Z
lastmod: 2021-07-31T12:35:02+01:00

tags:
 - Docker
 - Kubernetes
 - macOS

cover:
    image: "/img/2018-01-06_docker-kubernetes_0.png" 
    alt: "Discover Docker and Kubernetes integration on Mac, enabling easy deployment and management of containerized applications."

images:
 - "/img/2018-01-06_docker-kubernetes_0.png"
 - "/img/2018-01-06_docker-kubernetes_1.png"
 - "/img/2018-01-06_docker-kubernetes_2.png"
 - "/img/2018-01-06_docker-kubernetes_3.png"
 - "/img/2018-01-06_docker-kubernetes_4.png"
 - "/img/2018-01-06_docker-kubernetes_5.png"
 - "/img/2018-01-06_docker-kubernetes_6.png"
 - "/img/2018-01-06_docker-kubernetes_7.png"
 - "/img/2018-01-06_docker-kubernetes_8.png"
 - "/img/2018-01-06_docker-kubernetes_9.png"
 - "/img/2018-01-06_docker-kubernetes_10.png"
 - "/img/2018-01-06_docker-kubernetes_11.png"
 - "/img/2018-01-06_docker-kubernetes_12.png"
 - "/img/2018-01-06_docker-kubernetes_13.png"
 - "/img/2018-01-06_docker-kubernetes_14.png"
 - "/img/2018-01-06_docker-kubernetes_15.png"
 - "/img/2018-01-06_docker-kubernetes_16.png"
 - "/img/2018-01-06_docker-kubernetes_17.png"
 - "/img/2018-01-06_docker-kubernetes_18.png"
 - "/img/2018-01-06_docker-kubernetes_19.png"
 - "/img/2018-01-06_docker-kubernetes_20.png"
 - "/img/2018-01-06_docker-kubernetes_21.png"
 - "/img/2018-01-06_docker-kubernetes_22.png"
 - "/img/2018-01-06_docker-kubernetes_23.png"
 - "/img/2018-01-06_docker-kubernetes_24.png"
 - "/img/2018-01-06_docker-kubernetes_25.png"
 - "/img/2018-01-06_docker-kubernetes_26.png"
 - "/img/2018-01-06_docker-kubernetes_27.png"


aliases:
- "/docker-and-kubernetes-40ab7d01909f"

---

This morning, like a lot of the Docker community, I receieved an email I had been waiting for since November, confirmation that Kubernetes on Docker for Mac had made its way through to a public edge release.

![text](/img/2018-01-06_docker-kubernetes_1.png)

The version of Docker I was running was on the stable channel;

![graphical user interface, text, application](/img/2018-01-06_docker-kubernetes_2.png)

The first thing I did was open up the preferences;

![graphical user interface, text, application, email](/img/2018-01-06_docker-kubernetes_3.png)

and used the [switch to edge link](https://docs.docker.com/docker-for-mac/install/) in there to go straight to the Docker for Mac download page;

![graphical user interface, text, application, email, website](/img/2018-01-06_docker-kubernetes_4.png)

Once there, I clicked on the **Get Docker for Mac (Edge)** button which went onto download the latest disk image, once downloaded I double clicked it and was presented with the drag & drop installer;

![text, website](/img/2018-01-06_docker-kubernetes_5.png)

I quit Docker, and dragged the Docker application to my Applications folder. Once it had copied across I reopened Docker which gave me the following warning;

![graphical user interface, text, application](/img/2018-01-06_docker-kubernetes_6.png)

I was fine with that, so clicked on **Reset and Restart**, to be able to do this Docker needed my password;

![graphical user interface, text, application](/img/2018-01-06_docker-kubernetes_7.png)

After a few minutes, Docker for Mac started up, the first thing I did was open the About Docker window to confirm the version;

![graphical user interface, application](/img/2018-01-06_docker-kubernetes_8.png)

As you can see, this window now shows the version numbers of all of the Docker components installed and available. What we are insterested in is Kubernetes v.1.8.2. I also checked the version on the command line using the Docker client ;

```
$ docker version
$ docker-compose version
$ docker-machine version
```

![text](/img/2018-01-06_docker-kubernetes_9.png)

As you can see from the results above, everything matched. So lets take a look at Kubernetes, which by default is disabled.

To enable Kubernetes open the preferences and click on the Kubernetes icon;

![graphical user interface, text, application, email](/img/2018-01-06_docker-kubernetes_10.png)

Once in there tick **Enable Kubernetes** and then click on the **Apply** button;

![graphical user interface, text, application](/img/2018-01-06_docker-kubernetes_11.png)

This will present you with a message informing you that Docker will need a few minutes to install and configure the cluster, as well as an internet connection so it can download the compoents.

![graphical user interface, text, application](/img/2018-01-06_docker-kubernetes_12.png)

After a few minutes you should see the following message;

![graphical user interface, text, application](/img/2018-01-06_docker-kubernetes_13.png)

Docker for Mac also installs the Kubernetes command line client, kubectl, you can check this is installed by running;

```
$ kubectl version
```

![text](/img/2018-01-06_docker-kubernetes_14.png)

Running the following command will give you information about the nodes running in your Kubernetes cluster, we should see just the one;

```
$ kubectl get nodes
```

![graphical user interface, text, application, chat or text message](/img/2018-01-06_docker-kubernetes_15.png)

Now that we have a single node cluster up and running lets dig a little deeper into how Docker have done their deployment. You may remember in the Kubernetes preferences pane there is an option which allows you to **Show system containers**, tick this and click **Apply**;

![graphical user interface, text, application](/img/2018-01-06_docker-kubernetes_16.png)

Running the following command will list of the running containers, but only show the container name, image used and the command which was executed;

```
$ docker container ls --format "table{{.Names}}\t{{.Image }}\t{{.Command}}"
```

You can see the results below;

![text](/img/2018-01-06_docker-kubernetes_17.png)

One thing to note is that only one of the container images is from Docker themselves, the rest are from Google. You can find out more information on how these images are built at the following page;

[kubernetes/kubernetes](https://github.com/kubernetes/kubernetes/tree/master/build "https://github.com/kubernetes/kubernetes/tree/master/build")

We can find out a little more on the installation itself by running the following commands;

```
$ kubectl get namespaces
$ kubectl get pods --namespace kube-system
```

As you can see from the terminal output below, this lists all of the pods which containers below belong to;

![text](/img/2018-01-06_docker-kubernetes_18.png)

The one service which is missing is the Kubernetes Dashboard, this would be a good excuse to install it.

Installing the Dashboard is quite a simple task, running the following command will deploy it your Kubernetes cluster;

```
$ kubectl create -f https://raw.githubusercontent.com/kubernetes/dashboard/master/src/deploy/recommended/kubernetes-dashboard.yaml
```

After a minute or two you should be able to run the following commands to view the deployments and services running in the **kube-system** namespace;

```
$ kubectl get deployments --namespace kube-system
$ kubectl get services --namespace kube-system
```

![text](/img/2018-01-06_docker-kubernetes_19.png)

Now that the Dashboard is running you can access it through the proxy service provided by kubectl, to start this service simply run;

```
$ kubectl proxy
```

![text](/img/2018-01-06_docker-kubernetes_20.png)

Once the proxy has started open the following URL in your browser;

[http://localhost:8001/api/v1/namespaces/kube-system/services/https:kubernetes-dashboard:/proxy/](http://localhost:8001/api/v1/namespaces/kube-system/services/https:kubernetes-dashboard:/proxy/)

This should show you a login page;

![graphical user interface, text, application, email](/img/2018-01-06_docker-kubernetes_21.png)

As we are connected via the proxy we do not need to sign in using either Kubeconfig or with a Token, so just press **Skip**, this will take you straight to the Dashboard;

![graphical user interface](/img/2018-01-06_docker-kubernetes_22.png)![graphical user interface](/img/2018-01-06_docker-kubernetes_23.png)

Docker also provide an example application, lets take a look at deploying it.

The Docker Compose file, yes you read that right we are going be using Docker Compose, looks like the following;

```
version: '3.3'

services:
  web:
    build: web
    cover:
    image: dockerdemos/lab-web
    volumes:
     - "./web/static:/static"
    ports:
     - "80:80"

  words:
    build: words
    cover:
    image: dockerdemos/lab-words
    deploy:
      replicas: 5
      endpoint_mode: dnsrr
      resources:
        limits:
          memory: 16M
        reservations:
          memory: 16M

  db:
    build: db
    cover:
    image: dockerdemos/lab-db
```

Running the following command;

```
$ docker stack deploy --compose-file stack.yml demo
```

Will launch a demo application which was origininally used during European DockerCon 17.

![text](/img/2018-01-06_docker-kubernetes_24.png)

Once the stack is stable and running you can check run;

```
$ kubectl get pods
```

![a screenshot of a computer](/img/2018-01-06_docker-kubernetes_25.png)

As you can see, this has launched several pods, we can also check the deployment and services by running;

```
$ kubectl get deployments
$ kubectl get services
```

![text](/img/2018-01-06_docker-kubernetes_26.png)

As you see, the web service has a type of **LoadBalancer**, while the Exteral-IP address is shown as <pending> you should be able to open your browser and go to [http://localhost/](http://localhost/) where you should be able to see the demo application;

![graphical user interface](/img/2018-01-06_docker-kubernetes_27.png)

Running the following command will stop and remove the example service;

```
$ docker stack remove demo
```

If you want to remove the Kubernetes Dashboard you can run;

```
$ kubectl delete deployment kubernetes-dashboard --namespace kube-system
```

As you can see, Kubernetes on Docker for Mac is quite straight forward, and so far I have to say I much prefer it to running [Minikube](https://media-glass.es/launching-a-local-kubernetes-lab-using-minikube-39560f792889), having everything all in a single place really makes things straight foward.