---
title: "Terraform & Azure"
description: "Unlock the power of Terraform and Azure for seamless VM provisioning! Learn how to streamline your infrastructure management today!"
author: "Russ Mckendrick"
date: 2015-07-19T15:13:10.000Z
lastmod: 2021-07-31T12:33:16+01:00

tags:
 - "Infrastructure as Code"
 - "Azure"
 - "Cloud"
 - "Terraform"

cover:
    image: "/img/2015-07-19_terraform-azure_0.png" 
    alt: "Unlock the power of Terraform and Azure for seamless VM provisioning! Learn how to streamline your infrastructure management today!"

images:
 - "/img/2015-07-19_terraform-azure_0.png"
 - "/img/2015-07-19_terraform-azure_1.png"
 - "/img/2015-07-19_terraform-azure_2.png"


aliases:
- "/terraform-azure-d818760b0eeb"

---

As regular readers will know I really like the tools provided by [Hashicorp](https://hashicorp.com/ "Hashicorp") and today I found an excuse to use one. I needed to bring up a Virtual Machine in [Microsoft Azure](http://azure.microsoft.com/en-gb/ "Azure"). I hadn’t logged into Azure for quite a while so imagine my shock when I opened the dashboard, it’s not that great and the beta of the new one isn’t that brilliant either. It was so bad I tweeted about it ….

{{< twitter user=russmckendrick id=622503853162934273 >}}

I had recently looked at [Terraform](https://www.terraform.io "Terraform") for another project and I worked through the [excellent getting started guide which covers how to launch AWS Instances](https://www.terraform.io/intro/getting-started/install.html "Getting started").

I decided that it maybe more straight forward to launch my test Virtual Machines using Terraform rather than going through the dashboard, apart from the storage container which I created ahead of launching my configuration.

Terraform is straight forward to install if you have [Homebrew](http://brew.sh "Homebrew") installed, none Mac users can follow the [install guide](https://www.terraform.io/intro/getting-started/install.html).

```
 brew install terraform
 brew cask install graphviz
```

There is a Cask version of terraform, this does not ship with the Azure provider so use the main brew package instead. [Graphviz](http://www.graphviz.org "Graphviz") is installed so that the graph functionality can be used.

I downloaded a copy of my Publish Settings from [https://manage.windowsazure.com/publishsettings](https://manage.windowsazure.com/publishsettings "Publish Settings") and renamed the file to settings.publishsettings. I then created terraform configuration (which can be found in the following repo [https://github.com/russmckendrick/terraform-examples/tree/master/azure](https://github.com/russmckendrick/terraform-examples/tree/master/azure)).

First off I checked everything was OK with the configuration using terraform plan;

```
 ⚡ terraform plan
 var.azure_settings_file
 Default: settings.publishsettings
 Enter a value:

Refreshing Terraform state prior to plan…

The Terraform execution plan has been generated and is shown below.
 Resources are shown in alphabetical order for quick scanning. Green resources
 will be created (or destroyed and then created if an existing resource
 exists), yellow resources are being changed in-place, and red resources
 will be destroyed.

Note: You didn’t specify an “-out” parameter to save this plan, so when
 “apply” is called, Terraform can’t guarantee this is what will execute.

+ azure_hosted_service.terraform-service
 default_certificate_thumbprint: “” => “<computed>”
 description: “” => “Hosted service created by Terraform.”
 ephemeral_contents: “” => “0”
 label: “” => “russ-tf-hs-01”
 location: “” => “West Europe”
 name: “” => “russ-terraform-service”
 status: “” => “<computed>”
 url: “” => “<computed>”

+ azure_instance.basic-server
 automatic_updates: “” => “0”
 description: “” => “<computed>”
 endpoint.#: “” => “1”
 endpoint.2462817782.name: “” => “SSH”
 endpoint.2462817782.private_port: “” => “22”
 endpoint.2462817782.protocol: “” => “tcp”
 endpoint.2462817782.public_port: “” => “22”
 hosted_service_name: “” => “russ-terraform-service”
 cover:
    image: “” => “OpenLogic 7.1”
 ip_address: “” => “<computed>”
 location: “” => “West Europe”
 name: “” => “russ-terraform-test”
 password: “” => “z69rVZfH”
 security_group: “” => “<computed>”
 size: “” => “Basic_A1”
 storage_service_name: “” => “russstoreage”
 subnet: “” => “<computed>”
 username: “” => “azureuser”
 vip_address: “” => “<computed>”

Plan: 2 to add, 0 to change, 0 to destroy.
```

As you can see everything is good to go, I also generated graphical overview using terraform graph which shows how it looks;

```
terraform graph | dot -Tpng > graph.png
```

![graph](/img/2015-07-19_terraform-azure_1.png)

As everything looked good it was time to apply the configuration and launch the Virtual Machine using terraform apply;

```
 ⚡ terraform apply
 var.azure_settings_file
 Default: settings.publishsettings
 Enter a value:

azure_hosted_service.terraform-service: Creating…
 default_certificate_thumbprint: “” => “<computed>”
 description: “” => “Hosted service created by Terraform.”
 ephemeral_contents: “” => “0”
 label: “” => “russ-tf-hs-01”
 location: “” => “West Europe”
 name: “” => “russ-terraform-service”
 status: “” => “<computed>”
 url: “” => “<computed>”
 azure_hosted_service.terraform-service: Creation complete
 azure_instance.basic-server: Creating…
 automatic_updates: “” => “0”
 description: “” => “<computed>”
 endpoint.#: “” => “1”
 endpoint.2462817782.name: “” => “SSH”
 endpoint.2462817782.private_port: “” => “22”
 endpoint.2462817782.protocol: “” => “tcp”
 endpoint.2462817782.public_port: “” => “22”
 hosted_service_name: “” => “russ-terraform-service”
 cover:
    image: “” => “OpenLogic 7.1”
 ip_address: “” => “<computed>”
 location: “” => “West Europe”
 name: “” => “russ-terraform-test”
 password: “” => “z69rVZfH”
 security_group: “” => “<computed>”
 size: “” => “Basic_A1”
 storage_service_name: “” => “russstoreage”
 subnet: “” => “<computed>”
 username: “” => “azureuser”
 vip_address: “” => “<computed>”
 azure_instance.basic-server: Creation complete

Apply complete! Resources: 2 added, 0 changed, 0 destroyed.

The state of your infrastructure has been saved to the path
 below. This state is required to modify and destroy your
 infrastructure, so keep it safe. To inspect the complete state
 use the `terraform show` command.

State path: terraform.tfstate
```

As you can see from the GUI below it launched the Cloud Service and Virtual Machine as defined.

![microsoft-azure](/img/2015-07-19_terraform-azure_2.png)

I then used terraform show to query my instance to get the computed elements of the configuration;

```

 ⚡ terraform show
 azure_hosted_service.terraform-service:
 id = russ-terraform-service
 description = Hosted service created by Terraform.
 ephemeral_contents = false
 label = russ-tf-hs-01
 location = West Europe
 name = russ-terraform-service
 azure_instance.basic-server:
 id = russ-terraform-test
 automatic_updates = false
 endpoint.# = 1
 endpoint.2462817782.name = SSH
 endpoint.2462817782.private_port = 22
 endpoint.2462817782.protocol = tcp
 endpoint.2462817782.public_port = 22
 hosted_service_name = russ-terraform-service
 image = OpenLogic 7.1
 ip_address = 100.112.32.27
 location = West Europe
 name = russ-terraform-test
 password = z69rVZfH
 reverse_dns = 
 security_group = 
 size = Basic_A1
 storage_service_name = russstoreage
 subnet = 
 username = azureuser
 vip_address = 104.40.211.127
```

I connected to the Virtual Machine, did what I had to do (thats a whole other blog post) and then finally tore down the Virtual Machine and Cloud Service using terraform destroy;

```
 ⚡ terraform destroy
 Do you really want to destroy?
 Terraform will delete all your managed infrastructure.
 There is no undo. Only ‘yes’ will be accepted to confirm.

Enter a value: yes

var.azure_settings_file
 Default: settings.publishsettings
 Enter a value:

azure_hosted_service.terraform-service: Refreshing state… (ID: russ-terraform-service)
 azure_instance.basic-server: Refreshing state… (ID: russ-terraform-test)
 azure_instance.basic-server: Destroying…
 azure_instance.basic-server: Destruction complete
 azure_hosted_service.terraform-service: Destroying…
 azure_hosted_service.terraform-service: Destruction complete

Apply complete! Resources: 0 added, 0 changed, 2 destroyed.
```

As a Mac / Linux user I found the whole experience to be a lot more what I am used to with other cloud services and a lot less “Microsoft” than I feared.
