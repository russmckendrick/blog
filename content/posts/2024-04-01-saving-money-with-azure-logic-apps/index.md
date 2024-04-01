---
title: "Saving money with Azure Logic Apps"
author: "Russ McKendrick"
date: 2024-04-01T11:30:00+01:00
description: "Discover how Azure Logic Apps can help you save money by automating tasks like stopping and starting Virtual Machines and Application Gateways. This post provides a step-by-step guide on deploying Logic Apps and walks through the workflows for cost-saving automations, ensuring your Azure resources only run when needed."
draft: false
showToc: true
cover:
    image: "cover.png"
    relative: true
tags:
  - "azure"
---

During the day job, I have to get a little creative with controlling costs for Azure resources; there are some everyday tasks and scenarios where Azure Logic Apps can help you save money 💰.

The first is quite a typical scenario: stopping and starting Azure Virtual Machines. There was a time when I would have just used an Azure Automation Account and the Microsoft-supplied workflow. Still, Automation Accounts are a little (well, a lot) too reliant on PowerShell for my macOS using / Linux administrating tastes. 

Another common requirement I have encountered is Azure Application Gateways. With the retirement of v1 Azure Application Gateway SKUs, v2 SKUs can be expensive if you run multiple Azure Application Gateways for Dev, Test, and PreProd environments that are not needed 24/7. A little-known feature, mainly because you cannot do it from the Azure Portal, is that you can stop Azure Application Gateways. You will not be charged for them while they are in the stopped state.

I could discuss some other common scenarios, but before we do that, let's examine the LogicApps and workflow I have settled on for the two scenarios I mentioned.
# Targetting Azure Virtual Machines

I have settled on a standard (ish) workflow using the Azure REST API. We will need a few supporting resources and the Azure Logic App itself.
## Deploying the Azure Logic App and supporting resources
Our first task is to clone the GitHub repo, which contains the JSON definition of the Azure Logic Apps we will be deploying;

{{< terminal title="Cloning to accompanying repo" >}}
```
git clone git@github.com:russmckendrick/money-saving-azure-logic-apps.git
cd money-saving-azure-logic-apps
```
{{< /terminal >}}

With the repo cloned, we can now create the Azure Resources; I will be using the Azure CLI to do this, starting with setting some environment variables which you can update as needed:

{{< terminal title="Setting some environment variables" >}}
```
export RESOURCE_GROUP_NAME="rg-logicapps-blogpost-uks"
export REGION="uksouth"
export SUBSCRIPTION_ID=$(az account show --query id --output tsv)
export MANAGED_ID_NAME="mi-logicapps-blogpost-uks"
export LOGIC_APP_NAME="la-virtualMachineStopStart-uks"
```
{{< /terminal >}}

With the variables in place, we can deploy the resource group;

{{< terminal title="Create the resource group" >}}
```
az group create \
	--name $RESOURCE_GROUP_NAME \
	--location $REGION
```
{{< /terminal >}}

The first resource we will need to deploy is a user-managed identity; we will be granting this ID permissions to do "stuff" in our Azure subscription and attaching it to the Azure Logic App to use when we connect to the Azure REST API :

{{< terminal title="Create the user managed identity" >}}
```
az identity create \
	--resource-group $RESOURCE_GROUP_NAME \
	--name $MANAGED_ID_NAME
```
{{< /terminal >}}

As the Azure Logic App will need to search for resources in the subscription and also be able to interact with Azure virtual machines; we should permit it to do just those tasks by granting our User Assigned Identity the Reader and Virtual Machine Contributor roles :

{{< terminal title="Granting RBAC permissions" >}}
```
az role assignment create \
	--assignee-principal-type "ServicePrincipal" \
	--assignee-object "$(az identity show --resource-group $RESOURCE_GROUP_NAME --name $MANAGED_ID_NAME --query principalId --output tsv)" \
	--role "Reader" \
	--scope "/subscriptions/$SUBSCRIPTION_ID"

az role assignment create \
	--assignee-principal-type "ServicePrincipal" \
	--assignee-object "$(az identity show --resource-group $RESOURCE_GROUP_NAME --name $MANAGED_ID_NAME --query principalId --output tsv)" \
	--role "Virtual Machine Contributor" \
	--scope "/subscriptions/$SUBSCRIPTION_ID"
```
{{< /terminal >}}

With the User Managed Identity in place, we can now create the Azure Logic App.

To do this, run the following command:

{{< terminal title="Create the Azure Logic App" >}}
```
az logic workflow create \
	--resource-group $RESOURCE_GROUP_NAME \
	--location $REGION \
	--name $LOGIC_APP_NAME \
	--mi-user-assigned "$(az identity show --resource-group $RESOURCE_GROUP_NAME --name $MANAGED_ID_NAME --query id --output tsv)" \
	--state "Disabled" \
	--definition "virtualMachineStopStart.json"
```
{{< /terminal >}}

This part of the Azure CLI is, at the time of writing this post, in preview, so you may get the following prompt; if you do, follow the on-screen instructions:

{{< terminal title="Do you need to install the extension?" >}}
```
The command requires the extension logic. Do you
want to install it now? The command will continue
to run after the extension is installed. (Y/n)
```
{{< /terminal >}}

Once complete, you should have a Logic App with code imported and the User-Assigned Identity assigned to it. The Azure Logic App is also currently disabled as we haven't finished the configuration yet; there are more bits of information we need to update.

The Logic App JSON contains four Parameters these are;

- **managedId**: This parameter must be updated to contain the full resource ID for the User Managed Identity we have assigned to the Logic App.
- **subscriptionId**: This parameter must be updated with the ID of the Azure Subscription that contains the resources you want to manage with the Logic App.
- **tagName**: The default value is ￼`virtualMachineStopStart`￼  , so any Virtual Machines with this tag, with the value below, will have their power state managed by this Logic App.
- **tagValue**: `included` is the default here.

Luckily, we can use the Azure CLI to do that as well; here are the two commands, starting with one to update the **managedId** parameter:

{{< terminal title="Setting the managedId parameter" >}}
```
az logic workflow update \
	--resource-group $RESOURCE_GROUP_NAME \
	--name $LOGIC_APP_NAME \
	--set "definition.parameters.managedId.defaultValue=$(az identity show --resource-group $RESOURCE_GROUP_NAME --name $MANAGED_ID_NAME --query id --output tsv)"
```
{{< /terminal >}}

Now the **subscriptionId** parameter:

{{< terminal title="Setting the subscriptionId parameter" >}}
```
az logic workflow update \
	--resource-group $RESOURCE_GROUP_NAME \
	--name $LOGIC_APP_NAME \
	--set "definition.parameters.subscriptionId.defaultValue=$(az account show --query id --output tsv)"
```
{{< /terminal >}}

Logging into [the Azure Portal](https://portal.azure.com/); you should see your newly deployed resources:

{{< gallery match="images/deploying-the-logic-app-and-supporting-resources/*" sortOrder="assc" rowHeight="200" margins="5" thumbnailResizeOptions="600x600 q90 Lanczos" showExif=true previewType="blur" embedPreview=true loadJQuery=true >}}<br>

We are now ready to apply our cost-saving automation; well, we would be if we had the resources, so let's launch some Azure Virtual Machines.
## Creating test Azure Virtual Machine resources

We will go through the Logic App in more detail soon; for now, let's create some Azure Virtual Machines we can target with the Azure Logic App. The commands below will launch three virtual machines, two of which are tagged and will be targeted by our Azure Logic App:

{{< terminal title="Launching three test VMs" >}}
```
export RESOURCE_GROUP_NAME="rg-demo-vms-uks"
export REGION=uksouth
export VNET_NAME=vnet-demo-vms-uks
export SUBNET_NAME=sub-vms
export VM_IMAGE="Canonical:0001-com-ubuntu-minimal-jammy:minimal-22_04-lts-gen2:latest"
export VM_NAME="vm-demo"

az group create \
	--name $RESOURCE_GROUP_NAME \
	--location $REGION

az network vnet create \
	--resource-group $RESOURCE_GROUP_NAME \
	--name $VNET_NAME \
	--address-prefix 10.0.0.0/24 \
	--subnet-name $SUBNET_NAME \
	--subnet-prefix 10.0.0.0/27

for i in {1..3}; do
  if [ $i -le 2 ]; then
    az vm create \
      --resource-group $RESOURCE_GROUP_NAME \
      --name $VM_NAME-$(openssl rand -hex 5)-uks \
      --image $VM_IMAGE \
      --admin-username azureuser \
      --vnet-name $VNET_NAME \
      --subnet $SUBNET_NAME \
      --generate-ssh-keys \
      --public-ip-address "" \
      --size Standard_B2ms \
      --tags "virtualMachineStopStart=included"
  else
    az vm create \
      --resource-group $RESOURCE_GROUP_NAME \
      --name $VM_NAME-$(openssl rand -hex 5)-uks \
      --image $VM_IMAGE \
      --admin-username azureuser \
      --vnet-name $VNET_NAME \
      --subnet $SUBNET_NAME \
      --generate-ssh-keys \
      --public-ip-address "" \
      --size Standard_B2ms
  fi
done
```
{{< /terminal >}}

{{< gallery match="images/creating-some-target-resources/*" sortOrder="assc" rowHeight="200" margins="5" thumbnailResizeOptions="600x600 q90 Lanczos" showExif=true previewType="blur" embedPreview=true loadJQuery=false >}}<br>

With the resources now deployed, let's run the Azure Logic App and start saving money.

## Running the Azure Logic App

In [the Azure Portal](https://portal.azure.com/), go to your Logic App and press the **Enable** button. This will trigger a Run, and clicking on **Refresh** should show you that a run is in progress:

{{< gallery match="images/vm-running-the-logic-app-stop/*" sortOrder="assc" rowHeight="200" margins="5" thumbnailResizeOptions="600x600 q90 Lanczos" showExif=true previewType="blur" embedPreview=true loadJQuery=false >}}<br>

As you can see from the screens above, the Logic App ran, and because the two tagged Virtual Machines were running - it powered them down; well, actually - it Stopped and Deallocated them, so we are not charged while they are in the Stopped state.

Running the Logic App for a second time will start the two tagged machines as they were both Stopped (Deallocted):

{{< gallery match="images/vm-running-the-logic-app-start/*" sortOrder="assc" rowHeight="200" margins="5" thumbnailResizeOptions="600x600 q90 Lanczos" showExif=true previewType="blur" embedPreview=true loadJQuery=false >}}<br>

If you are following along and have deployed the example resources, now would be a good time to terminate them. You can do this by running:

{{< terminal title="Removing the demo Virtual Machines and Group" >}}
```
export RESOURCE_GROUP_NAME="rg-demo-vms-uks"
az group delete --name $RESOURCE_GROUP_NAME
```
{{< /terminal >}}

## Working through the Azure Logic App

As you may have already spotted in the Logic app designer section, there are quite a few steps defined, so let's work through them now; below is the full workflow:

{{< img src="images/working-through-the-logic-app/vm-full-logic-app.png" alt="The full machine workflow" >}}

So, let's start at the beginning.

### Recurrence (Azure Virtual Machine)

This is our trigger, by default, is set to run at 07:00 and 18:00 on Monday, Tuesday, Wednesday, Thursday, and Friday every week. The for this step is below:

```json
{
  "type": "Recurrence",
  "recurrence": {
    "frequency": "Week",
    "interval": 1,
    "schedule": {
      "hours": [
        "7",
        "18"
      ],
      "minutes": [
        0
      ],
      "weekDays": [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday"
      ]
    },
    "timeZone": "GMT Standard Time"
  }
}
```

### Get a list of all resources tagged to be managed (Azure Virtual Machine)
This is where our first HTTP call to the Azure REST API takes place; it makes a **GET** request to the [https://management.azure.com/subscriptions/{subscriptionId}/resources?api-version=2021-04-01](https://learn.microsoft.com/en-us/rest/api/resources/resources/list?view=rest-resources-2021-04-01) API and filters using the contents of the **tagName** and **tagValue** parameters:

```json
{
  "type": "Http",
  "inputs": {
    "uri": "https://management.azure.com/subscriptions/@{parameters('subscriptionId')}/resources?api-version=2021-04-01&$filter=tagName eq '@{parameters('tagName')}' and tagValue eq '@{parameters('tagValue')}'",
    "method": "GET",
    "authentication": {
      "identity": "@{parameters('managedId')}",
      "type": "ManagedServiceIdentity"
    }
  },
  "runAfter": {},
  "runtimeConfiguration": {
    "contentTransfer": {
      "transferMode": "Chunked"
    }
  }
}
```

When we first ran the Azure Logic App, this is an example of the output that was passed onto the following task:

```json
{
  "value": [
    {
      "id": "/subscriptions/ce7aa0b9-3545-4104-99dc-d4d082339a05/resourceGroups/RG-DEMO-VMS-UKS/providers/Microsoft.Compute/disks/vm-demo-d62ef52290-uks_OsDisk_1_23c583676cb8413c9ac875058f5c1f30",
      "name": "vm-demo-d62ef52290-uks_OsDisk_1_23c583676cb8413c9ac875058f5c1f30",
      "type": "Microsoft.Compute/disks",
      "sku": {
        "name": "Premium_LRS",
        "tier": "Premium"
      },
      "kind": "",
      "managedBy": "/subscriptions/ce7aa0b9-3545-4104-99dc-d4d082339a05/resourceGroups/rg-demo-vms-uks/providers/Microsoft.Compute/virtualMachines/vm-demo-d62ef52290-uks",
      "location": "uksouth",
      "tags": {
        "virtualMachineStopStart": "included"
      }
    },
    {
      "id": "/subscriptions/ce7aa0b9-3545-4104-99dc-d4d082339a05/resourceGroups/RG-DEMO-VMS-UKS/providers/Microsoft.Compute/disks/vm-demo-e8ab6db95a-uks_OsDisk_1_5be3d505ec324ef3a411406f24e13bf2",
      "name": "vm-demo-e8ab6db95a-uks_OsDisk_1_5be3d505ec324ef3a411406f24e13bf2",
      "type": "Microsoft.Compute/disks",
      "sku": {
        "name": "Premium_LRS",
        "tier": "Premium"
      },
      "kind": "",
      "managedBy": "/subscriptions/ce7aa0b9-3545-4104-99dc-d4d082339a05/resourceGroups/rg-demo-vms-uks/providers/Microsoft.Compute/virtualMachines/vm-demo-e8ab6db95a-uks",
      "location": "uksouth",
      "tags": {
        "virtualMachineStopStart": "included"
      }
    },
    {
      "id": "/subscriptions/ce7aa0b9-3545-4104-99dc-d4d082339a05/resourceGroups/rg-demo-vms-uks/providers/Microsoft.Compute/virtualMachines/vm-demo-d62ef52290-uks",
      "name": "vm-demo-d62ef52290-uks",
      "type": "Microsoft.Compute/virtualMachines",
      "kind": "",
      "managedBy": "",
      "location": "uksouth",
      "tags": {
        "virtualMachineStopStart": "included"
      }
    },
    {
      "id": "/subscriptions/ce7aa0b9-3545-4104-99dc-d4d082339a05/resourceGroups/rg-demo-vms-uks/providers/Microsoft.Compute/virtualMachines/vm-demo-e8ab6db95a-uks",
      "name": "vm-demo-e8ab6db95a-uks",
      "type": "Microsoft.Compute/virtualMachines",
      "kind": "",
      "managedBy": "",
      "location": "uksouth",
      "tags": {
        "virtualMachineStopStart": "included"
      }
    },
    {
      "id": "/subscriptions/ce7aa0b9-3545-4104-99dc-d4d082339a05/resourceGroups/rg-demo-vms-uks/providers/Microsoft.Network/networkInterfaces/vm-demo-d62ef52290-uksVMNic",
      "name": "vm-demo-d62ef52290-uksVMNic",
      "type": "Microsoft.Network/networkInterfaces",
      "kind": "Regular",
      "managedBy": "",
      "location": "uksouth",
      "tags": {
        "virtualMachineStopStart": "included"
      }
    },
    {
      "id": "/subscriptions/ce7aa0b9-3545-4104-99dc-d4d082339a05/resourceGroups/rg-demo-vms-uks/providers/Microsoft.Network/networkInterfaces/vm-demo-e8ab6db95a-uksVMNic",
      "name": "vm-demo-e8ab6db95a-uksVMNic",
      "type": "Microsoft.Network/networkInterfaces",
      "kind": "Regular",
      "managedBy": "",
      "location": "uksouth",
      "tags": {
        "virtualMachineStopStart": "included"
      }
    },
    {
      "id": "/subscriptions/ce7aa0b9-3545-4104-99dc-d4d082339a05/resourceGroups/rg-demo-vms-uks/providers/Microsoft.Network/networkSecurityGroups/vm-demo-d62ef52290-uksNSG",
      "name": "vm-demo-d62ef52290-uksNSG",
      "type": "Microsoft.Network/networkSecurityGroups",
      "kind": "",
      "managedBy": "",
      "location": "uksouth",
      "tags": {
        "virtualMachineStopStart": "included"
      }
    },
    {
      "id": "/subscriptions/ce7aa0b9-3545-4104-99dc-d4d082339a05/resourceGroups/rg-demo-vms-uks/providers/Microsoft.Network/networkSecurityGroups/vm-demo-e8ab6db95a-uksNSG",
      "name": "vm-demo-e8ab6db95a-uksNSG",
      "type": "Microsoft.Network/networkSecurityGroups",
      "kind": "",
      "managedBy": "",
      "location": "uksouth",
      "tags": {
        "virtualMachineStopStart": "included"
      }
    }
  ]
}
```

### Filter everything but the VMs we are managing (Azure Virtual Machine)
While testing the Logic App, I found that more than just the virtual machine resource could be tagged with **tagName**; for example, in the output of the previous step, disks, network interfaces, and more all have the same tag. Now, this would result in an error when running later parts of the workflow, so here we filtered down the list of resources the last step fetched to where the resource **type** is equal to **Microsoft.Compute/virtualMachines**.

```json
{
  "type": "Query",
  "inputs": {
    "from": "@body('Get_a_list_of_all_resources_tagged_to_be_managed')['value']",
    "where": "@equals(item()['type'],'Microsoft.Compute/virtualMachines')"
  },
  "runAfter": {
    "Get_a_list_of_all_resources_tagged_to_be_managed": [
      "Succeeded"
    ]
  }
}

```

{{< notice info >}}
There is an annoying limitation when searching for resources using the [https://management.azure.com/subscriptions/{subscriptionId}/resources?api-version=2021-04-01](https://learn.microsoft.com/en-us/rest/api/resources/resources/list?view=rest-resources-2021-04-01) API. While you can filter on any number of **tags** you like or even the resource **type**, you can not filter on both simultaneously, which is why we have this extra step.
{{< /notice >}}

Once this filter has been applied, we are now left with details on the two machines from the test run:

```json
[
  {
    "id": "/subscriptions/ce7aa0b9-3545-4104-99dc-d4d082339a05/resourceGroups/rg-demo-vms-uks/providers/Microsoft.Compute/virtualMachines/vm-demo-d62ef52290-uks",
    "name": "vm-demo-d62ef52290-uks",
    "type": "Microsoft.Compute/virtualMachines",
    "kind": "",
    "managedBy": "",
    "location": "uksouth",
    "tags": {
      "virtualMachineStopStart": "included"
    }
  },
  {
    "id": "/subscriptions/ce7aa0b9-3545-4104-99dc-d4d082339a05/resourceGroups/rg-demo-vms-uks/providers/Microsoft.Compute/virtualMachines/vm-demo-e8ab6db95a-uks",
    "name": "vm-demo-e8ab6db95a-uks",
    "type": "Microsoft.Compute/virtualMachines",
    "kind": "",
    "managedBy": "",
    "location": "uksouth",
    "tags": {
      "virtualMachineStopStart": "included"
    }
  }
]
```

### Process just the VMs (Azure Virtual Machine)
Now that we have a JSON object which contains only the information on virtual machines with the tags that indicate the workflow should be working with them, we need to parse the JSON object and turn the data into something we can use; this task takes the schema and does just that: 

```json
{
  "type": "ParseJson",
  "inputs": {
    "content": "@body('Filter_everything_but_the_VMs_we_are_managing')",
    "schema": {
      "items": {
        "properties": {
          "id": {
            "type": "string"
          },
          "kind": {
            "type": "string"
          },
          "location": {
            "type": "string"
          },
          "managedBy": {
            "type": "string"
          },
          "name": {
            "type": "string"
          },
          "tags": {
            "properties": {
              "scheduledVMPowerOnOff": {
                "type": "string"
              }
            },
            "type": "object"
          },
          "type": {
            "type": "string"
          }
        },
        "required": [
          "id",
          "name",
          "type",
          "kind",
          "managedBy",
          "location",
          "tags"
        ],
        "type": "object"
      },
      "type": "array"
    }
  },
  "runAfter": {
    "Filter_everything_but_the_VMs_we_are_managing": [
      "Succeeded"
    ]
  }
}
```

While the output looks the same as the last step, it is now referenced in a way that allows us to loop over it with a for each task.
### For Each VM (Azure Virtual Machine)
This is the first of two loops we need to run, the second of which is nested in this loop.

```json
{
  "type": "Foreach",
  "foreach": "@body('Process_just_the_VMs')",
  "comment": "The rest in the for each task are detailed below are displayed here",
  "runAfter": {
    "Process_just_the_VMs": [
      "Succeeded"
    ]
  }
}
```

You can see in the screens below it looped through two virtual machines:

{{< img src="images/working-through-the-logic-app/vm-1of2.png" alt="VM 1of 2" >}}

Clicking on the right arrow will take us to the second virtual machine:

{{< img src="images/working-through-the-logic-app/vm-2of2.png" alt="VM 2 of 2" >}}

Now, let's see what we ran for each virtual machine.

#### Get some information on the Virtual Machine (Azure Virtual Machine)

The first task of the loop gets information about the virtual machine we are currently processing, it does this by making a GET request to the [https://management.azure.com/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.Compute/virtualMachines/{vmName}/instanceView?api-version=2024-03-01](https://learn.microsoft.com/en-us/rest/api/compute/virtual-machines/instance-view?view=rest-compute-2024-03-01&tabs=HTTP) Azure REST API endpoint:

```json
{
  "type": "Http",
  "inputs": {
    "uri": "https://management.azure.com@{items('For_Each_VM')['id']}/instanceView?api-version=2024-03-01",
    "method": "GET",
    "authentication": {
      "identity": "@{parameters('managedId')}",
      "type": "ManagedServiceIdentity"
    }
  },
  "runtimeConfiguration": {
    "contentTransfer": {
      "transferMode": "Chunked"
    }
  }
}
```

As you can see from the code above, we are using `{items('For_Each_VM')['id']}` - this contains all of the information we need to connect to the endpoint, for example:

```
/subscriptions/ce7aa0b9-3545-4104-99dc-d4d082339a05/resourceGroups/rg-demo-vms-uks/providers/Microsoft.Compute/virtualMachines/vm-demo-e8ab6db95a-uks
```

Which returns the following output:

```json
{
  "computerName": "vm-demo-e8ab6db95a-uks",
  "osName": "ubuntu",
  "osVersion": "22.04",
  "vmAgent": {
    "vmAgentVersion": "2.10.0.8",
    "statuses": [
      {
        "code": "ProvisioningState/succeeded",
        "level": "Info",
        "displayStatus": "Ready",
        "message": "Guest Agent is running",
        "time": "2024-03-31T12:49:57+00:00"
      }
    ],
    "extensionHandlers": []
  },
  "disks": [
    {
      "name": "vm-demo-e8ab6db95a-uks_OsDisk_1_5be3d505ec324ef3a411406f24e13bf2",
      "statuses": [
        {
          "code": "ProvisioningState/succeeded",
          "level": "Info",
          "displayStatus": "Provisioning succeeded",
          "time": "2024-03-31T12:43:14.0729588+00:00"
        }
      ]
    }
  ],
  "hyperVGeneration": "V2",
  "statuses": [
    {
      "code": "ProvisioningState/succeeded",
      "level": "Info",
      "displayStatus": "Provisioning succeeded",
      "time": "2024-03-31T12:43:41.2609336+00:00"
    },
    {
      "code": "PowerState/running",
      "level": "Info",
      "displayStatus": "VM running"
    }
  ]
}
```

So, we now need to know the power status.
#### Filter just the status about the PowerState (Azure Virtual Machine)
Again, we are running another query - we need to do this because there are two statuses being returned from the initial API call, one for the **ProvisioningState** and the second for the **PowerState** - it is this one we need to work with:

```json
{
  "type": "Query",
  "inputs": {
    "from": "@body('Get_some_information_on_the_Virtual_Machine')['statuses']",
    "where": "@contains(item()['code'],'PowerState')"
  },
  "runAfter": {
    "Get_some_information_on_the_Virtual_Machine": [
      "Succeeded"
    ]
  }
}
```

This leaves us with the following output to use as input for the next task:

```json
[
  {
    "code": "PowerState/running",
    "level": "Info",
    "displayStatus": "VM running"
  }
]
```

#### Process just the VMs power state

Again, we need to get the data into a format we can use:

```json
{
  "type": "ParseJson",
  "inputs": {
    "content": "@body('Filter_just_the_status_about_the_PowerState')",
    "schema": {
      "items": {
        "properties": {
          "code": {
            "type": "string"
          },
          "displayStatus": {
            "type": "string"
          },
          "level": {
            "type": "string"
          }
        },
        "required": [
          "code",
          "level",
          "displayStatus"
        ],
        "type": "object"
      },
      "type": "array"
    }
  },
  "runAfter": {
    "Filter_just_the_status_about_the_PowerState": [
      "Succeeded"
    ]
  }
}

```

We then take this and pass it to our nest loop.

### For each PowerState code (Azure Virtual Machine)

Because we are going to be using a conditional, we need to use another loop to get the output from above into a state we can use:

```
{
  "type": "Foreach",
  "foreach": "@outputs('Process_just_the_VMs_power_state')['body']",
  "comment": "The rest in the for each task are detailed below are displayed here",
  "runAfter": {
    "Process_just_the_VMs_power_state": [
      "Succeeded"
    ]
  }
}
```

#### Condition (Azure Virtual Machine)

Here we have the final step: if `@items('For_each_PowerState_code')['code']` is equal to `PowerState/deallocated`, ie **True**, then we need to power the virtual machine on.

To do this we make a **POST** to [https://management.azure.com/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.Compute/virtualMachines/{vmName}/start?api-version=2024-03-01](https://learn.microsoft.com/en-us/rest/api/compute/virtual-machines/start?view=rest-compute-2024-03-01&tabs=HTTP).

If `@items('For_each_PowerState_code')['code']` is not equal to `PowerState/deallocated`, ie **False**,  then we assume that the resource is running and we need to deallocate by doing  a **POST** to [https://management.azure.com/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.Compute/virtualMachines/{vmName}/deallocate?api-version=2024-03-01](https://learn.microsoft.com/en-us/rest/api/compute/virtual-machines/deallocate?view=rest-compute-2024-03-01&tabs=HTTP)

The JSON for the conditional is below:

```json
{
  "type": "If",
  "expression": {
    "and": [
      {
        "equals": [
          "@items('For_each_PowerState_code')['code']",
          "PowerState/deallocated"
        ]
      }
    ]
  },
  "actions": {
    "Start_Virtual_Machine": {
      "type": "Http",
      "inputs": {
        "uri": "https://management.azure.com@{items('For_Each_VM')['id']}/start?api-version=2024-03-01",
        "method": "POST",
        "authentication": {
          "identity": "@{parameters('managedId')}",
          "type": "ManagedServiceIdentity"
        }
      },
      "runtimeConfiguration": {
        "contentTransfer": {
          "transferMode": "Chunked"
        }
      }
    }
  },
  "else": {
    "actions": {
      "Deallocate_Virtual_Machine": {
        "type": "Http",
        "inputs": {
          "uri": "https://management.azure.com@{items('For_Each_VM')['id']}/deallocate?api-version=2024-03-01",
          "method": "POST",
          "authentication": {
            "identity": "@{parameters('managedId')}",
            "type": "ManagedServiceIdentity"
          }
        },
        "runtimeConfiguration": {
          "contentTransfer": {
            "transferMode": "Chunked"
          }
        }
      }
    }
  }
}

```

In our first run, this final task's output was **False**, so the virtual machines were deallocated, as you can see from the results below:

{{< img src="images/working-through-the-logic-app/vm-2of2results.png" alt="The full machine workflow" >}}

Let's now see what the approach for an Azure Application Gateway looks like.

# Targeting Azure Application Gateways
As already mentioned, there is no way to stop an Application Gateway in the Azure portal; you need to use the Azure CLI or Powershell - both of which call the Azure REST API - so how can we do the same with an Azure Logic App?

## Deploying the Logic App and supporting resources
Again, our first task is to clone the GitHub repo, which contains the JSON definition of the Logic Apps we will be deploying. If you already have this, open a new terminal session and change to the `money-saving-azure-logic-apps` folder.:

{{< terminal title="Cloning to accompanying repo" >}}
```
git clone git@github.com:russmckendrick/money-saving-azure-logic-apps.git
cd money-saving-azure-logic-apps
```
{{< /terminal >}}

Now, we can set some environment variables:

{{< terminal title="Setting some environment variables" >}}
```
export RESOURCE_GROUP_NAME="rg-logicapps-blogpost-uks"
export REGION="uksouth"
export SUBSCRIPTION_ID=$(az account show --query id --output tsv)
export MANAGED_ID_NAME="mi-logicapps-blogpost-uks"
export LOGIC_APP_NAME="la-applicationGatewayStopStart-uks"
```
{{< /terminal >}}

The commands below are repeated from the last section of the post, so if you have already run them, you can move on to the next set of commands; if you haven't, then we need to create the resource group, user-managed identity and assign Reader access:

{{< terminal title="Create the resource group, identity and assign Reader access" >}}
```
az group create --name $RESOURCE_GROUP_NAME --location $REGION
az identity create --resource-group $RESOURCE_GROUP_NAME --name $MANAGED_ID_NAME
az role assignment create --assignee-principal-type "ServicePrincipal" --assignee-object "$(az identity show --resource-group $RESOURCE_GROUP_NAME --name $MANAGED_ID_NAME --query principalId --output tsv)" --role "Reader" --scope "/subscriptions/$SUBSCRIPTION_ID"
```
{{< /terminal >}}

Next, we need to assign the user-managed identity Network Contributor access to our subscription:

{{< terminal title="Granting Network Contributor permissions" >}}
```
az role assignment create \
	--assignee-principal-type "ServicePrincipal" \
	--assignee-object "$(az identity show --resource-group $RESOURCE_GROUP_NAME --name $MANAGED_ID_NAME --query principalId --output tsv)" \
	--role "Network Contributor" \
	--scope "/subscriptions/$SUBSCRIPTION_ID"
```
{{< /terminal >}}

The access is sorted, we can create the Logic App:

{{< terminal title="Create the Logic App" >}}
```
az logic workflow create \
	--resource-group $RESOURCE_GROUP_NAME \
	--location $REGION \
	--name $LOGIC_APP_NAME \
	--mi-user-assigned "$(az identity show --resource-group $RESOURCE_GROUP_NAME --name $MANAGED_ID_NAME --query id --output tsv)" \
	--state "Disabled" \
	--definition "applicationGatewayStopStart.json"
```
{{< /terminal >}}

Now we can update the parameters:

{{< terminal title="Setting the managedId and subscriptionId parameters" >}}
```
az logic workflow update \
	--resource-group $RESOURCE_GROUP_NAME \
	--name $LOGIC_APP_NAME \
	--set "definition.parameters.managedId.defaultValue=$(az identity show --resource-group $RESOURCE_GROUP_NAME --name $MANAGED_ID_NAME --query id --output tsv)"

az logic workflow update \
	--resource-group $RESOURCE_GROUP_NAME \
	--name $LOGIC_APP_NAME \
	--set "definition.parameters.subscriptionId.defaultValue=$(az account show --query id --output tsv)"
```
{{< /terminal >}}

So far, it's very similar to the workflow for Azure Virtual Machines which I aimed for with this approach. This time, the **tagName** we are looking for is **applicationGatewayStopStart**, and the **tagValue** is again **included**.

## Creating an Azure Application Gateway

Again, for testing, we need a resource to target; the commands below deploy an Azure Application Gateway with the most basic configuration I could get away with:

{{< terminal title="Launching an Azure Application Gateway" >}}
```
export RESOURCE_GROUP_NAME="rg-demo-appgw-uks"
export REGION=uksouth
export VNET_NAME=vnet-demo-appgw-uks
export AG_SUBNET_NAME=sub-appwg
export BACKEND_SUBNET_NAME=sub-vms
export AG_PUBLIC_IP_NAME=pip-agw-demo-appgw-uks
export APP_GATEWAY_NAME=agw-demo-appgw-uks

az group create \
	--name $RESOURCE_GROUP_NAME \
	--location $REGION

az network vnet create \
	--name $VNET_NAME \
	--resource-group $RESOURCE_GROUP_NAME \
	--location $REGION \
	--address-prefix 10.21.0.0/16 \
	--subnet-name $AG_SUBNET_NAME \
	--subnet-prefix 10.21.0.0/24

az network vnet subnet create \
	--name $BACKEND_SUBNET_NAME \
	--resource-group $RESOURCE_GROUP_NAME \
	--vnet-name $VNET_NAME \
	--address-prefix 10.21.1.0/24

az network public-ip create \
	--resource-group $RESOURCE_GROUP_NAME \
	--name $AG_PUBLIC_IP_NAME \
	--allocation-method Static \
	--sku Standard

az network application-gateway create \
	--name $APP_GATEWAY_NAME \
	--location $REGION \
	--resource-group $RESOURCE_GROUP_NAME \
	--capacity 2 \
	--sku Standard_v2 \
	--public-ip-address $AG_PUBLIC_IP_NAME \
	--vnet-name $VNET_NAME \
	--subnet $AG_SUBNET_NAME \
	--priority 100 \
	--tags "applicationGatewayStopStart=included"
```
{{< /terminal >}}

The Azure Application Gateway will finish deploying in about 10 minutes, so now would be a good time to grab a drink ☕.

## Running the Logic App (Azure Application Gateway)

In [the Azure Portal](https://portal.azure.com/), go to your Azure Logic App and press the **Enable** button. This will trigger a Run, and clicking on **Refresh** should show you that a run is in progress:

{{< gallery match="images/agw-running-the-logic-app-stop/*" sortOrder="assc" rowHeight="200" margins="5" thumbnailResizeOptions="600x600 q90 Lanczos" showExif=true previewType="blur" embedPreview=true loadJQuery=false >}}<br>

As you can see from the screens above, the Azure Logic App ran, and because the Application Gateway had an **Operational State** of **Running**, it Stopped the Azure Application Gateway. You can check the **Operational State** by going to the Azure Application Gateway in the Azure portal and going to **Properties** in the left-hand menu.

Running the Azure Logic App for a second time will start the Azure Application Gateway with an **Operational State** of **Running**:

{{< gallery match="images/agw-running-the-logic-app-start/*" sortOrder="assc" rowHeight="200" margins="5" thumbnailResizeOptions="600x600 q90 Lanczos" showExif=true previewType="blur" embedPreview=true loadJQuery=false >}}<br>

At this point, if you are testing, you should terminate the Azure Application Gateway so you don't end up getting an unexpected cost (even with the Azure Logic App in place it's not cheap 😃)

{{< terminal title="Removing the demo Virtual Machines and Group" >}}
```
export RESOURCE_GROUP_NAME="rg-demo-appgw-uks"
az group delete --name $RESOURCE_GROUP_NAME
```
{{< /terminal >}}

## Working through the Azure Logic App

As you may have already spotted in the Logic app designer section, the workflow looks pretty similar:

{{< img src="images/working-through-the-logic-app/agw-full-logic-app.png" alt="The full machine workflow" >}}

So let's work through it.

### Recurrence & Get a list of all resources tagged to be managed (Azure Application Gateway)

Both of these steps are the same as detailed in [Recurrence](#recurrence) and [Get a list of all resources tagged to be managed](#recurrence) when we covered the Azure Virtual Machine workflow. The output on the first example run was:

```json
{
  "value": [
    {
      "id": "/subscriptions/ce7aa0b9-3545-4104-99dc-d4d082339a05/resourceGroups/rg-demo-appgw-uks/providers/Microsoft.Network/applicationGateways/agw-demo-appgw-uks",
      "name": "agw-demo-appgw-uks",
      "type": "Microsoft.Network/applicationGateways",
      "kind": "",
      "managedBy": "",
      "location": "uksouth",
      "tags": {
        "applicationGatewayStopStart": "included"
      }
    }
  ]
}
```

### Filter everything but the App Gateways we are managing (Azure Application Gateway)

Here, we are filtering on **Microsoft.Network/applicationGateways**  resource type incase a supporting resource, such as the public IP address, just happens to have the tag applied:

```json
{
  "type": "Query",
  "inputs": {
    "from": "@body('Get_a_list_of_all_resources_tagged_to_be_managed')['value']",
    "where": "@equals(item()['type'],'Microsoft.Network/applicationGateways')"
  },
  "runAfter": {
    "Get_a_list_of_all_resources_tagged_to_be_managed": [
      "Succeeded"
    ]
  }
}

```

### For Each App Gateway (Azure Application Gateway)

So begins our loop; this differs slightly in that there is no nested loop this time as all of the information we need is available in a single place rather than the multiple statuses we had returned when working with Azure Virtual Machines:

```json
{
  "type": "Foreach",
  "foreach": "@body('Procetipless_just_the_App_Gateways')",
  "comment": "The rest in the for each task are detailed below are displayed here",
  "runAfter": {
    "Process_just_the_App_Gateways": [
      "Succeeded"
    ]
  }
}
```

#### Get some information on the Application Gateway (Azure Application Gateway)

This performs a **GET** against [https://management.azure.com/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.Network/applicationGateways/{applicationGatewayName}?api-version=2023-09-01](https://learn.microsoft.com/en-us/rest/api/application-gateway/application-gateways/get?view=rest-application-gateway-2023-09-01&tabs=HTTP) which returns information on the Azure Application Gateway:

```json
{
  "type": "Http",
  "inputs": {
    "uri": "https://management.azure.com@{items('For_Each_App_Gateway')['id']}?api-version=2023-09-01",
    "method": "GET",
    "authentication": {
      "identity": "@{parameters('managedId')}",
      "type": "ManagedServiceIdentity"
    }
  },
  "runtimeConfiguration": {
    "contentTransfer": {
      "transferMode": "Chunked"
    }
  }
}

```

As you can see from the output below, there is a lot of information returned:

```json
{
  "name": "agw-demo-appgw-uks",
  "id": "/subscriptions/ce7aa0b9-3545-4104-99dc-d4d082339a05/resourceGroups/rg-demo-appgw-uks/providers/Microsoft.Network/applicationGateways/agw-demo-appgw-uks",
  "etag": "W/\"5599fe28-15f0-40b8-a25d-56971263aaf8\"",
  "type": "Microsoft.Network/applicationGateways",
  "location": "uksouth",
  "tags": {
    "applicationGatewayStopStart": "included"
  },
  "properties": {
    "provisioningState": "Succeeded",
    "resourceGuid": "39ae7e1b-3890-4bc5-a12d-37f885c607aa",
    "sku": {
      "name": "Standard_v2",
      "tier": "Standard_v2",
      "family": "Generation_2",
      "capacity": 2
    },
    "operationalState": "Running",
    "gatewayIPConfigurations": [
      {
        "name": "appGatewayFrontendIP",
        "id": "/subscriptions/ce7aa0b9-3545-4104-99dc-d4d082339a05/resourceGroups/rg-demo-appgw-uks/providers/Microsoft.Network/applicationGateways/agw-demo-appgw-uks/gatewayIPConfigurations/appGatewayFrontendIP",
        "etag": "W/\"5599fe28-15f0-40b8-a25d-56971263aaf8\"",
        "properties": {
          "provisioningState": "Succeeded",
          "subnet": {
            "id": "/subscriptions/ce7aa0b9-3545-4104-99dc-d4d082339a05/resourceGroups/rg-demo-appgw-uks/providers/Microsoft.Network/virtualNetworks/vnet-demo-appgw-uks/subnets/sub-appwg"
          }
        },
        "type": "Microsoft.Network/applicationGateways/gatewayIPConfigurations"
      }
    ],
    "sslCertificates": [],
    "trustedRootCertificates": [],
    "trustedClientCertificates": [],
    "sslProfiles": [],
    "frontendIPConfigurations": [
      {
        "name": "appGatewayFrontendIP",
        "id": "/subscriptions/ce7aa0b9-3545-4104-99dc-d4d082339a05/resourceGroups/rg-demo-appgw-uks/providers/Microsoft.Network/applicationGateways/agw-demo-appgw-uks/frontendIPConfigurations/appGatewayFrontendIP",
        "etag": "W/\"5599fe28-15f0-40b8-a25d-56971263aaf8\"",
        "type": "Microsoft.Network/applicationGateways/frontendIPConfigurations",
        "properties": {
          "provisioningState": "Succeeded",
          "privateIPAllocationMethod": "Dynamic",
          "publicIPAddress": {
            "id": "/subscriptions/ce7aa0b9-3545-4104-99dc-d4d082339a05/resourceGroups/rg-demo-appgw-uks/providers/Microsoft.Network/publicIPAddresses/pip-agw-demo-appgw-uks"
          },
          "httpListeners": [
            {
              "id": "/subscriptions/ce7aa0b9-3545-4104-99dc-d4d082339a05/resourceGroups/rg-demo-appgw-uks/providers/Microsoft.Network/applicationGateways/agw-demo-appgw-uks/httpListeners/appGatewayHttpListener"
            }
          ]
        }
      }
    ],
    "frontendPorts": [
      {
        "name": "appGatewayFrontendPort",
        "id": "/subscriptions/ce7aa0b9-3545-4104-99dc-d4d082339a05/resourceGroups/rg-demo-appgw-uks/providers/Microsoft.Network/applicationGateways/agw-demo-appgw-uks/frontendPorts/appGatewayFrontendPort",
        "etag": "W/\"5599fe28-15f0-40b8-a25d-56971263aaf8\"",
        "properties": {
          "provisioningState": "Succeeded",
          "port": 80,
          "httpListeners": [
            {
              "id": "/subscriptions/ce7aa0b9-3545-4104-99dc-d4d082339a05/resourceGroups/rg-demo-appgw-uks/providers/Microsoft.Network/applicationGateways/agw-demo-appgw-uks/httpListeners/appGatewayHttpListener"
            }
          ]
        },
        "type": "Microsoft.Network/applicationGateways/frontendPorts"
      }
    ],
    "backendAddressPools": [
      {
        "name": "appGatewayBackendPool",
        "id": "/subscriptions/ce7aa0b9-3545-4104-99dc-d4d082339a05/resourceGroups/rg-demo-appgw-uks/providers/Microsoft.Network/applicationGateways/agw-demo-appgw-uks/backendAddressPools/appGatewayBackendPool",
        "etag": "W/\"5599fe28-15f0-40b8-a25d-56971263aaf8\"",
        "properties": {
          "provisioningState": "Succeeded",
          "backendAddresses": [],
          "requestRoutingRules": [
            {
              "id": "/subscriptions/ce7aa0b9-3545-4104-99dc-d4d082339a05/resourceGroups/rg-demo-appgw-uks/providers/Microsoft.Network/applicationGateways/agw-demo-appgw-uks/requestRoutingRules/rule1"
            }
          ]
        },
        "type": "Microsoft.Network/applicationGateways/backendAddressPools"
      }
    ],
    "loadDistributionPolicies": [],
    "backendHttpSettingsCollection": [
      {
        "name": "appGatewayBackendHttpSettings",
        "id": "/subscriptions/ce7aa0b9-3545-4104-99dc-d4d082339a05/resourceGroups/rg-demo-appgw-uks/providers/Microsoft.Network/applicationGateways/agw-demo-appgw-uks/backendHttpSettingsCollection/appGatewayBackendHttpSettings",
        "etag": "W/\"5599fe28-15f0-40b8-a25d-56971263aaf8\"",
        "properties": {
          "provisioningState": "Succeeded",
          "port": 80,
          "protocol": "Http",
          "cookieBasedAffinity": "Disabled",
          "connectionDraining": {
            "enabled": false,
            "drainTimeoutInSec": 1
          },
          "pickHostNameFromBackendAddress": false,
          "requestTimeout": 30,
          "requestRoutingRules": [
            {
              "id": "/subscriptions/ce7aa0b9-3545-4104-99dc-d4d082339a05/resourceGroups/rg-demo-appgw-uks/providers/Microsoft.Network/applicationGateways/agw-demo-appgw-uks/requestRoutingRules/rule1"
            }
          ]
        },
        "type": "Microsoft.Network/applicationGateways/backendHttpSettingsCollection"
      }
    ],
    "backendSettingsCollection": [],
    "httpListeners": [
      {
        "name": "appGatewayHttpListener",
        "id": "/subscriptions/ce7aa0b9-3545-4104-99dc-d4d082339a05/resourceGroups/rg-demo-appgw-uks/providers/Microsoft.Network/applicationGateways/agw-demo-appgw-uks/httpListeners/appGatewayHttpListener",
        "etag": "W/\"5599fe28-15f0-40b8-a25d-56971263aaf8\"",
        "properties": {
          "provisioningState": "Succeeded",
          "frontendIPConfiguration": {
            "id": "/subscriptions/ce7aa0b9-3545-4104-99dc-d4d082339a05/resourceGroups/rg-demo-appgw-uks/providers/Microsoft.Network/applicationGateways/agw-demo-appgw-uks/frontendIPConfigurations/appGatewayFrontendIP"
          },
          "frontendPort": {
            "id": "/subscriptions/ce7aa0b9-3545-4104-99dc-d4d082339a05/resourceGroups/rg-demo-appgw-uks/providers/Microsoft.Network/applicationGateways/agw-demo-appgw-uks/frontendPorts/appGatewayFrontendPort"
          },
          "protocol": "Http",
          "hostNames": [],
          "requireServerNameIndication": false,
          "enableHttp3": false,
          "requestRoutingRules": [
            {
              "id": "/subscriptions/ce7aa0b9-3545-4104-99dc-d4d082339a05/resourceGroups/rg-demo-appgw-uks/providers/Microsoft.Network/applicationGateways/agw-demo-appgw-uks/requestRoutingRules/rule1"
            }
          ]
        },
        "type": "Microsoft.Network/applicationGateways/httpListeners"
      }
    ],
    "listeners": [],
    "urlPathMaps": [],
    "requestRoutingRules": [
      {
        "name": "rule1",
        "id": "/subscriptions/ce7aa0b9-3545-4104-99dc-d4d082339a05/resourceGroups/rg-demo-appgw-uks/providers/Microsoft.Network/applicationGateways/agw-demo-appgw-uks/requestRoutingRules/rule1",
        "etag": "W/\"5599fe28-15f0-40b8-a25d-56971263aaf8\"",
        "properties": {
          "provisioningState": "Succeeded",
          "ruleType": "Basic",
          "priority": 100,
          "httpListener": {
            "id": "/subscriptions/ce7aa0b9-3545-4104-99dc-d4d082339a05/resourceGroups/rg-demo-appgw-uks/providers/Microsoft.Network/applicationGateways/agw-demo-appgw-uks/httpListeners/appGatewayHttpListener"
          },
          "backendAddressPool": {
            "id": "/subscriptions/ce7aa0b9-3545-4104-99dc-d4d082339a05/resourceGroups/rg-demo-appgw-uks/providers/Microsoft.Network/applicationGateways/agw-demo-appgw-uks/backendAddressPools/appGatewayBackendPool"
          },
          "backendHttpSettings": {
            "id": "/subscriptions/ce7aa0b9-3545-4104-99dc-d4d082339a05/resourceGroups/rg-demo-appgw-uks/providers/Microsoft.Network/applicationGateways/agw-demo-appgw-uks/backendHttpSettingsCollection/appGatewayBackendHttpSettings"
          }
        },
        "type": "Microsoft.Network/applicationGateways/requestRoutingRules"
      }
    ],
    "routingRules": [],
    "probes": [],
    "rewriteRuleSets": [],
    "redirectConfigurations": [],
    "privateLinkConfigurations": [],
    "privateEndpointConnections": [],
    "defaultPredefinedSslPolicy": "AppGwSslPolicy20150501"
  }
}
```


#### Condition  (Azure Application Gateway)

This checks if **operationalState** is equal to **Running** and **True** is returned, then a **POST** against [https://management.azure.com/subscriptions/{subscriptionId}/resource groups/{resourceGroupName}/providers/Microsoft.Network/applicationGateways/{applicationGatewayName}/stop?api-version=2023-09-01](https://learn.microsoft.com/en-us/rest/api/application-gateway/application-gateways/stop?view=rest-application-gateway-2023-09-01&tabs=HTTP) is made, this instructs the Application Gateway to stop.

Or if **operationalState** is not equal to **Running** and **False** is returned, then a **POST** against [https://management.azure.com/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.Network/applicationGateways/{applicationGatewayName}/start?api-version=2023-09-01](https://learn.microsoft.com/en-us/rest/api/application-gateway/application-gateways/start?view=rest-application-gateway-2023-09-01&tabs=HTTP) is executed, this starts the Application Gateway.

```
{
  "type": "If",
  "expression": {
    "and": [
      {
        "equals": [
          "@body('Process_information_on_the_ApplicationGateway')['properties']['operationalState']",
          "Running"
        ]
      }
    ]
  },
  "actions": {
    "Stop_the_Application_Gateway": {
      "type": "Http",
      "inputs": {
        "uri": "https://management.azure.com/@{items('For_Each_App_Gateway')['id']}/stop?api-version=2023-09-01",
        "method": "POST",
        "authentication": {
          "identity": "@{parameters('managedId')}",
          "type": "ManagedServiceIdentity"
        }
      },
      "runtimeConfiguration": {
        "contentTransfer": {
          "transferMode": "Chunked"
        }
      }
    }
  },
  "else": {
    "actions": {
      "Start_the_Application_Gateway": {
        "type": "Http",
        "inputs": {
          "uri": "https://management.azure.com/@{items('For_Each_App_Gateway')['id']}/start?api-version=2023-09-01",
          "method": "POST",
          "authentication": {
            "audience": "",
            "identity": "@{parameters('managedId')}",
            "type": "ManagedServiceIdentity"
          }
        },
        "runtimeConfiguration": {
          "contentTransfer": {
            "transferMode": "Chunked"
          }
        }
      }
    }
  },
  "runAfter": {
    "Process_information_on_the_ApplicationGateway": [
      "Succeeded"
    ]
  }
}

```

As the Azure Application Gateway was running when we ran the Azure Logic App the first time, the run stopped the Application Gateway:

{{< img src="images/working-through-the-logic-app/agw-results.png" alt="The full Application Gateway workflow" >}}

As you can see, while we are working with two different resource types, the workflow follows the same steps: get information on tagged resources, filter the list of resources to just the kind we are targeting with the workflow, get the status, and, depending on the status, perform an action.

{{< gallery match="cover02-large.png" sortOrder="assc" thumbnailResizeOptions="600x600 q90 Lanczos" showExif=true previewType="blur" embedPreview=true loadJQuery=true >}}<br>

# Removing the Azure Logic Apps

To remove the Azure Logic Apps and also the user-managed identity run the following:

{{< terminal title="Setting some environment variables" >}}
```
export RESOURCE_GROUP_NAME="rg-logicapps-blogpost-uks"
az group delete --name $RESOURCE_GROUP_NAME
```
{{< /terminal >}}

You may also have to tidy up the RBAC assignments on your subscription in the [Azure Portal](http://portal.azure.com/).

# Conclusion

Azure Logic Apps provide a powerful and flexible way to automate cost-saving tasks in your Azure environment. By leveraging the Azure REST API and managed identities, you can create workflows that intelligently start and stop your Virtual Machines and Application Gateways based on tags and schedules.

The approach outlined in this post offers a consistent and scalable solution for managing your resources across different types. Whether you're dealing with Virtual Machines, Application Gateways, or other Azure services, the core steps remain the same: retrieve tagged resources, filter them, check their status, and perform actions based on that status.

Implementing these cost-saving automations can significantly impact your Azure spend, especially for non-production environments that don't need to run 24/7. Ensuring your resources are only running when necessary allows you to optimise your cloud costs without sacrificing functionality or performance.

As you explore optimising your Azure environment, consider how Azure Logic Apps can help you streamline your operations and reduce expenses. With a little creativity and some JSON skills, you can create powerful automations that save you time and money in the long run.
