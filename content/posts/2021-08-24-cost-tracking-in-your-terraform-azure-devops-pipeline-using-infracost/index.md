---
title: "Cost tracking in your Terraform Azure DevOps Pipeline using Infracost"
author: "Russ Mckendrick"
date: 2021-08-24
description: ""
draft: true
showToc: true
cover:
    image: "cover.png"
    relative: true
tags:
  - "Terraform"
  - "Azure DevOps"
  - "Azure"
  - "Cost"
  - "Pipeline"

---

In [my last blog post](/2021/06/08/azure-devops-terraform-pipeline-with-checkov-approvals/) I introduced [a stage](/2021/06/08/azure-devops-terraform-pipeline-with-checkov-approvals/#stage-checkovscan) which executed [Checkov](https://www.checkov.io/) to my Terraform Azure DevOps pipeline, this scanned the Terraform configuration and stopped the deployment if there was an issue. I also added [a stage](/2021/06/08/azure-devops-terraform-pipeline-with-checkov-approvals/#stage-terraform-plan) which checks to see if there are any resources being destroyed.

# Whats missing?

Both of these I thought should give some basic protection against problems caused by common configuration issues, which they did, but it didn't take into account the end user, i.e. me, making a change which would dramatically increase the running costs of the deployment.

# Enter Infracost

One day as I was skimming through [Reddit](https://www.reddit.com/r/Terraform/) and I noticed mention of [Infracost](https://www.infracost.io/) (I can't remember the post, sorry) - the description of the tool got my attention "Cloud cost estimates for Terraform in pull requests" peaked my interest and gave it ago locally.

## Installing and registering Infracost locally

As I am macOS user installing Infracost locally was a [Homebrew](https://brew.sh) command away:

{{< terminal title="Install Infracost on macOS" >}}
``` terminfo
brew install infracost
```
{{< /terminal >}}

Once installed you need to register for an API key, this can be done with a single command:

{{< terminal title="Register for an API key" >}}
``` terminfo
infracost register
```
{{< /terminal >}}

It will ask you for your Name and Email address, once you enter these you should see something like the following output:

{{< terminal title="Output" >}}
```
$ infracost register
Please enter your name and email address to get an API key.
See our FAQ (https://www.infracost.io/docs/faq) for more details.
Name: Russ McKendrick
Email: russ@mckendrick.io

Thank you Russ McKendrick!
Your API key is: IaMnOtREaLlyANapIK3y

Success: Your API key has been saved to /Users/russ.mckendrick/.config/infracost/credentials.yml
You can now run infracost breakdown --path=... and point to your Terraform directory or JSON/plan file.
```
{{< /terminal >}}

That is all of the configuration you need to do, once installed you can try running the tool.

## Running Infracost locally

Next up we need some Terraform to run it against, I have some test code which launches a Linux Virtual Machine in Azure so decided to use that.

{{% alert theme="info" %}}The Terraform code I am using can be found at the [russmckendrick/terraform-vm-local-example](https://github.com/russmckendrick/terraform-vm-local-example) Github repo.{{% /alert %}}

To start with run the following:

{{< terminal title="Run some Terraform commands" >}}
``` terminfo
terraform init
terraform plan -out tfplan.binary
terraform show -json tfplan.binary > plan.json
```
{{< /terminal >}}

This will download all of the Terraform providers and create a Terraform Plan file and then convert it to JSON. Next up we can run Infracost against the JSON version of the Terraform Plan file u sing the following command:

{{< terminal title="Run Infracost for the first time" >}}
``` terminfo
infracost breakdown --path plan.json
```
{{< /terminal >}}

As you can see from the output below (you may need to scroll right), the virtual machine using the SKU **Standard_B1ms** is going to cost $17.23 per month with an addition cost of around $1.69 for the disk operations:

{{< terminal title="Output" >}}
```
$ infracost breakdown --path plan.json
Detected Terraform plan JSON file at plan.json

✔ Calculating monthly cost estimate

Project: russmckendrick/terraform-vm-local-example/plan.json

 Name                                                     Monthly Qty  Unit                      Monthly Cost

 azurerm_linux_virtual_machine.main
 ├─ Instance usage (pay as you go, Standard_B1ms)                 730  hours                           $17.23
 └─ os_disk
    ├─ Storage (S4)                                                 1  months                           $1.69
    └─ Disk operations                             Monthly cost depends on usage: $0.0005 per 10k operations

 OVERALL TOTAL                                                                                         $18.92
----------------------------------
To estimate usage-based resources use --usage-file, see https://infracost.io/usage-file
```
{{< /terminal >}}

That's a reasonable cost, so lets launch the Virtual Machine by running:

{{% alert theme="danger" %}}**Warning!** If you are following along running the commands below will incur cost.{{% /alert %}}

{{< terminal title="Run some Terraform commands" >}}
``` terminfo
terraform apply
```
{{< /terminal >}}

Now that we have the Virtual Machine, lets increase the specification by updating the SKU to **Standard_B4ms**, this can be done in the `terraform.tfvars` file in the repo. Once updated, generate a new plan file and run Infracost again:

{{< terminal title="Run some Terraform commands" >}}
``` terminfo
terraform plan -out tfplan.binary
terraform show -json tfplan.binary > plan.json
infracost breakdown --path plan.json
```
{{< /terminal >}}

You will notice that when you ran the `terraform plan` command it checked against the Terraform Statefile, however as you can see from the output below ...

{{< terminal title="Output" >}}
``` 
$ infracost breakdown --path plan.json
Detected Terraform plan JSON file at plan.json

✔ Calculating monthly cost estimate

Project: russmckendrick/terraform-vm-local-example/plan.json

 Name                                                     Monthly Qty  Unit                      Monthly Cost

 azurerm_linux_virtual_machine.main
 ├─ Instance usage (pay as you go, Standard_B4ms)                 730  hours                          $137.97
 └─ os_disk
    ├─ Storage (S4)                                                 1  months                           $1.69
    └─ Disk operations                             Monthly cost depends on usage: $0.0005 per 10k operations

 OVERALL TOTAL                                                                                        $139.66
----------------------------------
To estimate usage-based resources use --usage-file, see https://infracost.io/usage-file
```
{{< /terminal >}}

... all it shows is the new cost, wouldn't it be good if you could figure out the difference? Well you can, just run the following command:

{{< terminal title="Check the differences" >}}
``` terminfo
infracost diff --path plan.json
```
{{< /terminal >}}

This time I got the output below:

{{< terminal title="Output" >}}
``` 
$ infracost diff --path plan.json
Detected Terraform plan JSON file at plan.json

✔ Calculating monthly cost estimate

Project: russmckendrick/terraform-vm-local-example/plan.json

~ azurerm_linux_virtual_machine.main
  +$121 ($18.92 -> $140)

    - Instance usage (pay as you go, Standard_B1ms)
      -$17.23

    + Instance usage (pay as you go, Standard_B4ms)
      +$138

Monthly cost change for russmckendrick/terraform-vm-local-example/plan.json
Amount:  +$121 ($18.92 -> $140)
Percent: +638%

----------------------------------
Key: ~ changed, + added, - removed

To estimate usage-based resources use --usage-file, see https://infracost.io/usage-file
```
{{< /terminal >}}

... as you can, here we have an increase in cost of 638% - probably best that I don't update the SKU !!!

Now lets look how this can be applied to the Azure DevOps pipeline, but not before I run the following to remove the Virtual Machine:

{{< terminal title="Run Terraform Destroy" >}}
``` terminfo
terraform destroy
```
{{< /terminal >}}


