---
title: "Docker"
description: "A beginner's guide to Docker on CentOS, covering installation, running containers, and basic management with an introduction to Docker commands."
author: "Russ Mckendrick"
date: "2014-02-15T12:00:00+01:00"
tags:
  - "Docker"
  - "Tools"
cover:
  image: "/img/2014-02-15_docker_0.png"
  alt: "A beginner's guide to Docker on CentOS, covering installation, running containers, and basic management with an introduction to Docker commands."
lastmod: "2021-07-31T12:31:13+01:00"
aliases:
  - "/docker-516afc902732"
---

Been playing a little with [Docker](http://docker.io/) this afternoon, while its something I have been aware for a while its not something I have really looked into.

As I prefer working with CentOS rather than Ubuntu its taken me a while to get the motivation to do any more than some reading, however as the latest version now runs on RHE compatible

{{< terminal title="Docker 1/4" >}}
```
yum install http://www.mirrorservice.org/sites/dl.fedoraproject.org/pub/epel/6/i386/epel-release-6-8.noarch.rpm
yum -y install docker-io
service docker start
chkconfig docker on
```
{{< /terminal >}}

Once the services are installed pull down some images to test with;

{{< terminal title="Docker 2/4" >}}
```
docker pull ubuntu
docker pull centos
docker run centos /bin/echo hello world
```
{{< /terminal >}}

the last command launches a CentOS container, runs the echo and then exits. To do something more interesting;

{{< terminal title="Docker 3/4" >}}
```
CONTAINER_ID=$(sudo docker run -d ubuntu /bin/sh -c “while true; do echo hello world; sleep 1; done”)
docker ps
docker attach -sig-proxy=false $CONTAINER_ID
docker logs $CONTAINER_ID
docker stop $CONTAINER_ID
```
{{< /terminal >}}

Once you have some containers running the following commands are useful;

{{< terminal title="Docker 4/4" >}}
```
docker info # Get some information on the installation
docker images # List the available images
docker ps # Whats running?
docker search [TERM] # Search for images
```
{{< /terminal >}}

This is probably one of the better introductions to Docker I have seen;

and some further reading;

- [Simple SAAS](http://developer.rackspace.com/blog/slumlord-hosting-with-docker.html)
- [List of projects](http://blog.docker.io/2013/07/docker-projects-from-the-docker-community/)
- [Puppet Module](http://forge.puppetlabs.com/garethr/docker)
