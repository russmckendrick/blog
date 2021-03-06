---
author: Russ McKendrick
comments: true
date: 2014-12-14 12:00:00+00:00
image: assets/posts/05b95-1fbbrk3hdstn5wiwc7ppfka.png
title: First Steps with Ansible
categories:
    - Tech
tags:
    - Ansible
    - AWS
    - CentOS
    - Shell
---

All of the posts on orchestration on here have been about [Puppet](/2014/01/12/vagrant-puppet/) on [CentOS](/2014/02/23/more-puppet/) however last week I had need to script an AWS architecture and then launch instances built with [Packer](https://www.packer.io/) into it.

After much swearing I managed to hack together a python script which used [Boto](https://github.com/boto/boto) to create a launch configuration and register it with an auto-scaling group, I then used a second script which re-cycled instances behind the Elastic Load Balancer which were launched with the previous launch configuration.

I decided there must be a more elegant way of doing this so I looked at Puppet using it to manage AWS, there are some modules available but there was a lot of people discussing the various ways to configure a VPC using Puppet. Then I remember that learning the basics of [Ansible](http://www.ansible.com/home) was on my list of things to do.

[https://www.youtube.com/embed/Qi0AhK7PMCI](https://www.youtube.com/embed/Qi0AhK7PMCI)

As Ansible is agent-less I needed to install it on my Mac, this is simple enough as you can use [Brew](http://brew.sh) ….

    
    brew update
    brew install ansible


… once install I used a CentOS 7 Vagrant box to work through a few [tutorials](http://docs.ansible.com/intro_getting_started.html) …

    
    russ @ Russs-iMac in ~/Desktop/ansible
    vagrant up
    Bringing machine ‘default’ up with ‘virtualbox’ provider…
    ==> default: Importing base box ‘zoresvit/centos-7.0’…
    ==> default: Matching MAC address for NAT networking…
    ==> default: Checking if box ‘zoresvit/centos-7.0’ is up to date…
    ==> default: Setting the name of the VM: ansible-000dd0c7684e44d25776288b71d594e00234a0ad_default_1418570825018_9435
    ==> default: Clearing any previously set network interfaces…
    ==> default: Preparing network interfaces based on configuration…
    default: Adapter 1: nat
    default: Adapter 2: hostonly
    ==> default: Forwarding ports…
    default: 22 => 2222 (adapter 1)
    ==> default: Running ‘pre-boot’ VM customizations…
    ==> default: Booting VM…
    ==> default: Waiting for machine to boot. This may take a few minutes…
    default: SSH address: 127.0.0.1:2222
    default: SSH username: vagrant
    default: SSH auth method: private key
    default: Warning: Connection timeout. Retrying…
    ==> default: Machine booted and ready!
    ==> default: Checking for guest additions in VM…
    ==> default: Setting hostname…
    ==> default: Configuring and enabling network interfaces…
    ==> default: Mounting shared folders…
    default: /share => /Users/russ/Desktop/ansible/share
    default: /vagrant => /Users/russ/Desktop/ansible
    ==> default: Running provisioner: ansible…



    
    PLAY [all] ********************************************************************



    
    GATHERING FACTS *************************************************************** 
    ok: [default]



    
    TASK: [common | install ntp] ************************************************** 
    changed: [default]



    
    TASK: [common | check ntpd service is stopped] ******************************** 
    changed: [default]



    
    TASK: [common | ntpdate] ****************************************************** 
    skipping: [default]



    
    TASK: [common | ntp config file] ********************************************** 
    changed: [default]



    
    TASK: [common | start ntpd service] ******************************************* 
    changed: [default]



    
    NOTIFIED: [common | restart ntpd] ********************************************* 
    changed: [default]



    
    PLAY RECAP ******************************************************************** 
    default : ok=6 changed=5 unreachable=0 failed=0


… like all first steps using a new orchestration tool I had installed & configured NTPD.

The syntax itself isn’t too different from Puppet so it was easy to get the gist of what was going on. Once I had gotten my head around the basics I started on creating a [Playbook](http://docs.ansible.com/playbooks.html) which configures a VPC and launches an Elastic Load Balancer , here is the current work in progress …

[https://gist.github.com/russmckendrick/874b67126f2564be64e8](https://gist.github.com/russmckendrick/874b67126f2564be64e8)

Once I have everything working as expected I will post an update.
