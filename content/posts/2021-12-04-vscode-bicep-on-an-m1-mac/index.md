---
title: "VSCode + Bicep on an M1 Mac"
author: "Russ McKendrick"
date: 2021-12-04T17:26:55Z
description: ""
draft: false
showToc: true
cover:
    image: "cover.png"
    relative: true
tags:
  - "macos"
  - "arm64"
  - "azure"
  - "bicep"
---

Probably a little late to the party with this one, but I have recently upgraded to an M1 Pro MacBook Pro, for the most part, the problems with moving to arm64 are not as bad as I thought - most are annoying little things.

However, the biggest one came when I decided to take a serious look at Bicep.

After installing the [Bicep VSCode extension ](https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-bicep)and opening a test Bicep file, I was greeted with the following message ...

{{< img src="images/01.png" alt="The error" >}}

As you can see, there are complaints about installing the .Net 5.0 runtime; this makes sense as there is no arm64 .Net 5.0 for macOS, .Net 6.0 will be fully supported - however, Bicep will not offer support for this until its 0.5 release, which is due at some point in January 2022 ...

{{< center >}}{{< twitter 1461124007441305601 >}}{{< /center >}}

... so, how do we work around this?

Apple provides [Rosetta 2](https://support.apple.com/en-gb/HT211861) to help you run Intel (or x86_64) binaries and applications on your M1 powered Mac - as I am a [Homebrew](https://brew.sh/) user, I thought it would be good to install the x86_64 version of .Net 5.0 using this.

To do this, you will need to install the x86_64 of Homebrew itself which you can do by running the command below ...

{{< terminal title="Install the x86_64 version of Homebrew" >}}
``` terminfo
arch -x86_64 /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install.sh)"
```
{{< /terminal >}}

.. so far, so good - however, you now have two versions of Homebrew installed - this could get messy and confusing.

Open your `~/.zshrc` file and adding the following ...

{{< terminal title="Add the Brow alias" >}}
```
alias brow='arch --x86_64 /usr/local/Homebrew/bin/brew'
path=('/opt/homebrew/bin' $path)
export PATH
```
{{< /terminal >}}

When you open a fresh terminal session, you will have an alias called `brow` which runs the x86_64 version of Homebrew which is found at `/usr/local/Homebrew/bin/brew` and keep the `brew` command as the arm64 version as `/opt/homebrew/bin/brew`.

Once installed, you can then invoke the x86_64 version of Homebrew and install .Net 5.0 using this command ...

{{< terminal title="Install and unlink .Net 5.0" >}}
``` terminfo
brow install dotnet
brow unlink dotnet
```
{{< /terminal >}}

... you may have noticed that we have installed >net and then immediately unlinked it. We did this because we are now going to install the arm64 version of .Net 6.0, to do this run the following ...

{{< terminal title="Install .Net 6.0" >}}
``` terminfo
brew install --cask dotnet
```
{{< /terminal >}}

So now we have two versions of .Net installed, we can test this by running the following command ...

{{< terminal title="Testing .Net 6.0" >}}
``` terminfo
dotnet --list-runtimes
Microsoft.NETCore.App 6.0.0 [/usr/local/share/dotnet/shared/Microsoft.NETCore.App]
```
{{< /terminal >}}

{{< terminal title="Testing .Net 5.0" >}}
``` terminfo
/usr/local/opt/dotnet/libexec/dotnet --list-runtimes
Microsoft.AspNetCore.App 5.0.10 [/usr/local/Cellar/dotnet/5.0.207/libexec/shared/Microsoft.AspNetCore.App]
```
{{< /terminal >}}

As you can see from the output above, we are getting the expected versions returned, net we need to tell the Bicep VSCode extension to use the right version of .Net; to do this, enter the following in your settings ...

{{< terminal title="VSCode Bicep Settings" >}}
``` json
"dotnetAcquisitionExtension.existingDotnetPath": [
        {
            "extensionId": "ms-azuretools.vscode-bicep",
            "path": "/usr/local/opt/dotnet/libexec/dotnet"
        }
    ],
```
{{< /terminal >}}

... you can get to the settings page by press **Command + Shift + P** then searching for settings ...

{{< img src="images/02.png" alt="The settings" >}}

... once the settings are in place, close your VSCode and reopen your Bicep file, and hey presto, the error is gone. The Bicep Language server has launched as expected, and you can start to add resources etc.

{{< img src="images/03.png" alt="All working" >}}

So what happens once Bicep update to version 0.5, which introduces support for .Net 6.0? Just delete the setting block we added and restart VSCode - this will remove the reference to the x86_64 version of .Net 5.0, and it will default to the arm64 version of .Net 6.0.
