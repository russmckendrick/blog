---
title: "Tracking costs in Terraform using Infracost"
author: "Russ McKendrick"
date: 2021-08-24
description: ""
draft: false
showToc: true
cover:
    image: "cover.png"
    relative: true
aliases:
  - "/2021/08/24/tracking-costs-in-your-terraform-azure-devops-pipeline-using-infracost/"
tags:
  - "Terraform"
  - "Azure DevOps"
  - "Pipeline"
  - "Azure"
  - "Cost"
  - "Infracost"

---

In [my last blog post](/2021/06/08/azure-devops-terraform-pipeline-with-checkov-approvals/) I introduced [a stage](/2021/06/08/azure-devops-terraform-pipeline-with-checkov-approvals/#stage-checkovscan) which executed [Checkov](https://www.checkov.io/) to my Terraform Azure DevOps pipeline, this scanned the Terraform configuration and stopped the deployment if there was an issue. I also added [a stage](/2021/06/08/azure-devops-terraform-pipeline-with-checkov-approvals/#stage-terraform-plan) which checks to see if there are any resources being destroyed.

## Whats missing?

Both of these I thought should give some basic protection against problems caused by common configuration issues, which they did, but it didn't take into account the end user, i.e. me, making a change which would dramatically increase the running costs of the deployment.

## Enter Infracost

One day as I was skimming through [Reddit](https://www.reddit.com/r/Terraform/) and I noticed mention of [Infracost](https://www.infracost.io/) (I can't remember the post, sorry) - the description of the tool got my attention "Cloud cost estimates for Terraform in pull requests" peaked my interest and gave it ago locally.

### Installing and registering Infracost locally

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

{{< notice tip >}}
Please make a note of the API key, you will need it later.
{{< /notice >}}

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

### Running Infracost locally

Next up we need some Terraform to run it against, I have some test code which launches a Linux Virtual Machine in Azure so decided to use that.

{{< notice info >}}
The Terraform code I am using can be found at the [russmckendrick/terraform-vm-local-example](https://github.com/russmckendrick/terraform-vm-local-example) Github repo.
{{< /notice >}}

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

{{< notice warning >}}
**Warning!** If you are following along running the commands below will incur cost.
{{< /notice >}}

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

## The Pipeline

The stages of the pipeline are not changing too much, they are still the following 

- **Checkov Scan**, there are no changes to [this stage](/2021/06/08/azure-devops-terraform-pipeline-with-checkov-approvals/#stage-checkovscan)
- **Terraform Validate**, there are no changes to [this stage](/2021/06/08/azure-devops-terraform-pipeline-with-checkov-approvals/#stage-terraform-validate)
- **Terraform Plan**, there is where all of the changes are and we will be covering this stage in more detail below.
- **Terraform Apply (Auto Approval)**, there are no changes to [this stage](/2021/06/08/azure-devops-terraform-pipeline-with-checkov-approvals/#stage-terraform-apply-auto-approval)
- **Terraform Apply (Manual Approval)**, there are some minor changes to [this stage](/2021/06/08/azure-devops-terraform-pipeline-with-checkov-approvals/#stage-terraform-apply-manual-approval), mostly around the wording 

### Additional Pipeline variables

There is an addition of a single variable at the top of the `azure-pipeline.yml` file, this sets the `cost_increase_alert_percentage` threshold - in my case I set this to 50%:

{{< terminal title="Run some Terraform commands" >}}
``` yaml
variables:
  tf_version: "latest" # what version of terraform should be used
  tf_state_rg: "rg-tfstate" # name of the resource group to create/use for the terraform state file
  tz_state_location: "uksouth" # location of the resource group to create/use for the terraform state file
  tf_state_sku: "Standard_RAGRS" # sku to use when creating the storeage account to create/use for the terraform state file
  tf_state_sa_name: "tfstatesa20210606" # name of of the storage account to create/use for the terraform state file
  tf_state_container_name: "tfstate" # name of of the container to create/use for the terraform state file
  tf_environment: "dev" # enviroment name, used for the statefile name
  cost_increase_alert_percentage: 50 # if the difference in costs is higher than x% then you will need to manually validate the deployment
```
{{< /terminal >}}

The second variable which needs to be added contains the API key which you made a note of when the `infracost register` command was ran locally. If you didn't make a note then the configuration file created by the command also contains the API key, in my case was stored at `/Users/russ.mckendrick/.config/infracost/credentials.yml` and make a note of the API key.

Open the pipeline in Azure DevOps, click **Edit**, then **Variables** and finally add a variable called `INFRACOST_API_KEY` making sure that you tick the *Keep this value secret* box:

{{< img src="images/01-update-variable.png" alt="Adding the INFRACOST_API_KEY variable" >}}

Now the two variables have been added lets look at the changes to the pipeline itself.

### Stage - Terraform Plan

Before this stage contained the following tasks:

- "Run > terraform init"
- "Run > terraform plan"
- "Run > terraform show"

There are no changes to these three tasks, by the end of the them we are left with an idea of what Terraform is going to do and a Terraform Plan file is stored at `$(System.DefaultWorkingDirectory)/terraform.tfplan`. 

#### Task - Install > Infracost

The first of the two new tasks we are adding simply installs Infracost:

{{< terminal title="Install > Infracost" >}}
``` yaml
- bash: |
    if [ -z "$(INFRACOST_API_KEY)" ]; then
      echo "ℹ️ - No Infracost API Key has been detected - skipping task"
    else
      sudo apt-get update -qq && sudo apt-get -qq install bc curl git jq bc
      curl -sL https://github.com/infracost/infracost/releases/latest/download/infracost-linux-amd64.tar.gz | tar xz -C /tmp
      sudo mv /tmp/infracost-linux-amd64 /usr/bin/infracost
    fi
  name: "installinfracost"
  displayName: "Install > Infrascost"
```
{{< /terminal >}}

As you can see, there is a little logic in there which skips this step if the `$(INFRACOST_API_KEY)` is not defined and we are just left with a message which looks like the following:

{{< img src="images/06-skipping.png" alt="Nothing to do here" >}}

Once Infracost has been installed we can then run it.

#### Task - Run > Infracost

There is quite a bit of logic in the this task, here it is in its entirety:

{{< terminal title="Run > Infracost" >}}
``` yaml
- bash: |
    if [ -z "$(INFRACOST_API_KEY)" ]; then
      echo "ℹ️ - No Infracost API Key has been detected - skipping task"
    else
      mkdir $(System.DefaultWorkingDirectory)/output
      terraform show -json $(System.DefaultWorkingDirectory)/terraform.tfplan > $(System.DefaultWorkingDirectory)/output/plan.json
      infracost breakdown --format json --path $(System.DefaultWorkingDirectory)/output/plan.json > $(System.DefaultWorkingDirectory)/output/cost.json

      past_total_monthly_cost=$(jq '[.projects[].pastBreakdown.totalMonthlyCost | select (.!=null) | tonumber] | add' $(System.DefaultWorkingDirectory)/output/cost.json)
      total_monthly_cost=$(jq '[.projects[].breakdown.totalMonthlyCost | select (.!=null) | tonumber] | add' $(System.DefaultWorkingDirectory)/output/cost.json)
      diff_cost=$(jq '[.projects[].diff.totalMonthlyCost | select (.!=null) | tonumber] | add' $(System.DefaultWorkingDirectory)/output/cost.json)
      percentage_threshold=$(cost_increase_alert_percentage)

      if [ $(echo "$past_total_monthly_cost > 0" | bc -l) = 1 ] && [ $(echo "$total_monthly_cost > 0" | bc -l) = 1 ]; then
        percent=$(echo "scale=6; $total_monthly_cost / $past_total_monthly_cost * 100 - 100" | bc)
      fi

      if [ $(echo "$past_total_monthly_cost <= 0" | bc -l) = 1 ] && [ $(echo "$total_monthly_cost <= 0" | bc -l) = 1 ]; then
        percent=0
      fi

      if [ -z "$percent" ]; then
        echo "##vso[task.logissue type=warning]💰 - ℹ️ No previous cost data has been detected"
      elif [ $(echo "$percent > $percentage_threshold" | bc -l) = 1 ]; then
        echo "##vso[task.logissue type=warning]💰 - 📈 A $percent% increase in cost have be detected. Your monthly costs are increasing from \$$past_total_monthly_cost to \$$total_monthly_cost"
        echo "##vso[task.setvariable variable=TERRAFORM_PLAN_HAS_DESTROY_CHANGES]true"
      else
        echo "##vso[task.logissue type=warning]💰 - 📉 An acceptable or no change in cost has been detected. Your new monthly costs are \$$total_monthly_cost from \$$past_total_monthly_cost"
      fi
    fi
  env:
    INFRACOST_API_KEY: $(INFRACOST_API_KEY)
  name: "runinfracost"
  displayName: "Run > Infrascost"
```
{{< /terminal >}}

The first few of the steps in the task roughly follow what we ran locally:

- Check to see if `$(INFRACOST_API_KEY)` has been set
- Create a folder called output
- Run `terraform show` using the plan file created by the **Run > terraform plan** task to save a JSON version of the plan
- Take the JSON file created above and run  `infracost breakdown`, this time outputting the results as a second JSON file

With the only difference being that rather outputting the the screen we are saving the results to a JSON file, once the file has been generated we can interact with it using eh `jq` command, `jq` is a lightweight and flexible command-line JSON processor.

First we get the value for the previous cost, if there was one, and assign it to the `$past_total_monthly_cost` variable

{{< terminal title="Set $past_total_monthly_cost" >}}
``` bash
past_total_monthly_cost=$(jq '[.projects[].pastBreakdown.totalMonthlyCost | select (.!=null) | tonumber] | add' $(System.DefaultWorkingDirectory)/output/cost.json)
```
{{< /terminal >}}

Them we get the value for the new cost, and assign it to the `$total_monthly_cost` variable:

{{< terminal title="Set $total_monthly_cost" >}}
``` bash
total_monthly_cost=$(jq '[.projects[].breakdown.totalMonthlyCost | select (.!=null) | tonumber] | add' $(System.DefaultWorkingDirectory)/output/cost.json)
```
{{< /terminal >}}

Next up, we get the difference in cost and set that as the `$diff_cost` variable:

{{< terminal title="Set $diff_cost" >}}
``` bash
diff_cost=$(jq '[.projects[].diff.totalMonthlyCost | select (.!=null) | tonumber] | add' $(System.DefaultWorkingDirectory)/output/cost.json)
```
{{< /terminal >}}

Not how that the difference in cost was aviable to us in the JSON output without the need for us to run the `infracost diff` command.

Finally, we take the pipeline variable `$(cost_increase_alert_percentage)` and set a local one called `$percentage_threshold`:

{{< terminal title="Set $percentage_threshold" >}}
``` bash
percentage_threshold=$(cost_increase_alert_percentage)
```
{{< /terminal >}}

The next part of the script ...

{{< terminal title="Set $percent" >}}
``` bash
if [ $(echo "$past_total_monthly_cost > 0" | bc -l) = 1 ] && [ $(echo "$total_monthly_cost > 0" | bc -l) = 1 ]; then
  percent=$(echo "scale=6; $total_monthly_cost / $past_total_monthly_cost * 100 - 100" | bc)
fi
```
{{< /terminal >}}

... only runs if both `$past_total_monthly_cost` and `$total_monthly_cost` are greater than 0, what it does it set the percentage increase or decrease based on the data in the variables we have just set, this is then exported to the `$percent` variable.

The next statement sets `$percent` if there is no cost data:

{{< terminal title="Set $percent to 0" >}}
``` bash
if [ $(echo "$past_total_monthly_cost <= 0" | bc -l) = 1 ] && [ $(echo "$total_monthly_cost <= 0" | bc -l) = 1 ]; then
  percent=0
fi
```
{{< /terminal >}}

Now we should have information to make a decision on what the Terraform should do, which should be one of three things;

- **1.** Do nothing, there is no price data to output a message saying that and move on.
- **2.** Check to see if `$percent` is higher than `$percentage_threshold`, if so output a message and also set `$TERRAFORM_PLAN_HAS_DESTROY_CHANGES` to `true` to trigger the manual review stage.
- **3.** If neither of the conditions above are met then assume that the cost increase with within `$percentage_threshold`, print a message.

This looks like the following:

{{< terminal title="Decide what to do" >}}
``` bash
  if [ -z "$percent" ]; then
    echo "##vso[task.logissue type=warning]💰 - ℹ️ No previous cost data has been detected"
  elif [ $(echo "$percent > $percentage_threshold" | bc -l) = 1 ]; then
    echo "##vso[task.logissue type=warning]💰 - 📈 A $percent% increase in cost have be detected. Your monthly costs are increasing from \$$past_total_monthly_cost to \$$total_monthly_cost"
    echo "##vso[task.setvariable variable=TERRAFORM_PLAN_HAS_DESTROY_CHANGES]true"
  else
    echo "##vso[task.logissue type=warning]💰 - 📉 An acceptable or no change in cost has been detected. Your new monthly costs are \$$total_monthly_cost from \$$past_total_monthly_cost"
  fi
```
{{< /terminal >}}

The final part of the task closes the loop and also sets the content of `$(INFRACOST_API_KEY)` as an environment variable called `INFRACOST_API_KEY` which the `infracost` checks when it is executed:

{{< terminal title="Decide what to do" >}}
``` yaml
  fi
env:
  INFRACOST_API_KEY: $(INFRACOST_API_KEY)
name: "runinfracost"
displayName: "Run > Infrascost"
```
{{< /terminal >}}

#### Task - Vars > Set Variables for next stage

The final task in this stage is not much different than before, just some of the wording has been tweaked to take into account we are now looking for cost as well a resources being destroyed:

{{< terminal title="Vars > Set Variables for next stage" >}}
``` yaml
- bash: |
    if [ "$TERRAFORM_PLAN_HAS_CHANGES" = true ] && [ "$TERRAFORM_PLAN_HAS_DESTROY_CHANGES" = false ] ; then
      echo "##vso[task.setvariable variable=HAS_CHANGES_ONLY;isOutput=true]true"
      echo "##vso[task.logissue type=warning]👍 - Changes with no destroys detected, it is safe for the pipeline to proceed automatically"
      fi
    if [ "$TERRAFORM_PLAN_HAS_CHANGES" = true ] && [ "$TERRAFORM_PLAN_HAS_DESTROY_CHANGES" = true ] ; then
      echo "##vso[task.setvariable variable=HAS_DESTROY_CHANGES;isOutput=true]true"
      echo "##vso[task.logissue type=warning]⛔️ - Changes with Destroy or Cost increase, pipeline will require a manual approval to proceed"
    fi
    if [ "$TERRAFORM_PLAN_HAS_CHANGES" != true ] ; then
      echo "##vso[task.logissue type=warning]ℹ️ - No changes detected, terraform apply will not run"
    fi
  name: "setvar"
  displayName: "Vars > Set Variables for next stage"
```
{{< /terminal >}}

There are also some tweaks to the rest of the pipeline, but nothing outside of changing some of the wording.

## Running the Pipeline 

Now that we have all of the bits together lets run the same Terraform code which launches a Linux virtual machine with the **Standard_B1ms** SKU.

### Initial Run

When the pipeline is first run there are no existing costs so we get the following output:

{{< img src="images/02-first-run.png" alt="First run" >}}

As you can see, we have a message saying that "No previous cost data has been detected" and that Terraform as just run as expected as it is only adding resources.

### Running again

Rerunning with the same SKU us the following:

{{< img src="images/03-no-change.png" alt="Second run" >}}

As we already have an existing resource Infracost returns information on both the previous and new cost, which in our case was $18.91 - also not that as there are no changes Terraform does not attempt to apply any thing.

### Updating the SKU and increasing costs

Now lets bump the SKU to **Standard_B4ms**:

{{< img src="images/04-increase-the-sku.png" alt="Update the SKU" >}}

As you can see, an cost increase of over 50% has been detected, over 630% in-fact from $18.91 to £139.66 per month, so the `$HAS_DESTROY_CHANGES` has been set and the manual validation stage was executed.

### Undo the change to the SKU

The final change is changing the SKU of the virtual machine back to **Standard_B1ms**:

{{< img src="images/05-decrease-the-sku.png" alt="Undo the change to the SKU" >}}

The message this time shows that the costs have been reduced and we are OK with that, so the pipeline triggered the auto-approve stage and we didn't have to step in and review the changes.

## Summary

Now the pipeline described above does differ from the native CI/CD integration provided by Infracost which can be found [here](https://www.infracost.io/docs/integrations/cicd). Infracost's own integration hooks into your repo and is triggered on a pull request - as I already had a pipeline built I decided to adapt their [script](https://github.com/infracost/infracost/blob/master/scripts/ci/diff.sh) a little so that it fitted my own needs.

With over 3 million prices listed covering the bulk of Microsoft Azure, Amazon Web Services, and Google Cloud Platform cloud services it should pick up the majority of common mistakes when it comes to incorrectly configuring a service using Terraform and hopefully stop you getting any nasty surprises at the end of the month.

They have also just updated the self-hosted version of the Cloud Pricing API meaning that you can connect to your own instance rather than registered to use their public end-point which is extremely useful if you have limited network access, see [this blog post](https://www.infracost.io/blog/jul-2021-update) for more information.

The full code for the pipeline and Terraform scripts covered in this post can be found [in the GitHub repo here](https://github.com/russmckendrick/DevOpsTerraformPipeline/).