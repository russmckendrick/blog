---
title: "Docker Networking Magic"
description: "Explore Docker's new networking features with Weave for encrypted, multi-host container networking. See the magic in action!"
author: "Russ Mckendrick"
date: "2016-02-25T17:58:14+01:00"
tags:
  - "Docker"
cover:
  image: "/img/2016-02-25_docker-networking-magic_0.png"
  alt: "Explore Docker's new networking features with Weave for encrypted, multi-host container networking. See the magic in action!"
lastmod: "2021-07-31T12:33:44+01:00"
aliases:
  - "/docker-networking-magic-d85b497f58ed"
---

I have been quiet on here as I am in the process of writing again, one of things I have been looking at is Dockers new networking features. This gave me an excuse to have a play with Weave. Rather than go into too much detail here, lets go all click bait because you won’t believe what happened next.

I launched two hosts in [Digital Ocean](https://m.do.co/c/52ec4dc3647e), one in London and then one in New York City using Docker Machine;

{{< terminal title="Docker Networking Magic 1/9" >}}
```
docker-machine create \
 — driver digitalocean \
 — digitalocean-access-token your-digital-ocean-api-token-goes-here \
 — digitalocean-region lon1 \
 — digitalocean-size 1gb \
mesh-london

docker-machine create \
 — driver digitalocean \
 — digitalocean-access-token your-digital-ocean-api-token-goes-here \
 — digitalocean-region nyc2 \
 — digitalocean-size 1gb \
mesh-nyc
```
{{< /terminal >}}

Once both hosts were up and running I downloaded the Weave binaries on each host;

{{< terminal title="Docker Networking Magic 2/9" >}}
```
docker-machine ssh mesh-london ‘curl -L git.io/weave -o /usr/local/bin/weave; chmod a+x /usr/local/bin/weave’
docker-machine ssh mesh-nyc ‘curl -L git.io/weave -o /usr/local/bin/weave; chmod a+x /usr/local/bin/weave’
```
{{< /terminal >}}

Once the binary was on each host, I launched Weave on each host making sure I provided a password so that traffic between the host machines would be encrypted;

{{< terminal title="Docker Networking Magic 3/9" >}}
```
docker-machine ssh mesh-london weave launch — password m3ga_5ecret_pa55w0rd
docker-machine ssh mesh-nyc weave launch — password m3ga_5ecret_pa55w0rd
```
{{< /terminal >}}

Now Weave is running on both my hosts, I instructed the mesh-nyc host to connect to the IP address of the mesh-london host;

{{< terminal title="Docker Networking Magic 4/9" >}}
```
docker-machine ssh mesh-nyc weave connect “$(docker-machine ip mesh-london)”
```
{{< /terminal >}}

and finally check the status of the Weave cluster;

{{< terminal title="Docker Networking Magic 5/9" >}}
```
docker-machine ssh mesh-nyc weave status
```
{{< /terminal >}}

There should be two peers and 2 established connections.

This is where it gets interesting. Launching a [NGINX](https://hub.docker.com/r/russmckendrick/nginx/) container on the New York City host by running;

{{< terminal title="Docker Networking Magic 6/9" >}}
```
docker $(docker-machine config mesh-nyc) run -itd \
 — name=nginx \
 — net=weave \
 — hostname=”nginx.weave.local” \
 — dns=”172.17.0.1" \
 — dns-search=”weave.local” \
russmckendrick/nginx
```
{{< /terminal >}}

and then on the London host, try wgetting the page being served by NGINX (its just a plain one which says Hello from NGINX);

{{< terminal title="Docker Networking Magic 7/9" >}}
```
docker $(docker-machine config mesh-london) run -it \
 — rm \
 — net=weave \
 — dns=”172.17.0.1" \
 — dns-search=”weave.local” \
russmckendrick/base wget -q -O- http://nginx.weave.local
```
{{< /terminal >}}

and then finally ping the NGINX container;

{{< terminal title="Docker Networking Magic 8/9" >}}
```
docker $(docker-machine config mesh-london) run -it \
 — rm \
 — net=weave \
 — dns=”172.17.0.1" \
 — dns-search=”weave.local” \
russmckendrick/base ping -c 3 nginx.weave.local
```
{{< /terminal >}}

If you can’t be bothered to run it yourself, and who can blame you, here is an [asciicinema](https://asciinema.org/~russmckendrick) recording;

![asciicast](/img/2016-02-25_docker-networking-magic_1.png)

As you can see, with no effort on my part other than the commands above I had encrypted, multi-host container networking !!!

![black-magic](/img/2016-02-25_docker-networking-magic_2.gif)

Don’t forget to get teardown the two [Digital Ocean](https://m.do.co/c/52ec4dc3647e) hosts if you brought them up;

{{< terminal title="Docker Networking Magic 9/9" >}}
```
docker-machine stop mesh-london mesh-nyc
docker-machine rm mesh-london mesh-nyc
```
{{< /terminal >}}

For further reading on Weave Net please [see their documentation](https://github.com/weaveworks/weave#readme).
