---
title: "Packer CentOS 8"
summary: "CentOS 8 has been out for a few weeks, so this weekend I decided to have a play."
author: "Russ McKendrick"
date: 2019-10-13T01:43:27+01:00
image: "assets/headers/2019-10-13-packer-centos8.png"
comments: true
draft: false
categories:
  - Tech
tags: 
  - CentOS
  - Packer
---

Now that CentOS 8 has been out for a few weeks I decided it was time to dip my toe in the water and update the CentOS 7 Packer scripts I had to work with CentOS 8.

For those that don't know, [Packer by Hashicorp](https://www.packer.io), is a tool which allows you to build your own images from a number of sources and use them on a number of platforms - Hashicorp describe Packer as;

> HashiCorp Packer is easy to use and automates the creation of any type of machine image. It embraces modern configuration management by encouraging you to use automated scripts to install and configure the software within your Packer-made images. Packer brings machine images into the modern age, unlocking untapped potential and opening new opportunities.

I took my [CentOS 7 Packer configuration](https://github.com/russmckendrick/packer-centos7) and tweaked it as the build process wasn't different, the repo containing the CentOS 8 configuration can be found at [https://github.com/russmckendrick/packer-centos8](https://github.com/russmckendrick/packer-centos8).

Running the build went as expected, building using VMWare with the following command;

```
$ packer build -only vmware-iso CentOS_8.json
```

Gave the following;

{{< cdn src="/assets/body/2019-10-13-packer-centos802.png" alt="The command line output" >}}
{{< cdn src="/assets/body/2019-10-13-packer-centos801.png" alt="The VMWare machine starting up" >}}

For VirtualBox I ran;

```
$ packer build -only virtualbox-iso CentOS_8.json
```

and got;

{{< cdn src="/assets/body/2019-10-13-packer-centos803.png" alt="The command line output" >}}
{{< cdn src="/assets/body/2019-10-13-packer-centos804.png" alt="The VMWare machine starting up" >}}

Once I have the two Vagrant boxes the Packer configuration produced I uploaded the them to [Vagrant Cloud](https://app.vagrantup.com/russmckendrick/), you can find them both at [http://app.vagrantup.com/russmckendrick/boxes/centos8](http://app.vagrantup.com/russmckendrick/boxes/centos8). Once uploaded I used Vagrant to launch my first CentOS 8 server;

```
$ mkdir ~/centos8
$ cd ~/centos8
$ vagrant init russmckendrick/centos8
$ vagrant up
```

{{< cdn src="/assets/body/2019-10-13-packer-centos805.png" alt="Starting the Vagrant Box" >}}

Once launched, I used `vagrant ssh` to login and check the release file;

{{< cdn src="/assets/body/2019-10-13-packer-centos806.png" alt="Logging in and check the version" >}}

As you can see, I was prompted to to activate the web console, to do this I ran the following commands within the Vagrant box;

```
$ sudo systemctl enable --now cockpit.socket
$ sudo systemctl start cockpit
```

Then found out the IP address of the Vagrant box by running;

```
$ vagrant ssh -c "ip address show | grep 'inet ' | grep -v '127.0.0.1' | sed -e 's/^.*inet //' -e 's/\/.*$//'" 2> /dev/null
```

For me, this returned `192.168.151.129`, I then went to the following URL https://192.168.151.129:9090/ and was greeted by a login page;

{{< cdn src="/assets/body/2019-10-13-packer-centos807.png" alt="Login page" >}}

Using the username and password of "**vagrant**" I logged in and got;

{{< cdn src="/assets/body/2019-10-13-packer-centos808.png" alt="Stats" >}}

As you can see, these are the basic stats, there are also updates available, most of which appear to be bug fixes;

{{< cdn src="/assets/body/2019-10-13-packer-centos809.png" alt="Updates" >}}

Also, Cockpit comes with its own built in Terminal;

{{< cdn src="/assets/body/2019-10-13-packer-centos810.png" alt="Terminal" >}}

Finally, to remove the Vagrant box I ran;

```
$ vagrant destroy
```

This stopped and removed the box and concluded my very brief play with CentOS 8. Expect more posts soon(ish).