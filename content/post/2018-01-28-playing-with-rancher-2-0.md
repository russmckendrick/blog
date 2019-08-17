---
author: Russ McKendrick
comments: true
date: 2018-01-28
image: assets/posts/3a843-1-t4gnas1xpdwk_0palkrca.png
title: Playing with Rancher 2.0
categories:
    - Tech
tags:
    - Docker
    - Google Cloud Platform
    - Kubernetes
    - Rancher
---

As I had some free time this weekend so I thought it would be good to have a play with the recently released preview of Rancher 2.0.

**Please do not follow along with this post, you will see why towards the end !!!**
![](/assets/posts/cbbf8-1gbqhbgj-u3jiky9cowbsya.png)
The very snazzy Rancher 2.0 website
When I last wrote about [Rancher, is was back in June 2016](https://media-glass.es/launching-a-local-rancher-cluster-1422b89b0477), in that post I launched Rancher locally and used it target a few VirtualBox VMs. Rather than Virtual Box VMs I am going to use a cloud service, but I am going to be running it locally again, to do this launch the container I ran the following command;

    
    $ docker container run -d 
        --restart=unless-stopped 
        -p 8080:80 
        -p 8443:443 
        rancher/server:preview


![](/assets/posts/149af-15uttqvk2rkkmn2fg01cakq.png)

Running the container
I checked that the container was up and running by running;

    
    $ docker container ls


![](/assets/posts/0e792-1exsrk4fpl0qmls0nv0z1rw.png)

It is running
Then entered opened my browswer and went to [https://localhost:8443/](https://localhost:8443/), after the usual certificate warnings I was greeted by a login screen;
![](/assets/posts/44ae3-1lfg3yjeu1dpcq81kkd6ehq.png)

Login screen
The default username and password for Rancher is simply **admin**, once you login you will be asked to change the password to something, hopefully, which is a lot more secure;
![](/assets/posts/5e501-1w1ej0ckq5g2c4wtwhkhsyq.png)
Once logged in, you should be greeting by a page which looks like the one below, as you can see, we have nothing to show yet;
![](/assets/posts/fc24d-1s84er7cmttnud6ubsrfvow.png)
So now we need a cluster, clicking on **Add Cluster** will present three options.



 	
  * Create a Cloud Cluster

 	
  * Create a RKE Cluster

 	
  * Import an Existing Cluster


![](/assets/posts/3ec87-1_-mvrhcalvcskm8fgxawca.png)
I am going to use the first of these options offers you an interface to launch a Kubernetes cluster by using the native Kubernetes tools in the big three public cloud providers. Well, sort of, at the time of writting only [Google Container Engine](https://cloud.google.com/kubernetes-engine/) is supported, suport for [Amazon EKS](https://aws.amazon.com/eks/) and [Azure Container Service](https://azure.microsoft.com/en-gb/services/container-service/) is “coming soon” and you are treated the following gif …
![](/assets/posts/00535-10xziwplkxmmgztx07d9acq.gif)

Lets all goto the lobby
So I guess that means I will launching my cluster using Google’s Container Engine. To do this I needed to create a service account by follwing the on-screen instructions;
![](/assets/posts/57d6c-1bpdonc1sjxkb5xnofa3fzq.png)

Creating the service account at Google
More information on createing a service account can be found in the [docs](https://cloud.google.com/compute/docs/access/create-enable-service-accounts-for-instances).

Once I had the service account JSON file I entered into the space provided and clicked on Next;
![](/assets/posts/c1f71-1z_8sgu6s7b7w4rzwpiogug.png)
I enter the **Name** of my cluster as _lab_ and kept the rest options at their defaults, meaning that Rancher would launch a three node n1-standard-1 (1 vCPU, 3.75GB RAM 100GB HDD) cluster in us-central1-f.
![](/assets/posts/51dde-1zudtqm8iblhfgrjd5lrduw.png)

Provisioning the cluster
You can double check the Google Clound Console to see the status of your cluster, as you can see from the screen below the lab was launching;
![](/assets/posts/f3fb0-1qxrjwdsjjsh1ke4pi33tnq.png)

Checking the Google Cloud Console
After a few minutes the cluster showed as Active in Rancher;
![](/assets/posts/405d0-1ny86yb3hznjabq-wbedqaq.png)

All done
Clicking on Nodes in the top menu showed me my three nodes;
![](/assets/posts/b9866-1upnunam27syzn8eisewvda.png)

The three nodes
Now that I had my three node cluster regisgered with Rancher I could start to use it, to do this I Clicked on Global in the top right and selected the C**luster:lab**, this took me to the overview page;
![](/assets/posts/279ba-1ucdlfnylwdvzeksq3rhcfa.png)

Cluster lab
Clicking **Namespaces** showed me the namespaces I would expect to see in a newly launched Kubernetes cluster;
![](/assets/posts/df9e4-1d20evanzzozd2wybvivywq.png)

The namespaces
Clicking **Nodes**, and then on one of the three nodes gave quite a detailed overview of the selected node;
![](/assets/posts/abe63-1ks4ltzoi_nkkl-kzxxvs1w.png)

Node Overview
Now I had poked around the cluster, it was time to launch something, Rancher is known as having quite an extensive catalogue of applications, both Rancher approved and also comminutiy currated ones.

To launch an application I needed to select an application, as I was just messing about I decided to use the Default project which was created as part on the initial Rancher installation on the cluster;
![](/assets/posts/1e2f6-1tuc0ncc1qmaqlordsowfiq.png)

Listing the projects
Clicked on **Default** took me to the projects dashboard, as you can see from the screen below, there was a warning that this area of the software was still being worked on;
![](/assets/posts/51006-1kyfo3zy7hwe39wuxzjhf7w.png)

The project dashboard
This is kind of where my journey with Rancher 2.0 fell apart, I wasn’t able to do much with it from here, now I am not certain if this was because I had launched my Rancher machine locally using Docker for Mac or if that was all, after all it is labelled as an Alpha version.

To test this, I launched a droplet in DigitalOcean using `doctl`;

    
    $ doctl compute droplet create rancher 
        --region lon1 
        --image ubuntu-17-10-x64 
        --size 1gb


Checked that the droplet had launched by running;

    
    $ doctl compute droplet list


Then SSH’ed to the droplet by running;

    
    $ doctl compute ssh rancher


Once I was on the droplet I installed Docker using the following commands;

    
    $ curl -fsSL get.docker.com -o get-docker.sh
    $ sh get-docker.sh


Then launched the Rancher 2.0 container by running;

    
    $ docker container run -d 
        --restart=unless-stopped 
        -p 80:80 
        -p 443:443 
        rancher/server:preview


Note that this time I have used ports 80 and 443, putting the IP address of my droplet into my browser took me to the login page via the usual self-signed certificate warnings.

Once logged in I changed the password as prompted, launched a new cluster in using the same method as before. Once my cluster was up and running, I went to the default project and clicked on Catalog Apps, this time I was presented with a listed of a few of the default applications.
![](/assets/posts/8a86b-1f61ow-s0vjlsxavbmjhmcg.png)
I decided to install Heapster as it was first, clicking View Details and then working through the on-screen prompts but still nothing seemed to work.

It was at this point I gave up, and decided that I would probably wait a month or two to have another look. All of the getting everything ready appears to be there at the moment, but the doing anything through Rancher is lacking at the moment.

Expect a follow up post in the next month or two.
