---
title: "Testing a New Posts"
author: "Russ Mckendrick"
date: 2021-08-14T19:20:47+01:00
description: ""
draft: true
showToc: true
cover:
    image: "cover.png"
    relative: true
tags:
  - "post"
---

# Gallery


{{< gallery >}}
   {{< img src="images/01.png" alt="bdrmm ‎- Bedroom" >}}
   {{< img src="images/02.png" alt="Doves ‎- The Universal Want" >}}
   {{< img src="images/03.png" alt="Pure Reason Revolution — Eupnea" >}}
   {{< img src="images/04.png" alt="Orb — Abolition Of The Royal Familia" >}}
   {{< img src="images/05.png" alt="The Smashing Pumpkins — Cyr" >}}
   {{< img src="images/06.png" alt="Andy Bell — The View From Halfway Down" >}}
   {{< img src="images/07.png" alt="Andy Bell — The View From Halfway Down" >}}
{{< /gallery >}}
# Terminal

{{< terminal title="This is just a test" >}}
``` yaml
  - stage: "runCheckov"
    displayName: "Checkov - Scan Terraform files"
    jobs:
      - job: "runCheckov"
        displayName: "Checkov > Pull, run and publish results of Checkov scan"
        steps:
          - bash: |
              docker pull bridgecrew/checkov
            workingDirectory: $(System.DefaultWorkingDirectory)
            displayName: "Pull > bridgecrew/checkov"
          - bash: |
              docker run \
                --volume $(pwd):/tf bridgecrew/checkov \
                --directory /tf \
                --output junitxml \
                --soft-fail > $(pwd)/CheckovReport.xml
            workingDirectory: $(System.DefaultWorkingDirectory)
            displayName: "Run > checkov"
          - task: PublishTestResults@2
            inputs:
              testRunTitle: "Checkov Results"
              failTaskOnFailedTests: true
              testResultsFormat: "JUnit"
              testResultsFiles: "CheckovReport.xml"
              searchFolder: "$(System.DefaultWorkingDirectory)"
            displayName: "Publish > Checkov scan results"
```
{{< /terminal >}}
# Some text

:anguished: :+1:

{{< notice info >}}
**This** is some info
{{< /notice >}}

{{< notice tip >}}
**This** is a tip
{{< /notice >}}

{{< notice note >}}
**This** is a note
{{< /notice >}}

{{< notice warning >}}
*Beware !** is a danger
{{< /notice >}}

# Pics
## testing the img shortcode

{{< img src="cover.png" alt="Screenshot of the Onion homepage" >}}
## testing the giphy shortcode

{{< giphy jqYbk3Vy6NO3C >}}