---
title: "Some Terraform Azure Notes"
author: "Russ McKendrick"
date: 2021-08-30T11:41:34+01:00
description: "Notes on Terraform Azure deployments: diagnostic settings, expiration dates, Azure Automation Account web hooks."
draft: false
showToc: true
cover:
    image: "cover.png"
    relative: true
    alt: "Notes on Terraform Azure deployments: diagnostic settings, expiration dates, Azure Automation Account web hooks."
tags:
  - "Terraform"
  - "Infrastructure as Code"
  - "Automation"
  - "Azure"
---

I have just finished working on a few large Terraform Azure deployments, thought I would stick a few notes down in a blog post so that I can refer to them in the future as well as hopefully being useful to others.

## Azure Diagnostic Settings 

While the **azurerm_monitor_diagnostic_setting** resource can be used to apply diagnostic settings to pretty much any other resource, however, as each resource has different `logs` and `metrics` figuring them out can be a chore. This is where the **[azurerm_monitor_diagnostic_categories](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/data-sources/monitor_diagnostic_categories)** data source comes in.

The **azurerm_monitor_diagnostic_categories** data source can be used to target an existing resource to gather information on the `logs` and `metrics` which need to be applied, you can then take this data and apply to a dynamic block in your **azurerm_monitor_diagnostic_setting** resource. Let's look at how this would work for a virtual network.

The code below will create a Resource Group, launch a Log Analytics Workspace and also create a Virtual Network:

{{< ide title="Create the example resources" lang="HCL" >}}
```hcl {linenos=true} 
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
{{< /ide >}}

Now that the resources have been defined, we can grab the information on what `logs` and `metrics` we need to be enable on the Virtual Network itself by passing the **azurerm_monitor_diagnostic_categories** data source the ID of our virtual network:

{{< ide title="Use azurerm_monitor_diagnostic_categories" lang="HCL" >}}
```hcl {linenos=true}
data "azurerm_monitor_diagnostic_categories" "vnet" {
  resource_id = azurerm_virtual_network.vnet.id
}
```
{{< /ide >}}

Finally, we can take the information gathered above and apply it using two dynamic blocks, one for the `log` and other for the `metric`:

{{< ide title="Add the Diagnostic Settings" lang="HCL" >}}
```hcl {linenos=true}
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
{{< /ide >}}

In the case of the Virtual Network there are just a single output for each type of diagnostic setting, 

{{< ide title="The output" lang="HCL" >}}
```hcl {linenos=true}
logs = toset([
  "VMProtectionAlerts",
])
metrics = toset([
  "AllMetrics",
])
```
{{< /ide >}}

Now while this may seem a little overkill, some resources can have up to half a dozen different diagnostic settings so taking approach means you don't have to really care what they are as they will just be applied.

## Expiry Dates

The next thing isn't really anything to do with Azure - but is useful when you need to set an expiry date - in my case I have been using for setting the expiration date for Azure Virtual Desktop host pool tokens.

Let's look at an example first:

{{< ide title="Setting a 30 day expiry" lang="HCL" >}}
```hcl {linenos=true}
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
```{{< /ide >}}

This will give the following output:

{{< ide title="The output" lang="HCL" >}}
```hcl {linenos=true}
expiry-date = "2021-09-29T11:51:17Z"
```
{{< /ide >}}

While the above is a really basic example, using it for something like a **[azurerm_virtual_desktop_host_pool](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/virtual_desktop_host_pool)** resource would look something like:

{{< ide title="Hostpool example"lang="HCL"  >}}
```hcl {linenos=true}
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
{{< /ide >}}

You can then take the token generated above and add it to an Azure Key Vault using **[azurerm_key_vault_secret](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/key_vault_secret)**:

{{< ide title="Key Vault Secret example" lang="HCL" >}}
```hcl {linenos=true}
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
{{< /ide >}}

## Azure Automation Account Web Hook

Next up we have what was the bane of my life for a good few days, Azure Automation Accounts. While they are supported by the Terraform Azure provider there are some notable omissions - the creation of Webhooks is one.

Before we look at creating the web hook we are going to need an Automation Account and Runbook, the following code adds these with a really basic configuration:

{{< ide title="Create an Azure Automation Account and Runbook" lang="HCL">}}
```hcl {linenos=true}
terraform {
  required_version = ">= 1.0.0"
  required_providers {
    azurerm = {
      source = "hashicorp/azurerm" # https://registry.terraform.io/providers/hashicorp/azurerm/latest
    }
  }
}

provider "azurerm" { # Configure the Microsoft Azure RM Provider
  features {
    key_vault {
      purge_soft_delete_on_destroy = true
    }
  }
}
resource "azurerm_resource_group" "resource_group" {
  name     = "rg-test-uks"
  location = "uksouth"
}

resource "azurerm_automation_account" "automation_account" {
  resource_group_name = azurerm_resource_group.resource_group.name
  location            = azurerm_resource_group.resource_group.location
  name                = "auto-test-uks"
  sku_name            = "Basic"
}

resource "azurerm_automation_runbook" "automation_account_runbook" {
  resource_group_name     = azurerm_resource_group.resource_group.name
  location                = azurerm_resource_group.resource_group.location
  automation_account_name = azurerm_automation_account.automation_account.name
  name                    = "HelloWorld"
  log_verbose             = "true"
  log_progress            = "true"
  runbook_type            = "PowerShell"
  publish_content_link {
    uri = "https://gist.githubusercontent.com/russmckendrick/fa422b292a786682da887643e72213d5/raw/c1b7aa3c9729b66341a25efbea75c961d2326df0/HelloWorld-Workflow.ps1"
  }
}
```
{{< /ide >}}

You maybe thinking to yourself, if Terraform doesn't support web hooks then how can we add them? Luckily Terraform allows you execute ARM templates - which does support the create and assignment of a web hook, there are a few things we are going to have generate first before run the ARM template though.

- `webhook_expiry_time` = you must assign an expiry date to a webhook, luckily we have just covered how to do that so we will be using that.
- `webhook_token1` and `webhook_token2` = these are two random strings which will go to make up part of the webhook URL

{{< ide title="Generate some stuff" lang="HCL" >}}
```hcl {linenos=true}
resource "time_rotating" "webhook_expiry_time" {
  rotation_years = 5
}
resource "random_string" "webhook_token1" {
  length  = 10
  upper   = true
  lower   = true
  number  = true
  special = false
}

resource "random_string" "webhook_token2" {
  length  = 31
  upper   = true
  lower   = true
  number  = true
  special = false
}
```
{{< /ide >}}

Next we need to create the webook URL itself as this is not done for us, to do this I am setting a local variable so I can reuse it if needed:

{{< ide title="Set the local variable" lang="HCL">}}
```hcl {linenos=true}
locals {
  webhook = "https://${split("/", azurerm_automation_account.automation_account.dsc_server_endpoint)[4]}.webhook.${substr(azurerm_resource_group.resource_group.location, 0, 3)}.azure-automation.net/webhooks?token={random_string.webhook_token1.result}{random_string.webhook_token2.result}"
}
```
{{< /ide >}}

As you can see, this using as much dynamically generated content as possible to full in gaps of the URL.

{{< notice warning >}}
**Please note:** As I am am launching my resources in UK South the short location for this is *uks*, depending on the location you are using you may have alter the code above to change the number of characters being used or hardcode the short region ID.
{{< /notice >}}

Now that we have everything needed to generate the URL we can deploy the ARM template by using:

{{< ide title="Generate some stuff" lang="HCL" >}}
```hcl {linenos=true}
resource "azurerm_template_deployment" "automation_account_webhook" {
  name                = "HelloWorldWebhook"
  resource_group_name = azurerm_resource_group.resource_group.name
  deployment_mode     = "Incremental"
  template_body       = <<DEPLOY
{
  "$schema": "http://schema.management.azure.com/schemas/2015-01-01/deploymentTemplate.json#",
  "contentVersion": "1.0.0.0",
  "resources": [
    {
      "name": "${azurerm_automation_account.automation_account.name}/HelloWorldWebhook",
      "type": "Microsoft.Automation/automationAccounts/webhooks",
      "apiVersion": "2015-10-31",
      "properties": {
        "isEnabled": true,
        "uri": "${local.webhook}",
        "expiryTime": "${time_rotating.webhook_expiry_time.rotation_rfc3339}",
        "parameters": {},
        "runbook": {
          "name": "${azurerm_automation_runbook.automation_account_runbook.name}"
        }
      }
    }
  ]
}
DEPLOY
}
```
{{< /ide >}}

This gives the following output:

{{< ide title="The output" lang="HCL">}}
```hcl {linenos=true}
webhook = "https://e833b5e7-ef20-41ad-83db-eec633b9d22b.webhook.uks.azure-automation.net/webhooks?token=%2buXamOQWrjJ%2bmzhBt7kpeMKcX5R8wnULaj7zNWBCyh2%3d"
```
{{< /ide >}}

All of which means that the following command, updating it to matech your URL, can be used to trigger the web hook:

{{< terminal title="The output" >}}
``` terminfo
curl -H 'Content-Length: 0' -X POST 'https://e833b5e7-ef20-41ad-83db-eec633b9d22b.webhook.uks.azure-automation.net/webhooks?token=%2buXamOQWrjJ%2bmzhBt7kpeMKcX5R8wnULaj7zNWBCyh2%3d'
```
{{< /terminal >}}

This should return some JSON with the job ID:

{{< terminal title="The Job ID" >}}
```json {linenos=true}
{
  "JobIds": [
    "8fd8f676-1a0b-45d7-9472-7697d7720ac5"
  ]
}
```
{{< /terminal >}}

## Full Example Code

The full example code to accompany this post can be found at [russmckendrick/some-terraform-azure-notes](https://github.com/russmckendrick/some-terraform-azure-notes) on [GitHub](https://github.com/russmckendrick/some-terraform-azure-notes).