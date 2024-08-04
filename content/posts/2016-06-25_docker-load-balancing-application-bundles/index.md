---
title: "Docker Load Balancing & Application Bundles"
description: "Explore Docker Swarm, load balancing, and DAB with Ansible on Digital Ocean. Step-by-step guide included."
author: "Russ Mckendrick"
date: "2016-06-25T18:30:16+01:00"
tags:
  - "Docker"
cover:
  image: "/img/2016-06-25_docker-load-balancing-application-bundles_0.png"
  alt: "Explore Docker Swarm, load balancing, and DAB with Ansible on Digital Ocean. Step-by-step guide included."
lastmod: "2021-07-31T12:33:58+01:00"
aliases:
  - "/docker-load-balancing-application-bundles-38426d9568d2"
---

Earlier in the week I wrote about the [new Docker Swarm functionality](/2016/06/30/docker-service/), as i didn’t have much time I was just using the [Docker for Mac](https://www.docker.com/products/docker#/mac) beta.

#### Launching a Swarm cluster

To test more of the new features we are going to need a few servers so rather than launching them locally I decided to write an Ansible playbook to launch x number of droplets in [Digital Ocean](https://m.do.co/c/52ec4dc3647e). Once the droplets have launched the playbook goes on to perform the following tasks;

- Installs a few prerequisites like python 2.7, git and UFW
- Configures UFW, locking down the Docker services to just our Droplets
- Installs Docker 1.12rc2 experimental build from [https://experimental.docker.com/](https://experimental.docker.com/)
- Initializes the Swarm manager and then connects the worker nodes to the manager

The playbook is available on GitHub at [https://github.com/russmckendrick/digitalocean-docker-swarm](https://github.com/russmckendrick/digitalocean-docker-swarm), the [README](https://github.com/russmckendrick/digitalocean-docker-swarm/blob/master/README.md) has instructions on how to run the playbook so I won’t go into detail here, below is a what you should see when you run the playbook for the first time;

![asciicast](/img/2016-06-25_docker-load-balancing-application-bundles_1.png)

Once complete, you should have four droplets launched in [Digital Ocean](https://m.do.co/c/52ec4dc3647e);

![more-docker-service01](/img/2016-06-25_docker-load-balancing-application-bundles_2.jpg)

#### Load Balancing

One of the features I wanted to try for myself was the Load Balancing. The documentation describes this as;

> The swarm manager uses ingress load balancing to expose the services you want to make available externally to the swarm. The swarm manager can automatically assign the service a PublishedPort or you can configure a PublishedPort for the service in the 30000–32767 range.
> 
>  External components, such as cloud load balancers, can access the service on the PublishedPort of any node in the cluster whether or not the node is currently running the task for the service. All nodes in the swarm cluster route ingress connections to a running task instance.

Now you have your Docker Swarm cluster up and running we can test the Load Balancing to do this connect to the Manager, the IP is at the end of the playbook output or you can get it from your [Digital Ocean](https://m.do.co/c/52ec4dc3647e)[control panel](https://cloud.digitalocean.com/droplets).

Once connected you can check everything is OK with your cluster by running;

```
docker node ls
```

This will show all of the Droplets in the cluster and their current status. Now we have confirm our cluster is working as it should be we can launch some containers. In my previous post I created a service using my [test container](https://hub.docker.com/r/russmckendrick/cluster/) so I will do that again here.

```
docker network create -d overlay clusternetwork
docker service create — name cluster -p:80:80/tcp — network clusternetwork russmckendrick/cluster
docker service ls
docker service tasks cluster
```

![more-docker-service02](/img/2016-06-25_docker-load-balancing-application-bundles_3.jpg)

As you can see, I have a single container running on the docker-swarm-manager node. Lets try connecting to our container via the IP address of one of the worker nodes;

![more-docker-service03](/img/2016-06-25_docker-load-balancing-application-bundles_4.jpg)

and there we have our container !!!

Last time we tried scaling, so lets try again now. As we have four droplets we can get into double digits;

```
docker service scale cluster=15
docker service tasks cluster
```

![more-docker-service04](/img/2016-06-25_docker-load-balancing-application-bundles_5.jpg)

Before looking at anything else lets remove the cluster service;

```
docker service rm cluster
docker service ls
```

#### Docker Distributed Application Bundles (DAB)

While we have our Swarm cluster up and running, lets look at building a distributed application using a Docker Compose file. Docker Distributed Application Bundles are described as;

> Distributed Application Bundles is an experimental open file format for bundling up all the artifacts required to ship and deploy multi-container apps: a DAB contains a description of all the services required to run the application and details images to use, ports to expose, and the networks used to link services.

The Docker Compose file we will be using follows;

```
version: ‘2’
services:
 wordpress:
 container_name: my-wordpress-app
 cover:
    image: wordpress
 ports:
 — “80:80”
 environment:
 — “WORDPRESS_DB_HOST=mysql:3306”
 — “WORDPRESS_DB_PASSWORD=password”
 mysql:
 container_name: my-wordpress-database
 cover:
    image: mysql
 expose:
 — “3306”
 environment:
 — “MYSQL_ROOT_PASSWORD=password”
```

As you can see the docker-compose.yml file runs a WordPress and MySQL container as well configures networking. On your local machine, check that you are running Docker Compose 1.8rc1, this is included in the latest Docker for Mac beta, by running;

```
docker-compose — version
```

Now create a temporary folder and download the docker-compose.yml file;

```
mkdir ~/Desktop/test
cd ~/Desktop/test
curl -O https://gist.githubusercontent.com/russmckendrick/c6320315431afd19a0ee10132e086673/raw/e3a8019a68c2122141cae14bcb84b4c20ef18fe6/docker-compose.yml
```

Now we have our Docker Compose file, download the images by running;

```
docker-compose pull
```

and finally create the bundle by running;

```
docker-compose bundle -o wordpress.dsb
```

![more-docker-service06](/img/2016-06-25_docker-load-balancing-application-bundles_6.jpg)

a copy of the bundle created above looks like;

```

<!DOCTYPE html>
<html lang="en" data-color-mode="auto" data-light-theme="light" data-dark-theme="dark">
  <head>
    <meta charset="utf-8">
  <link rel="dns-prefetch" href="https://github.githubassets.com">
  <link rel="dns-prefetch" href="https://avatars.githubusercontent.com">
  <link rel="dns-prefetch" href="https://github-cloud.s3.amazonaws.com">
  <link rel="dns-prefetch" href="https://user-images.githubusercontent.com/">

  <link crossorigin="anonymous" media="all" integrity="sha512-+z3z7w/QKK6v7DS9Y7YG7e3neIfYqIJaOykTRwMq4TdhAIQ7h3n7TCXttcuZDvdnaWPJV44oKM5vmkLhHO2ZHA==" rel="stylesheet" href="https://github.githubassets.com/assets/frameworks-fb3df3ef0fd028aeafec34bd63b606ed.css" />
  
    <link crossorigin="anonymous" media="all" integrity="sha512-fT2DQxqNhDV1nNx3O++a8GI7qYYEW9SXVa1DFqueH7oHuDL9whJKb3TOAvI6HA8fH6nRcesnmlOqZEkTo1i0Ig==" rel="stylesheet" href="https://github.githubassets.com/assets/behaviors-7d3d83431a8d8435759cdc773bef9af0.css" />
    
    
    
    <link crossorigin="anonymous" media="all" integrity="sha512-hYGZSZSj5++MKRYLpvuTuQZOudb1FvmDgsVTX4newaIeoM71nzUl0THhhpl+G0RnD4p6hGjUSL+TTsTNy47xXQ==" rel="stylesheet" href="https://github.githubassets.com/assets/github-8581994994a3e7ef8c29160ba6fb93b9.css" />

  <script crossorigin="anonymous" defer="defer" integrity="sha512-CzeY4A6TiG4fGZSWZU8FxmzFFmcQFoPpArF0hkH0/J/S7UL4eed/LKEXMQXfTwiG5yEJBI+9BdKG8KQJNbhcIQ==" type="application/javascript" src="https://github.githubassets.com/assets/environment-0b3798e0.js"></script>
    <script crossorigin="anonymous" defer="defer" integrity="sha512-jtCal1yPaE2jCFEjCzUp5xS9iK32c9PLvWbjpo4bVCC517kn7oemHSND1lApbjGsQOG3IUAflrIUeUubRhsglw==" type="application/javascript" src="https://github.githubassets.com/assets/chunk-frameworks-8ed09a97.js"></script>
    <script crossorigin="anonymous" defer="defer" integrity="sha512-US/IQhvG9ej4VfjEAZn++Hu2XUgXKUo/3YypnqjP1kjNCWzxGJyNw6JSFeeTcSI5KCDCi/iDdXbzi7i4TA47SQ==" type="application/javascript" src="https://github.githubassets.com/assets/chunk-vendor-512fc842.js"></script>
  
  <script crossorigin="anonymous" defer="defer" integrity="sha512-5Pwulj9jNU43LQBhJuFtO5iD2vv6fWgh8C8WfN6sjS+5KOzzsWkYZsAxp7L8hJJFqgp/vpYeIkxx1Y2A2XZv7Q==" type="application/javascript" src="https://github.githubassets.com/assets/behaviors-e4fc2e96.js"></script>
  
    <script crossorigin="anonymous" defer="defer" integrity="sha512-5tWKSr7mhAzSh4Sx5YRFgKftdGxKwHKnOGYw5DlxjHhkQVURYFU3Bk5IMOGMKuAiJTlC3OXYM3xzGcyjzuEFQQ==" type="application/javascript" data-module-id="./chunk-animate-on-scroll.js" data-src="https://github.githubassets.com/assets/chunk-animate-on-scroll-e6d58a4a.js"></script>
    <script crossorigin="anonymous" defer="defer" integrity="sha512-0MZorw3oXnKy5eeSwQ9xGrKU4hxQeCXxmyxhneIHNhDIqu8vWh8mHss9FlC75Xd/bPWxFDCvdOo57tnTR46nbA==" type="application/javascript" data-module-id="./chunk-codemirror.js" data-src="https://github.githubassets.com/assets/chunk-codemirror-d0c668af.js"></script>
    <script crossorigin="anonymous" defer="defer" integrity="sha512-M6W/sGLOuJXCIkw+doDl6zl7J9q2DmqdwftQCtyEiZM/UJNGRVQdyKwI/PAMxD12se/wCx3ZcyJs9nz0o0OSVw==" type="application/javascript" data-module-id="./chunk-color-modes.js" data-src="https://github.githubassets.com/assets/chunk-color-modes-33a5bfb0.js"></script>
    <script crossorigin="anonymous" defer="defer" integrity="sha512-71HZu1T5JWqRNF9wrm2NXZAqYVvzxZ8Dvor5U5l/LuEBbGCBX57Sny60Rj+qUZZAvEBGFlNsz179DEn2HFwgVA==" type="application/javascript" data-module-id="./chunk-confetti.js" data-src="https://github.githubassets.com/assets/chunk-confetti-ef51d9bb.js"></script>
    <script crossorigin="anonymous" defer="defer" integrity="sha512-P29U0lNmhUj353VrCWp6czdhNpMtF70xVKf4GBGFVKCoqGtxp0sywAM8/46+iC0kdFiRvM13EBvDnq6oyWRwiw==" type="application/javascript" data-module-id="./chunk-contributions-spider-graph.js" data-src="https://github.githubassets.com/assets/chunk-contributions-spider-graph-3f6f54d2.js"></script>
    <script crossorigin="anonymous" defer="defer" integrity="sha512-arflMFcVzVAYaP2n7m7gklPChWsVsCDtRPav2Cb6bqLeJf8pgbojWJ3EseKXILCIqfxl/v6arBduZ9SLmpMEZw==" type="application/javascript" data-module-id="./chunk-delayed-loading-element.js" data-src="https://github.githubassets.com/assets/chunk-delayed-loading-element-6ab7e530.js"></script>
    <script crossorigin="anonymous" defer="defer" integrity="sha512-6j/oSF+kbW+yetNPvI684VzAu9pzug6Vj2h+3u1LdCuRhR4jnuiHZfeQKls3nxcT/S3H+oIt7FtigE/aeoj+gg==" type="application/javascript" data-module-id="./chunk-drag-drop.js" data-src="https://github.githubassets.com/assets/chunk-drag-drop-ea3fe848.js"></script>
    <script crossorigin="anonymous" defer="defer" integrity="sha512-VSSd+Yzi2iMS+pibY6hD/WdypxAEdob5F2RMKxuKcAHS2EpFYJPeTXoVxt0NXg03tfj2dka2mEtHS+vjpYSaDw==" type="application/javascript" data-module-id="./chunk-edit-hook-secret-element.js" data-src="https://github.githubassets.com/assets/chunk-edit-hook-secret-element-55249df9.js"></script>
    <script crossorigin="anonymous" defer="defer" integrity="sha512-XObZgIojqwx94ekra728uVPTHs30O37w4+dNCDNUrZXRnGmFRcitdymWoSEm7ztcvhzboxHmXOSP2TeoPSfQ5Q==" type="application/javascript" data-module-id="./chunk-edit.js" data-src="https://github.githubassets.com/assets/chunk-edit-5ce6d980.js"></script>
    <script crossorigin="anonymous" defer="defer" integrity="sha512-aiqMIGGZGo8AQMjcoImKPMTsZVVRl6htCSY7BpRmpGPG/AF+Wq+P/Oj/dthWQOIk9cCNMPEas7O2zAR6oqn0tA==" type="application/javascript" data-module-id="./chunk-emoji-picker-element.js" data-src="https://github.githubassets.com/assets/chunk-emoji-picker-element-6a2a8c20.js"></script>
    <script crossorigin="anonymous" defer="defer" integrity="sha512-qqRgtYe+VBe9oQvKTYSA9uVb3qCKhEMl3sHdsnP8AbVRfumjSOugTCEN1YLmnniNBMXb77ty2wddblbKSaQE1Q==" type="application/javascript" data-module-id="./chunk-failbot.js" data-src="https://github.githubassets.com/assets/chunk-failbot-aaa460b5.js"></script>
    <script crossorigin="anonymous" defer="defer" integrity="sha512-NiXH7+N+GxV7caD3K5mDWHU7fxKSM6URlU8+rm70GhOV72UsOTwj4emmH+4K6Grn8MqbOfcpnqnA6B83g35H0w==" type="application/javascript" data-module-id="./chunk-filter-input.js" data-src="https://github.githubassets.com/assets/chunk-filter-input-3625c7ef.js"></script>
    <script crossorigin="anonymous" defer="defer" integrity="sha512-Z1wcyOFQHzyMSPqp5DLKrobr3DN2Q6Dz31cfPtw4b2vPs9PX0PrxyDXHpTbIlcZ9qT1M1BNAypHKKw8Lp6Yx/Q==" type="application/javascript" data-module-id="./chunk-insights-graph.js" data-src="https://github.githubassets.com/assets/chunk-insights-graph-675c1cc8.js"></script>
    <script crossorigin="anonymous" defer="defer" integrity="sha512-hDiTAZNldjiUNPk5eNthz6zUVY57FFqFU+n2D7WRYygzCxbDtwO9ODKDsEXxYb8kAMI7gTC8/QR3dXtHVCVgcA==" type="application/javascript" data-module-id="./chunk-insights-query.js" data-src="https://github.githubassets.com/assets/chunk-insights-query-84389301.js"></script>
    <script crossorigin="anonymous" defer="defer" integrity="sha512-lmosGyye+/xONUQs9SwGN/a9fQvUSiAFk5HrL8eLHjeuOx9DX9TW5ckRKFD+6FM54vutFf/mBmNFW/0R3KJEBw==" type="application/javascript" data-module-id="./chunk-invitations.js" data-src="https://github.githubassets.com/assets/chunk-invitations-966a2c1b.js"></script>
    <script crossorigin="anonymous" defer="defer" integrity="sha512-4MxGQhsDODvZgLbu5arO6CapfnNvZ5fXMsZ47FiklUKRmHq4B3h8uTokSIWAOAxsvCMRrZr0DVZ0i0gm3RAnsg==" type="application/javascript" data-module-id="./chunk-jump-to.js" data-src="https://github.githubassets.com/assets/chunk-jump-to-e0cc4642.js"></script>
    <script crossorigin="anonymous" defer="defer" integrity="sha512-VtdawM/OSsu+d6v25ZY6UcQa/GGLAStSESjsqdEwx+ey88GNYGkQ24o+JFFo4lY+7wLMRf7aCrLxkA5SquBoNQ==" type="application/javascript" data-module-id="./chunk-launch-code-element.js" data-src="https://github.githubassets.com/assets/chunk-launch-code-element-56d75ac0.js"></script>
    <script crossorigin="anonymous" defer="defer" integrity="sha512-RR5Uk+KE9M/CsqLcmgReChS7ZDjm8gxcOnDYWWkMdeTsrpW/xDlJHQEgUfuEC6HJXfyPNcW+oBTHqMnucNYGTQ==" type="application/javascript" data-module-id="./chunk-line-chart.js" data-src="https://github.githubassets.com/assets/chunk-line-chart-451e5493.js"></script>
    <script crossorigin="anonymous" defer="defer" integrity="sha512-RduaLAviB2ygvRK/eX5iwzYO43ie7svrJ0rYJs06x7XqpRl/IK8PPBscBWM9Moo5Z86DK2iRLE2+aR7TJ5Uc2Q==" type="application/javascript" data-module-id="./chunk-metric-selection-element.js" data-src="https://github.githubassets.com/assets/chunk-metric-selection-element-45db9a2c.js"></script>
    <script crossorigin="anonymous" defer="defer" integrity="sha512-7hZ031ngiF36wGsfcoyyCWTqwYxjX+qeTLtCV7CJ+IO+wzkzCm1RoR3WzWczfWmwLNqr+Hu3kQOgkBaGn4ntWQ==" type="application/javascript" data-module-id="./chunk-notification-list-focus.js" data-src="https://github.githubassets.com/assets/chunk-notification-list-focus-ee1674df.js"></script>
    <script crossorigin="anonymous" defer="defer" integrity="sha512-ma0OOy3nj0c1cqBx0BkcmIFsLqcSZ+MIukQxyEFM/OWTzZpG+QMgOoWPAHZz43M6fyjAUG1jH6c/6LPiiKPCyw==" type="application/javascript" data-module-id="./chunk-profile-pins-element.js" data-src="https://github.githubassets.com/assets/chunk-profile-pins-element-99ad0e3b.js"></script>
    <script crossorigin="anonymous" defer="defer" integrity="sha512-hgoSKLTlL8I3IWr/TLONCU+N4kdCtdrHCrrud4NKhgRlLrTw0XUPhqBaDdZUiFSzDQRw/nFQ1kw2VeTm0g9+lA==" type="application/javascript" data-module-id="./chunk-profile.js" data-src="https://github.githubassets.com/assets/chunk-profile-860a1228.js"></script>
    <script crossorigin="anonymous" defer="defer" integrity="sha512-4Xg3IDW6ukiZDStR9gjKuCIvz0ZMxOkYuBD6s1m5n7SvrOCG1Mg8unFMMZHGsWEiK9oAp83tCZEJzV1wpOzAsQ==" type="application/javascript" data-module-id="./chunk-readme-toc-element.js" data-src="https://github.githubassets.com/assets/chunk-readme-toc-element-e1783720.js"></script>
    <script crossorigin="anonymous" defer="defer" integrity="sha512-/fwTpG2i+GCgHEZc/35F+pXdShv1RfJMxyixcTIxzxDdylOWVJvjIWoumYWEPj7gUqBdrWt4SFf989Szmxleaw==" type="application/javascript" data-module-id="./chunk-ref-selector.js" data-src="https://github.githubassets.com/assets/chunk-ref-selector-fdfc13a4.js"></script>
    <script crossorigin="anonymous" defer="defer" integrity="sha512-D/MxBjtRPjes6DvnYGi2dEH7AQEnLvSvTODabEkSo+1zP6SSEZpb8oF52kFWERA97t1L19fF/P3bn4pgIsMPuA==" type="application/javascript" data-module-id="./chunk-responsive-underlinenav.js" data-src="https://github.githubassets.com/assets/chunk-responsive-underlinenav-0ff33106.js"></script>
    <script crossorigin="anonymous" defer="defer" integrity="sha512-SWy36S28Js+/YzsvYgmp+IEdC0qtMcBf6sYhXTEcj1aFPCLPOTOnOKqzFiNyH2oNVDd+u5Qi8eqYINSIu28LFQ==" type="application/javascript" data-module-id="./chunk-runner-groups.js" data-src="https://github.githubassets.com/assets/chunk-runner-groups-496cb7e9.js"></script>
    <script crossorigin="anonymous" defer="defer" integrity="sha512-SVdK0K69PnQ4FChdpl650OR+vplYWXqddxNkEGKhQf6tkehqvKkFEg5LQSZgCVKt2tfc9CnWJlmKCwbTTipEjg==" type="application/javascript" data-module-id="./chunk-series-table.js" data-src="https://github.githubassets.com/assets/chunk-series-table-49574ad0.js"></script>
    <script crossorigin="anonymous" defer="defer" integrity="sha512-tk76eoSLUqXSVZ8ANzPprrOImFIV1zQ/VBV+WzG8ZjZpVPH8cLkMH/ur5HJB1lxx9/yo+V2wjDF96t4qfUwZLA==" type="application/javascript" data-module-id="./chunk-severity-calculator-element.js" data-src="https://github.githubassets.com/assets/chunk-severity-calculator-element-b64efa7a.js"></script>
    <script crossorigin="anonymous" defer="defer" integrity="sha512-j7Pb1H+2Xt4YIKSrJLLXxl/NNkkpW//5PLTpu58JGD8pqRPODDjJKqjO6YPZd++BB4VJubHPjzvuMXhW/9jcqA==" type="application/javascript" data-module-id="./chunk-sortable-behavior.js" data-src="https://github.githubassets.com/assets/chunk-sortable-behavior-8fb3dbd4.js"></script>
    <script crossorigin="anonymous" defer="defer" integrity="sha512-nKa3UdA2O7Ve4Jn24gaB20yUfJvS7wlnd8Q8C+iWD8i2tXLgaKemDWkLeexeQdrs+an98FCl5fOiy0J+izn+tQ==" type="application/javascript" data-module-id="./chunk-three.module.js" data-src="https://github.githubassets.com/assets/chunk-three.module-9ca6b751.js"></script>
    <script crossorigin="anonymous" defer="defer" integrity="sha512-WK8VXw3lfUQ/VRW0zlgKPhcMUqH0uTnB/KzePUPdZhCm/HpxfXXHKTGvj5C0Oex7+zbIM2ECzULbtTCT4ug3yg==" type="application/javascript" data-module-id="./chunk-toast.js" data-src="https://github.githubassets.com/assets/chunk-toast-58af155f.js"></script>
    <script crossorigin="anonymous" defer="defer" integrity="sha512-1vSZvwpr106s8wjSNFNFGVmFT2E4YjI2N8k6JqiSb28GGYMkEJUhveotmvB00Z4bQZM61ZgvWcXax1U3M48gLQ==" type="application/javascript" data-module-id="./chunk-tweetsodium.js" data-src="https://github.githubassets.com/assets/chunk-tweetsodium-d6f499bf.js"></script>
    <script crossorigin="anonymous" defer="defer" integrity="sha512-fvcOOYapCxPkDRQWz2WQzrqL6rRhX88yHWF87fb9Xny2Fq4lri0ONaVFL7XDSTiTyu4OTp+8WoyfMVpgGUaaVg==" type="application/javascript" data-module-id="./chunk-unveil.js" data-src="https://github.githubassets.com/assets/chunk-unveil-7ef70e39.js"></script>
    <script crossorigin="anonymous" defer="defer" integrity="sha512-UOFNW/xcxynplVfC8Y3fQdFFiasmugYUUHU4N90G8sqBZGL1yR37yjVakxV8/FV5deBALx9OQMBoiba/3OHGDA==" type="application/javascript" data-module-id="./chunk-user-status-submit.js" data-src="https://github.githubassets.com/assets/chunk-user-status-submit-50e14d5b.js"></script>
    <script crossorigin="anonymous" defer="defer" integrity="sha512-cKu/+X7gT+WVH4sXKt0g3G77bfQfcgwurRObM+dt8XylPm9eEWI+/aWKhVab6VsYuvvuI5BTriKXhXfJwaSXdQ==" type="application/javascript" data-module-id="./chunk-webgl-warp.js" data-src="https://github.githubassets.com/assets/chunk-webgl-warp-70abbff9.js"></script>
    <script crossorigin="anonymous" defer="defer" integrity="sha512-W5dFBEQL1e7FdO7OALIe0SYa7GulAAa2GJtDXTxuQctkb69SaEmn10skbbZcYF9GXjWa350XmT+7ofRdxRgzVg==" type="application/javascript" src="https://github.githubassets.com/assets/gist-5b974504.js"></script>

  

  <meta name="viewport" content="width=device-width">
  
  <title>docker-compose.yml · GitHub</title>
    <meta name="description" content="GitHub Gist: instantly share code, notes, and snippets.">
    <link rel="search" type="application/opensearchdescription+xml" href="/opensearch-gist.xml" title="Gist">
  <link rel="fluid-icon" href="https://gist.github.com/fluidicon.png" title="GitHub">
  <meta property="fb:app_id" content="1401488693436528">
  <meta name="apple-itunes-app" content="app-id=1477376905" />
    <meta name="twitter:cover:
    image:src" content="https://github.githubassets.com/images/modules/gists/gist-og-image.png" /><meta name="twitter:site" content="@github" /><meta name="twitter:card" content="summary_large_image" /><meta name="twitter:title" content="docker-compose.yml" /><meta name="twitter:description" content="GitHub Gist: instantly share code, notes, and snippets." />
    <meta property="og:image" content="https://github.githubassets.com/images/modules/gists/gist-og-image.png" /><meta property="og:cover:
    image:alt" content="GitHub Gist: instantly share code, notes, and snippets." /><meta property="og:site_name" content="Gist" /><meta property="og:type" content="article" /><meta property="og:title" content="docker-compose.yml" /><meta property="og:url" content="https://gist.github.com/russmckendrick/c6320315431afd19a0ee10132e086673" /><meta property="og:description" content="GitHub Gist: instantly share code, notes, and snippets." /><meta property="article:author" content="262588213843476" /><meta property="article:publisher" content="262588213843476" />

    

  <link rel="assets" href="https://github.githubassets.com/">
  

  <meta name="request-id" content="D1ED:07B4:2D139E7:2EF5652:6105352C" data-pjax-transient="true"/><meta name="html-safe-nonce" content="1838cb71b9c225343dc9e1ad5066b3220bff36778570edb5d7f8b301c0929c10" data-pjax-transient="true"/><meta name="visitor-payload" content="eyJyZWZlcnJlciI6Imh0dHBzOi8vZ2lzdC5naXRodWJ1c2VyY29udGVudC5jb20vcnVzc21ja2VuZHJpY2svYzYzMjAzMTU0MzFhZmQxOWEwZWUxMDEzMmUwODY2NzMvI2ZpbGUtd29yZHByZXNzLWRzYi9yYXciLCJyZXF1ZXN0X2lkIjoiRDFFRDowN0I0OjJEMTM5RTc6MkVGNTY1Mjo2MTA1MzUyQyIsInZpc2l0b3JfaWQiOiI2ODE5NTc1NTAxMTUwMzAzNTMyIiwicmVnaW9uX2VkZ2UiOiJmcmEiLCJyZWdpb25fcmVuZGVyIjoiZnJhIn0=" data-pjax-transient="true"/><meta name="visitor-hmac" content="e72c617f130e90ac5f82704e43513e8da4b345eb5e3a732353062dfc024e49c0" data-pjax-transient="true"/>

  <meta name="github-keyboard-shortcuts" content="" data-pjax-transient="true" />

  

  <meta name="selected-link" value="gist_code" data-pjax-transient>

    <meta name="google-site-verification" content="c1kuD-K2HIVF635lypcsWPoD4kilo5-jA_wBFyT4uMY">
  <meta name="google-site-verification" content="KT5gs8h0wvaagLKAVWq8bbeNwnZZK1r1XQysX3xurLU">
  <meta name="google-site-verification" content="ZzhVyEFwb7w3e0-uOTltm8Jsck2F5StVihD0exw2fsA">
  <meta name="google-site-verification" content="GXs5KoUUkNCoaAZn7wPN-t01Pywp9M3sEjnt_3_ZWPc">

  <meta name="octolytics-host" content="collector.githubapp.com" /><meta name="octolytics-app-id" content="gist" /><meta name="octolytics-event-url" content="https://collector.githubapp.com/github-external/browser_event" />

  <meta name="analytics-location" content="/&lt;user-name&gt;/&lt;gist-id&gt;" data-pjax-transient="true" />

  

    <meta name="octolytics-dimension-public" content="true" /><meta name="octolytics-dimension-gist_id" content="37150325" /><meta name="octolytics-dimension-gist_name" content="c6320315431afd19a0ee10132e086673" /><meta name="octolytics-dimension-anonymous" content="false" /><meta name="octolytics-dimension-owner_id" content="121128" /><meta name="octolytics-dimension-owner_login" content="russmckendrick" /><meta name="octolytics-dimension-forked" content="false" />

      <meta name="hostname" content="gist.github.com">
    <meta name="user-login" content="">

      <meta name="expected-hostname" content="gist.github.com">

    <meta name="enabled-features" content="MARKETPLACE_PENDING_INSTALLATIONS">

  <meta http-equiv="x-pjax-version" content="4be5dca52805d25b8808ca76e15aec1612b283988c56f71ffcbab102aec38701">
  

      <link href="/russmckendrick.atom" rel="alternate" title="atom" type="application/atom+xml">

  <link crossorigin="anonymous" media="all" integrity="sha512-MNTs9iGu5Xcf0Bzgk6PUM7zD5fVhhU3VZQt2kHegYrBdtkv0ZKjmlSi4YHNkxO+eDvfNkHmK91JgnqPZ2E/TYA==" rel="stylesheet" href="https://github.githubassets.com/assets/gist-30d4ecf621aee5771fd01ce093a3d433.css" />

  <meta name="browser-stats-url" content="https://api.github.com/_private/browser/stats">

  <meta name="browser-errors-url" content="https://api.github.com/_private/browser/errors">

  <meta name="browser-optimizely-client-errors-url" content="https://api.github.com/_private/browser/optimizely_client/errors">

  <link rel="mask-icon" href="https://github.githubassets.com/pinned-octocat.svg" color="#000000">
  <link rel="alternate icon" class="js-site-favicon" type="image/png" href="https://github.githubassets.com/favicons/favicon.png">
  <link rel="icon" class="js-site-favicon" type="image/svg+xml" href="https://github.githubassets.com/favicons/favicon.svg">

<meta name="theme-color" content="#1e2327">
<meta name="color-scheme" content="light dark" />

<meta name="enabled-homepage-translation-languages" content="">

  </head>

  <body class="logged-out env-production page-responsive" style="word-wrap: break-word;">
    

    <div class="position-relative js-header-wrapper ">
      <a href="#start-of-content" class="px-2 py-4 color-bg-info-inverse color-text-white show-on-focus js-skip-to-content">Skip to content</a>
      <span data-view-component="true" class="progress-pjax-loader width-full js-pjax-loader-bar Progress position-fixed">
    <span style="background-color: #79b8ff;width: 0%;" data-view-component="true" class="Progress-item progress-pjax-loader-bar"></span>
</span>      
      

          <div class="Header js-details-container Details flex-wrap flex-md-nowrap p-responsive" role="banner" >
  <div class="Header-item d-none d-md-flex">
    <a class="Header-link" data-hotkey="g d" aria-label="Gist Homepage " href="/">
  <svg class="octicon octicon-mark-github v-align-middle d-inline-block d-md-none" height="24" viewBox="0 0 16 16" version="1.1" width="24" aria-hidden="true"><path fill-rule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path></svg>
  <svg height="24" class="octicon octicon-logo-github v-align-middle d-none d-md-inline-block" viewBox="0 0 45 16" version="1.1" width="67" aria-hidden="true"><path fill-rule="evenodd" d="M18.53 12.03h-.02c.009 0 .015.01.024.011h.006l-.01-.01zm.004.011c-.093.001-.327.05-.574.05-.78 0-1.05-.36-1.05-.83V8.13h1.59c.09 0 .16-.08.16-.19v-1.7c0-.09-.08-.17-.16-.17h-1.59V3.96c0-.08-.05-.13-.14-.13h-2.16c-.09 0-.14.05-.14.13v2.17s-1.09.27-1.16.28c-.08.02-.13.09-.13.17v1.36c0 .11.08.19.17.19h1.11v3.28c0 2.44 1.7 2.69 2.86 2.69.53 0 1.17-.17 1.27-.22.06-.02.09-.09.09-.16v-1.5a.177.177 0 00-.146-.18zM42.23 9.84c0-1.81-.73-2.05-1.5-1.97-.6.04-1.08.34-1.08.34v3.52s.49.34 1.22.36c1.03.03 1.36-.34 1.36-2.25zm2.43-.16c0 3.43-1.11 4.41-3.05 4.41-1.64 0-2.52-.83-2.52-.83s-.04.46-.09.52c-.03.06-.08.08-.14.08h-1.48c-.1 0-.19-.08-.19-.17l.02-11.11c0-.09.08-.17.17-.17h2.13c.09 0 .17.08.17.17v3.77s.82-.53 2.02-.53l-.01-.02c1.2 0 2.97.45 2.97 3.88zm-8.72-3.61h-2.1c-.11 0-.17.08-.17.19v5.44s-.55.39-1.3.39-.97-.34-.97-1.09V6.25c0-.09-.08-.17-.17-.17h-2.14c-.09 0-.17.08-.17.17v5.11c0 2.2 1.23 2.75 2.92 2.75 1.39 0 2.52-.77 2.52-.77s.05.39.08.45c.02.05.09.09.16.09h1.34c.11 0 .17-.08.17-.17l.02-7.47c0-.09-.08-.17-.19-.17zm-23.7-.01h-2.13c-.09 0-.17.09-.17.2v7.34c0 .2.13.27.3.27h1.92c.2 0 .25-.09.25-.27V6.23c0-.09-.08-.17-.17-.17zm-1.05-3.38c-.77 0-1.38.61-1.38 1.38 0 .77.61 1.38 1.38 1.38.75 0 1.36-.61 1.36-1.38 0-.77-.61-1.38-1.36-1.38zm16.49-.25h-2.11c-.09 0-.17.08-.17.17v4.09h-3.31V2.6c0-.09-.08-.17-.17-.17h-2.13c-.09 0-.17.08-.17.17v11.11c0 .09.09.17.17.17h2.13c.09 0 .17-.08.17-.17V8.96h3.31l-.02 4.75c0 .09.08.17.17.17h2.13c.09 0 .17-.08.17-.17V2.6c0-.09-.08-.17-.17-.17zM8.81 7.35v5.74c0 .04-.01.11-.06.13 0 0-1.25.89-3.31.89-2.49 0-5.44-.78-5.44-5.92S2.58 1.99 5.1 2c2.18 0 3.06.49 3.2.58.04.05.06.09.06.14L7.94 4.5c0 .09-.09.2-.2.17-.36-.11-.9-.33-2.17-.33-1.47 0-3.05.42-3.05 3.73s1.5 3.7 2.58 3.7c.92 0 1.25-.11 1.25-.11v-2.3H4.88c-.11 0-.19-.08-.19-.17V7.35c0-.09.08-.17.19-.17h3.74c.11 0 .19.08.19.17z"></path></svg>
  <svg height="24" class="octicon octicon-logo-gist v-align-middle d-none d-md-inline-block" viewBox="0 0 25 16" version="1.1" width="37" aria-hidden="true"><path fill-rule="evenodd" d="M4.7 8.73h2.45v4.02c-.55.27-1.64.34-2.53.34-2.56 0-3.47-2.2-3.47-5.05 0-2.85.91-5.06 3.48-5.06 1.28 0 2.06.23 3.28.73V2.66C7.27 2.33 6.25 2 4.63 2 1.13 2 0 4.69 0 8.03c0 3.34 1.11 6.03 4.63 6.03 1.64 0 2.81-.27 3.59-.64V7.73H4.7v1zm6.39 3.72V6.06h-1.05v6.28c0 1.25.58 1.72 1.72 1.72v-.89c-.48 0-.67-.16-.67-.7v-.02zm.25-8.72c0-.44-.33-.78-.78-.78s-.77.34-.77.78.33.78.77.78.78-.34.78-.78zm4.34 5.69c-1.5-.13-1.78-.48-1.78-1.17 0-.77.33-1.34 1.88-1.34 1.05 0 1.66.16 2.27.36v-.94c-.69-.3-1.52-.39-2.25-.39-2.2 0-2.92 1.2-2.92 2.31 0 1.08.47 1.88 2.73 2.08 1.55.13 1.77.63 1.77 1.34 0 .73-.44 1.42-2.06 1.42-1.11 0-1.86-.19-2.33-.36v.94c.5.2 1.58.39 2.33.39 2.38 0 3.14-1.2 3.14-2.41 0-1.28-.53-2.03-2.75-2.23h-.03zm8.58-2.47v-.86h-2.42v-2.5l-1.08.31v2.11l-1.56.44v.48h1.56v5c0 1.53 1.19 2.13 2.5 2.13.19 0 .52-.02.69-.05v-.89c-.19.03-.41.03-.61.03-.97 0-1.5-.39-1.5-1.34V6.94h2.42v.02-.01z"></path></svg>
</a>
  </div>

  <div class="Header-item d-md-none">
    <button class="Header-link btn-link js-details-target" type="button" aria-label="Toggle navigation" aria-expanded="false">
      <svg aria-hidden="true" viewBox="0 0 16 16" version="1.1" data-view-component="true" height="24" width="24" class="octicon octicon-three-bars">
    <path fill-rule="evenodd" d="M1 2.75A.75.75 0 011.75 2h12.5a.75.75 0 110 1.5H1.75A.75.75 0 011 2.75zm0 5A.75.75 0 011.75 7h12.5a.75.75 0 110 1.5H1.75A.75.75 0 011 7.75zM1.75 12a.75.75 0 100 1.5h12.5a.75.75 0 100-1.5H1.75z"></path>
</svg>
    </button>
  </div>

  <div class="Header-item Header-item--full js-site-search flex-column flex-md-row width-full flex-order-2 flex-md-order-none mr-0 mr-md-3 mt-3 mt-md-0 Details-content--hidden-not-important d-md-flex">
      <div class="header-search flex-self-stretch flex-md-self-auto mr-0 mr-md-3 mb-3 mb-md-0">
  <!-- '"` --><!-- </textarea></xmp> --></option></form><form class="position-relative js-quicksearch-form" role="search" aria-label="Site" action="/search" accept-charset="UTF-8" method="get">
    <div class="header-search-wrapper form-control input-sm js-chromeless-input-container">
      <input type="text"
        class="form-control input-sm js-site-search-focus header-search-input"
        data-hotkey="s,/"
        name="q"
        aria-label="Search"
        placeholder="Search…"
        autocorrect="off"
        autocomplete="off"
        autocapitalize="off">
    </div>

</form></div>

    <nav aria-label="Global" class="d-flex flex-column flex-md-row flex-self-stretch flex-md-self-auto">
  <a class="Header-link mr-0 mr-md-3 py-2 py-md-0 border-top border-md-top-0 border-white-fade" data-ga-click="Header, go to all gists, text:all gists" href="/discover">All gists</a>

  <a class="Header-link mr-0 mr-md-3 py-2 py-md-0 border-top border-md-top-0 border-white-fade" data-ga-click="Header, go to GitHub, text:Back to GitHub" href="https://github.com">Back to GitHub</a>

    <a class="Header-link d-block d-md-none mr-0 mr-md-3 py-2 py-md-0 border-top border-md-top-0 border-white-fade" data-ga-click="Header, sign in" data-hydro-click="{&quot;event_type&quot;:&quot;authentication.click&quot;,&quot;payload&quot;:{&quot;location_in_page&quot;:&quot;gist header&quot;,&quot;repository_id&quot;:null,&quot;auth_type&quot;:&quot;LOG_IN&quot;,&quot;originating_url&quot;:&quot;https://gist.github.com/russmckendrick/c6320315431afd19a0ee10132e086673&quot;,&quot;user_id&quot;:null}}" data-hydro-click-hmac="cf01ec2cc77f9152fd7c96e069704b5c061db38945dfa004d079cb8b456639bb" href="https://gist.github.com/auth/github?return_to=https%3A%2F%2Fgist.github.com%2Frussmckendrick%2Fc6320315431afd19a0ee10132e086673%2F">
      Sign in
</a>
      <a class="Header-link d-block d-md-none mr-0 mr-md-3 py-2 py-md-0 border-top border-md-top-0 border-white-fade" data-ga-click="Header, sign up" data-hydro-click="{&quot;event_type&quot;:&quot;authentication.click&quot;,&quot;payload&quot;:{&quot;location_in_page&quot;:&quot;gist header&quot;,&quot;repository_id&quot;:null,&quot;auth_type&quot;:&quot;SIGN_UP&quot;,&quot;originating_url&quot;:&quot;https://gist.github.com/russmckendrick/c6320315431afd19a0ee10132e086673&quot;,&quot;user_id&quot;:null}}" data-hydro-click-hmac="9d0334c939847410dbc61785bc9ce5cbad8fc169f24470d700704e8345cfd9bc" href="/join?return_to=https%3A%2F%2Fgist.github.com%2Frussmckendrick%2Fc6320315431afd19a0ee10132e086673%2F&amp;source=header-gist">
        Sign up
</a></nav>

  </div>

  <div class="Header-item Header-item--full flex-justify-center d-md-none position-relative">
    <a class="Header-link" data-hotkey="g d" aria-label="Gist Homepage " href="/">
  <svg class="octicon octicon-mark-github v-align-middle d-inline-block d-md-none" height="24" viewBox="0 0 16 16" version="1.1" width="24" aria-hidden="true"><path fill-rule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path></svg>
  <svg height="24" class="octicon octicon-logo-github v-align-middle d-none d-md-inline-block" viewBox="0 0 45 16" version="1.1" width="67" aria-hidden="true"><path fill-rule="evenodd" d="M18.53 12.03h-.02c.009 0 .015.01.024.011h.006l-.01-.01zm.004.011c-.093.001-.327.05-.574.05-.78 0-1.05-.36-1.05-.83V8.13h1.59c.09 0 .16-.08.16-.19v-1.7c0-.09-.08-.17-.16-.17h-1.59V3.96c0-.08-.05-.13-.14-.13h-2.16c-.09 0-.14.05-.14.13v2.17s-1.09.27-1.16.28c-.08.02-.13.09-.13.17v1.36c0 .11.08.19.17.19h1.11v3.28c0 2.44 1.7 2.69 2.86 2.69.53 0 1.17-.17 1.27-.22.06-.02.09-.09.09-.16v-1.5a.177.177 0 00-.146-.18zM42.23 9.84c0-1.81-.73-2.05-1.5-1.97-.6.04-1.08.34-1.08.34v3.52s.49.34 1.22.36c1.03.03 1.36-.34 1.36-2.25zm2.43-.16c0 3.43-1.11 4.41-3.05 4.41-1.64 0-2.52-.83-2.52-.83s-.04.46-.09.52c-.03.06-.08.08-.14.08h-1.48c-.1 0-.19-.08-.19-.17l.02-11.11c0-.09.08-.17.17-.17h2.13c.09 0 .17.08.17.17v3.77s.82-.53 2.02-.53l-.01-.02c1.2 0 2.97.45 2.97 3.88zm-8.72-3.61h-2.1c-.11 0-.17.08-.17.19v5.44s-.55.39-1.3.39-.97-.34-.97-1.09V6.25c0-.09-.08-.17-.17-.17h-2.14c-.09 0-.17.08-.17.17v5.11c0 2.2 1.23 2.75 2.92 2.75 1.39 0 2.52-.77 2.52-.77s.05.39.08.45c.02.05.09.09.16.09h1.34c.11 0 .17-.08.17-.17l.02-7.47c0-.09-.08-.17-.19-.17zm-23.7-.01h-2.13c-.09 0-.17.09-.17.2v7.34c0 .2.13.27.3.27h1.92c.2 0 .25-.09.25-.27V6.23c0-.09-.08-.17-.17-.17zm-1.05-3.38c-.77 0-1.38.61-1.38 1.38 0 .77.61 1.38 1.38 1.38.75 0 1.36-.61 1.36-1.38 0-.77-.61-1.38-1.36-1.38zm16.49-.25h-2.11c-.09 0-.17.08-.17.17v4.09h-3.31V2.6c0-.09-.08-.17-.17-.17h-2.13c-.09 0-.17.08-.17.17v11.11c0 .09.09.17.17.17h2.13c.09 0 .17-.08.17-.17V8.96h3.31l-.02 4.75c0 .09.08.17.17.17h2.13c.09 0 .17-.08.17-.17V2.6c0-.09-.08-.17-.17-.17zM8.81 7.35v5.74c0 .04-.01.11-.06.13 0 0-1.25.89-3.31.89-2.49 0-5.44-.78-5.44-5.92S2.58 1.99 5.1 2c2.18 0 3.06.49 3.2.58.04.05.06.09.06.14L7.94 4.5c0 .09-.09.2-.2.17-.36-.11-.9-.33-2.17-.33-1.47 0-3.05.42-3.05 3.73s1.5 3.7 2.58 3.7c.92 0 1.25-.11 1.25-.11v-2.3H4.88c-.11 0-.19-.08-.19-.17V7.35c0-.09.08-.17.19-.17h3.74c.11 0 .19.08.19.17z"></path></svg>
  <svg height="24" class="octicon octicon-logo-gist v-align-middle d-none d-md-inline-block" viewBox="0 0 25 16" version="1.1" width="37" aria-hidden="true"><path fill-rule="evenodd" d="M4.7 8.73h2.45v4.02c-.55.27-1.64.34-2.53.34-2.56 0-3.47-2.2-3.47-5.05 0-2.85.91-5.06 3.48-5.06 1.28 0 2.06.23 3.28.73V2.66C7.27 2.33 6.25 2 4.63 2 1.13 2 0 4.69 0 8.03c0 3.34 1.11 6.03 4.63 6.03 1.64 0 2.81-.27 3.59-.64V7.73H4.7v1zm6.39 3.72V6.06h-1.05v6.28c0 1.25.58 1.72 1.72 1.72v-.89c-.48 0-.67-.16-.67-.7v-.02zm.25-8.72c0-.44-.33-.78-.78-.78s-.77.34-.77.78.33.78.77.78.78-.34.78-.78zm4.34 5.69c-1.5-.13-1.78-.48-1.78-1.17 0-.77.33-1.34 1.88-1.34 1.05 0 1.66.16 2.27.36v-.94c-.69-.3-1.52-.39-2.25-.39-2.2 0-2.92 1.2-2.92 2.31 0 1.08.47 1.88 2.73 2.08 1.55.13 1.77.63 1.77 1.34 0 .73-.44 1.42-2.06 1.42-1.11 0-1.86-.19-2.33-.36v.94c.5.2 1.58.39 2.33.39 2.38 0 3.14-1.2 3.14-2.41 0-1.28-.53-2.03-2.75-2.23h-.03zm8.58-2.47v-.86h-2.42v-2.5l-1.08.31v2.11l-1.56.44v.48h1.56v5c0 1.53 1.19 2.13 2.5 2.13.19 0 .52-.02.69-.05v-.89c-.19.03-.41.03-.61.03-.97 0-1.5-.39-1.5-1.34V6.94h2.42v.02-.01z"></path></svg>
</a>
  </div>

    <div class="Header-item f4 mr-0" role="navigation">
      <a class="HeaderMenu-link no-underline mr-3" data-ga-click="Header, sign in" data-hydro-click="{&quot;event_type&quot;:&quot;authentication.click&quot;,&quot;payload&quot;:{&quot;location_in_page&quot;:&quot;gist header&quot;,&quot;repository_id&quot;:null,&quot;auth_type&quot;:&quot;LOG_IN&quot;,&quot;originating_url&quot;:&quot;https://gist.github.com/russmckendrick/c6320315431afd19a0ee10132e086673&quot;,&quot;user_id&quot;:null}}" data-hydro-click-hmac="cf01ec2cc77f9152fd7c96e069704b5c061db38945dfa004d079cb8b456639bb" href="https://gist.github.com/auth/github?return_to=https%3A%2F%2Fgist.github.com%2Frussmckendrick%2Fc6320315431afd19a0ee10132e086673%2F">
        Sign&nbsp;in
</a>        <a class="HeaderMenu-link d-inline-block no-underline border color-border-tertiary rounded px-2 py-1" data-ga-click="Header, sign up" data-hydro-click="{&quot;event_type&quot;:&quot;authentication.click&quot;,&quot;payload&quot;:{&quot;location_in_page&quot;:&quot;gist header&quot;,&quot;repository_id&quot;:null,&quot;auth_type&quot;:&quot;SIGN_UP&quot;,&quot;originating_url&quot;:&quot;https://gist.github.com/russmckendrick/c6320315431afd19a0ee10132e086673&quot;,&quot;user_id&quot;:null}}" data-hydro-click-hmac="9d0334c939847410dbc61785bc9ce5cbad8fc169f24470d700704e8345cfd9bc" href="/join?return_to=https%3A%2F%2Fgist.github.com%2Frussmckendrick%2Fc6320315431afd19a0ee10132e086673%2F&amp;source=header-gist">
          Sign&nbsp;up
</a>    </div>
</div>

    </div>

  <div id="start-of-content" class="show-on-focus"></div>

    <div data-pjax-replace id="js-flash-container">

  <template class="js-flash-template">
    <div class="flash flash-full  {{ className }}">
  <div class="container-lg px-2" >
    <button class="flash-close js-flash-close" type="button" aria-label="Dismiss this message">
      <svg aria-hidden="true" viewBox="0 0 16 16" version="1.1" data-view-component="true" height="16" width="16" class="octicon octicon-x">
    <path fill-rule="evenodd" d="M3.72 3.72a.75.75 0 011.06 0L8 6.94l3.22-3.22a.75.75 0 111.06 1.06L9.06 8l3.22 3.22a.75.75 0 11-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 01-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 010-1.06z"></path>
</svg>
    </button>
    
      <div>{{ message }}</div>

  </div>
</div>
  </template>
</div>

    

  <include-fragment class="js-notification-shelf-include-fragment" data-base-src="https://github.com/notifications/beta/shelf"></include-fragment>

  <div
    class="application-main "
    data-commit-hovercards-enabled
    data-discussion-hovercards-enabled
    data-issue-and-pr-hovercards-enabled
  >
        <div itemscope itemtype="http://schema.org/Code">
    <main id="gist-pjax-container" data-pjax-container>
      

  <div class="gist-detail-intro gist-banner pb-3">
    <div class="text-center container-lg px-3">
      <p class="lead">
        Instantly share code, notes, and snippets.
      </p>
    </div>
  </div>

<div class="gisthead pagehead color-bg-secondary pb-0 pt-3 mb-4">
  <div class="px-0">
    
  

<div class="mb-3 d-flex px-3 px-md-3 px-lg-5">
  <div class="flex-auto min-width-0 width-fit mr-3">
    <div class="d-flex">
      <div class="d-none d-md-block">
        <a class="avatar mr-2 flex-shrink-0" data-hovercard-type="user" data-hovercard-url="/users/russmckendrick/hovercard" data-octo-click="hovercard-link-click" data-octo-dimensions="link_type:self" href="/russmckendrick"><img class=" avatar-user" src="https://avatars.githubusercontent.com/u/121128?s=64&amp;v=4" width="32" height="32" alt="@russmckendrick" /></a>
      </div>
      <div class="d-flex flex-column">
        <h1 class="break-word f3 text-normal mb-md-0 mb-1">
          <span class="author"><a data-hovercard-type="user" data-hovercard-url="/users/russmckendrick/hovercard" data-octo-click="hovercard-link-click" data-octo-dimensions="link_type:self" href="/russmckendrick">russmckendrick</a></span><!--
              --><span class="mx-1 color-text-secondary">/</span><!--
              --><strong itemprop="name" class="css-truncate-target mr-1" style="max-width: 410px"><a href="/russmckendrick/c6320315431afd19a0ee10132e086673">docker-compose.yml</a></strong>
        </h1>
        <div class="note m-0">
          Last active <time-ago datetime="2016-06-25T18:23:49Z" data-view-component="true" class="no-wrap">Jun 25, 2016</time-ago>
        </div>
      </div>
    </div>
  </div>

  <ul class="d-md-flex d-none pagehead-actions float-none">

    <li>
        <a class="btn btn-sm btn-with-count tooltipped tooltipped-n" aria-label="You must be signed in to star a gist" rel="nofollow" data-hydro-click="{&quot;event_type&quot;:&quot;authentication.click&quot;,&quot;payload&quot;:{&quot;location_in_page&quot;:&quot;gist star button&quot;,&quot;repository_id&quot;:null,&quot;auth_type&quot;:&quot;LOG_IN&quot;,&quot;originating_url&quot;:&quot;https://gist.github.com/russmckendrick/c6320315431afd19a0ee10132e086673&quot;,&quot;user_id&quot;:null}}" data-hydro-click-hmac="a48c689d5c15facc9e8553b7a84477253aab1819668f80d6113ee9c4b336a5ca" href="/login?return_to=https%3A%2F%2Fgist.github.com%2Frussmckendrick%2Fc6320315431afd19a0ee10132e086673%2F">
    <svg aria-hidden="true" viewBox="0 0 16 16" version="1.1" data-view-component="true" height="16" width="16" class="octicon octicon-star">
    <path fill-rule="evenodd" d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25zm0 2.445L6.615 5.5a.75.75 0 01-.564.41l-3.097.45 2.24 2.184a.75.75 0 01.216.664l-.528 3.084 2.769-1.456a.75.75 0 01.698 0l2.77 1.456-.53-3.084a.75.75 0 01.216-.664l2.24-2.183-3.096-.45a.75.75 0 01-.564-.41L8 2.694v.001z"></path>
</svg>
    Star
</a>
    <a class="social-count" aria-label="0 users starred this gist" href="/russmckendrick/c6320315431afd19a0ee10132e086673/stargazers">
      0
</a>
    </li>

      <li>
          <a class="btn btn-sm btn-with-count tooltipped tooltipped-n" aria-label="You must be signed in to fork a gist" rel="nofollow" data-hydro-click="{&quot;event_type&quot;:&quot;authentication.click&quot;,&quot;payload&quot;:{&quot;location_in_page&quot;:&quot;gist fork button&quot;,&quot;repository_id&quot;:null,&quot;auth_type&quot;:&quot;LOG_IN&quot;,&quot;originating_url&quot;:&quot;https://gist.github.com/russmckendrick/c6320315431afd19a0ee10132e086673&quot;,&quot;user_id&quot;:null}}" data-hydro-click-hmac="47f7308ce3778bbe17cc378483e62271b71ed9273ef58c07bad2d94864c5c737" href="/login?return_to=https%3A%2F%2Fgist.github.com%2Frussmckendrick%2Fc6320315431afd19a0ee10132e086673%2F">
    <svg aria-hidden="true" viewBox="0 0 16 16" version="1.1" data-view-component="true" height="16" width="16" class="octicon octicon-repo-forked">
    <path fill-rule="evenodd" d="M5 3.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm0 2.122a2.25 2.25 0 10-1.5 0v.878A2.25 2.25 0 005.75 8.5h1.5v2.128a2.251 2.251 0 101.5 0V8.5h1.5a2.25 2.25 0 002.25-2.25v-.878a2.25 2.25 0 10-1.5 0v.878a.75.75 0 01-.75.75h-4.5A.75.75 0 015 6.25v-.878zm3.75 7.378a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm3-8.75a.75.75 0 100-1.5.75.75 0 000 1.5z"></path>
</svg>
    Fork
</a>    <span class="social-count">0</span>

      </li>
  </ul>
</div>

<div class="d-block d-md-none px-3 px-md-3 px-lg-5 mb-3">
    <a class="btn btn-sm btn-block tooltipped tooltipped-n" aria-label="You must be signed in to star a gist" rel="nofollow" data-hydro-click="{&quot;event_type&quot;:&quot;authentication.click&quot;,&quot;payload&quot;:{&quot;location_in_page&quot;:&quot;gist star button&quot;,&quot;repository_id&quot;:null,&quot;auth_type&quot;:&quot;LOG_IN&quot;,&quot;originating_url&quot;:&quot;https://gist.github.com/russmckendrick/c6320315431afd19a0ee10132e086673&quot;,&quot;user_id&quot;:null}}" data-hydro-click-hmac="a48c689d5c15facc9e8553b7a84477253aab1819668f80d6113ee9c4b336a5ca" href="/login?return_to=https%3A%2F%2Fgist.github.com%2Frussmckendrick%2Fc6320315431afd19a0ee10132e086673%2F">
    <svg aria-hidden="true" viewBox="0 0 16 16" version="1.1" data-view-component="true" height="16" width="16" class="octicon octicon-star">
    <path fill-rule="evenodd" d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25zm0 2.445L6.615 5.5a.75.75 0 01-.564.41l-3.097.45 2.24 2.184a.75.75 0 01.216.664l-.528 3.084 2.769-1.456a.75.75 0 01.698 0l2.77 1.456-.53-3.084a.75.75 0 01.216-.664l2.24-2.183-3.096-.45a.75.75 0 01-.564-.41L8 2.694v.001z"></path>
</svg>
    Star
</a>

</div>

<div class="d-flex flex-md-row flex-column px-0 pr-md-3 px-lg-5">
  <div class="flex-md-order-1 flex-order-2 flex-auto">
    <nav class="UnderlineNav box-shadow-none px-3 px-lg-0 "
     aria-label="Gist"
     data-pjax="#gist-pjax-container">

  <div class="UnderlineNav-body">
    <a class="js-selected-navigation-item selected UnderlineNav-item" data-pjax="true" data-hotkey="g c" aria-current="page" data-selected-links="gist_code /russmckendrick/c6320315431afd19a0ee10132e086673" href="/russmckendrick/c6320315431afd19a0ee10132e086673">
      <svg aria-hidden="true" viewBox="0 0 16 16" version="1.1" data-view-component="true" height="16" width="16" class="octicon octicon-code UnderlineNav-octicon">
    <path fill-rule="evenodd" d="M4.72 3.22a.75.75 0 011.06 1.06L2.06 8l3.72 3.72a.75.75 0 11-1.06 1.06L.47 8.53a.75.75 0 010-1.06l4.25-4.25zm6.56 0a.75.75 0 10-1.06 1.06L13.94 8l-3.72 3.72a.75.75 0 101.06 1.06l4.25-4.25a.75.75 0 000-1.06l-4.25-4.25z"></path>
</svg>
      Code
</a>
      <a class="js-selected-navigation-item UnderlineNav-item" data-pjax="true" data-hotkey="g r" data-selected-links="gist_revisions /russmckendrick/c6320315431afd19a0ee10132e086673/revisions" href="/russmckendrick/c6320315431afd19a0ee10132e086673/revisions">
        <svg aria-hidden="true" viewBox="0 0 16 16" version="1.1" data-view-component="true" height="16" width="16" class="octicon octicon-git-commit">
    <path fill-rule="evenodd" d="M10.5 7.75a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zm1.43.75a4.002 4.002 0 01-7.86 0H.75a.75.75 0 110-1.5h3.32a4.001 4.001 0 017.86 0h3.32a.75.75 0 110 1.5h-3.32z"></path>
</svg>
        Revisions
        <span title="4" data-view-component="true" class="Counter hx_reponav_item_counter">4</span>
</a>

  </div>
</nav>

  </div>

  <div class="d-md-flex d-none flex-items-center flex-md-order-2 flex-order-1 file-navigation-options" data-multiple>

    <div class="d-lg-table d-none">
      <div class="file-navigation-option v-align-middle">

  <div class="d-md-flex d-none">
    <div class="input-group">
      <div class="input-group-button">
        <details class="details-reset details-overlay select-menu">
          <summary class="btn btn-sm select-menu-button" data-ga-click="Repository, clone Embed, location:repo overview">
            <span data-menu-button>Embed</span>
          </summary>
          <details-menu
            class="select-menu-modal position-absolute"
            data-menu-input="gist-share-url"
            style="z-index: 99;" aria-label="Clone options">
            <div class="select-menu-header">
              <span class="select-menu-title">What would you like to do?</span>
            </div>
            <div class="select-menu-list">
                <button name="button" type="button" class="select-menu-item width-full" aria-checked="true" role="menuitemradio" value="&lt;script src=&quot;https://gist.github.com/russmckendrick/c6320315431afd19a0ee10132e086673.js&quot;&gt;&lt;/script&gt;" data-hydro-click="{&quot;event_type&quot;:&quot;clone_or_download.click&quot;,&quot;payload&quot;:{&quot;feature_clicked&quot;:&quot;EMBED&quot;,&quot;git_repository_type&quot;:&quot;GIST&quot;,&quot;gist_id&quot;:37150325,&quot;originating_url&quot;:&quot;https://gist.github.com/russmckendrick/c6320315431afd19a0ee10132e086673&quot;,&quot;user_id&quot;:null}}" data-hydro-click-hmac="de2bd46b2206f2e07835801870b9f8a7cc67bbfbdd41b867280d2355a3026c90">
                  <svg aria-hidden="true" viewBox="0 0 16 16" version="1.1" data-view-component="true" height="16" width="16" class="octicon octicon-check select-menu-item-icon">
    <path fill-rule="evenodd" d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z"></path>
</svg>
                  <div class="select-menu-item-text">
                    <span class="select-menu-item-heading" data-menu-button-text>
                      
                      Embed
                    </span>
                      <span class="description">
                        Embed this gist in your website.
                      </span>
                  </div>
</button>                <button name="button" type="button" class="select-menu-item width-full" aria-checked="false" role="menuitemradio" value="https://gist.github.com/russmckendrick/c6320315431afd19a0ee10132e086673" data-hydro-click="{&quot;event_type&quot;:&quot;clone_or_download.click&quot;,&quot;payload&quot;:{&quot;feature_clicked&quot;:&quot;SHARE&quot;,&quot;git_repository_type&quot;:&quot;GIST&quot;,&quot;gist_id&quot;:37150325,&quot;originating_url&quot;:&quot;https://gist.github.com/russmckendrick/c6320315431afd19a0ee10132e086673&quot;,&quot;user_id&quot;:null}}" data-hydro-click-hmac="bd14e934d5c3174f385bc964fffea25a960b7b414dcd1852a2208aeb134dbb7e">
                  <svg aria-hidden="true" viewBox="0 0 16 16" version="1.1" data-view-component="true" height="16" width="16" class="octicon octicon-check select-menu-item-icon">
    <path fill-rule="evenodd" d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z"></path>
</svg>
                  <div class="select-menu-item-text">
                    <span class="select-menu-item-heading" data-menu-button-text>
                      
                      Share
                    </span>
                      <span class="description">
                        Copy sharable link for this gist.
                      </span>
                  </div>
</button>                <button name="button" type="button" class="select-menu-item width-full" aria-checked="false" role="menuitemradio" value="https://gist.github.com/c6320315431afd19a0ee10132e086673.git" data-hydro-click="{&quot;event_type&quot;:&quot;clone_or_download.click&quot;,&quot;payload&quot;:{&quot;feature_clicked&quot;:&quot;USE_HTTPS&quot;,&quot;git_repository_type&quot;:&quot;GIST&quot;,&quot;gist_id&quot;:37150325,&quot;originating_url&quot;:&quot;https://gist.github.com/russmckendrick/c6320315431afd19a0ee10132e086673&quot;,&quot;user_id&quot;:null}}" data-hydro-click-hmac="2da0aca5e2625fb2e2ed70023f612ae0404bb864e0544c50a9997f007aac75a5">
                  <svg aria-hidden="true" viewBox="0 0 16 16" version="1.1" data-view-component="true" height="16" width="16" class="octicon octicon-check select-menu-item-icon">
    <path fill-rule="evenodd" d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z"></path>
</svg>
                  <div class="select-menu-item-text">
                    <span class="select-menu-item-heading" data-menu-button-text>
                      Clone via
                      HTTPS
                    </span>
                      <span class="description">
                        Clone with Git or checkout with SVN using the repository’s web address.
                      </span>
                  </div>
</button>            </div>
            <div class="select-menu-list">
              <a role="link" class="select-menu-item select-menu-action" href="https://docs.github.com/articles/which-remote-url-should-i-use" target="_blank">
                <svg aria-hidden="true" viewBox="0 0 16 16" version="1.1" data-view-component="true" height="16" width="16" class="octicon octicon-question select-menu-item-icon">
    <path fill-rule="evenodd" d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8zm9 3a1 1 0 11-2 0 1 1 0 012 0zM6.92 6.085c.081-.16.19-.299.34-.398.145-.097.371-.187.74-.187.28 0 .553.087.738.225A.613.613 0 019 6.25c0 .177-.04.264-.077.318a.956.956 0 01-.277.245c-.076.051-.158.1-.258.161l-.007.004a7.728 7.728 0 00-.313.195 2.416 2.416 0 00-.692.661.75.75 0 001.248.832.956.956 0 01.276-.245 6.3 6.3 0 01.26-.16l.006-.004c.093-.057.204-.123.313-.195.222-.149.487-.355.692-.662.214-.32.329-.702.329-1.15 0-.76-.36-1.348-.863-1.725A2.76 2.76 0 008 4c-.631 0-1.155.16-1.572.438-.413.276-.68.638-.849.977a.75.75 0 101.342.67z"></path>
</svg>
                <div class="select-menu-item-text">
                  Learn more about clone URLs
                </div>
              </a>
            </div>
          </details-menu>
        </details>
      </div>

      <input
        id="gist-share-url"
        type="text"
        data-autoselect
        class="form-control input-monospace input-sm"
        value="&lt;script src=&quot;https://gist.github.com/russmckendrick/c6320315431afd19a0ee10132e086673.js&quot;&gt;&lt;/script&gt;"
        aria-label="Clone this repository at &lt;script src=&quot;https://gist.github.com/russmckendrick/c6320315431afd19a0ee10132e086673.js&quot;&gt;&lt;/script&gt;"
        readonly>

      <div class="input-group-button">
        <clipboard-copy for="gist-share-url" aria-label="Copy to clipboard" class="btn btn-sm zeroclipboard-button" data-hydro-click="{&quot;event_type&quot;:&quot;clone_or_download.click&quot;,&quot;payload&quot;:{&quot;feature_clicked&quot;:&quot;COPY_URL&quot;,&quot;git_repository_type&quot;:&quot;GIST&quot;,&quot;gist_id&quot;:37150325,&quot;originating_url&quot;:&quot;https://gist.github.com/russmckendrick/c6320315431afd19a0ee10132e086673&quot;,&quot;user_id&quot;:null}}" data-hydro-click-hmac="0e5cd1a7f085965a5972efd55528d4687ad50bb3f643cbbcb2c946f6128acc54"><svg aria-hidden="true" viewBox="0 0 16 16" version="1.1" data-view-component="true" height="16" width="16" class="octicon octicon-clippy">
    <path fill-rule="evenodd" d="M5.75 1a.75.75 0 00-.75.75v3c0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75v-3a.75.75 0 00-.75-.75h-4.5zm.75 3V2.5h3V4h-3zm-2.874-.467a.75.75 0 00-.752-1.298A1.75 1.75 0 002 3.75v9.5c0 .966.784 1.75 1.75 1.75h8.5A1.75 1.75 0 0014 13.25v-9.5a1.75 1.75 0 00-.874-1.515.75.75 0 10-.752 1.298.25.25 0 01.126.217v9.5a.25.25 0 01-.25.25h-8.5a.25.25 0 01-.25-.25v-9.5a.25.25 0 01.126-.217z"></path>
</svg></clipboard-copy>
      </div>
    </div>
  </div>
</div>

    </div>

    <div class="ml-2 file-navigation-option">
    <a class="btn btn-sm tooltipped tooltipped-s tooltipped-multiline js-remove-unless-platform" data-platforms="windows,mac" aria-label="Save russmckendrick/c6320315431afd19a0ee10132e086673 to your computer and use it in GitHub Desktop." data-hydro-click="{&quot;event_type&quot;:&quot;clone_or_download.click&quot;,&quot;payload&quot;:{&quot;feature_clicked&quot;:&quot;OPEN_IN_DESKTOP&quot;,&quot;git_repository_type&quot;:&quot;GIST&quot;,&quot;gist_id&quot;:37150325,&quot;originating_url&quot;:&quot;https://gist.github.com/russmckendrick/c6320315431afd19a0ee10132e086673&quot;,&quot;user_id&quot;:null}}" data-hydro-click-hmac="3ca6036019eae2e610d20d12398b41ea421bb99e1f862975742519f7f71aad4d" href="https://desktop.github.com"><svg aria-hidden="true" viewBox="0 0 16 16" version="1.1" data-view-component="true" height="16" width="16" class="octicon octicon-desktop-download">
    <path d="M4.927 5.427l2.896 2.896a.25.25 0 00.354 0l2.896-2.896A.25.25 0 0010.896 5H8.75V.75a.75.75 0 10-1.5 0V5H5.104a.25.25 0 00-.177.427z"></path><path d="M1.573 2.573a.25.25 0 00-.073.177v7.5a.25.25 0 00.25.25h12.5a.25.25 0 00.25-.25v-7.5a.25.25 0 00-.25-.25h-3a.75.75 0 110-1.5h3A1.75 1.75 0 0116 2.75v7.5A1.75 1.75 0 0114.25 12h-3.727c.099 1.041.52 1.872 1.292 2.757A.75.75 0 0111.25 16h-6.5a.75.75 0 01-.565-1.243c.772-.885 1.192-1.716 1.292-2.757H1.75A1.75 1.75 0 010 10.25v-7.5A1.75 1.75 0 011.75 1h3a.75.75 0 010 1.5h-3a.25.25 0 00-.177.073zM6.982 12a5.72 5.72 0 01-.765 2.5h3.566a5.72 5.72 0 01-.765-2.5H6.982z"></path>
</svg></a>
</div>

    <div class="ml-2">
      <a class="btn btn-sm" rel="nofollow" data-hydro-click="{&quot;event_type&quot;:&quot;clone_or_download.click&quot;,&quot;payload&quot;:{&quot;feature_clicked&quot;:&quot;DOWNLOAD_ZIP&quot;,&quot;git_repository_type&quot;:&quot;GIST&quot;,&quot;gist_id&quot;:37150325,&quot;originating_url&quot;:&quot;https://gist.github.com/russmckendrick/c6320315431afd19a0ee10132e086673&quot;,&quot;user_id&quot;:null}}" data-hydro-click-hmac="c694827d7b7759dec7d874afb70c0a263c83b6cce239248e4ec3cb7c50bd3870" data-ga-click="Gist, download zip, location:gist overview" href="/russmckendrick/c6320315431afd19a0ee10132e086673/archive/e3a8019a68c2122141cae14bcb84b4c20ef18fe6.zip">Download ZIP</a>
    </div>
  </div>
</div>

  </div>
</div>

<div class="container-lg px-3 new-discussion-timeline">
  <div class="repository-content gist-content" >
    
  <div>
    

        <div class="js-gist-file-update-container js-task-list-container file-box">
  <div id="file-docker-compose-yml" class="file my-2">
      <div class="file-header d-flex flex-md-items-center flex-items-start">
        <div class="file-actions flex-order-2 pt-0">

          <a href="/russmckendrick/c6320315431afd19a0ee10132e086673/raw/e3a8019a68c2122141cae14bcb84b4c20ef18fe6/docker-compose.yml" role="button" data-view-component="true" class="btn-sm btn">
  
  Raw
  

</a>
        </div>
        <div class="file-info pr-4 d-flex flex-md-items-center flex-items-start flex-order-1 flex-auto">
          <span class="mr-1">
            <svg class="octicon octicon-code-square color-icon-secondary" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path fill-rule="evenodd" d="M1.75 1.5a.25.25 0 00-.25.25v12.5c0 .138.112.25.25.25h12.5a.25.25 0 00.25-.25V1.75a.25.25 0 00-.25-.25H1.75zM0 1.75C0 .784.784 0 1.75 0h12.5C15.216 0 16 .784 16 1.75v12.5A1.75 1.75 0 0114.25 16H1.75A1.75 1.75 0 010 14.25V1.75zm9.22 3.72a.75.75 0 000 1.06L10.69 8 9.22 9.47a.75.75 0 101.06 1.06l2-2a.75.75 0 000-1.06l-2-2a.75.75 0 00-1.06 0zM6.78 6.53a.75.75 0 00-1.06-1.06l-2 2a.75.75 0 000 1.06l2 2a.75.75 0 101.06-1.06L5.31 8l1.47-1.47z"></path></svg>
          </span>
          <a class="wb-break-all" href="#file-docker-compose-yml">
            <strong class="user-select-contain gist-blob-name css-truncate-target">
              docker-compose.yml
            </strong>
          </a>
        </div>
      </div>
    
  <div itemprop="text" class="Box-body p-0 blob-wrapper data type-yaml  gist-border-0">

      
<table class="highlight tab-size js-file-line-container" data-tab-size="8" data-paste-markdown-skip>
      <tr>
        <td id="file-docker-compose-yml-L1" class="blob-num js-line-number" data-line-number="1"></td>
        <td id="file-docker-compose-yml-LC1" class="blob-code blob-code-inner js-file-line"><span class="pl-ent">version</span>: <span class="pl-s"><span class="pl-pds">&#39;</span>2<span class="pl-pds">&#39;</span></span></td>
      </tr>
      <tr>
        <td id="file-docker-compose-yml-L2" class="blob-num js-line-number" data-line-number="2"></td>
        <td id="file-docker-compose-yml-LC2" class="blob-code blob-code-inner js-file-line"><span class="pl-ent">services</span>:</td>
      </tr>
      <tr>
        <td id="file-docker-compose-yml-L3" class="blob-num js-line-number" data-line-number="3"></td>
        <td id="file-docker-compose-yml-LC3" class="blob-code blob-code-inner js-file-line">  <span class="pl-ent">wordpress</span>:</td>
      </tr>
      <tr>
        <td id="file-docker-compose-yml-L4" class="blob-num js-line-number" data-line-number="4"></td>
        <td id="file-docker-compose-yml-LC4" class="blob-code blob-code-inner js-file-line">    <span class="pl-ent">container_name</span>: <span class="pl-s">my-wordpress-app</span></td>
      </tr>
      <tr>
        <td id="file-docker-compose-yml-L5" class="blob-num js-line-number" data-line-number="5"></td>
        <td id="file-docker-compose-yml-LC5" class="blob-code blob-code-inner js-file-line">    <span class="pl-ent">image</span>: <span class="pl-s">wordpress</span></td>
      </tr>
      <tr>
        <td id="file-docker-compose-yml-L6" class="blob-num js-line-number" data-line-number="6"></td>
        <td id="file-docker-compose-yml-LC6" class="blob-code blob-code-inner js-file-line">    <span class="pl-ent">ports</span>: </td>
      </tr>
      <tr>
        <td id="file-docker-compose-yml-L7" class="blob-num js-line-number" data-line-number="7"></td>
        <td id="file-docker-compose-yml-LC7" class="blob-code blob-code-inner js-file-line">      - <span class="pl-s"><span class="pl-pds">&quot;</span>80:80<span class="pl-pds">&quot;</span></span></td>
      </tr>
      <tr>
        <td id="file-docker-compose-yml-L8" class="blob-num js-line-number" data-line-number="8"></td>
        <td id="file-docker-compose-yml-LC8" class="blob-code blob-code-inner js-file-line">    <span class="pl-ent">environment</span>:</td>
      </tr>
      <tr>
        <td id="file-docker-compose-yml-L9" class="blob-num js-line-number" data-line-number="9"></td>
        <td id="file-docker-compose-yml-LC9" class="blob-code blob-code-inner js-file-line">      - <span class="pl-s"><span class="pl-pds">&quot;</span>WORDPRESS_DB_HOST=mysql:3306<span class="pl-pds">&quot;</span></span></td>
      </tr>
      <tr>
        <td id="file-docker-compose-yml-L10" class="blob-num js-line-number" data-line-number="10"></td>
        <td id="file-docker-compose-yml-LC10" class="blob-code blob-code-inner js-file-line">      - <span class="pl-s"><span class="pl-pds">&quot;</span>WORDPRESS_DB_PASSWORD=password<span class="pl-pds">&quot;</span></span></td>
      </tr>
      <tr>
        <td id="file-docker-compose-yml-L11" class="blob-num js-line-number" data-line-number="11"></td>
        <td id="file-docker-compose-yml-LC11" class="blob-code blob-code-inner js-file-line">  <span class="pl-ent">mysql</span>:</td>
      </tr>
      <tr>
        <td id="file-docker-compose-yml-L12" class="blob-num js-line-number" data-line-number="12"></td>
        <td id="file-docker-compose-yml-LC12" class="blob-code blob-code-inner js-file-line">    <span class="pl-ent">container_name</span>: <span class="pl-s">my-wordpress-database</span></td>
      </tr>
      <tr>
        <td id="file-docker-compose-yml-L13" class="blob-num js-line-number" data-line-number="13"></td>
        <td id="file-docker-compose-yml-LC13" class="blob-code blob-code-inner js-file-line">    <span class="pl-ent">image</span>: <span class="pl-s">mysql</span></td>
      </tr>
      <tr>
        <td id="file-docker-compose-yml-L14" class="blob-num js-line-number" data-line-number="14"></td>
        <td id="file-docker-compose-yml-LC14" class="blob-code blob-code-inner js-file-line">    <span class="pl-ent">expose</span>:</td>
      </tr>
      <tr>
        <td id="file-docker-compose-yml-L15" class="blob-num js-line-number" data-line-number="15"></td>
        <td id="file-docker-compose-yml-LC15" class="blob-code blob-code-inner js-file-line">      - <span class="pl-s"><span class="pl-pds">&quot;</span>3306<span class="pl-pds">&quot;</span></span></td>
      </tr>
      <tr>
        <td id="file-docker-compose-yml-L16" class="blob-num js-line-number" data-line-number="16"></td>
        <td id="file-docker-compose-yml-LC16" class="blob-code blob-code-inner js-file-line">    <span class="pl-ent">environment</span>:</td>
      </tr>
      <tr>
        <td id="file-docker-compose-yml-L17" class="blob-num js-line-number" data-line-number="17"></td>
        <td id="file-docker-compose-yml-LC17" class="blob-code blob-code-inner js-file-line">      - <span class="pl-s"><span class="pl-pds">&quot;</span>MYSQL_ROOT_PASSWORD=password<span class="pl-pds">&quot;</span></span></td>
      </tr>
</table>

  </div>

  </div>
</div>

        <div class="js-gist-file-update-container js-task-list-container file-box">
  <div id="file-wordpress-dsb" class="file my-2">
      <div class="file-header d-flex flex-md-items-center flex-items-start">
        <div class="file-actions flex-order-2 pt-0">

          <a href="/russmckendrick/c6320315431afd19a0ee10132e086673/raw/e3a8019a68c2122141cae14bcb84b4c20ef18fe6/wordpress.dsb" role="button" data-view-component="true" class="btn-sm btn">
  
  Raw
  

</a>
        </div>
        <div class="file-info pr-4 d-flex flex-md-items-center flex-items-start flex-order-1 flex-auto">
          <span class="mr-1">
            <svg class="octicon octicon-code-square color-icon-secondary" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path fill-rule="evenodd" d="M1.75 1.5a.25.25 0 00-.25.25v12.5c0 .138.112.25.25.25h12.5a.25.25 0 00.25-.25V1.75a.25.25 0 00-.25-.25H1.75zM0 1.75C0 .784.784 0 1.75 0h12.5C15.216 0 16 .784 16 1.75v12.5A1.75 1.75 0 0114.25 16H1.75A1.75 1.75 0 010 14.25V1.75zm9.22 3.72a.75.75 0 000 1.06L10.69 8 9.22 9.47a.75.75 0 101.06 1.06l2-2a.75.75 0 000-1.06l-2-2a.75.75 0 00-1.06 0zM6.78 6.53a.75.75 0 00-1.06-1.06l-2 2a.75.75 0 000 1.06l2 2a.75.75 0 101.06-1.06L5.31 8l1.47-1.47z"></path></svg>
          </span>
          <a class="wb-break-all" href="#file-wordpress-dsb">
            <strong class="user-select-contain gist-blob-name css-truncate-target">
              wordpress.dsb
            </strong>
          </a>
        </div>
      </div>
    
  <div itemprop="text" class="Box-body p-0 blob-wrapper data type-text  gist-border-0">

      
<table class="highlight tab-size js-file-line-container" data-tab-size="8" data-paste-markdown-skip>
      <tr>
        <td id="file-wordpress-dsb-L1" class="blob-num js-line-number" data-line-number="1"></td>
        <td id="file-wordpress-dsb-LC1" class="blob-code blob-code-inner js-file-line">{</td>
      </tr>
      <tr>
        <td id="file-wordpress-dsb-L2" class="blob-num js-line-number" data-line-number="2"></td>
        <td id="file-wordpress-dsb-LC2" class="blob-code blob-code-inner js-file-line">  &quot;services&quot;: {</td>
      </tr>
      <tr>
        <td id="file-wordpress-dsb-L3" class="blob-num js-line-number" data-line-number="3"></td>
        <td id="file-wordpress-dsb-LC3" class="blob-code blob-code-inner js-file-line">    &quot;mysql&quot;: {</td>
      </tr>
      <tr>
        <td id="file-wordpress-dsb-L4" class="blob-num js-line-number" data-line-number="4"></td>
        <td id="file-wordpress-dsb-LC4" class="blob-code blob-code-inner js-file-line">      &quot;Env&quot;: [</td>
      </tr>
      <tr>
        <td id="file-wordpress-dsb-L5" class="blob-num js-line-number" data-line-number="5"></td>
        <td id="file-wordpress-dsb-LC5" class="blob-code blob-code-inner js-file-line">        &quot;MYSQL_ROOT_PASSWORD=password&quot;</td>
      </tr>
      <tr>
        <td id="file-wordpress-dsb-L6" class="blob-num js-line-number" data-line-number="6"></td>
        <td id="file-wordpress-dsb-LC6" class="blob-code blob-code-inner js-file-line">      ], </td>
      </tr>
      <tr>
        <td id="file-wordpress-dsb-L7" class="blob-num js-line-number" data-line-number="7"></td>
        <td id="file-wordpress-dsb-LC7" class="blob-code blob-code-inner js-file-line">      &quot;Image&quot;: &quot;mysql@sha256:a9a5b559f8821fe73d58c3606c812d1c044868d42c63817fa5125fd9d8b7b539&quot;, </td>
      </tr>
      <tr>
        <td id="file-wordpress-dsb-L8" class="blob-num js-line-number" data-line-number="8"></td>
        <td id="file-wordpress-dsb-LC8" class="blob-code blob-code-inner js-file-line">      &quot;Networks&quot;: [</td>
      </tr>
      <tr>
        <td id="file-wordpress-dsb-L9" class="blob-num js-line-number" data-line-number="9"></td>
        <td id="file-wordpress-dsb-LC9" class="blob-code blob-code-inner js-file-line">        &quot;default&quot;</td>
      </tr>
      <tr>
        <td id="file-wordpress-dsb-L10" class="blob-num js-line-number" data-line-number="10"></td>
        <td id="file-wordpress-dsb-LC10" class="blob-code blob-code-inner js-file-line">      ], </td>
      </tr>
      <tr>
        <td id="file-wordpress-dsb-L11" class="blob-num js-line-number" data-line-number="11"></td>
        <td id="file-wordpress-dsb-LC11" class="blob-code blob-code-inner js-file-line">      &quot;Ports&quot;: [</td>
      </tr>
      <tr>
        <td id="file-wordpress-dsb-L12" class="blob-num js-line-number" data-line-number="12"></td>
        <td id="file-wordpress-dsb-LC12" class="blob-code blob-code-inner js-file-line">        {</td>
      </tr>
      <tr>
        <td id="file-wordpress-dsb-L13" class="blob-num js-line-number" data-line-number="13"></td>
        <td id="file-wordpress-dsb-LC13" class="blob-code blob-code-inner js-file-line">          &quot;Port&quot;: 3306, </td>
      </tr>
      <tr>
        <td id="file-wordpress-dsb-L14" class="blob-num js-line-number" data-line-number="14"></td>
        <td id="file-wordpress-dsb-LC14" class="blob-code blob-code-inner js-file-line">          &quot;Protocol&quot;: &quot;tcp&quot;</td>
      </tr>
      <tr>
        <td id="file-wordpress-dsb-L15" class="blob-num js-line-number" data-line-number="15"></td>
        <td id="file-wordpress-dsb-LC15" class="blob-code blob-code-inner js-file-line">        }</td>
      </tr>
      <tr>
        <td id="file-wordpress-dsb-L16" class="blob-num js-line-number" data-line-number="16"></td>
        <td id="file-wordpress-dsb-LC16" class="blob-code blob-code-inner js-file-line">      ]</td>
      </tr>
      <tr>
        <td id="file-wordpress-dsb-L17" class="blob-num js-line-number" data-line-number="17"></td>
        <td id="file-wordpress-dsb-LC17" class="blob-code blob-code-inner js-file-line">    }, </td>
      </tr>
      <tr>
        <td id="file-wordpress-dsb-L18" class="blob-num js-line-number" data-line-number="18"></td>
        <td id="file-wordpress-dsb-LC18" class="blob-code blob-code-inner js-file-line">    &quot;wordpress&quot;: {</td>
      </tr>
      <tr>
        <td id="file-wordpress-dsb-L19" class="blob-num js-line-number" data-line-number="19"></td>
        <td id="file-wordpress-dsb-LC19" class="blob-code blob-code-inner js-file-line">      &quot;Env&quot;: [</td>
      </tr>
      <tr>
        <td id="file-wordpress-dsb-L20" class="blob-num js-line-number" data-line-number="20"></td>
        <td id="file-wordpress-dsb-LC20" class="blob-code blob-code-inner js-file-line">        &quot;WORDPRESS_DB_HOST=mysql:3306&quot;, </td>
      </tr>
      <tr>
        <td id="file-wordpress-dsb-L21" class="blob-num js-line-number" data-line-number="21"></td>
        <td id="file-wordpress-dsb-LC21" class="blob-code blob-code-inner js-file-line">        &quot;WORDPRESS_DB_PASSWORD=password&quot;</td>
      </tr>
      <tr>
        <td id="file-wordpress-dsb-L22" class="blob-num js-line-number" data-line-number="22"></td>
        <td id="file-wordpress-dsb-LC22" class="blob-code blob-code-inner js-file-line">      ], </td>
      </tr>
      <tr>
        <td id="file-wordpress-dsb-L23" class="blob-num js-line-number" data-line-number="23"></td>
        <td id="file-wordpress-dsb-LC23" class="blob-code blob-code-inner js-file-line">      &quot;Image&quot;: &quot;wordpress@sha256:42e78527eda069e20ff1759286ce809d910509380e836ea97794eb5fa6311447&quot;, </td>
      </tr>
      <tr>
        <td id="file-wordpress-dsb-L24" class="blob-num js-line-number" data-line-number="24"></td>
        <td id="file-wordpress-dsb-LC24" class="blob-code blob-code-inner js-file-line">      &quot;Networks&quot;: [</td>
      </tr>
      <tr>
        <td id="file-wordpress-dsb-L25" class="blob-num js-line-number" data-line-number="25"></td>
        <td id="file-wordpress-dsb-LC25" class="blob-code blob-code-inner js-file-line">        &quot;default&quot;</td>
      </tr>
      <tr>
        <td id="file-wordpress-dsb-L26" class="blob-num js-line-number" data-line-number="26"></td>
        <td id="file-wordpress-dsb-LC26" class="blob-code blob-code-inner js-file-line">      ], </td>
      </tr>
      <tr>
        <td id="file-wordpress-dsb-L27" class="blob-num js-line-number" data-line-number="27"></td>
        <td id="file-wordpress-dsb-LC27" class="blob-code blob-code-inner js-file-line">      &quot;Ports&quot;: [</td>
      </tr>
      <tr>
        <td id="file-wordpress-dsb-L28" class="blob-num js-line-number" data-line-number="28"></td>
        <td id="file-wordpress-dsb-LC28" class="blob-code blob-code-inner js-file-line">        {</td>
      </tr>
      <tr>
        <td id="file-wordpress-dsb-L29" class="blob-num js-line-number" data-line-number="29"></td>
        <td id="file-wordpress-dsb-LC29" class="blob-code blob-code-inner js-file-line">          &quot;Port&quot;: 80, </td>
      </tr>
      <tr>
        <td id="file-wordpress-dsb-L30" class="blob-num js-line-number" data-line-number="30"></td>
        <td id="file-wordpress-dsb-LC30" class="blob-code blob-code-inner js-file-line">          &quot;Protocol&quot;: &quot;tcp&quot;</td>
      </tr>
      <tr>
        <td id="file-wordpress-dsb-L31" class="blob-num js-line-number" data-line-number="31"></td>
        <td id="file-wordpress-dsb-LC31" class="blob-code blob-code-inner js-file-line">        }</td>
      </tr>
      <tr>
        <td id="file-wordpress-dsb-L32" class="blob-num js-line-number" data-line-number="32"></td>
        <td id="file-wordpress-dsb-LC32" class="blob-code blob-code-inner js-file-line">      ]</td>
      </tr>
      <tr>
        <td id="file-wordpress-dsb-L33" class="blob-num js-line-number" data-line-number="33"></td>
        <td id="file-wordpress-dsb-LC33" class="blob-code blob-code-inner js-file-line">    }</td>
      </tr>
      <tr>
        <td id="file-wordpress-dsb-L34" class="blob-num js-line-number" data-line-number="34"></td>
        <td id="file-wordpress-dsb-LC34" class="blob-code blob-code-inner js-file-line">  }, </td>
      </tr>
      <tr>
        <td id="file-wordpress-dsb-L35" class="blob-num js-line-number" data-line-number="35"></td>
        <td id="file-wordpress-dsb-LC35" class="blob-code blob-code-inner js-file-line">  &quot;version&quot;: &quot;0.1&quot;</td>
      </tr>
      <tr>
        <td id="file-wordpress-dsb-L36" class="blob-num js-line-number" data-line-number="36"></td>
        <td id="file-wordpress-dsb-LC36" class="blob-code blob-code-inner js-file-line">}</td>
      </tr>
</table>

  </div>

  </div>
</div>

    <a name="comments"></a>
    <div class="js-quote-selection-container" data-quote-markdown=".js-comment-body">
      <div class="js-discussion "
      >
        <div class="ml-md-6 pl-md-3 ml-0 pl-0">
          

<!-- Rendered timeline since 2016-06-25 11:23:49 -->
<div id="partial-timeline-marker"
      class="js-timeline-marker js-updatable-content"
      data-last-modified="Sat, 25 Jun 2016 18:23:49 GMT"
      >
</div>

        </div>

        <div class="discussion-timeline-actions">
            <div class="flash flash-warn mt-3">
    <a rel="nofollow" class="btn btn-primary" data-hydro-click="{&quot;event_type&quot;:&quot;authentication.click&quot;,&quot;payload&quot;:{&quot;location_in_page&quot;:&quot;signed out comment&quot;,&quot;repository_id&quot;:null,&quot;auth_type&quot;:&quot;SIGN_UP&quot;,&quot;originating_url&quot;:&quot;https://gist.github.com/russmckendrick/c6320315431afd19a0ee10132e086673&quot;,&quot;user_id&quot;:null}}" data-hydro-click-hmac="fd10bd2a4caef5c6686a009b36fb6beb76e15d90cb8e46890a64a51cc92c08b2" href="/join?source=comment-gist">Sign up for free</a>
    <strong>to join this conversation on GitHub</strong>.
    Already have an account?
    <a rel="nofollow" data-hydro-click="{&quot;event_type&quot;:&quot;authentication.click&quot;,&quot;payload&quot;:{&quot;location_in_page&quot;:&quot;signed out comment&quot;,&quot;repository_id&quot;:null,&quot;auth_type&quot;:&quot;LOG_IN&quot;,&quot;originating_url&quot;:&quot;https://gist.github.com/russmckendrick/c6320315431afd19a0ee10132e086673&quot;,&quot;user_id&quot;:null}}" data-hydro-click-hmac="6608c6cd1cbad61d25e95275f30a5ccfe905195db4a3a02c27ad65deb6a027b5" href="/login?return_to=https%3A%2F%2Fgist.github.com%2Frussmckendrick%2Fc6320315431afd19a0ee10132e086673%2F">Sign in to comment</a>
</div>

        </div>
      </div>
    </div>
</div>
  </div>
</div><!-- /.container -->

    </main>
  </div>

  </div>

          
<div class="footer container-lg width-full p-responsive" role="contentinfo">
  <div class="position-relative d-flex flex-row-reverse flex-lg-row flex-wrap flex-lg-nowrap flex-justify-center flex-lg-justify-between pt-6 pb-2 mt-6 f6 color-text-secondary border-top color-border-secondary ">
    <ul class="list-style-none d-flex flex-wrap col-12 col-lg-5 flex-justify-center flex-lg-justify-between mb-2 mb-lg-0">
      <li class="mr-3 mr-lg-0">&copy; 2021 GitHub, Inc.</li>
        <li class="mr-3 mr-lg-0"><a href="https://docs.github.com/en/github/site-policy/github-terms-of-service" data-hydro-click="{&quot;event_type&quot;:&quot;analytics.event&quot;,&quot;payload&quot;:{&quot;category&quot;:&quot;Footer&quot;,&quot;action&quot;:&quot;go to terms&quot;,&quot;label&quot;:&quot;text:terms&quot;,&quot;originating_url&quot;:&quot;https://gist.github.com/russmckendrick/c6320315431afd19a0ee10132e086673&quot;,&quot;user_id&quot;:null}}" data-hydro-click-hmac="abc73873ff093c9b8b2a2e1fc1ebbbe464ddb22752ae0de11a2c14864ee51f69">Terms</a></li>
        <li class="mr-3 mr-lg-0"><a href="https://docs.github.com/en/github/site-policy/github-privacy-statement" data-hydro-click="{&quot;event_type&quot;:&quot;analytics.event&quot;,&quot;payload&quot;:{&quot;category&quot;:&quot;Footer&quot;,&quot;action&quot;:&quot;go to privacy&quot;,&quot;label&quot;:&quot;text:privacy&quot;,&quot;originating_url&quot;:&quot;https://gist.github.com/russmckendrick/c6320315431afd19a0ee10132e086673&quot;,&quot;user_id&quot;:null}}" data-hydro-click-hmac="4987a142cd3ccb039e8d823b9b9bd2e3bc80ac72729e6518a9e7216e05c4b624">Privacy</a></li>
        <li class="mr-3 mr-lg-0"><a data-hydro-click="{&quot;event_type&quot;:&quot;analytics.event&quot;,&quot;payload&quot;:{&quot;category&quot;:&quot;Footer&quot;,&quot;action&quot;:&quot;go to security&quot;,&quot;label&quot;:&quot;text:security&quot;,&quot;originating_url&quot;:&quot;https://gist.github.com/russmckendrick/c6320315431afd19a0ee10132e086673&quot;,&quot;user_id&quot;:null}}" data-hydro-click-hmac="791531dc3186f41154700424cce9dba6d5b1b43e58c48d0127cbad4221cc5982" href="https://github.com/security">Security</a></li>
        <li class="mr-3 mr-lg-0"><a href="https://www.githubstatus.com/" data-hydro-click="{&quot;event_type&quot;:&quot;analytics.event&quot;,&quot;payload&quot;:{&quot;category&quot;:&quot;Footer&quot;,&quot;action&quot;:&quot;go to status&quot;,&quot;label&quot;:&quot;text:status&quot;,&quot;originating_url&quot;:&quot;https://gist.github.com/russmckendrick/c6320315431afd19a0ee10132e086673&quot;,&quot;user_id&quot;:null}}" data-hydro-click-hmac="acc368b250c206ad7432160628be87a14010d2fad47ad0c3a7671492ac705300">Status</a></li>
        <li><a data-ga-click="Footer, go to help, text:Docs" href="https://docs.github.com">Docs</a></li>
    </ul>

    <a aria-label="Homepage" title="GitHub" class="footer-octicon d-none d-lg-block mx-lg-4" href="https://github.com">
      <svg aria-hidden="true" viewBox="0 0 16 16" version="1.1" data-view-component="true" height="24" width="24" class="octicon octicon-mark-github">
    <path fill-rule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
</svg>
</a>
    <ul class="list-style-none d-flex flex-wrap col-12 col-lg-5 flex-justify-center flex-lg-justify-between mb-2 mb-lg-0">
        <li class="mr-3 mr-lg-0"><a href="https://support.github.com" data-hydro-click="{&quot;event_type&quot;:&quot;analytics.event&quot;,&quot;payload&quot;:{&quot;category&quot;:&quot;Footer&quot;,&quot;action&quot;:&quot;go to contact&quot;,&quot;label&quot;:&quot;text:contact&quot;,&quot;originating_url&quot;:&quot;https://gist.github.com/russmckendrick/c6320315431afd19a0ee10132e086673&quot;,&quot;user_id&quot;:null}}" data-hydro-click-hmac="cf8d46ecc5cf70ed5b79d5d5b5914fdff62a8afa07d943e50e0971fa771d1fe8">Contact GitHub</a></li>
        <li class="mr-3 mr-lg-0"><a href="https://github.com/pricing" data-hydro-click="{&quot;event_type&quot;:&quot;analytics.event&quot;,&quot;payload&quot;:{&quot;category&quot;:&quot;Footer&quot;,&quot;action&quot;:&quot;go to Pricing&quot;,&quot;label&quot;:&quot;text:Pricing&quot;,&quot;originating_url&quot;:&quot;https://gist.github.com/russmckendrick/c6320315431afd19a0ee10132e086673&quot;,&quot;user_id&quot;:null}}" data-hydro-click-hmac="d9efe25b8091274cc444c68f4955225f12513096e0c24ab6c9ef3f8a2075234c">Pricing</a></li>
      <li class="mr-3 mr-lg-0"><a href="https://docs.github.com" data-hydro-click="{&quot;event_type&quot;:&quot;analytics.event&quot;,&quot;payload&quot;:{&quot;category&quot;:&quot;Footer&quot;,&quot;action&quot;:&quot;go to api&quot;,&quot;label&quot;:&quot;text:api&quot;,&quot;originating_url&quot;:&quot;https://gist.github.com/russmckendrick/c6320315431afd19a0ee10132e086673&quot;,&quot;user_id&quot;:null}}" data-hydro-click-hmac="755b1a0d47a31741b69a9f8ae5b965a035c4b05bf21b602e53c063bce4699571">API</a></li>
      <li class="mr-3 mr-lg-0"><a href="https://services.github.com" data-hydro-click="{&quot;event_type&quot;:&quot;analytics.event&quot;,&quot;payload&quot;:{&quot;category&quot;:&quot;Footer&quot;,&quot;action&quot;:&quot;go to training&quot;,&quot;label&quot;:&quot;text:training&quot;,&quot;originating_url&quot;:&quot;https://gist.github.com/russmckendrick/c6320315431afd19a0ee10132e086673&quot;,&quot;user_id&quot;:null}}" data-hydro-click-hmac="8ea7f042df28d99ce6d6f1b228446724e46ced53ba1ac75af85fe91be2c64eef">Training</a></li>
        <li class="mr-3 mr-lg-0"><a href="https://github.blog" data-hydro-click="{&quot;event_type&quot;:&quot;analytics.event&quot;,&quot;payload&quot;:{&quot;category&quot;:&quot;Footer&quot;,&quot;action&quot;:&quot;go to blog&quot;,&quot;label&quot;:&quot;text:blog&quot;,&quot;originating_url&quot;:&quot;https://gist.github.com/russmckendrick/c6320315431afd19a0ee10132e086673&quot;,&quot;user_id&quot;:null}}" data-hydro-click-hmac="d688e0cb0a073d5c23752216466039ea1dafd4ae632ca26cf524c0d1299970cb">Blog</a></li>
        <li><a data-ga-click="Footer, go to about, text:about" href="https://github.com/about">About</a></li>
    </ul>
  </div>
  <div class="d-flex flex-justify-center pb-6">
    <span class="f6 color-text-tertiary"></span>
  </div>

  
</div>

  <div id="ajax-error-message" class="ajax-error-message flash flash-error" hidden>
    <svg aria-hidden="true" viewBox="0 0 16 16" version="1.1" data-view-component="true" height="16" width="16" class="octicon octicon-alert">
    <path fill-rule="evenodd" d="M8.22 1.754a.25.25 0 00-.44 0L1.698 13.132a.25.25 0 00.22.368h12.164a.25.25 0 00.22-.368L8.22 1.754zm-1.763-.707c.659-1.234 2.427-1.234 3.086 0l6.082 11.378A1.75 1.75 0 0114.082 15H1.918a1.75 1.75 0 01-1.543-2.575L6.457 1.047zM9 11a1 1 0 11-2 0 1 1 0 012 0zm-.25-5.25a.75.75 0 00-1.5 0v2.5a.75.75 0 001.5 0v-2.5z"></path>
</svg>
    <button type="button" class="flash-close js-ajax-error-dismiss" aria-label="Dismiss error">
      <svg aria-hidden="true" viewBox="0 0 16 16" version="1.1" data-view-component="true" height="16" width="16" class="octicon octicon-x">
    <path fill-rule="evenodd" d="M3.72 3.72a.75.75 0 011.06 0L8 6.94l3.22-3.22a.75.75 0 111.06 1.06L9.06 8l3.22 3.22a.75.75 0 11-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 01-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 010-1.06z"></path>
</svg>
    </button>
    You can’t perform that action at this time.
  </div>

  <div class="js-stale-session-flash flash flash-warn flash-banner" hidden
    >
    <svg aria-hidden="true" viewBox="0 0 16 16" version="1.1" data-view-component="true" height="16" width="16" class="octicon octicon-alert">
    <path fill-rule="evenodd" d="M8.22 1.754a.25.25 0 00-.44 0L1.698 13.132a.25.25 0 00.22.368h12.164a.25.25 0 00.22-.368L8.22 1.754zm-1.763-.707c.659-1.234 2.427-1.234 3.086 0l6.082 11.378A1.75 1.75 0 0114.082 15H1.918a1.75 1.75 0 01-1.543-2.575L6.457 1.047zM9 11a1 1 0 11-2 0 1 1 0 012 0zm-.25-5.25a.75.75 0 00-1.5 0v2.5a.75.75 0 001.5 0v-2.5z"></path>
</svg>
    <span class="js-stale-session-flash-signed-in" hidden>You signed in with another tab or window. <a href="">Reload</a> to refresh your session.</span>
    <span class="js-stale-session-flash-signed-out" hidden>You signed out in another tab or window. <a href="">Reload</a> to refresh your session.</span>
  </div>
    <template id="site-details-dialog">
  <details class="details-reset details-overlay details-overlay-dark lh-default color-text-primary hx_rsm" open>
    <summary role="button" aria-label="Close dialog"></summary>
    <details-dialog class="Box Box--overlay d-flex flex-column anim-fade-in fast hx_rsm-dialog hx_rsm-modal">
      <button class="Box-btn-octicon m-0 btn-octicon position-absolute right-0 top-0" type="button" aria-label="Close dialog" data-close-dialog>
        <svg aria-hidden="true" viewBox="0 0 16 16" version="1.1" data-view-component="true" height="16" width="16" class="octicon octicon-x">
    <path fill-rule="evenodd" d="M3.72 3.72a.75.75 0 011.06 0L8 6.94l3.22-3.22a.75.75 0 111.06 1.06L9.06 8l3.22 3.22a.75.75 0 11-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 01-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 010-1.06z"></path>
</svg>
      </button>
      <div class="octocat-spinner my-6 js-details-dialog-spinner"></div>
    </details-dialog>
  </details>
</template>

    <div class="Popover js-hovercard-content position-absolute" style="display: none; outline: none;" tabindex="0">
  <div class="Popover-message Popover-message--bottom-left Popover-message--large Box color-shadow-large" style="width:360px;">
  </div>
</div>

    <template id="snippet-clipboard-copy-button">
  <div class="zeroclipboard-container position-absolute right-0 top-0">
    <clipboard-copy aria-label="Copy" class="ClipboardButton btn js-clipboard-copy m-2 p-0 tooltipped-no-delay" data-copy-feedback="Copied!" data-tooltip-direction="w">
      <svg aria-hidden="true" viewBox="0 0 16 16" version="1.1" data-view-component="true" height="16" width="16" class="octicon octicon-clippy js-clipboard-clippy-icon m-2">
    <path fill-rule="evenodd" d="M5.75 1a.75.75 0 00-.75.75v3c0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75v-3a.75.75 0 00-.75-.75h-4.5zm.75 3V2.5h3V4h-3zm-2.874-.467a.75.75 0 00-.752-1.298A1.75 1.75 0 002 3.75v9.5c0 .966.784 1.75 1.75 1.75h8.5A1.75 1.75 0 0014 13.25v-9.5a1.75 1.75 0 00-.874-1.515.75.75 0 10-.752 1.298.25.25 0 01.126.217v9.5a.25.25 0 01-.25.25h-8.5a.25.25 0 01-.25-.25v-9.5a.25.25 0 01.126-.217z"></path>
</svg>
      <svg aria-hidden="true" viewBox="0 0 16 16" version="1.1" data-view-component="true" height="16" width="16" class="octicon octicon-check js-clipboard-check-icon color-text-success d-none m-2">
    <path fill-rule="evenodd" d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z"></path>
</svg>
    </clipboard-copy>
  </div>
</template>

  

  </body>
</html>

```

Back on our Swarm manager, we can download the distributed app by running;

```
curl -O https://gist.githubusercontent.com/russmckendrick/c6320315431afd19a0ee10132e086673/raw/e3a8019a68c2122141cae14bcb84b4c20ef18fe6/wordpress.dsb
docker deploy wordpress
```

Now the application has been deployed you can check its status by running;

```
docker stack tasks wordpress
```

Finally, we need to know which port our WordPress container has been published on so that we can access it in our browser. To get this information run the following command;

```
docker service inspect wordpress_wordpress
```

and make a note of the **PublishedPort** in the Endpoint section.

![more-docker-service07](/img/2016-06-25_docker-load-balancing-application-bundles_7.jpg)

Going to any of your hosts on port 30001 should present you with a WordPress installation screen.

It’s worth noting that this feature is not yet complete and it seems to be quite limiting, for example there doesn’t appear to be a way to mount volumes or define which port is exposed.

#### Tearing down the cluster

As none of us want servers hanging around, not being used but costing us money there is a playbook which terminates the Drops we originally launched, to run it follow the instructions in the [README](https://github.com/russmckendrick/digitalocean-docker-swarm/blob/master/README.md).

![asciicast](/img/2016-06-25_docker-load-balancing-application-bundles_8.png)
