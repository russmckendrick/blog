---
author: russmckendrick
comments: true
date: 2015-05-24 11:00:00+00:00
layout: post
link: http://mediaglasses.blog/2015/05/24/quick-openstack-kilo-installation/
slug: quick-openstack-kilo-installation
title: Quick OpenStack Kilo Installation
wordpress_id: 1095
categories:
- Tech
tags:
- CentOS
- OpenStack
- Vagrant
---

I am going to be playing with OpenStack over the next few weeks so I decided to create a Vagrant script which would bootstrap a working [OpenStack Kilo](https://wiki.openstack.org/wiki/ReleaseNotes/Kilo) installation using [RedHat RDO](https://www.rdoproject.org/).

It uses my [CentOS 7 Vagrant box](https://vagrantcloud.com/russmckendrick/boxes/centos7) and works with both VirtualBox and VMWare Fusion.

To get it up and running create a folder for the Vagrantfile to live;

    
    mkdir -p ~/Machines/OpenStack/


Download a copy of the Vagrantfile;

    
    curl -O <a href="https://gist.githubusercontent.com/russmckendrick/49700dbf18ac2d7fbbfa/raw/46c367fa9d257bab46affe15a19904c9d5171be9/Vagrantfile" target="_blank" data-href="https://gist.githubusercontent.com/russmckendrick/49700dbf18ac2d7fbbfa/raw/46c367fa9d257bab46affe15a19904c9d5171be9/Vagrantfile">https://gist.githubusercontent.com/russmckendrick/49700dbf18ac2d7fbbfa/raw/46c367fa9d257bab46affe15a19904c9d5171be9/Vagrantfile</a> > ~/Machines/OpenStack/Vagrantfile


and start the machine up;

    
     cd ~/Machines/OpenStack/
     vagrant up # for VirtualBox
     vagrant up — provider vmware_fusion # for VMWare Fusion


It will take around 20 minutes to bootstrap the machine so make a cup of tea and watch this introduction to Kilo;

[https://www.youtube.com/embed/y39CAXJAW3M](https://www.youtube.com/embed/y39CAXJAW3M)

Feel free to reuse the Vagrantfile if you like;

[https://gist.github.com/russmckendrick/49700dbf18ac2d7fbbfa](https://gist.github.com/russmckendrick/49700dbf18ac2d7fbbfa)
