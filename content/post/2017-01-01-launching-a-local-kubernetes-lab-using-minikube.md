---
author: Russ McKendrick
comments: true
date: 2017-01-01 17:02:25+00:00
image: assets/posts/808a9-16xv05yyuqb_wrzj-mqgsda.png
title: Launching a local Kubernetes lab using Minikube
categories:
    - Tech
tags:
    - Docker
    - Kubernetes
    - Lab
    - Minikube
---

I have more and more people at work asking me about Docker and [Kubernetes](http://kubernetes.io/), so I thought it would be good to write down some instructions on bringing up a small test lab on my laptop.

I had initially assumed that I would have to spend some time configuring a Vagrant box for this, but then I spotted the [Minikube project](https://github.com/kubernetes/minikube).


<blockquote>Minikube is a tool that makes it easy to run Kubernetes locally. Minikube runs a single-node Kubernetes cluster inside a VM on your laptop for users looking to try out Kubernetes or develop with it day-to-day.</blockquote>


Minikube launches a virtual machine and then can be used to manage the configuration much like the way [Docker Machine](https://docs.docker.com/machine/) does, in fact it uses [libmachine](https://github.com/docker/machine/tree/master/libmachine) which is part of Docker Machine to launch the virtual machine.

I jumped straight into installing it. First of all, using [Homebrew](http://brew.sh/) and [Cask](https://caskroom.github.io/) I installed the requirements which are;



 	
  * 
[kubectl](http://kubernetes.io/docs/user-guide/kubectl-overview/), this allows you control your Kubernetes cluster from the command line

 	
  * 
[virtualbox](http://virtualbox.org/), a way of running VMs on your local machine


I should point out that I did try using try using [docker-machine-driver-xhyve](https://github.com/zchee/docker-machine-driver-xhyve) which is a libmachine driver that enables Docker Machine and libmachine powered applications to use xhyve which is the native macOS hypervisor, while it worked once it then failed to boot again.

Considering I will only be using Minikube to give people a quick overview I decided to stick with VirtualBox as it has worked without any problems.

To install these, I ran the following command;

    
    brew install kubectl
    brew cask install virtualbox


Now the requirements are installed and configured it was time to install Minikube. To install Minikube, I ran the following;

    
    brew cask install minikube


![](/assets/posts/082ae-1d49mtvz_wsqwb_iibbuqya.png)Such download, much install
Now that minikube was installed I ran the command below to launch my local Kubernetes cluster;

    
    minikube start


After a minute or two, it returned a message saying _“Kubectl is now configured to use the cluster”_ and that was it, I had my local Kubernetes cluster up and running.
![](/assets/posts/addc1-1row37aijczxxemprnqov9a.png)

That was easy
To test it ran the following commands to launch two NGINX containers, check that everything is running and then bind the service to a port on the local Kubernetes cluster;

    
    kubectl run my-nginx --image=nginx --replicas=2 --port=80
    kubectl get pods
    kubectl expose deployment my-nginx --type=NodePort


![](/assets/posts/c59c4-1f8qg-rfzqnioiwqiab1etw.png)

Testing my installation
Running the following command opened the exposed service in my browser;

    
    open $(minikube service my-nginx --url)


![](/assets/posts/2dbcb-1mtzw59cxrlhmfpdflstk7a.png)

It works !!!
To view the [Kubernetes Dashboard](http://kubernetes.io/docs/user-guide/ui/) I ran;

    
    minikube dashboard


![](/assets/posts/7858d-1yaureemqho9rthziunzjya.png)

Opening the dashboard
Which opened my browser;
![](/assets/posts/530e2-1oophjs_hp6mnlxsvvhwzyw.png)

The Kubernetes Dashboard with all of its material glory
As minikube uses libmachine I can configure my local docker client to connect to the local Kubernetes cluster in the same way you would with a Docker Machine launched Docker host, I did this by running;

    
    eval $(minikube docker-env)
    docker ps


![](/assets/posts/62593-1u9ue7y4ot2ebahp32qnx9q.png)

Its so wide !!!
There are options to enable additional functionality, such as [Heapster](https://github.com/kubernetes/heapster). To install and enable Heapster I ran the following command;

    
    minikube addons enable heapster


To check on the status of the service, I ran the following;

    
    kubectl get pods --namespace=kube-system


Once the Pod had a status of _Running_ I checked the name of the service by running;

    
    minikube service list --namespace=kube-system


![](/assets/posts/dbd5b-1wajh2bbrs15u_-etxdhz4g.png)

Enabling Heapster and opening the dashboard
Once I knew the name of the service I ran the command below to open the stats dashboard;

    
    open $(minikube service monitoring-grafana --namespace=kube-system  --url)


![](/assets/posts/2d2a4-1n-7wtxb2itpyqgie2kycha.png)

Heapster uses [Grafana](http://grafana.org/) to visualise its data
Once I had finished I had the option of either stopping or deleting the local Kubernetes cluster by running on of the following commands;

    
    minikube stop
    minikube delete


As you may notice from the following terminal output there is no warning when deleting the cluster so make sure you do want to delete the local Kubernetes cluster !!!
![](/assets/posts/9983b-10vcrodifkv0bxb0tr0cylw.png)

Would be nice get a prompt here
So, what are the drawbacks? Although I have spent the entire post referring to my “local Kubernetes cluster” it is only a single virtual machine, so I won’t be able to demonstrate the scheduler.

Also, as it is running locally, I won’t be able to show off any of the cloud-native load balancing integrations.

Other than that, there is more than enough for me to explain the basic concepts behine Kubernetes.

For more information on Minikube see the following;



 	
  * Github project, [https://github.com/kubernetes/minikube](https://github.com/kubernetes/minikube)

 	
  * Project Roadmap, [https://github.com/kubernetes/minikube/blob/master/ROADMAP.md](https://github.com/kubernetes/minikube/blob/master/ROADMAP.md)


