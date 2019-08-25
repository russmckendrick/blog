---
title: "Azure Bastion"
author: "Russ McKendrick"
date: "2019-06-23"
image: "assets/headers/2019-06-23-azure-bastion.jpg"
comments: true
categories:
  - Tech
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

The first of the two commands enrolls you into the preview and the second re-registers your subscription with the Microsoft.Network namespace. You can check the feature is correctly registered within your subscription by running;

```
PS Azure:\> Get-AzProviderFeature -ProviderNamespace Microsoft.Network
```

You should see something like the following output from the first two commands;

{{< cdn src="/assets/body/2019-06-23-azure-bastion01.png" alt="The output of running the PowerShell commands" >}}

I then created a Virtual Network in East US, which is one of the supported regions. When creating the Virtual Network, I added a second subnet called **AzureBastionSubnet**, in my case I used a `/24`. However, the minimum size for this subnet is `/27`; if you do not add this now you will be prompted to add a new Virtual Network when creating the Bastion host;

{{< cdn src="/assets/body/2019-06-23-azure-bastion02.png" alt="The additional subnet" >}}

Once the Virtual Network was in place, I launched a small test virtual machine, when configuring the machine, I made sure that there was no public IP address present. The resource group once the virtual machine had launched looked like the following;

{{< cdn src="/assets/body/2019-06-23-azure-bastion03.png" alt="An inaccessible virtual machine" >}}

Once the virtual machine and you will need to use a special Preview version of the portal which has the Azure Bastion features enable, **this is only accessible** by going to the [http://aka.ms/BastionHost](http://aka.ms/BastionHost), once logged in you should see a familiar looking Azure Portal, however it will have an orange header.

So now that I have an inaccessible virtual machine and we are logged into the preview portal it is time to launch the bastion host - to do this, click on the **+ Create a resource** button and search the Azure Marketplace for Bastion, you should see results which look something like the following;

{{< cdn src="/assets/body/2019-06-23-azure-bastion04.png" alt="The marketplace search results" >}}

Clicking on **Bastion (Preview)** result will give you a **Create** button, here you will have several options, I filled them in as follows;

{{< cdn src="/assets/body/2019-06-23-azure-bastion05.png" alt="Creating the Bastion host" >}}

Clicking on **Review + Create** and then once I was happy with the details **Create** set off the deployment, after around 5 minutes it completed;

{{< cdn src="/assets/body/2019-06-23-azure-bastion06.png" alt="Success !!!!" >}}

To use the Bastion host, you will need to go to the test VM which was launched, in the **Operations** section of the VM you will notice that there is an option for **Bastion**, click on this to be taken to the connection screen which currently looks like the following;

{{< cdn src="/assets/body/2019-06-23-azure-bastion07.png" alt="Connecting through the Bastion" >}}

As you can see, while I opted to use a password, you can also use a private SSH key. Once you click on **Connect** a new window will open, and you will be presented with a terminal;

{{< cdn src="/assets/body/2019-06-23-azure-bastion08.png" alt="It's the Test Virtual Machine" >}}

As you can see, you are connected straight through to the virtual machine - which in my case was running CentOS 7.5. You might notice that there is a pull-out menu on the left of the screen identified by **>>**, clicking on this will reveal the clipboard. From here you can select text from within the host, and it will appear within the clipboard;

{{< cdn src="/assets/body/2019-06-23-azure-bastion09.png" alt="Pasting through to the host" >}}

You can also paste text straight into the box, then right-click to paste it into the host machine;

{{< cdn src="/assets/body/2019-06-23-azure-bastion10.png" alt="Copying from the host" >}}

Now that we have played with a Linux box let's launch a Windows virtual machine. Once started, click on the **Connect** option, and you can see that a **Bastion** tab has been added, fill in the details;

{{< cdn src="/assets/body/2019-06-23-azure-bastion11.png" alt="Connecting to the Windows VM" >}}

Once you click on **Connect** a new browser window will open, and you will be connected to the virtual machine;

{{< cdn src="/assets/body/2019-06-23-azure-bastion12.png" alt="Connecting to the Windows VM" >}}

You can copy and paste text just as we did on the Linux host using the extendable Clipboard box, but other than that it is a standard RDP connection, in a browser, on my Mac.

For the short time I used Azure Bastion it was responsive, and I didn't have any issues. The service as a whole looks great and is one of those solves a problem you probably didn't know you have, having a jump host exposed to the network 24/7, either via the internet or privately using an Express Route. 

Being able to make ad-hoc connections to Virtual Machines in a "cloud native way" with the added security of using the Azure portal session, meaning 2FA and whatever access controls you have in place to protect your Azure accounts, is going to be a very big tick when it comes to meeting the requirements of  compliance and info-sec teams. It will make managing firewalls more straight forward as you don't need to open ports or add public IP addresses as Azure Bastion runs within your Virtual Networks and isn't exposed externally.

Please note, while you will be able to see the Azure Bastion service running in the regular Azure Portal;

{{< cdn src="/assets/body/2019-06-23-azure-bastion13.png" alt="This is useless" >}}

You currently will not be able to take advantage of the service without first logging into the Azure Bastion preview portal at [http://aka.ms/BastionHost](http://aka.ms/BastionHost) due to the service's reliance on additional functionality in the Azure Portal.

For more information on the server see the following video;

{{< youtube "eLjuWG-L57Q" >}}

or the services documentation at [https://docs.microsoft.com/en-us/azure/bastion/](https://docs.microsoft.com/en-us/azure/bastion/).
