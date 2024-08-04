---
title: "Docker for Amazon Web Services Beta"
description: "Explore Docker for Amazon Web Services beta, effortlessly launch Docker Swarm clusters on AWS with CloudFormation templates. Easy scaling and management."
author: "Russ Mckendrick"
date: "2016-08-12T11:30:31+01:00"
tags:
  - "Cloud"
  - "AWS"
  - "Docker"
cover:
  image: "/img/2016-08-12_docker-for-amazon-web-services-beta_0.png"
  alt: "Explore Docker for Amazon Web Services beta, effortlessly launch Docker Swarm clusters on AWS with CloudFormation templates. Easy scaling and management."
lastmod: "2021-07-31T12:34:06+01:00"
aliases:
  - "/docker-for-amazon-web-services-beta-b0a48d6df1a5"
---

Yesterday the following email dropped into my inbox …

![email](/img/2016-08-12_docker-for-amazon-web-services-beta_1.jpg)

… I spend a lot of the day job looking at and talking about Amazon Web Services (AWS) so this had got my interest.

In [my last book](https://www.packtpub.com/networking-and-servers/extending-docker) I covered Amazon’s Elastic Container Service (ECS) and I have to admit that it wasn’t the most greatest service Amazon had released, especially compared the ease you can now [launch Swarm Clusters using Docker](/2016/06/25/docker-load-balancing-application-bundles/).

As you can see from the e-mail, Dockers AWS beta ships in two parts, the first being the Amazon Machine Image (AMI) which until general release is shared with your AWS account and the second part is a CloudFormation template.

The CloudFormation template is where all of the hard work happens, as you can see from the rendering of the template below, taken from the CloudFormation visual editor, it sets up quite a few AWS services …

![docker-aws02](/img/2016-08-12_docker-for-amazon-web-services-beta_2.jpg)

Now CloudFormation is not a tool as part of my day to day AWS use, instead I use [Ansible](https://www.ansible.com/) as I have to work with more than just AWS. However, CloudFormation is straight forward enough to follow, the template configures the following …

- Creates all of the IAM roles needed for the instances launched by the template to be able to interact with the AWS API
- Creates and configures the networking and security using Amazon Virtual Private Cloud (VPC)
- Launches two Elastic Load Balancers (ELB)
- Launches the instances needed to manage the cluster and also the cluster nodes themselves
- To allow the cluster stack to be upgraded the template configures Amazon Simple Queue Service (SQS) & DynamoDB to store the state of the cluster in

There are a few parameters you can customize before you launch the cluster, these allow you to control the size and specification of the cluster. As I am going to be only running the cluster to have a play around with I choose the following …

![docker-aws03](/img/2016-08-12_docker-for-amazon-web-services-beta_3.jpg)

It is important you select the SSH Key to use. While you can move onto launching the cluster with this option left blank, if you do, the cluster will fail to launch.

It takes about 5 minutes for the cluster to launch, you can keep an eye on where in the process you are at by keeping the events tab open, as you can see from the screen below my cluster has just starting running;

![docker-aws04](/img/2016-08-12_docker-for-amazon-web-services-beta_4.jpg)

Once you stack has been created click on outputs and you should see two ELB addresses, one of the addresses should have **Docker-ELB-SSH** in it, you will need to SSH to this address to manage your cluster, I ran the following to get into my cluster …

ssh docker@Docker-ELB-SSH-62516391.eu-west-1.elb.amazonaws.comm

Before we start to look at Docker itself lets see what underlying operation system the AMI Docker shared with us is using by running …

{{< terminal title="Docker for Amazon Web Services Beta 1/7" >}}
```
cat /etc/*release
```
{{< /terminal >}}

as you can see from the output below, they are using [Alpine Linux](https://www.alpinelinux.org) …

{{< terminal title="Docker for Amazon Web Services Beta 2/7" >}}
```
NAME=”Alpine Linux”
ID=alpine
VERSION_ID=3.3.3
PRETTY_NAME=”Alpine Linux v3.3"
HOME_URL=”http://alpinelinux.org"
BUG_REPORT_URL=”http://bugs.alpinelinux.org"
```
{{< /terminal >}}

… which makes sense as its also the operating system Docker are using for the underlying virtual machine in Docker for Mac & Windows.

There are a few containers which run on all of the nodes default, you can see these by running docker ps, however the documentation recommends leaving these alone as making changes to them or stopping them could cause problem with your cluster.

![docker-aws05](/img/2016-08-12_docker-for-amazon-web-services-beta_5.jpg)

As you can see from the screen above, we have 6 EC2 instances launched, so if we run the docker node ls command we should 6 nodes returned (1 management instance and 5 cluster nodes) …

{{< terminal title="Docker for Amazon Web Services Beta 3/7" >}}
```
docker node ls
ID HOSTNAME STATUS AVAILABILITY MANAGER STATUS
2refwgkq4jluq128gqeuuprw5 * ip-192–168–33–156.eu-west-1.compute.internal Ready Active Leader
4c42wk5m06b1g1nkzt27tos9t ip-192–168–33–190.eu-west-1.compute.internal Ready Active
4nmx66cboyzy34jg9tq8t7v4d ip-192–168–33–188.eu-west-1.compute.internal Ready Active
6tzs81n34g6tjv43ab359f1yl ip-192–168–34–4.eu-west-1.compute.internal Ready Active
6xdmbb9lew1ahatxk5sb5rrum ip-192–168–33–189.eu-west-1.compute.internal Ready Active
82cj3u8ck5sbuaagv6ebn0m8w ip-192–168–34–5.eu-west-1.compute.internal Ready Active
```
{{< /terminal >}}

Before we launch a server, lets take a quick look at the version of Docker which is running;

{{< terminal title="Docker for Amazon Web Services Beta 4/7" >}}
```
docker -v
Docker version 1.12.0, build 8eab29e, experimental
```
{{< /terminal >}}

The full release notes for this version [can be found here](https://github.com/docker/docker/releases/tag/v1.12.0)

Now we have our cluster up and running, we can launch a container service, like in my [previous](/2016/06/25/docker-load-balancing-application-bundles/)[posts](/2016/06/25/docker-service-load-balancing-and-docker-distributed-application-bundles/) we will launch [a simple container which just gives you the container ID](https://hub.docker.com/r/russmckendrick/cluster/). To launch a single container simply run the following command;

{{< terminal title="Docker for Amazon Web Services Beta 5/7" >}}
```
docker service create — name cluster -p:80:80/tcp russmckendrick/cluster
```
{{< /terminal >}}

and this will launch a container which will be available at the **docker-elb** ELB address which was given in the output tab of the CloudFormation page.

![docker-aws07](/img/2016-08-12_docker-for-amazon-web-services-beta_6.jpg)

As before we can scale the service using the following command …

{{< terminal title="Docker for Amazon Web Services Beta 6/7" >}}
```
docker service scale cluster=20
```
{{< /terminal >}}

Once scaled you should be able to refresh your browser a few times to see the container ID change. At any time you can check how many containers you have in service by running the docker service ls command …

{{< terminal title="Docker for Amazon Web Services Beta 7/7" >}}
```
docker service ls
ID NAME REPLICAS IMAGE COMMAND
5rxo34jox7ly cluster 20/20 russmckendrick/cluster
```
{{< /terminal >}}

You can remove a running service using the following command docker service rm cluster.

You terminal session should look like the one below …

![docker-aws06](/img/2016-08-12_docker-for-amazon-web-services-beta_7.jpg)

One of the bonuses of the stack being launched using CloudFormation is that you can get an estimate of how much it would cost to run your stack, as you can see from the screen below it would cost us $123.50 per month for us to run our stack with its 6 EC2 instances and 2 ELBs 24–7 …

![docker-aws08](/img/2016-08-12_docker-for-amazon-web-services-beta_8.jpg)

So there you have it, so far it is as easy to use Docker Swarm and a lot less complicated than Amazon ECS, however there a few features which I am sure will be added before the final release …

Load Balancing

There is only a single elastic load balancer launched, while you can map different ports to the ELB it would be good to be able to launch more one load balancer so I have have multiple applications running the same external ports or support for Amazons new Application Load Balancer …

- [New — AWS Application Load Balancer](https://aws.amazon.com/blogs/aws/new-aws-application-load-balancer/)
- [Application Load Balancer Details](https://aws.amazon.com/elasticloadbalancing/applicationloadbalancer/)
- [Launch Video](https://www.youtube.com/watch?v=4976_8JIWT4&index=2&list=PLhr1KZpdzukfsuHJK5mv40wVsMMhgOZ-Q)

Volumes

It would be good to be able to use Elastic Block Storage (EBS) and Elastic File System (EFS) as a native storage when creating volumes.

Amazon Services

One thing AWS do really well is providing highly-available services, it would also be good to launch some of these services such as Amazon Relational Database Service (RDS) or Amazon ElastiCache and have them (as far as Docker is concerned) as “virtual” containers accessible to my other containers.

I can’t wait to see how Docker for AWS develops over the coming months, they already have a solid base to build on so it will be good to see them start adding features like the ones mentioned above over the few releases.