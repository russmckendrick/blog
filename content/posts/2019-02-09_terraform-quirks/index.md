---
title: "Terraform Quirks"
description: "Explore Terraform quirks: module challenges, resource dependencies, and count/list workarounds."
author: "Russ Mckendrick"
date: 2019-02-09T00:00:00.000Z
tags:
 - Terraform
 - Infrastructure as Code

cover:
    image: "/img/2019-02-09_terraform-quirks_0.png" 
    alt: "Explore Terraform quirks: module challenges, resource dependencies, and count/list workarounds."

images:
 - "/img/2019-02-09_terraform-quirks_0.png"


aliases:
- "/terraform-quirks-d43569381300"

---

I have been using Terraform over the last few months, having [not used it in anger for quite a while](https://mediaglasses.blog/2015/07/19/terraform-azure/) since the projects I have been working on have been more suitable for using [Ansible](https://www.packtpub.com/virtualization-and-cloud/learn-ansible).

However, as I am doing more and more with Microsoft Azure, I found the Ansible modules a little lacking, plus for someone of the projects I have had to use an orchestration tool which can natively run on Windows.

Doing a little reading, I decided that I should be using modules so that i didn’t have to repeat lots of code. While this approach has mostly worked the current version of Terraform, 0.11.x, does have a few annoyances.

For example, in Azure, you have to create a resource group and then place resources you are launching in the group you have configured. Great I thought to myself I will just create a module which generates the resource group and then use an output to reference the resource group later in my plan.

The code for the module looked something like the following;

```
resource "azurerm_resource_group" "resource_group" {  name     = "${var.resource_group_name}"  location = "${var.location}"  tags     = "${var.tags}"}variable "name" {  description = "The name of the resource group we want to use"  default     = ""}variable "location" {  description = "The location/region where we are crrating the resource"  default     = ""}variable "tags" {  description = "The tags to associate the resource we are creating"  type        = "map"  default     = {}}output "rg_name" {  description = "The name of the newly created resource group"  value       = "${azurerm_resource_group.resource_group.name}"}
```

I was hoping that this meant that my **main.tf** could look like;

```
module "application-rg" {  source   = "modules/vnet"  name     = "${var.resource_group_name}"  location = "${var.location}"  tags     = "${merge(var.default_tags, map("type","resource"))}"}module "application-vnet" {  source              = "modules/vnet"  resource_group_name = "${module.application-rg.rg_name}"  location            = "${var.location}"  tags                = "${merge(var.default_tags, map("type","network"))}"  vnet_name           = "${module.application-rg.rg_name}-vnet"  address_space       = "10.10.0.0/16"}
```

While it worked, it did error a lot of the time from a standing start, this was because by Terraform was trying to create the vNet before the Resource Group had been created.

No problem I thought to myself — I remembered from the last time I used Terraform that there are resource dependencies in the form of . However, after much reading, I discovered that **depends_on** isn’t yet supported for modules — it is on the road map though.

Because of this I had to rejig my **main.tf** file to look like the following;

```
resource "azurerm_resource_group" "resource_group" {  name     = "${var.resource_group_name}"  location = "${var.location}"  tags     = "${merge(var.default_tags, map("type","resource"))}"}module "application-vnet" {  source              = "modules/vnet"  resource_group_name = "${azurerm_resource_group.resource_group.name}"  location            = "${var.location}"  tags                = "${merge(var.default_tags, map("type","network"))}"  vnet_name           = "${azurerm_resource_group.resource_group.name}-vnet"  address_space       = "10.10.0.0/16"}
```

This was not the end of the world, but as the documentation was pushing me down the module route, it was annoying.

The next lot of problem I had was with trying to use **count** with lists which had either been dynamically generated from another module or where hard coded. After much searching [StackOverflow](https://stackoverflow.com/questions/tagged/terraform) and [GitHub issues](https://github.com/hashicorp/terraform/issues/) I found workarounds for most of my issues, such as the following (which has been abridged);

```
resource "azurerm_network_security_group" "nsg" {  resource_group_name = "${var.resource_group_name}"  location            = "${var.location}"  tags                = "${var.tags}"  name                = "${var.name}"}locals {  rules_locked_down_no = "${length(var.rules_locked_down)}"  rules_groups_no      = "${length(var.rules_groups)}"  rules_open_no        = "${length(var.rules_open)}"}resource "azurerm_network_security_rule" "rules_locked_down" {  count                       = "${local.rules_locked_down_no != 0 ? length(var.rules_locked_down) : 0}"  name                        = "${lookup(var.rules_locked_down[count.index], "name", "default_rule_name")}"  priority                    = "${lookup(var.rules_locked_down[count.index], "priority")}"  direction                   = "${lookup(var.rules_locked_down[count.index], "direction", "Any")}"  resource_group_name         = "${var.resource_group_name}"  network_security_group_name = "${azurerm_network_security_group.nsg.name}"}resource "azurerm_network_security_rule" "rules_open" {  count                       = "${local.rules_open_no != 0 ? length(var.rules_open) : 0}"  name                        = "${lookup(var.rules_open[count.index], "name", "default_rule_name")}"  priority                    = "${lookup(var.rules_open[count.index], "priority")}"  direction                   = "${lookup(var.rules_open[count.index], "direction", "Any")}"  resource_group_name         = "${var.resource_group_name}"  network_security_group_name = "${azurerm_network_security_group.nsg.name}"}resource "azurerm_network_security_rule" "rules_groups" {  count                                 = "${local.rules_groups_no != 0 ? length(var.rules_groups) : 0}"  name                                  = "${lookup(var.rules_groups[count.index], "name", "default_rule_name")}"  priority                              = "${lookup(var.rules_groups[count.index], "priority")}"  direction                             = "${lookup(var.rules_groups[count.index], "direction", "Any")}"  access                                = "${lookup(var.rules_groups[count.index], "access", "Allow")}"  resource_group_name                   = "${var.resource_group_name}"  network_security_group_name           = "${azurerm_network_security_group.nsg.name}"}
```

Here I had to use the **locals** to count the number of items in the **list** I was passing through so that it could be then be used by **count**.

This is something I would have expected to have worked when I first wrote the module as the syntax made sense, however, when I ran the original code this was pretty much the face I pulled when all I got was a message saying that the “count cannot be computed.”;

See [this GitHub issue for more detail](https://github.com/hashicorp/terraform/issues/18157) on why it didn’t work and what changes have been made in Terraform to fix it.

Most of the problems I came across while I have been revisiting Terraform appear to be either being fixed or having the ground-work laid for a fix in Terraform 0.12 which should be released very soon.

Until it is, I will be waiting — thinking about all of the work arounds I will have to undo.

For more information on Terraform 0.12 the following video is a good place to start;

Or the following blog posts from Hashicorp which go to make up a [preview of Terraform 0.12](https://www.hashicorp.com/blog/terraform-0-1-2-preview);

**Update 16/02/2019**

{{< reddit url="https://www.redditmedia.com/r/Terraform/comments/aos3o0/where_is_terraform_012/eg51f07/?depth=1&amp;showmore=false&amp;embed=true&amp;showmedia=false" height="500" >}}

it is an interesting insight into what is going to behind the scenes to get this release out of the gate.