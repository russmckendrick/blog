---
title: "Launching a local Rancher cluster"
description: "Learn to launch a local Rancher cluster effortlessly with Docker for Mac beta and Docker Machine for smooth demo setups."
author: "Russ Mckendrick"
date: 2016-06-12T15:30:55.000Z
lastmod: 2021-07-31T12:33:55+01:00

tags:
 - Docker
 - macOS
 - Tools

cover:
    image: "/img/2016-06-12_launching-a-local-rancher-cluster_0.png" 
    alt: "Learn to launch a local Rancher cluster effortlessly with Docker for Mac beta and Docker Machine for smooth demo setups."

images:
 - "/img/2016-06-12_launching-a-local-rancher-cluster_0.png"
 - "/img/2016-06-12_launching-a-local-rancher-cluster_1.png"
 - "/img/2016-06-12_launching-a-local-rancher-cluster_2.png"
 - "/img/2016-06-12_launching-a-local-rancher-cluster_3.png"
 - "/img/2016-06-12_launching-a-local-rancher-cluster_4.png"
 - "/img/2016-06-12_launching-a-local-rancher-cluster_5.png"


aliases:
- "/launching-a-local-rancher-cluster-1422b89b0477"

---

Earlier this week I wanted to show someone a copy of [Rancher](http://rancher.com/) running but I realized that I didn’t have a local lab configured. I managed to quickly launch a few machines in [Digital Ocean](https://m.do.co/c/52ec4dc3647e) meaning I could do the demo.

Rancher is described as being …

> From the ground up, Rancher was designed to solve all of the critical challenges necessary to run all of your applications in containers. Rancher provides a full set of infrastructure services for containers, including networking, storage services, host management, load balancing and more. All of these services work across any infrastructure, and make it simple to reliably deploy and manage applications.

As I am running the [Docker for Mac Beta](/2016/05/08/docker-on-mac-osx/) I got to thinking if I could use that to launch Rancher and then using Docker machine to launch a few hosts running [RancherOS](http://rancher.com/rancher-os/) to act as hosts.

Let’s do the easy bit, launching Rancher is incredibly easy. I just ran the following command;

```
docker run -d — restart=always -p 8080:8080 rancher/server:latest
```

It takes a minute for Rancher to download and start. You can check the progress by running docker logs container_name against the containers name, you can find the containers name by running the docker ps command.

![rancher01](/img/2016-06-12_launching-a-local-rancher-cluster_1.png)

This started the Rancher server on port 8080 on my Mac, at the moment there is a problem which causes the UI to error when running in Safari so I opened it with FireFox by running;

```
open -a FireFox http://localhost:8080
```

You will notice that we are accessing Rancher using localhost, when it comes to launching the host VMs they will not be able to access that address so lets grab the IP address of our local machine;

```
ipconfig getifaddr en1
```

For me, this was 10.0.1.15. Next up lets goto FireFox, if everything went as planned you should see a screen asking you to add a host. While we haven’t got our host VMs launched we will need to configure Rancher to listen on our local machines IP address. To do this click on “Add Host”, when you do this you will be able to a page which asks you to confirm the “Host Registration URL”.

This is the URL which our host machines will use to call back to the Rancher server, to update it click on the “Something else” radio button and your IP address and port;

![rancher02](/img/2016-06-12_launching-a-local-rancher-cluster_2.png)

Once you have updated the IP address click on “Save”, you will then be taken a screen where you can add your hosts. Ignore steps one through to four, step five should give you the command you need to run on your host machines to download the Rancher client agent and register itself with your server. For me this command was ….

```
sudo docker run -d — privileged -v /var/run/docker.sock:/var/run/docker.sock -v /var/lib/rancher:/var/lib/rancher rancher/agent:v1.0.1 http://10.0.1.15:8080/v1/scripts/2925437AFC94D6994999:1465743600000:C8O5m4OXR0giBvn3DonFFvow
```

Once you have made a note of the command, click on “Close” and go back to your terminal to launch a few host VMs. Here we will be using Docker Machine to launch two VMs running RancherOS.

> RancherOS is a tiny Linux distro that runs the entire OS as Docker containers.

To do this run the following two commands;

```
docker-machine create -d virtualbox — virtualbox-boot2docker-url https://releases.rancher.com/os/latest/rancheros.iso rancher01
docker-machine create -d virtualbox — virtualbox-boot2docker-url https://releases.rancher.com/os/latest/rancheros.iso rancher02
```

You can check that your machines are OK by running docker-machine ls, you should see something like;

![rancher03](/img/2016-06-12_launching-a-local-rancher-cluster_3.png)

Now we have our two host machines up and running we just need to launch the agent container. To do this run the following command, making sure to replace the end part with the command from step five on your own Rancher installation;

```
docker-machine ssh rancher01 docker run -d — privileged -v /var/run/docker.sock:/var/run/docker.sock -v /var/lib/rancher:/var/lib/rancher rancher/agent:v1.0.1 http://10.0.1.15:8080/v1/scripts/2925437AFC94D6994999:1465743600000:C8O5m4OXR0giBvn3DonFFvow
```

and for the second host VM;

```
docker-machine ssh rancher02 docker run -d — privileged -v /var/run/docker.sock:/var/run/docker.sock -v /var/lib/rancher:/var/lib/rancher rancher/agent:v1.0.1 http://10.0.1.15:8080/v1/scripts/2925437AFC94D6994999:1465743600000:C8O5m4OXR0giBvn3DonFFvow
```

once you have ran the commands, it will take a minute or two for the agents to register themselves with your server. Once the hosts have registered themselves you should see something like the following;

![rancher04](/img/2016-06-12_launching-a-local-rancher-cluster_4.png)

You can now start to launch services from the catalog etc;

![rancher05](/img/2016-06-12_launching-a-local-rancher-cluster_5.png)

To teardown the cluster run the following command, replacing the “amazing_brattain” with the name of your container, to stop and remove the container running the Rancher Server;

```
docker stop amazing_brattain && docker rm amazing_brattain
```

and to remove the two hosts run;

```
docker-machine rm rancher01 rancher02
```

So thats how you can quickly launch a local Rancher cluster using the Docker for Mac beta and Docker Machine.
