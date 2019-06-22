---
author: russmckendrick
comments: true
date: 2019-06-23 05:00:00+00:00
layout: post
current: post
class: post-template
navigation: True
title: Azure Bastion
slug: azure-bastion
cover: assets/headers/2019-06-23-azure-bastion.jpg
categories: Tech
tags: 
  - Azure
---

Last week Microsoft announced that Azure Bastion had gone into public preview, I had been interested in this service since I first heard about it a few months ago.

As I had some time, I decided to take a look and see if the initial release shows as much promise as I hope it would have when first read the overview.

To get access to the Azure Bastion preview, you will need to run the following PowerShell commands from [Cloud shell](https://shell.azure.com/) which will enable the service against your account;

```
PS Azure:\> Register-AzureRmProviderFeature -FeatureName AllowBastionHost -ProviderNamespace Microsoft.Network
PS Azure:\> Register-AzureRmResourceProvider -ProviderNamespace Microsoft.Network
```

The first of the two commands enrols you into the preview and the second re-registers your subscription with the Microsoft.Network namespace. You can check the feature is correctly registered within your subscription by running;

```
PS Azure:\> Get-AzProviderFeature -ProviderNamespace Microsoft.Network
```

You should see something like the following output from the first two commands;

![The output of running the PowerShell commands](/assets/body/2019-06-23-azure-bastion01.png)

I then created a Virtual Network in East US, which is one of the supported regions. When creating the Virtual Network, I added a second subnet called **AzureBastionSubnet**, in my case I used a `/24`. However, the minimum size for this subnet is `/27`; if you do not add this now you will be prompted to add a new Virtual Network when creating the Bastion host;

![The additional subnet](/assets/body/2019-06-23-azure-bastion02.png)

Once the Virtual Network was in place, I launched a small test virtual machine, when configuring the machine, I made sure that there was no public IP address present. The resource group once the virtual machine had launched looked like the following;

![An inaccessible virtual machine](/assets/body/2019-06-23-azure-bastion03.png)

Once the virtual machine and you will need to use a special Preview version of the portal which has the Azure Bastion features enable, **this is only accessible** by going to the [http://aka.ms/BastionHost](http://aka.ms/BastionHost), once logged in you should see a familiar looking Azure Portal, however it will have an orange header.

So now that I have an inaccessible virtual machine and we are logged into the preview portal it is time to launch the bastion host - to do this, click on the **+ Create a resource** button and search the Azure Marketplace for Bastion, you should see results which look something like the following;

![The marketplace search results](/assets/body/2019-06-23-azure-bastion04.png)

Clicking on **Bastion (Preview)** result will give you a **Create** button, here you will have several options, I filled them in as follows;

![Creating the Bastion host](/assets/body/2019-06-23-azure-bastion05.png)

Clicking on **Review + Create** and then when I was happy with the details **Create** set off the deployment, after around 5 minutes it completed;

![Success !!!!](/assets/body/2019-06-23-azure-bastion06.png)

To use the Bastion host, you will need to go to the test VM which was launched, in the **Operations** section of the VM you will notice that there is an option for **Bastion**, click on this to be taken to the connection screen which currently looks like the following;

![Connecting through the Bastion](/assets/body/2019-06-23-azure-bastion07.png)

As you can see, while I opted to use a password, you can also use a private SSH key. Once you click on **Connect** a new window will open, and you will be presented with a terminal;

![It's the Test Virtual Machine](/assets/body/2019-06-23-azure-bastion08.png)

As you can see, you are connected straight through to the virtual machine - which in my case was running CentOS 7.5. You might notice that there is a pull-out menu on the left of the screen identified by **>>**, clicking on this will reveal the clipboard. From here you can select text from within the host, and it will appear within the clipboard;

![Pasting through to the host](/assets/body/2019-06-23-azure-bastion09.png)

You can also paste text straight into the box, then right-click to paste it into the host machine;

![Copying from the host](/assets/body/2019-06-23-azure-bastion10.png)

Now that we have played with a Linux box let's launch a Windows virtual machine. Once started, click on the **Connect** option, and you can see that a **Bastion** tab has been added, fill in the details;

![Connecting to the Windows VM](/assets/body/2019-06-23-azure-bastion11.png)

Once you click on **Connect** a new browser window will open, and you will be connected to the virtual machine;

![Connecting to the Windows VM](/assets/body/2019-06-23-azure-bastion12.png)

You can copy and paste text just as we did on the Linux host using the extendable Clipboard box, but other than that it is a standard RDP connection, in a browser, on my Mac.

For the short time I used Azure Bastion it was responsive, and I didn't have any issues. The service as a whole looks great and solves a problem, having a jump host exposed to the network 24/7, either via the internet or privately using an Express Route. Being able to make ad-hoc connections to Virtual Machines with the added security of using the Azure portal session, meaning MFA, is going to be a plus for compliance and will make managing firewalls more straight forward as you don't need to open ports or add public IP addresses as Azure Bastion runs within the Virtual Network.

Please note, while you will be able to see the Azure Bastion service running in the regular Azure Portal;

![This is useless](/assets/body/2019-06-23-azure-bastion13.png)

You currently will not be able to take advantage of the service without first logging into the exclusive preview portal at [http://aka.ms/BastionHost](http://aka.ms/BastionHost) due to the service's reliance on additional functionality in the Azure Portal.

For more information on the server see the following video;

{% include embed/youtube.html id="eLjuWG-L57Q" %}

or the services documentation at [https://docs.microsoft.com/en-us/azure/bastion/](https://docs.microsoft.com/en-us/azure/bastion/).
