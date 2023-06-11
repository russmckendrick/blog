---
title: "Production Ready Images with Packer"
author: "Russ Mckendrick"
date: 2015-02-02T12:00:00.000Z
lastmod: 2021-07-31T12:32:35+01:00

tags:
    - "AWS"
    - "Automation"
    - "Infrastructure as Code"
    - "DevOps"

cover:
    image: "/img/2015-02-02_production-ready-images-with-packer_0.png" 
images:
 - "/img/2015-02-02_production-ready-images-with-packer_0.png"


aliases:
- "/production-ready-images-with-packer-df467297c0ea"

---

I have watched numerous videos and seen quite a few slide decks which cover tools such as Puppet, Chef & Ansible. I have witnessed an entire rack of servers PXE boot, installing their base operating systems, configuring their services and then finally checking out a copy of a production ready codebase. Even after seeing this several times the old school sysadmin in me still thinks this is witchcraft.

In the world of dedicated servers or virtual machines this is great, however when it comes launching an auto-scaling instance in a service such as Amazon Web Services using orchestration tools in real-time could be the difference in your application staying online or failing.

Typically when auto-scaling is triggered by an event it’s because you need the additional resources as soon as possible, not in 15 minutes. You don’t want to be waiting around for …

- The instance to boot
- The instance to register itself with your orchestration tool
- The operating system to be updated
- Your software stack to be installed & configured
- Shared storage to be mounted
- Your application to be deployed
- The instance to register itself with the load balancer once it passes the health checks

Instead you would want …

- The instance to boot
- Shared storage to be mounted
- The instance to register itself with the load balancer once it passes the health checks

So how can you achieve this? The first thing is you don’t have to retool, you can still use your orchestration tool of choice and your already written (and tested) configuration, you just need to apply them in a slightly different way.

Using software such as [Packer](https://packer.io/) (other tools are available such as [Ansible](http://docs.ansible.com/ec2_ami_module.html) or [Amazons own tools](http://docs.aws.amazon.com/AWSEC2/latest/UserGuide/creating-an-ami-ebs.html)) you can automatically spin up an instance, apply your configuration using your choice of provisioner, check out your codebase and then power it down and create an Amazon Machine Image. Then all you have to do is boot it, either manually or using Amazons AutoScaling functionality.

This is not only a great way to deploy your instances for use in Amazon, but your can also it to build images for local development [Vagrant](https://www.vagrantup.com) (by the same people as Packer), VMWare or your [hypervisor of choice](https://www.packer.io/intro/platforms.html).

For a more detailed overview of Packer as well as Vagrant, this talk by Mitchell Hashimoto is a great introduction.
