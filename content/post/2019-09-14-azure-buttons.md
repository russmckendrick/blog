---
title: "Adding a Deploy to Azure Button"
summary: "While working on another post I needed to launch an Ansible VM in Azure, so I decided to look at a button!"
author: "Russ McKendrick"
date: 2019-09-14T19:43:27+01:00
image: "assets/headers/2019-09-14-azure-buttons.png"
comments: true
draft: false
categories:
  - Tech
tags: 
  - Azure
  - Ansible
---

I am currently a working on a few other blog posts and presentations for work on some Azure features which required me to launch a CentOS 7 Virtual Machine running the latest version of Ansible using an ARM template.

One thing I had noticed which doing reading up on the services I am going to be using is that a lot of the demos and documentation from Microsoft had buttons where you could **Deploy to Azure**, so I decided to create my own - you can see the finish product below;

<a href="https://azuredeploy.net/?repository=https://github.com/russmckendrick/azure-ansible-centos" alt="Deploy to Azure" target="_blank">
   <img src="https://azuredeploy.net/deploybutton.png"/>
</a>

The HTML used to generate the button above looks like the following;

```
<a href="https://azuredeploy.net/?repository=https://github.com/russmckendrick/azure-ansible-centos" alt="Deploy to Azure" target="_blank">
   <img src="http://azuredeploy.net/deploybutton.png"/>
</a>
```

Or you could use markdown, which looks like the following;

```
[![Deploy to Azure](https://azuredeploy.net/deploybutton.png)](https://azuredeploy.net/?repository=https://github.com/russmckendrick/azure-ansible-centos)
```

All you need to do is make sure that your ARM template us called `azuredeploy.json` and when a user clicks on the **Deploy to Azure** button they will be transferred to the launcher which loads in the [ARM template in the provided repository](https://github.com/russmckendrick/azure-ansible-centos).

Once loaded they should be presented with a screen which looks like the following;

{{< cdn src="/assets/body/2019-09-14-azure-buttons-01.png" alt="Entering the information" >}}

Once the required information has been filled in, clicking **Next** will validate their input and give them an overview of the resources will be launched;

{{< cdn src="/assets/body/2019-09-14-azure-buttons-02.png" alt="Almost ready" >}}

Clicking on the **Deploy** button will launch the resources, and after several minutes they should see something like the following;

{{< cdn src="/assets/body/2019-09-14-azure-buttons-03.png" alt="All done" >}}

This is a nice and simple way to allow you users to launch your ARM template powered application in Azure ☁️.

{{< giphy "cdGQHR4Qzefx6" >}}
