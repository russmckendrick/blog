---
title: "Flocker on CentOS 7"
description: "Russ Mckendrick explores Flocker on CentOS 7, enhancing Dockerized applications with robust persistent storage solutions."
author: "Russ Mckendrick"
date: "2015-12-13T18:18:50+01:00"
tags:
  - "Linux"
  - "Docker"
cover:
  image: "/img/2015-12-13_flocker-on-centos-7_0.png"
  alt: "Russ Mckendrick explores Flocker on CentOS 7, enhancing Dockerized applications with robust persistent storage solutions."
lastmod: "2021-07-31T12:33:33+01:00"
aliases:
  - "/flocker-on-centos-7-17a8bfaa6509"
---

I have been reading about [Flocker](https://clusterhq.com/flocker/introduction/) for quite a while and it’s been something I have been meaning to look at since the introduction of plugins back in the [Docker 1.7 release](http://blog.docker.com/2015/06/announcing-docker-1-7-multi-host-networking-plugins-and-orchestration-updates/). But I have [been busy](/2015/10/11/monitoring-docker-book/) looking at other parts of Docker.

Since I had a few hours this weekend I thought it was about time and had a play. ClusterHQ describes Flocker as;

> Flocker is an open-source container data volume manager for your Dockerized application. It gives ops teams the tools they need to run containerized stateful services like databases in production.

Which basically means decent persistent storage, which is one thing I think Docker has been lacking when it comes to running services such as MySQL, Postgres, central logging etc.

For this test we are going to be launching three instances;

- control.mydomain.com — Controller — This will be our cluster controller
- flocker01.mydomain.com — Storage — Does what it says on the tin
- flocker02.mydomain.com — Storage — Does what it says on the tin

and [share keys between the root user on all three machines](https://www.digitalocean.com/community/tutorials/how-to-set-up-ssh-keys--2) allowing me password-less SSH access within the cluster.

#### Install the command-line tools

I am going to assume you will be installing the Flocker command-line tools on a Mac. Luckily ClusterHQ have made this straight forward by provide their own [Brew](http://brew.sh) packages. To install the tools simply run the following commands;

{{< terminal title="Flocker on CentOS 7 1/41" >}}
```
brew doctor
brew tap ClusterHQ/tap
brew update
brew install flocker-1.8.0
brew test flocker-1.8.0
flocker-deploy — version
```
{{< /terminal >}}

With the last two commands you should see something like the following output;

{{< terminal title="Flocker on CentOS 7 2/41" >}}
```
⚡ brew test flocker-1.8.0
Testing clusterhq/tap/flocker-1.8.0
==&gt; Using the sandbox
==&gt; /usr/local/Cellar/flocker-1.8.0/1.8.0/bin/flocker-deploy — version
russ in ~
⚡ flocker-deploy — version
1.8.0
```
{{< /terminal >}}

Finally, lets create a working directory;

{{< terminal title="Flocker on CentOS 7 3/41" >}}
```
mkdir ~/Documents/Projects/Flocker
```
{{< /terminal >}}

So thats the command line tools installed and tested, now its time to up the cluster nodes.

If you are running Linux there are instructions for installing the command line tools [various distributions in the official documentation](https://docs.clusterhq.com/en/1.8.0/install/install-client.html)

#### Node Preparation

**Please note — You should also transfer SSH keys between all of the nodes as mentioned at the top of this post.**

The following commands need to the run on all three cluster nodes;

- control.mydomain.com
- flocker01.mydomain.com
- flocker02.mydomain.com

We will be launching three [CentOS 7](https://www.centos.org) instances in [Digital Ocean](https://www.digitalocean.com/?refcode=52ec4dc3647e), first of all on each of the nodes run the [Digital Ocean bootstrap script](/2015/06/28/digital-ocean-bootstrap/) to get the defaults in place, and also run the [Docker install script](/2015/06/28/update-to-centos-7-docker-install-one-liner/) to get the latest version Docker installed and configured.

{{< terminal title="Flocker on CentOS 7 4/41" >}}
```
curl -fsS https://raw.githubusercontent.com/russmckendrick/DOBootstrap/master/do-bootstrap.sh | bash
curl -fsS https://raw.githubusercontent.com/russmckendrick/docker-install/master/install-offical | bash
```
{{< /terminal >}}

Now add the ClusterHQ yum repo and install the packages needed to run Flocker;

{{< terminal title="Flocker on CentOS 7 5/41" >}}
```
yum install -y https://clusterhq-archive.s3.amazonaws.com/centos/clusterhq-release$(rpm -E %dist).noarch.rpm
yum install -y clusterhq-flocker-node clusterhq-flocker-docker-plugin
```
{{< /terminal >}}

Next up create the directory where the cluster configuration will be stored and set the permissions

{{< terminal title="Flocker on CentOS 7 6/41" >}}
```
mkdir /etc/flocker &amp;&amp; chmod 0700 /etc/flocker
```
{{< /terminal >}}

Finally, it is important you ensure that the hostname of the machine doesn’t resolve to 127.0.0.1. Open the /etc/hosts file on each machine and remove any references as needed (for both IPv4 and IPv6);

{{< terminal title="Flocker on CentOS 7 7/41" >}}
```
vim /etc/hosts
```
{{< /terminal >}}

Repeat this process for each of the nodes within your cluster.

#### Install & Configure ZFS

The following commands need to the run on the **storage nodes**;

- flocker01.mydomain.com
- flocker02.mydomain.com

We are going to be using a ZFS peer-to-peer backend, this uses the local storage on the **storage nodes**, at the moment it is experimental so please do not try and use it in production.

As we ran the [Digital Ocean bootstrap script](/2015/06/28/digital-ocean-bootstrap/) and changed the Kernel configuration we just need to install the kernel-devel package, this should match the running kernel. To check this run

{{< terminal title="Flocker on CentOS 7 8/41" >}}
```
uname -a
```
{{< /terminal >}}

and check the that the version numbers match the kernel-devel package installed by the following command;

{{< terminal title="Flocker on CentOS 7 9/41" >}}
```
yum install -y kernel-devel epel-release
```
{{< /terminal >}}

If the kernel-devel package matches the installed kernel then continue, if not please ensure that the correct kernel is selected in your [Digital Ocean control panel](https://cloud.digitalocean.com) and then try again;

**The installation will take several minutes, this is normal and there is nothing to worry about if the process appears to hang during install.**

{{< terminal title="Flocker on CentOS 7 10/41" >}}
```
sync
yum install -y https://s3.amazonaws.com/archive.zfsonlinux.org/epel/zfs-release.el7.noarch.rpm
yum install -y zfs
```
{{< /terminal >}}

Once installed, load the newly compiled kernel module by running;

{{< terminal title="Flocker on CentOS 7 11/41" >}}
```
modprobe zfs
```
{{< /terminal >}}

Now on each of the **storage nodes** its time to create the ZFS pool, we will be calling the pool flocker;

{{< terminal title="Flocker on CentOS 7 12/41" >}}
```
mkdir -p /var/opt/flocker
truncate — size 10G /var/opt/flocker/pool-vdev
ZFS_MODULE_LOADING=yes zpool create flocker /var/opt/flocker/pool-vdev
```
{{< /terminal >}}

Finally, ZFS will need a key to be able access the other **storage nodes**, as we have already shared keys between the all the nodes run the following commands on each of the **storage nodes**;

{{< terminal title="Flocker on CentOS 7 13/41" >}}
```
cp -pr ~/.ssh/id_rsa /etc/flocker/id_rsa_flocker
```
{{< /terminal >}}

#### Flocker Control Service

The following commands need to the run on cluster control node;

- control.mydomain.com

At this stage we just need to enable the flocker-control service and configure firewalld with the correct ports for the service;

{{< terminal title="Flocker on CentOS 7 14/41" >}}
```
systemctl enable flocker-control
```
{{< /terminal >}}

and for firewalld;

{{< terminal title="Flocker on CentOS 7 15/41" >}}
```
systemctl enable firewalld.service
systemctl start firewalld.service
firewall-cmd — reload
firewall-cmd — permanent — add-service flocker-control-api
firewall-cmd — add-service flocker-control-api
firewall-cmd — reload
firewall-cmd — permanent — add-service flocker-control-agent
firewall-cmd — add-service flocker-control-agent
```
{{< /terminal >}}

You may have noticed we only enabled the service and haven’t started it, we will be doing this later in the installation.

#### Flocker Agent Service

The following commands need to the run on the two **storage nodes**;

- flocker01.mydomain.com
- flocker02.mydomain.com
    Firs of all lets put the put the agent configuration in place, make sure you put the hostname of your **control node** in the file and also make sure that you use the domain name and not the IP address;

{{< terminal title="Flocker on CentOS 7 16/41" >}}
```
cat >> /etc/flocker/agent.yml <<; FLOCKER_AGENT
“version”: 1
“control-service”:
 “hostname”: “control.mydomain.com”
 “port”: 4524
“dataset”:
 “backend”: “zfs”
 “pool”: “flocker”
FLOCKER_AGENT
```
{{< /terminal >}}

and then enable the Flocker Agent Services by running the following commands;

{{< terminal title="Flocker on CentOS 7 17/41" >}}
```
systemctl enable flocker-dataset-agent
systemctl enable flocker-container-agent
systemctl enable flocker-docker-plugin
```
{{< /terminal >}}

Like the **control node** we won’t be starting the services just yet, we need to put the authentication certificates in place first.

#### Generate the Cluster Certificates

Flocker uses SSL certificates for both the client & node authentication, there are a lot of them so please pay close attention to where each certificate and keys needs to be copied.

All of the certificates are generated on **your local machine** so make sure the following commands are all executed within the working directory we created when installing the commandline tools.

{{< terminal title="Flocker on CentOS 7 18/41" >}}
```
cd ~/Documents/Projects/Flocker
```
{{< /terminal >}}

#### Certificate Authority

First of all we need to create the certificate authority, all of the other certificates will be signed using this one. We will be calling the cluster flocker;

{{< terminal title="Flocker on CentOS 7 19/41" >}}
```
flocker-ca initialize flocker
```
{{< /terminal >}}

The cluster.key file should not be shared or copied anywhere else other than **your local machine**.

#### Control Certificate

The docs make the following notes;

- You should replace &lt;hostname&gt; with the hostname of your control service node; this hostname should match the hostname you will give to HTTP API clients.
- The &lt;hostname&gt; should be a valid DNS name that HTTPS clients can resolve, as they will use it as part of TLS validation.
- It is not recommended as an IP address for the &lt;hostname&gt;, as it can break some HTTPS clients.

Our control node is called control.mydomain.com so we will need to run the following command;

{{< terminal title="Flocker on CentOS 7 20/41" >}}
```
flocker-ca create-control-certificate control.mydomain.com
```
{{< /terminal >}}

Next up we need to copy the control certificate and key to the **control node**, give them the correct file name and set the correct permissions;

{{< terminal title="Flocker on CentOS 7 21/41" >}}
```
scp control-control.mydomain.com.crt root@control.mydomain.com:/etc/flocker/control-service.crt
scp control-control.mydomain.com.key root@control.mydomain.com:/etc/flocker/control-service.key
scp cluster.crt root@control.mydomain.com:/etc/flocker/
ssh root@control.mydomain.com “chmod 0600 /etc/flocker/control-service.key”
```
{{< /terminal >}}

#### Node Certificates

Now we have the certificate in place for the control node we need to create the one for each of the **storage nodes**. To do this run the following command;

{{< terminal title="Flocker on CentOS 7 22/41" >}}
```
flocker-ca create-node-certificate
```
{{< /terminal >}}

Each time you run the command you will be given a certificate with a unique ID (UID), the output should look something like;

{{< terminal title="Flocker on CentOS 7 23/41" >}}
```
russ in ~/Documents/Projects/Flocker
⚡ flocker-ca create-node-certificate
Created 0ed63f10–7065–4d37-af7c-6128cb5c072f.crt. Copy it over to /etc/flocker/node.crt on your node machine and make sure to chmod 0600 it.
```
{{< /terminal >}}

The UID in this run was “0ed63f10–7065–4d37-af7c-6128cb5c072f”. Now we have the first node certificate and key we need to copy it to the first of our **storage nodes** along with the cluster.crt and set the right permissions on the key file;

{{< terminal title="Flocker on CentOS 7 24/41" >}}
```
scp 0ed63f10–7065–4d37-af7c-6128cb5c072f.crt root@flocker01.mydomain.com:/etc/flocker/node.crt
scp 0ed63f10–7065–4d37-af7c-6128cb5c072f.key root@flocker01.mydomain.com:/etc/flocker/node.key
scp cluster.crt root@flocker01.mydomain.com:/etc/flocker/
ssh root@flocker01.mydomain.com “chmod 0600 /etc/flocker/node.key”
```
{{< /terminal >}}

Next up we need to generate a certificate for our next node, to do this run through the same steps as the first node;

{{< terminal title="Flocker on CentOS 7 25/41" >}}
```
flocker-ca create-node-certificate
```
{{< /terminal >}}

As you can see from the following, this time we got a UID of “f939152e-0ec0–4d7c-ae74–37c899648dca”;

{{< terminal title="Flocker on CentOS 7 26/41" >}}
```
⚡ flocker-ca create-node-certificate
Created f939152e-0ec0–4d7c-ae74–37c899648dca.crt. Copy it over to /etc/flocker/node.crt on your node machine and make sure to chmod 0600 it.
```
{{< /terminal >}}

and then copy the files and set the permissions;

{{< terminal title="Flocker on CentOS 7 27/41" >}}
```
scp f939152e-0ec0–4d7c-ae74–37c899648dca.crt root@flocker02.mydomain.com:/etc/flocker/node.crt
scp f939152e-0ec0–4d7c-ae74–37c899648dca.key root@flocker02.mydomain.com:/etc/flocker/node.key
scp cluster.crt root@flocker02.mydomain.com:/etc/flocker/
ssh root@flocker02.mydomain.com “chmod 0600 /etc/flocker/node.key”
```
{{< /terminal >}}

**Please note: It is important that each node has its own certificate, if you upload the same certificate to more than one node you will cause a conflict with the Flocker control service which will only register a single storage node.**

#### Docker Plug-in Certificate

Next up its the turn of the Docker plug-in, on **your local machine** run the following commands to generate, copy and set permissions on each of the **storage nodes**;

{{< terminal title="Flocker on CentOS 7 28/41" >}}
```
flocker-ca create-api-certificate plugin
scp -r plugin.* root@flocker01.mydomain.com:/etc/flocker/
scp -r plugin.* root@flocker02.mydomain.com:/etc/flocker/
```
{{< /terminal >}}

#### API User Certificate

Finally we should create an API user certificate, here will be calling the user flocker-russ

{{< terminal title="Flocker on CentOS 7 29/41" >}}
```
flocker-ca create-api-certificate flocker-russ
```
{{< /terminal >}}

As we are using a Mac we will need to import the certificate into our keychain to be able to use curl to query the **control node**.

First of all, rename the certificate and key;

{{< terminal title="Flocker on CentOS 7 30/41" >}}
```
mv flocker-russ.crt user.crt
mv flocker-russ.key user.key
```
{{< /terminal >}}

and then check the common name in the certificate;

{{< terminal title="Flocker on CentOS 7 31/41" >}}
```
openssl x509 -in user.crt -noout -subject
```
{{< /terminal >}}

You should see something like;

{{< terminal title="Flocker on CentOS 7 32/41" >}}
```
russ in ~/Documents/Projects/Flocker
⚡ openssl x509 -in user.crt -noout -subject
subject= /OU=065c8945–8c46–4fb7–93a4-e07a3846aba0/CN=user-flocker-russ
```
{{< /terminal >}}

Make a note of the “CN”, which in the example above is user-flocker-russ. Next up we need to create a .p12 certificate which can be understood by OSX, make sure you enter an export password when prompted;

{{< terminal title="Flocker on CentOS 7 33/41" >}}
```
openssl pkcs12 -export -in user.crt -inkey user.key -out user.p12
```
{{< /terminal >}}

Finally its time to import the certificate into your keychain by running the following command which will pop-up a prompt asking for the export password you assigned;

{{< terminal title="Flocker on CentOS 7 34/41" >}}
```
security import user.p12 -k ~/Library/Keychains/login.keychain
```
{{< /terminal >}}

#### Reboot everything

We will be rebooting the following nodes;

- control.mydomain.com
- flocker01.mydomain.com
- flocker02.mydomain.com

Now the nodes are prepared, all of the authentication certificates generated and shared across the cluster it’s time to reboot the **control & storage nodes**. To do this run the following command on each of the servers;

{{< terminal title="Flocker on CentOS 7 35/41" >}}
```
reboot
```
{{< /terminal >}}

Once rebooted we can start to test the cluster.

#### Testing the Cluster

Now everything is rebooted we should have a working Flocker cluster.

#### API Connection

First of all lets make a connection to the Flocker Control API and list the nodes. The following command will connect using the API certificate we imported into the Keychain, this is called by using the CN which was user-flocker-russ;

{{< terminal title="Flocker on CentOS 7 36/41" >}}
```
curl — cacert ~/Documents/Projects/Flocker/cluster.crt — cert “user-flocker-russ” https://control.mydomain.com:4523/v1/state/nodes
```
{{< /terminal >}}

You should see something like the following output;

{{< terminal title="Flocker on CentOS 7 37/41" >}}
```
russ in ~/Documents/Projects/Flocker
⚡ curl — cacert ~/Documents/Projects/Flocker/cluster.crt — cert “user-flocker-russ” https://control.mydomain.com:4523/v1/state/nodes
[{“host”: “123.123.123.1”, “uuid”: “0ed63f10–7065–4d37-af7c-6128cb5c072f”}, {“host”: “123.123.123.2”, “uuid”: “f939152e-0ec0–4d7c-ae74–37c899648dca”}]
```
{{< /terminal >}}

As you can see both nodes, with the UIDs of the node certificates are showing.

#### Docker Plugin test

Now you have the nodes talking to the control node its time to try and launch a container;

{{< terminal title="Flocker on CentOS 7 38/41" >}}
```
docker run -v wibble:/data — volume-driver flocker busybox sh -c “echo Hello from Flocker > /data/file.txt”
```
{{< /terminal >}}

You should see something like the following output;

{{< terminal title="Flocker on CentOS 7 39/41" >}}
```
[root@flocker02 ~]# docker run -v wibble:/data — volume-driver flocker busybox sh -c “echo Hello from Flocker > /data/file.txt”
Unable to find image ‘busybox:latest’ locally
latest: Pulling from library/busybox

c00ef186408b: Pull complete
ac6a7980c6c2: Pull complete
Digest: sha256:e4f93f6ed15a0cdd342f5aae387886fba0ab98af0a102da6276eaf24d6e6ade0
Status: Downloaded newer image for busybox:latest
[root@flocker02 ~]#
```
{{< /terminal >}}

Now you have written to “wibble:/data” you can launch another cotainer which remounts “wibble:/data” and prints the content of “/data/file.txt” to the screen;

{{< terminal title="Flocker on CentOS 7 40/41" >}}
```
docker run -v wibble:/data — volume-driver flocker busybox sh -c “cat /data/file.txt”
```
{{< /terminal >}}

You should see the following;

{{< terminal title="Flocker on CentOS 7 41/41" >}}
```
[root@flocker02 ~]# docker run -v wibble:/data — volume-driver flocker busybox sh -c “cat /data/file.txt”
Hello from Flocker
[root@flocker02 ~]#
```
{{< /terminal >}}

#### Further Testing

Now you have the basics tested you should be able to start working through some of the more advanced examples from [the official documentation](https://docs.clusterhq.com/en/1.8.0/tutorials_examples/index.html) like;

- [MongoDB](https://docs.clusterhq.com/en/1.8.0/tutorials_examples/tutorial/index.html)
- [Postgres](https://docs.clusterhq.com/en/1.8.0/tutorials_examples/examples/postgres.html)
- [Elasticsearch, Logstash & Kibana stack](https://docs.clusterhq.com/en/1.8.0/tutorials_examples/examples/linking.html)
