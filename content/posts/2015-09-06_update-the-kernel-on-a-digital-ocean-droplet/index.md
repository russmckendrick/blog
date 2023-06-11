---
title: "Update the Kernel on a Digital Ocean droplet"
author: "Russ Mckendrick"
date: 2015-09-06T16:46:11.000Z
lastmod: 2021-07-31T12:33:22+01:00

tags:
 - "Linux"
 - "Cloud"
 - "Security"

cover:
    image: "/img/2015-09-06_update-the-kernel-on-a-digital-ocean-droplet_0.png" 
images:
 - "/img/2015-09-06_update-the-kernel-on-a-digital-ocean-droplet_0.png"
 - "/img/2015-09-06_update-the-kernel-on-a-digital-ocean-droplet_1.png"
 - "/img/2015-09-06_update-the-kernel-on-a-digital-ocean-droplet_2.png"


aliases:
- "/update-the-kernel-on-a-digital-ocean-droplet-de267b6366c0"

---

A while I posted about a script I wrote to quickly [bootstrap a Digital Ocean droplet](https://media-glass.es/2015/06/28/digital-ocean-bootstrap/).

One one of the things I noticed while trying to install a few packages is that even though my script had run a yum update I was booting into the original Kernel and this was causing all sorts of hilarity when trying to build a Kernel module, because of this I added a few lines to my script to tell you if the kernel has been updated, and if so what the new version is;

![script](/img/2015-09-06_update-the-kernel-on-a-digital-ocean-droplet_1.png)

Once the script has been run you should power down your droplet from within the [control panel](https://cloud.digitalocean.com/) by selecting your droplet, then enter the Power menu, hit the “Power off” button to power down your droplet. While the droplet is powered off goto “Settings” and the switch to the “Kernel” tab, from there select the kernel you would like your droplet to use (in the example above its 3.10.0–229.11.1.el7.x86_64) and click the “Change” button;

![digitaloceancontrolpanel](/img/2015-09-06_update-the-kernel-on-a-digital-ocean-droplet_2.png)

After you have changed the kernel return to the “Power” section and power on your droplet.

Once the droplet has booted you will be running the new kernel.

This process differs depending on the Operating System have chosen, but it is applicable to all of the CentOS droplets and Ubuntu versions below 15.04, not that I am running any [Ubuntu servers](https://media-glass.es/2014/08/03/operating-system-snob/).
