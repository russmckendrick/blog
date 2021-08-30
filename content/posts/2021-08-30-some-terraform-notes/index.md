---
title: "Some Terraform Azure Notes"
author: "Russ Mckendrick"
date: 2021-08-30T11:41:34+01:00
description: ""
draft: true
showToc: true
cover:
    image: "cover.png"
    relative: true
tags:
  - "Terraform"
  - "Notes"
---

I have just finished working on a few large Terraform Azure deployments, thought I would stick a few notes down in a blog post so that I can refer to them in the future as well as hopefully being useful to others.

## Azure Diagnostic Settings 

While the **[azurerm_monitor_diagnostic_setting](azurerm_monitor_diagnostic_setting)** resource can be used to apply diagnostic settings to pretty much any other resource, however, as each resource has different `logs` and `metrics` figuring them out can be a chore. This is where the **[azurerm_monitor_diagnostic_categories](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/data-sources/monitor_diagnostic_categories)** data source comes in.

The **azurerm_monitor_diagnostic_categories** data source can be used to target an existing resource to gather information on the `logs` and `metrics` which need to be applied, you can then take this data and apply to a dynamic block in your **azurerm_monitor_diagnostic_setting** resource. Let's look at how this would work for a virtual network.

The code below will create a Resource Group, launch a Log Analytics Workspace and also create a Virtual Network:

{{< terminal title="Create the example resources" >}}
``` hcl
resource "azurerm_resource_group" "resource_group" {
  name     = "rg-test-uks"
  location = "uksouth"
}

resource "azurerm_log_analytics_workspace" "monitor" {
  resource_group_name = azurerm_resource_group.resource_group.name
  location            = azurerm_resource_group.resource_group.location
  name                = "law-test"
  sku                 = "PerGB2018"
  retention_in_days   = 30
}

resource "azurerm_virtual_network" "vnet" {
  resource_group_name = azurerm_resource_group.resource_group.name
  location            = azurerm_resource_group.resource_group.location
  name                = "vnet-test-001"
  address_space       = ["192.168.0.0/16"]
}

resource "azurerm_subnet" "subnet_001" {
  resource_group_name  = azurerm_resource_group.resource_group.name
  name                 = "snet-app-001"
  virtual_network_name = azurerm_virtual_network.vnet.name
  address_prefixes     = ["192.168.10.0/24"]
}
```
{{< /terminal >}}

Now that the resources have been defined, we can grab the information on what `logs` and `metrics` we need to be enable on the Virtual Network itself by passing the **azurerm_monitor_diagnostic_categories** data source the ID of our virtual network:

{{< terminal title="Use azurerm_monitor_diagnostic_categories" >}}
``` hcl
data "azurerm_monitor_diagnostic_categories" "vnet" {
  resource_id = azurerm_virtual_network.vnet.id
}
```
{{< /terminal >}}

Finally, we can take the information gathered above and apply it using two dynamic blocks, one for the `log` and other for the `metric`:

{{< terminal title="Add the Diagnostic Settings" >}}
``` hcl
resource "azurerm_monitor_diagnostic_setting" "vnet" {
  name                       = "diag-${azurerm_virtual_network.vnet.name}"
  target_resource_id         = azurerm_virtual_network.vnet.id
  log_analytics_workspace_id = azurerm_log_analytics_workspace.monitor.id

  dynamic "log" {
    for_each = data.azurerm_monitor_diagnostic_categories.vnet.logs
    content {
      category = log.value
      retention_policy {
        days    = 0
        enabled = false
      }
    }
  }

  dynamic "metric" {
    for_each = data.azurerm_monitor_diagnostic_categories.vnet.metrics
    content {
      category = metric.value
      retention_policy {
        days    = 0
        enabled = false
      }
    }
  }
}
```
{{< /terminal >}}

In the case of the Virtual Network there are just a single output for each type of diagnostic setting, 

{{< terminal title="The output" >}}
``` hcl
logs = toset([
  "VMProtectionAlerts",
])
metrics = toset([
  "AllMetrics",
])
```
{{< /terminal >}}

Now while this may seem a little overkill, some resources can have up to half a dozen different diagnostic settings so taking approach means you don't have to really care what they are as they will just be applied.

## Expiry Dates

The next thing isn't really anything to do with Azure - but is useful when you need to set an expiry date - in my case I have been using for setting the expiration date for Azure Virtual Desktop host pool tokens.

Let's look at an example first:

{{< terminal title="Setting a 30 day expiry" >}}
``` hcl
terraform {
  required_version = ">= 1.0.0"
  required_providers {
    time = {
      source = "hashicorp/time"
    }
  }
}

provider "time" {
}

resource "time_rotating" "token" {
  rotation_days = 30
}
```{{< /terminal >}}

This will give the following output:

{{< terminal title="The output" >}}
``` hcl
expiry-date = "2021-09-29T11:51:17Z"
```
{{< /terminal >}}

While the above is a really basic example, using it for something like a **[azurerm_virtual_desktop_host_pool](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/virtual_desktop_host_pool)** resource would look something like:

{{< terminal title="Hostpool example" >}}
``` hcl
resource "azurerm_virtual_desktop_host_pool" "host_pool" {
  resource_group_name      = azurerm_resource_group.resource_group.name
  location                 = azurerm_resource_group.resource_group.location
  name                     = "hp-example-hostpool"
  friendly_name            = "PooledDepthFirst"
  validate_environment     = true
  start_vm_on_connect      = true
  custom_rdp_properties    = "audiocapturemode:i:1;audiomode:i:0;"
  description              = "A pooled host pool using Depth First"
  type                     = "Pooled"
  maximum_sessions_allowed = 50
  load_balancer_type       = "DepthFirst"

  registration_info {
    expiration_date = time_rotating.token.rotation_rfc3339
  }

}
```
{{< /terminal >}}

You can then take the token generated above and add it to an Azure Key Vault using **[azurerm_key_vault_secret](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/key_vault_secret)**:

{{< terminal title="Key Vault Secret example" >}}
``` hcl
resource "azurerm_key_vault_secret" "host_pool_token" {
  depends_on = [
    azurerm_key_vault_access_policy.devops
  ]
  key_vault_id    = azurerm_key_vault.keyvault.id
  name            = "hostpoolToken"
  value           = azurerm_virtual_desktop_host_pool.avd_host_pool.registration_info[0].token
  content_type    = "text/plain"
  expiration_date = time_rotating.token.rotation_rfc3339
}
```
{{< /terminal >}}

## Azure Automation Account Web Hook

