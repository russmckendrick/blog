---
title: "Generating an Azure Storage Account SAS token using Azure Logic and Function apps"
author: "Russ McKendrick"
date: 2024-07-27T18:03:45+01:00
description: "Learn how to generate an Azure Storage Account SAS token from a Logic App using an Azure Function. This step-by-step guide covers deploying a PowerShell-based Function App, creating the SAS token generation function, and integrating it into your Logic App workflow. Overcome common challenges and enhance your Azure development skills with this practical tutorial."
draft: false
showToc: true
cover:
    image: "cover.png"
    relative: true
    alt: "Learn how to generate an Azure Storage Account SAS token from a Logic App using an Azure Function. This step-by-step guide covers deploying a PowerShell-based Function App, creating the SAS token generation function, and integrating it into your Logic App workflow. Overcome common challenges and enhance your Azure development skills with this practical tutorial."
tags:
  - "Azure"
keywords:
  - "Azure"
  - "Azure Logic App"
  - "Azure Function App"
  - "SAS Token"
  - "Azure Storage Account"
  - "Powershell"
---

Don't you just love it when you open your laptop first thing on a Monday morning, a fresh cup of coffee at the ready and you think to yourself ... 

> This should be a straight-forward five-minute job to start the week with

... and it turns out to be anything but?

That is exactly what happened to me this week, I won't go into too much detail, but I was working on an Azure Logic App that had to interact with an external service and pass it a a fully signed SAS URL for an Azure Storage Account so that it could send some quite large files there. You would assume that the [Azure Blob connector](https://learn.microsoft.com/en-us/connectors/azureblob/) would be able to do this, and you would be correct as there is a "Create SAS URI by path (V2)" action:

{{< linkpreview "https://learn.microsoft.com/en-us/connectors/azureblob/#create-sas-uri-by-path-(v2)" "noimage" >}}

This worked great in generating a SAS URL but when I tried to use it the service I was targeting returned the following message:

{{< ide title="LocalFunctionProj/getSAS/run.ps1" lang="JSON" >}}
```json {linenos=true}
{
  "code": "ExportFailed",
  "message": "The SAS token requires access to the 'Blob' service (ss=b)"
}
```
{{< /ide >}}<br>

After a few hours of making tweaks, searching forums and community posts during and between calls I could not get it to work. After a few aborted Plan B's which included trying to make all of the REST requests needed to generate the SAS token, that failed as I could not encode the connection string correctly using the built-in Logic App functions. I eventually settled on deploying an Azure Function App to run some Powershell which generates the SAS token and passes it back to the Logic App.

## Launching the Function App

First of all, we need a Function App, for this, we will be deploying a consumption plan-based App with the Powershell runtime. You can use the commands below to deploy this using the [Azure CLI](https://learn.microsoft.com/en-us/cli/azure/).

First, we need to set some variables;

{{< terminal title="Set some variables" >}}
```text
export RESOURCE_GROUP_NAME="rg-generate-sas-uks"
export REGION="uksouth"
export FUNCATION_APP_NAME="func-generate-sas-uks"
export FUNCATION_APP_STORAGE_ACCOUNT="safusasuks"
```
{{< /terminal >}}

Now that we have some variables set we can add the Resource Group;

{{< terminal title="Add the resource group using the Azure CLI" >}}
```text
az group create \
	--name $RESOURCE_GROUP_NAME \
	--location $REGION
```
{{< /terminal >}}

With somewhere to place the resources next up we need to add the storage account which will be used by the Function App to store its files;

{{< terminal title="Deploy the Storage Account using the Azure CLI" >}}
```text
az storage account create \
	--resource-group $RESOURCE_GROUP_NAME \
	--name $FUNCATION_APP_STORAGE_ACCOUNT \
	--kind StorageV2
```
{{< /terminal >}}

Finally, we can launch the Azure Function App;

{{< terminal title="Deploy the Function App using the Azure CLI" >}}
```text
az functionapp create \
	--resource-group $RESOURCE_GROUP_NAME \
	--name "$FUNCATION_APP_NAME" \
	--consumption-plan-location "$REGION" \
	--storage-account "$FUNCATION_APP_STORAGE_ACCOUNT" \
	--functions-version "4" \
	--runtime "powershell" \
	--runtime-version "7.4"
```
{{< /terminal >}}



## Deploying the Function

Now we have the Azure Function App deployed, our next task is to create and deploy our actual function. Being a [macOS](/tags/mags/) user I use `func` to create the function locally and then publish it, you can [download the tool from here](https://learn.microsoft.com/en-us/azure/azure-functions/functions-run-local), once installed, run the following commands to create the local function:

{{< terminal title="Deploy to the Function App using the Azure CLI" >}}
```text
func init LocalFunctionProj --worker-runtime powershell
cd LocalFunctionProj
func new --name getSAS --template "HTTP trigger"
```
{{< /terminal >}}

This will create all of the files needed for the function, using your IDE of choice replace the contents of `LocalFunctionProj/requirements.psd1` with the code below:

{{< ide title="`LocalFunctionProj/requirements.psd1" lang="Poweshell" >}}
```powershell {linenos=true}
@{
    'Az' = '12.*'
}
```
{{< /ide >}}<br>

Then the contents of `LocalFunctionProj/getSAS/run.ps1` with:

{{< ide title="LocalFunctionProj/getSAS/run.ps1" lang="Poweshell" >}}
```powershell {linenos=true}
# Import required namespaces
using namespace System.Net
using namespace Microsoft.WindowsAzure.Storage.Blob

# Input bindings are passed in via param block.
# $Request: Contains the request data
# $TriggerMetadata: Contains metadata about the trigger
param($Request, $TriggerMetadata)

# Log the request body for debugging purposes
Write-Host "Request body type: $($Request.Body.GetType().Name)"
Write-Host "Request body content: $($Request.Body | ConvertTo-Json -Depth 10)"

# The body is already deserialized, so we can use it directly
$requestBody = $Request.Body

# Check if we received the expected data (StorageAccountName and StorageAccountKey)
if ($requestBody -and $requestBody.ContainsKey('StorageAccountName') -and $requestBody.ContainsKey('StorageAccountKey')) {
    # Extract the storage account details from the request body
    $storageAccountName = $requestBody.StorageAccountName
    $storageAccountKey = $requestBody.StorageAccountKey

    # Generate the SAS token
    try {
        # Create a new Azure Storage context using the provided credentials
        $ctx = New-AzStorageContext -StorageAccountName $storageAccountName -StorageAccountKey $storageAccountKey
        
        # Generate a new SAS token with the following parameters:
        # - Service: Blob
        # - ResourceType: Service, Container, Object
        # - Permission: Create, Read, Write, Delete, List
        # - ExpiryTime: 2 days from now
        $sasToken = New-AzStorageAccountSASToken -Service Blob -ResourceType Service,Container,Object -Permission "crwdl" -ExpiryTime (Get-Date).AddDays(2) -Context $ctx
        
        # Prepare the success response
        $responseBody = @{
            "message" = "SAS Token generated successfully"
            "sasToken" = $sasToken
        } | ConvertTo-Json
        Write-Host "SAS Token generated successfully"
    } catch {
        # If an error occurs, prepare an error response
        $responseBody = @{
            "error" = "Failed to generate SAS Token"
            "details" = $_.Exception.Message
        } | ConvertTo-Json
        Write-Host "Failed to generate SAS Token: $_"
    }
}
else {
    # If the required data is missing or invalid, prepare an error response
    $responseBody = @{
        "error" = "Invalid or missing JSON data"
        "receivedData" = $requestBody
    } | ConvertTo-Json
    Write-Host "Invalid or missing JSON data"
}

# Associate values to output bindings by calling 'Push-OutputBinding'.
# This sends the HTTP response back to the client.
Push-OutputBinding -Name Response -Value ([HttpResponseContext]@{
    StatusCode = [HttpStatusCode]::OK
    Body = $responseBody
    Headers = @{'Content-Type' = 'application/json'}
})
```
{{< /ide >}}<br>

As you can see, the code above is commented which should give you a good gist of what happening but basically, we post a JSON file, the body of which looks like the following:

{{< ide title="The JSON body" lang="JSON" >}}
```json {linenos=true}
{
  "StorageAccountName": "<name-of-your-target-storage-account>",
  "StorageAccountKey": "<the-primary-key-of-the-storage-account-above>"
}
```
{{< /ide >}}<br>

It then uses the `New-AzStorageAccountSASToken` cmdlet to generate the SAS token. With the updates to the files in place, we can publish the local function to Azure by running the following code:

{{< terminal title="Deploy to the Function App using the Azure CLI" >}}
```text
func azure functionapp publish $FUNCATION_APP_NAME
```
{{< /terminal >}}

Once deployed, you can test if it is working as expected using [cURL](https://curl.se/) locally.

## Testing the Azure Function App

First, let's re-export our variables adding one that contains the name of the storage account you want to target:

{{< notice info >}}
These commands assume that your user has access to the target storage account.
{{< /notice >}}

{{< terminal title="Set some variables" >}}
```text
export RESOURCE_GROUP_NAME="rg-generate-sas-uks"
export REGION="uksouth"
export FUNCATION_APP_NAME="func-generate-sas-uks"
export FUNCATION_APP_STORAGE_ACCOUNT="safusasuks"
export TARGRET_STORAGE_ACCOUNT_NAME="sabackupuks"
```
{{< /terminal >}}

We can now use the Azure CLI to grab the primary storage key and use that to populate our JSON payload by running the command below:

{{< terminal title="Set some variables" >}}
```text
json_data=$(cat <<EOF
{
  "StorageAccountName": "$TARGRET_STORAGE_ACCOUNT_NAME",
  "StorageAccountKey": "$(az storage account keys list --resource-group $RESOURCE_GROUP_NAME --account-name $TARGRET_STORAGE_ACCOUNT_NAME --query '[0].value' -o tsv)"
}
EOF
)
```
{{< /terminal >}}

With our JSON body populated, we can now use the Azure CLI to grab the details on the function we have just deployed (i.e. the URL and access key) and then post to JSON body to it by running:

{{< terminal title="Set some variables" >}}
```text
curl -X POST \
	-H "Content-Type: application/json" \
	-d "$json_data" \
	"$(az functionapp function show --resource-group $RESOURCE_GROUP_NAME --name "$FUNCATION_APP_NAME" --function-name getSAS --query "invokeUrlTemplate" --output tsv)?code=$(az functionapp function keys list --resource-group $RESOURCE_GROUP_NAME --name "$FUNCATION_APP_NAME" --function-name getSAS --query "default" --output tsv)"
```
{{< /terminal >}}

It will take a few seconds to return something, but if everything goes as planned you should see something like the following response:

{{< ide title="The JSON result" lang="JSON" >}}
```json {linenos=true}
{
  "message": "SAS Token generated successfully",
  "sasToken": "sv=2023-08-03&ss=b&srt=sco&se=2024-07-30T08%3A12%3A06Z&sp=rwdlc&sig=7RsOYC6nEHCT9NaHm4t34RNqSLrt4GRiefZclzkHWgc%3D"
}
```
{{< /ide >}}<br>

As you can see, this worked as expected and returned the signed token which is valid for 48 hours.

## Adding the Function to your Logic App

I am not going to into details of the Logic App here, suffice to say that it needed to be integrated with an Azure Key Vault to store the primary Storage Account key and several other secrets for the service I was interacting with via HTTP requests. The Azure Function App was called using the Function workflow [which is detailed here](https://learn.microsoft.com/en-us/azure/logic-apps/call-azure-functions-from-workflows?tabs=consumption). There was a little bit of messing about with the results and getting the right information to construct the URL so here those details:

{{< ide title="Getting the information into the LogicApp" lang="JSON" >}}
```json {linenos=true}
"Parse_JSON_(SAS)": {
    "inputs": {
        "content": "@outputs('Generate_SAS_Token')",
        "schema": {
            "properties": {
                "body": {
                    "properties": {
                        "message": {
                            "type": "string"
                        },
                        "sasToken": {
                            "type": "string"
                        }
                    },
                    "type": "object"
                },
                "headers": {
                    "properties": {
                        "Content-Length": {
                            "type": "string"
                        },
                        "Content-Type": {
                            "type": "string"
                        },
                        "Date": {
                            "type": "string"
                        },
                        "Request-Context": {
                            "type": "string"
                        },
                        "Transfer-Encoding": {
                            "type": "string"
                        },
                        "Vary": {
                            "type": "string"
                        }
                    },
                    "type": "object"
                },
                "statusCode": {
                    "type": "integer"
                }
            },
            "type": "object"
        }
    },
    "runAfter": {
        "Generate_SAS_Token": [
            "Succeeded"
        ]
    },
    "type": "ParseJson"
},
```
{{< /ide >}}<br>

Here is the string I used to generate the fully signed URL:

{{< ide title="Calling the third-part API" lang="JSON" >}}
```json {linenos=true}
"Trigger_the_external_API": {
    "inputs": {
        "body": {
            "blob": "@{variables('dateTime')}.somefiletype",
            "container": "@{parameters('saBlobContainer')}",
            "storageAccountSasUri": "https://@{parameters('saAccountName')}.blob.core.windows.net/?@{body('Parse_JSON_(SAS)')?['body']?['sasToken']}"
        },
        "headers": {
            "Authorization": "Bearer @{body('Parse_JSON_(AuthToken)')?['access_token']}",
            "Content-Type": "application/json"
        },
        "method": "POST",
        "uri": "<some URL for an external endpoint>"
    },
    "runAfter": {
        "Parse_JSON_(SAS)": [
            "Succeeded"
        ]
    },
},
```
{{< /ide >}}<br>

## Conclusion

What started as a "straightforward five-minute job" turned into an insightful journey through Azure's intricacies. While the Azure Blob connector's built-in "Create SAS URI by path (V2)" action seemed promising initially, it fell short of providing the specific SAS token required by the external service. This challenge led us to explore alternative solutions, ultimately landing on a robust and flexible approach using an Azure Function App.

By leveraging PowerShell within an Azure Function, we created a custom solution that generates the exact SAS token needed, complete with the required 'Blob' service access. This approach not only solved our immediate problem but also provided several advantages:

1. Flexibility: The function can be easily modified to accommodate different SAS token requirements in the future.
2. Security: By using Azure Key Vault in conjunction with the Logic App, we maintained secure storage and access to sensitive information like storage account keys.
3. Reusability: The function can be called from various Logic Apps or other Azure services, making it a versatile tool in your Azure toolkit.
4. Scalability: Being serverless, the Function App can handle varying loads without manual intervention.

This solution demonstrates the power of combining different Azure services to overcome limitations and create tailored solutions.  Remember, when working with Azure or any complex system, what seems like a simple task can often lead to valuable learning experiences and innovative solutions. Embrace these challenges as opportunities to deepen your understanding and expand your Azure expertise.

As you implement this solution in your projects, consider documenting any additional hurdles you encounter and the solutions you devise. I hope you found this useful and also that appears high in your search results so don't have to spend lots of frustrating hours scratching your head like I did.
