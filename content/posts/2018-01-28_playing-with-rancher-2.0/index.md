---
title: "Playing with Rancher 2.0"
description: "Join Russ Mckendrick in exploring Rancher 2.0 for Kubernetes orchestration. Follow his journey as he tests out the preview version, uncovering its features and limitations."
author: "Russ Mckendrick"
date: 2018-01-28T12:52:26.760Z
lastmod: 2021-07-31T12:35:08+01:00
cover:
    image: "/img/2018-01-28_playing-with-rancher-2.0_0.png" 
images:
 - "/img/2018-01-28_playing-with-rancher-2.0_0.png"
 - "/img/2018-01-28_playing-with-rancher-2.0_1.png"
 - "/img/2018-01-28_playing-with-rancher-2.0_2.png"
 - "/img/2018-01-28_playing-with-rancher-2.0_3.png"
 - "/img/2018-01-28_playing-with-rancher-2.0_4.png"
 - "/img/2018-01-28_playing-with-rancher-2.0_5.png"
 - "/img/2018-01-28_playing-with-rancher-2.0_6.png"
 - "/img/2018-01-28_playing-with-rancher-2.0_7.png"
 - "/img/2018-01-28_playing-with-rancher-2.0_8.gif"
 - "/img/2018-01-28_playing-with-rancher-2.0_9.png"
 - "/img/2018-01-28_playing-with-rancher-2.0_10.png"
 - "/img/2018-01-28_playing-with-rancher-2.0_11.png"
 - "/img/2018-01-28_playing-with-rancher-2.0_12.png"
 - "/img/2018-01-28_playing-with-rancher-2.0_13.png"
 - "/img/2018-01-28_playing-with-rancher-2.0_14.png"
 - "/img/2018-01-28_playing-with-rancher-2.0_15.png"
 - "/img/2018-01-28_playing-with-rancher-2.0_16.png"
 - "/img/2018-01-28_playing-with-rancher-2.0_17.png"
 - "/img/2018-01-28_playing-with-rancher-2.0_18.png"
 - "/img/2018-01-28_playing-with-rancher-2.0_19.png"
 - "/img/2018-01-28_playing-with-rancher-2.0_20.png"
aliases:
- "/playing-with-rancher-2-0-58830337acfd"
tags:
    - Kubernetes
    - Cloud

---

As I had some free time this weekend so I thought it would be good to have a play with the recently released preview of Rancher 2.0.

**Please do not follow along with this post, you will see why towards the end !!!**

![](/img/2018-01-28_playing-with-rancher-2.0_1.png)

When I last wrote about [Rancher, is was back in June 2016](https://media-glass.es/launching-a-local-rancher-cluster-1422b89b0477), in that post I launched Rancher locally and used it target a few VirtualBox VMs. Rather than Virtual Box VMs I am going to use a cloud service, but I am going to be running it locally again, to do this launch the container I ran the following command;

```
$ docker container run -d \
    --restart=unless-stopped \
    -p 8080:80 \
    -p 8443:443 \
    rancher/server:preview
```

![](/img/2018-01-28_playing-with-rancher-2.0_2.png)

I checked that the container was up and running by running;

```
$ docker container ls
```

![](/img/2018-01-28_playing-with-rancher-2.0_3.png)

Then entered opened my browswer and went to [https://localhost:8443/](https://localhost:8443/), after the usual certificate warnings I was greeted by a login screen;

![](/img/2018-01-28_playing-with-rancher-2.0_4.png)

The default username and password for Rancher is simply **admin**, once you login you will be asked to change the password to something, hopefully, which is a lot more secure;

![](/img/2018-01-28_playing-with-rancher-2.0_5.png)

Once logged in, you should be greeting by a page which looks like the one below, as you can see, we have nothing to show yet;

![](/img/2018-01-28_playing-with-rancher-2.0_6.png)

So now we need a cluster, clicking on **Add Cluster** will present three options.

- Create a Cloud Cluster
- Create a RKE Cluster
- Import an Existing Cluster

![](/img/2018-01-28_playing-with-rancher-2.0_7.png)

I am going to use the first of these options offers you an interface to launch a Kubernetes cluster by using the native Kubernetes tools in the big three public cloud providers. Well, sort of, at the time of writting only [Google Container Engine](https://cloud.google.com/kubernetes-engine/) is supported, suport for [Amazon EKS](https://aws.amazon.com/eks/) and [Azure Container Service](https://azure.microsoft.com/en-gb/services/container-service/) is “coming soon” and you are treated the following gif …

![](/img/2018-01-28_playing-with-rancher-2.0_8.gif)

So I guess that means I will launching my cluster using Google’s Container Engine. To do this I needed to create a service account by follwing the on-screen instructions;

![](/img/2018-01-28_playing-with-rancher-2.0_9.png)

More information on createing a service account can be found in the [docs](https://cloud.google.com/compute/docs/access/create-enable-service-accounts-for-instances).

Once I had the service account JSON file I entered into the space provided and clicked on Next;

![](/img/2018-01-28_playing-with-rancher-2.0_10.png)

I enter the **Name** of my cluster as lab and kept the rest options at their defaults, meaning that Rancher would launch a three node n1-standard-1 (1 vCPU, 3.75GB RAM 100GB HDD) cluster in us-central1-f.

![](/img/2018-01-28_playing-with-rancher-2.0_11.png)

You can double check the Google Clound Console to see the status of your cluster, as you can see from the screen below the lab was launching;

![](/img/2018-01-28_playing-with-rancher-2.0_12.png)

After a few minutes the cluster showed as Active in Rancher;

![](/img/2018-01-28_playing-with-rancher-2.0_13.png)

Clicking on Nodes in the top menu showed me my three nodes;

![](/img/2018-01-28_playing-with-rancher-2.0_14.png)

Now that I had my three node cluster regisgered with Rancher I could start to use it, to do this I Clicked on Global in the top right and selected the C**luster:lab**, this took me to the overview page;

![](/img/2018-01-28_playing-with-rancher-2.0_15.png)

Clicking **Namespaces** showed me the namespaces I would expect to see in a newly launched Kubernetes cluster;

![](/img/2018-01-28_playing-with-rancher-2.0_16.png)

Clicking **Nodes**, and then on one of the three nodes gave quite a detailed overview of the selected node;

![](/img/2018-01-28_playing-with-rancher-2.0_17.png)

Now I had poked around the cluster, it was time to launch something, Rancher is known as having quite an extensive catalogue of applications, both Rancher approved and also comminutiy currated ones.

To launch an application I needed to select an application, as I was just messing about I decided to use the Default project which was created as part on the initial Rancher installation on the cluster;

![](/img/2018-01-28_playing-with-rancher-2.0_18.png)

Clicked on **Default** took me to the projects dashboard, as you can see from the screen below, there was a warning that this area of the software was still being worked on;

![](/img/2018-01-28_playing-with-rancher-2.0_19.png)

This is kind of where my journey with Rancher 2.0 fell apart, I wasn’t able to do much with it from here, now I am not certain if this was because I had launched my Rancher machine locally using Docker for Mac or if that was all, after all it is labelled as an Alpha version.

To test this, I launched a droplet in DigitalOcean using `doctl`;

```
$ doctl compute droplet create rancher \
    --region lon1 \
    --image ubuntu-17-10-x64 \
    --size 1gb
```

Checked that the droplet had launched by running;

```
$ doctl compute droplet list
```

Then SSH’ed to the droplet by running;

```
$ doctl compute ssh rancher
```

Once I was on the droplet I installed Docker using the following commands;

```
$ curl -fsSL get.docker.com -o get-docker.sh
$ sh get-docker.sh
```

Then launched the Rancher 2.0 container by running;

```
$ docker container run -d \
    --restart=unless-stopped \
    -p 80:80 \
    -p 443:443 \
    rancher/server:preview
```

Note that this time I have used ports 80 and 443, putting the IP address of my droplet into my browser took me to the login page via the usual self-signed certificate warnings.

Once logged in I changed the password as prompted, launched a new cluster in using the same method as before. Once my cluster was up and running, I went to the default project and clicked on Catalog Apps, this time I was presented with a listed of a few of the default applications.

![](/img/2018-01-28_playing-with-rancher-2.0_20.png)

I decided to install Heapster as it was first, clicking View Details and then working through the on-screen prompts but still nothing seemed to work.

It was at this point I gave up, and decided that I would probably wait a month or two to have another look. All of the getting everything ready appears to be there at the moment, but the doing anything through Rancher is lacking at the moment.

Expect a follow up post in the next month or two.