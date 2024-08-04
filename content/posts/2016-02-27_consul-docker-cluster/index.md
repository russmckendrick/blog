---
title: "Consul Docker Cluster"
description: "Set up Consul cluster on Docker with Docker Machine & Swarm for service discovery, using shared private IPs for networking."
author: "Russ Mckendrick"
date: "2016-02-27T17:55:22+01:00"
tags:
  - "Automation"
  - "Docker"
  - "Tools"
cover:
  image: "/img/2016-02-27_consul-docker-cluster_0.png"
  alt: "Set up Consul cluster on Docker with Docker Machine & Swarm for service discovery, using shared private IPs for networking."
lastmod: "2021-07-31T12:33:46+01:00"
aliases:
  - "/consul-docker-cluster-4b32160c1853"
---

As mentioned in my previous post I have been doing a lot of work with [Docker Machine](https://github.com/docker/machine) and [Docker Swarm](https://www.docker.com/products/docker-swarm) recently, to configure mulit-host networking with the latest version of Docker I needed to use a service discovery tool. As I had played with [Consul](https://www.consul.io/) in the past I decided to use that for my back-end service discovery.

Now if I wanted to launch a single node then I would run the following;

{{< terminal title="Consul Docker Cluster 1/10" >}}
```
docker run -d -p “8400:8400” -p “8500:8500” -h “consul” russmckendrick/consul
```
{{< /terminal >}}

However, thats not really recommended so here is how you stat a cluster using the same [image](https://hub.docker.com/r/russmckendrick/consul/). First of all, I launched three hosts in [Digital Ocean](https://m.do.co/c/52ec4dc3647e) with shared private networking enabled using Docker Machine;

{{< terminal title="Consul Docker Cluster 2/10" >}}
```
docker-machine create \
 — driver digitalocean \
 — digitalocean-access-token your-digital-ocean-api-token-goes-here \
 — digitalocean-region lon1 \
 — digitalocean-size 512mb \
 — digitalocean-private-networking \
service-discovery01

docker-machine create \
 — driver digitalocean \
 — digitalocean-access-token your-digital-ocean-api-token-goes-here \
 — digitalocean-region lon1 \
 — digitalocean-size 512mb \
 — digitalocean-private-networking \
service-discovery02

docker-machine create \
 — driver digitalocean \
 — digitalocean-access-token your-digital-ocean-api-token-goes-here \
 — digitalocean-region lon1 \
 — digitalocean-size 512mb \
 — digitalocean-private-networking \
service-discovery03
```
{{< /terminal >}}

As Docker Machine only returns the primary IP address when you run docker-machine ip machine-name I needed to grab the shared private IP addresses for each of the three hosts and put them in an environment variable as I would be using them several times;

{{< terminal title="Consul Docker Cluster 3/10" >}}
```
SD1=$(docker-machine ssh service-discovery01 “ip addr show eth1 | grep -Po ‘inet \K[\d.]+’”)
SD2=$(docker-machine ssh service-discovery02 “ip addr show eth1 | grep -Po ‘inet \K[\d.]+’”)
SD3=$(docker-machine ssh service-discovery03 “ip addr show eth1 | grep -Po ‘inet \K[\d.]+’”)
```
{{< /terminal >}}

Now I had the hosts up and also the shared private IP addresses of the three hosts it was time to launch the three Consul nodes;

First on **service-discovery01**;

{{< terminal title="Consul Docker Cluster 4/10" >}}
```
docker $(docker-machine config service-discovery01) run -d \
-p “$SD1:8300:8300” \
-p “$SD1:8301:8301” \
-p “$SD1:8301:8301/udp” \
-p “$SD1:8302:8302” \
-p “$SD1:8400:8400” \
-p “$SD1:8500:8500” \
-p “$(docker-machine ip service-discovery01):8500:8500” \
-p “$SD1:8600:8600” \
-p “$SD1:8600:8600/udp” \
-h “consul01” \
 — name=”consul01" \
russmckendrick/consul agent -data-dir /data -server -bootstrap-expect 3 -ui-dir /ui -client=0.0.0.0 -advertise=$SD1
```
{{< /terminal >}}

then on **service-discovery02**;

{{< terminal title="Consul Docker Cluster 5/10" >}}
```
docker $(docker-machine config service-discovery02) run -d \
-p “$SD2:8300:8300” \
-p “$SD2:8301:8301” \
-p “$SD2:8301:8301/udp” \
-p “$SD2:8302:8302” \
-p “$SD2:8400:8400” \
-p “$SD2:8500:8500” \
-p “$(docker-machine ip service-discovery02):8500:8500” \
-p “$SD2:8600:8600” \
-p “$SD2:8600:8600/udp” \
-h “consul02” \
 — name=”consul02" \
russmckendrick/consul agent -data-dir /data -server -bootstrap-expect 3 -ui-dir /ui -client=0.0.0.0 -advertise=$SD2
```
{{< /terminal >}}

and finally on **service-discovery03**;

{{< terminal title="Consul Docker Cluster 6/10" >}}
```
docker $(docker-machine config service-discovery03) run -d \
-p “$SD3:8300:8300” \
-p “$SD3:8301:8301” \
-p “$SD3:8301:8301/udp” \
-p “$SD3:8302:8302” \
-p “$SD3:8400:8400” \
-p “$SD3:8500:8500” \
-p “$(docker-machine ip service-discovery03):8500:8500” \
-p “$SD3:8600:8600” \
-p “$SD3:8600:8600/udp” \
-h “consul03” \
 — name=”consul03" \
russmckendrick/consul agent -data-dir /data -server -bootstrap-expect 3 -ui-dir /ui -client=0.0.0.0 -advertise=$SD3
```
{{< /terminal >}}

As you can see, there are a lot of port which need to be published for the clustering to work, including ones on UDP. This is the reason for launching using [Digital Ocean’s](https://m.do.co/c/52ec4dc3647e) share private networking. I could have took it one step further and properly locked each of the three hosts down further so they could only talk with each other, but thats for another time.

The other thing to note is that I am telling Consul to advertise it is running on the shared private networking IP address, if I didn’t then Consul would default to advertising the IP address of the container.

This means that while nodes would be registering themselves correctly they would not be able to contact each other as we have not enabled any sort of Docker multi-host networking for the service discovery nodes. Again, I could if I wanted to by using something like [Weave](/2016/02/25/docker-networking-magic/), but that would add additional steps to these already long notes.

Now that the three Consul nodes have been launched I created the cluster by running the following command against Consul on **service-discovery01**;

{{< terminal title="Consul Docker Cluster 7/10" >}}
```
docker $(docker-machine config service-discovery01) exec consul01 consul join $SD1 $SD2 $SD3
```
{{< /terminal >}}

I then checked the logs on **service-discovery01** by running;

{{< terminal title="Consul Docker Cluster 8/10" >}}
```
docker $(docker-machine config service-discovery01) logs consul01
```
{{< /terminal >}}

Should show you something like;

{{< terminal title="Consul Docker Cluster 9/10" >}}
```
==> WARNING: Expect Mode enabled, expecting 3 servers
==> Starting Consul agent…
==> Starting Consul agent RPC…
==> Consul agent running!
Node name: ‘consul01’
Datacenter: ‘dc1’
Server: true (bootstrap: false)
Client Addr: 0.0.0.0 (HTTP: 8500, HTTPS: -1, DNS: 8600, RPC: 8400)
Cluster Addr: 10.131.5.98 (LAN: 8301, WAN: 8302)
Gossip encrypt: false, RPC-TLS: false, TLS-Incoming: false
Atlas:

==> Log data will now stream in as it occurs:

2016/02/27 17:07:50 [INFO] serf: EventMemberJoin: consul01 10.131.5.98
2016/02/27 17:07:50 [INFO] serf: EventMemberJoin: consul01.dc1 10.131.5.98
2016/02/27 17:07:50 [INFO] raft: Node at 10.131.5.98:8300 [Follower] entering Follower state
2016/02/27 17:07:50 [INFO] consul: adding LAN server consul01 (Addr: 10.131.5.98:8300) (DC: dc1)
2016/02/27 17:07:50 [INFO] consul: adding WAN server consul01.dc1 (Addr: 10.131.5.98:8300) (DC: dc1)
2016/02/27 17:07:50 [ERR] agent: failed to sync remote state: No cluster leader
2016/02/27 17:07:52 [WARN] raft: EnableSingleNode disabled, and no known peers. Aborting election.
2016/02/27 17:08:09 [ERR] agent: failed to sync remote state: No cluster leader
2016/02/27 17:08:12 [ERR] agent: coordinate update error: No cluster leader
2016/02/27 17:08:29 [ERR] agent: failed to sync remote state: No cluster leader
2016/02/27 17:08:41 [ERR] agent: coordinate update error: No cluster leader
2016/02/27 17:08:50 [ERR] agent: failed to sync remote state: No cluster leader
2016/02/27 17:09:01 [INFO] agent.rpc: Accepted client: 127.0.0.1:44234
2016/02/27 17:09:01 [INFO] agent: (LAN) joining: [10.131.5.98 10.131.4.80 10.131.9.106]
2016/02/27 17:09:01 [INFO] serf: EventMemberJoin: consul02 10.131.4.80
2016/02/27 17:09:01 [INFO] consul: adding LAN server consul02 (Addr: 10.131.4.80:8300) (DC: dc1)
2016/02/27 17:09:01 [INFO] serf: EventMemberJoin: consul03 10.131.9.106
2016/02/27 17:09:01 [INFO] agent: (LAN) joined: 3 Err: 
2016/02/27 17:09:01 [INFO] consul: adding LAN server consul03 (Addr: 10.131.9.106:8300) (DC: dc1)
2016/02/27 17:09:01 [INFO] consul: Attempting bootstrap with nodes: [10.131.4.80:8300 10.131.9.106:8300 10.131.5.98:8300]
2016/02/27 17:09:01 [INFO] consul: New leader elected: consul03
2016/02/27 17:09:02 [INFO] agent: Synced service ‘consul’
```
{{< /terminal >}}

Finally, as the image has the [Consul UI](https://www.consul.io/intro/getting-started/ui.html) enabled, I could view my cluster in my browser by opening service-discovery01’s IP;

{{< terminal title="Consul Docker Cluster 10/10" >}}
```
open http://$(docker-machine ip service-discovery01):8500/ui
```
{{< /terminal >}}

and as expected I had three hosts within my cluster all on the shared private networking IP;

![consul](/img/2016-02-27_consul-docker-cluster_1.png)

Bosh!
