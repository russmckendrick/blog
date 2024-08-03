---
title: "Launching a local Kubernetes lab using Minikube"
description: "Learn to set up a local Kubernetes lab using Minikube for testing or development. Install, configure, and enable additional functionalities."
author: "Russ Mckendrick"
date: 2017-01-01T17:02:25.093Z
lastmod: 2021-07-31T12:34:39+01:00

tags:
 - Docker
 - Kubernetes

cover:
    image: "/img/2017-01-01_launching-a-local-kubernetes-lab-using-minikube_0.png" 
    alt: "Learn to set up a local Kubernetes lab using Minikube for testing or development. Install, configure, and enable additional functionalities."

images:
 - "/img/2017-01-01_launching-a-local-kubernetes-lab-using-minikube_0.png"
 - "/img/2017-01-01_launching-a-local-kubernetes-lab-using-minikube_1.png"
 - "/img/2017-01-01_launching-a-local-kubernetes-lab-using-minikube_2.png"
 - "/img/2017-01-01_launching-a-local-kubernetes-lab-using-minikube_3.png"
 - "/img/2017-01-01_launching-a-local-kubernetes-lab-using-minikube_4.png"
 - "/img/2017-01-01_launching-a-local-kubernetes-lab-using-minikube_5.png"
 - "/img/2017-01-01_launching-a-local-kubernetes-lab-using-minikube_6.png"
 - "/img/2017-01-01_launching-a-local-kubernetes-lab-using-minikube_7.png"
 - "/img/2017-01-01_launching-a-local-kubernetes-lab-using-minikube_8.png"
 - "/img/2017-01-01_launching-a-local-kubernetes-lab-using-minikube_9.png"
 - "/img/2017-01-01_launching-a-local-kubernetes-lab-using-minikube_10.png"


aliases:
- "/launching-a-local-kubernetes-lab-using-minikube-39560f792889"

---

I have more and more people at work asking me about Docker and [Kubernetes](http://kubernetes.io/), so I thought it would be good to write down some instructions on bringing up a small test lab on my laptop.

I had initially assumed that I would have to spend some time configuring a Vagrant box for this, but then I spotted the [Minikube project](https://github.com/kubernetes/minikube).

> Minikube is a tool that makes it easy to run Kubernetes locally. Minikube runs a single-node Kubernetes cluster inside a VM on your laptop for users looking to try out Kubernetes or develop with it day-to-day.

Minikube launches a virtual machine and then can be used to manage the configuration much like the way [Docker Machine](https://docs.docker.com/machine/) does, in fact it uses [libmachine](https://github.com/docker/machine/tree/master/libmachine) which is part of Docker Machine to launch the virtual machine.

I jumped straight into installing it. First of all, using [Homebrew](http://brew.sh/) and [Cask](https://github.com/Homebrew/homebrew-cask/) I installed the requirements which are;

- [kubectl](http://kubernetes.io/docs/user-guide/kubectl-overview/), this allows you control your Kubernetes cluster from the command line
- [virtualbox](http://virtualbox.org/), a way of running VMs on your local machine

I should point out that I did try using try using [docker-machine-driver-xhyve](https://github.com/zchee/docker-machine-driver-xhyve) which is a libmachine driver that enables Docker Machine and libmachine powered applications to use xhyve which is the native macOS hypervisor, while it worked once it then failed to boot again.

Considering I will only be using Minikube to give people a quick overview I decided to stick with VirtualBox as it has worked without any problems.

To install these, I ran the following command;

```
brew install kubectl
brew cask install virtualbox
```

Now the requirements are installed and configured it was time to install Minikube. To install Minikube, I ran the following;

```
brew cask install minikube
```

![text](/img/2017-01-01_launching-a-local-kubernetes-lab-using-minikube_1.png)

Now that minikube was installed I ran the command below to launch my local Kubernetes cluster;

```
minikube start
```

After a minute or two, it returned a message saying “Kubectl is now configured to use the cluster” and that was it, I had my local Kubernetes cluster up and running.

![graphical user interface, text](/img/2017-01-01_launching-a-local-kubernetes-lab-using-minikube_2.png)

To test it ran the following commands to launch two NGINX containers, check that everything is running and then bind the service to a port on the local Kubernetes cluster;

```
kubectl run my-nginx --image=nginx --replicas=2 --port=80
kubectl get pods
kubectl expose deployment my-nginx --type=NodePort
```

![text](/img/2017-01-01_launching-a-local-kubernetes-lab-using-minikube_3.png)

Running the following command opened the exposed service in my browser;

```
open $(minikube service my-nginx --url)
```

![graphical user interface, text, application, email](/img/2017-01-01_launching-a-local-kubernetes-lab-using-minikube_4.png)

To view the [Kubernetes Dashboard](http://kubernetes.io/docs/user-guide/ui/) I ran;

```
minikube dashboard
```

![graphical user interface, text, chat or text message](/img/2017-01-01_launching-a-local-kubernetes-lab-using-minikube_5.png)

Which opened my browser;

![graphical user interface, application](/img/2017-01-01_launching-a-local-kubernetes-lab-using-minikube_6.png)

As minikube uses libmachine I can configure my local docker client to connect to the local Kubernetes cluster in the same way you would with a Docker Machine launched Docker host, I did this by running;

```
eval $(minikube docker-env)
docker ps
```

![graphical user interface, text](/img/2017-01-01_launching-a-local-kubernetes-lab-using-minikube_7.png)

There are options to enable additional functionality, such as [Heapster](https://github.com/kubernetes/heapster). To install and enable Heapster I ran the following command;

```
minikube addons enable heapster
```

To check on the status of the service, I ran the following;

```
kubectl get pods --namespace=kube-system
```

Once the Pod had a status of Running I checked the name of the service by running;

```
minikube service list --namespace=kube-system
```

![graphical user interface, text](/img/2017-01-01_launching-a-local-kubernetes-lab-using-minikube_8.png)

Once I knew the name of the service I ran the command below to open the stats dashboard;

```
open $(minikube service monitoring-grafana --namespace=kube-system  --url)
```

![a screenshot of a computer](/img/2017-01-01_launching-a-local-kubernetes-lab-using-minikube_9.png)

Once I had finished I had the option of either stopping or deleting the local Kubernetes cluster by running on of the following commands;

```
minikube stop
minikube delete
```

As you may notice from the following terminal output there is no warning when deleting the cluster so make sure you do want to delete the local Kubernetes cluster !!!

![graphical user interface, text](/img/2017-01-01_launching-a-local-kubernetes-lab-using-minikube_10.png)

So, what are the drawbacks? Although I have spent the entire post referring to my “local Kubernetes cluster” it is only a single virtual machine, so I won’t be able to demonstrate the scheduler.

Also, as it is running locally, I won’t be able to show off any of the cloud-native load balancing integrations.

Other than that, there is more than enough for me to explain the basic concepts behine Kubernetes.

For more information on Minikube see the following;

- Github project, [https://github.com/kubernetes/minikube](https://github.com/kubernetes/minikube)
- Project Roadmap, [https://minikube.sigs.k8s.io/docs/contrib/roadmap/](https://minikube.sigs.k8s.io/docs/contrib/roadmap/)