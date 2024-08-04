---
title: "Azure DevOps Ansible Pipeline"
description: "Streamline your DevOps workflows by setting up an Azure pipeline using Ansible playbooks. Learn how to integrate Azure CLI for faster results!"
author: "Russ Mckendrick"
date: 2020-05-10
tags:
  - "Ansible"
  - "DevOps"
  - "Azure"
  - "Infrastructure as Code"
  - "Automation"
cover:
  image: "2020-05-10_azure-devops-ansible-pipeline_0.png"
  relative: true
  alt: "Streamline your DevOps workflows by setting up an Azure pipeline using Ansible playbooks. Learn how to integrate Azure CLI for faster results!"
aliases:
  - "/azure-devops-ansible-pipeline-69a13781be85"
---

I thought it was was about time that I started to have a play with Azure DevOps a little more than I have been doing, one of the things I have always meant to look at in the past is using DevOps to run Ansible playbooks.

However the [Ansible Task](https://www.azuredevopslabs.com/labs/vstsextend/ansible/) recommended by Microsoft has always put me off, the reason for this is that this task requires a Virtual Machine to run Ansible — this to me always seemed a little overkill.

As I had some time I thought I would sit down and have a look at coming up with a pipeline which executes an Ansible playbook which doesn’t use the Ansible Task. As I had already done some work with Python based command line tools on Azure DevOps I thought it best to take the same approach as I took with those to my Ansible pipeline.

As you can see, the start of the pipeline is pretty straight forward, I am triggering whenever `master` is pushed to and using the latest Ububtu VM image:

{{< terminal >}}
``` yaml
trigger:
- master

pool:
  vmImage: 'ubuntu-latest'
```
{{< /terminal >}}

The next step is to make sure that Python is installed, here I am using Python 3.6:

{{< terminal >}}
``` yaml
steps:

- task: UsePythonVersion@0
  displayName: 'Install Python'
  inputs:
    versionSpec: '3.6'
```
{{< /terminal >}}

So far so good, but, the next step had me scratching my head for a little while.

I knew that I was going to connect the Azure DevOps project to my Azure subscription using a service connection which would grant contributor access, I also new that I didn’t want to hard code any values in my `azure-pipelines.yml` file, so how could I make sure that the credentials for the Azure DevOps managed service principle could be securely passed used by Ansible?

After a little trial and error I settled on the task below:

{{< terminal >}}
``` yaml
- task: AzureCLI@2
  displayName: 'Azure CLI'
  inputs:
    azureSubscription: '$(SUBSCRIPTION_NAME)'
    addSpnToEnvironment: true
    scriptType: 'bash'
    scriptLocation: 'inlineScript'
    inlineScript: |
      echo "##vso[task.setvariable variable=ARM_SUBSCRIPTION_ID]$(az account show --query="id" -o tsv)"
      echo "##vso[task.setvariable variable=ARM_CLIENT_ID]${servicePrincipalId}"
      echo "##vso[task.setvariable variable=ARM_CLIENT_SECRET]${servicePrincipalKey}"
      echo "##vso[task.setvariable variable=ARM_TENANT_ID]${tenantId}"
```
{{< /terminal >}}

As you can see, I am using the AzureCLI Task — this takes a few inputs:

- **azureSubscription**: This will be the name of the service connection, as I don’t want to hardcode any values here I am using the variable `$(SUBSCRIPTION_NAME)`
- **addSpnToEnvironment**: When set to `true` this will add service principal id and key of the service endpoint as variables.
- **scriptType**: As I am using Ubuntu I set this to ‘bash’
- **scriptLocation**: Finally, setting ‘inlineScript’ means that I can define the script within the task

The inline script uses logging commands to take the SPN variables and set them as variables we can use in later tasks:

{{< terminal >}}
``` bash
echo "##vso[task.setvariable variable=ARM_SUBSCRIPTION_ID]$(az account show --query="id" -o tsv)"
echo "##vso[task.setvariable variable=ARM_CLIENT_ID]${servicePrincipalId}"
echo "##vso[task.setvariable variable=ARM_CLIENT_SECRET]${servicePrincipalKey}"
echo "##vso[task.setvariable variable=ARM_TENANT_ID]${tenantId}"
```
{{< /terminal >}}

You may have noticed that ARM_CLIENT_ID, ARM_CLIENT_SECRET and ARM_TENANT_ID are using the variables from the task which is why they are using the `${variable}` format.

To populate ARM_SUBSCRIPTION_ID we are using the output of running `az account show --query="id" -o tsv` which returns the subscription ID, so as we are using Bash the format is `$(command here)`.

The great thing about this approach is that because the variables which are outputted by the AzureCLI task are secrets they will always be treated as such so if we were to ever output them they will simple appear as *** though it is important that you are still careful when using them as you do not want the values appearing in any output.

The next step installs Ansible along with the Azure Modules:

{{< terminal >}}
``` yaml
- script: pip install ansible[azure]
  displayName: 'Install Ansible and the Azure modules'
```
{{< /terminal >}}

Now that we have our SPN credentials defined as variables within the pipeline and Ansible installed we can finally run the playbook using the final task:

{{< terminal >}}
``` yaml
- script: ansible-playbook -i inv site.yml
  displayName: 'Run Ansible Playbook'
  env:
    AZURE_CLIENT_ID: $(ARM_CLIENT_ID)
    AZURE_SECRET: $(ARM_CLIENT_SECRET)
    AZURE_TENANT: $(ARM_TENANT_ID)
    AZURE_SUBSCRIPTION_ID: $(ARM_SUBSCRIPTION_ID)
```
{{< /terminal >}}/

As the Azure Ansible modules expect the Azure credentials, tenant and subscription IDs as environment variables we are passing this at run time in the format which Ansible expects, AZURE_CLIENT_ID, AZURE_SECRET, AZURE_TENANT and AZURE_SUBSCRIPTION_ID — all of which are populated using the pipeline variables which were set in the Azure CLI task.

Running the Pipeline give me the following output:

{{< oldgallery >}}
   {{< img src="images/02.png" alt="text" >}}
   {{< img src="images/03.png" alt="text" >}}
   {{< img src="images/04.png" alt="text" >}}
{{< /oldgallery >}}

As you can see from the pipeline output above, the whole pipeline took just over a minute to run, and 50 seconds of that was installing Ansible itself.

Admittedly the playbook didn’t do much other than create a resource group called “azuredevops-rg” — however it wasn’t the playbook I was concerned about in this post — I just want a good boilerplate `azure-pipelines.yml` file for future projects.

If you follow along with this post, make sure that when creating the Pipeline in Azure DevOps you create a varible called `SUBSCRIPTION_NAME` and populate with the name of the Azure Resource Manager service connection your project uses.

You can find the repository used in this post [on GitHub](https://github.com/russmckendrick/DevOpsAnsiblePipeline).
