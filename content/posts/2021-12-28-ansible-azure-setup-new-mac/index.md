---
title: "Ansible setup with Azure on a new Mac"
author: "Russ McKendrick"
date: 2021-12-28T13:38:25Z
description: "Learn how to set up Ansible with Azure on a new Mac, addressing common issues with cryptography and module dependencies."
draft: false
showToc: true
cover:
    image: "cover.png"
    relative: true
    alt: "Learn how to set up Ansible with Azure on a new Mac, addressing common issues with cryptography and module dependencies."
tags:
  - "macos"
  - "azure"
  - "ansible"
---

Following on from upgrading my Macs to all M1-based ones, I get around to finally needing to use Ansible; typically, I would install Python using [PyEnv](/2021/10/30/managing-python-on-macos-monterey/) and then run the following ...

{{< terminal title="It should just work?!?!" >}}
``` terminfo
pip install --user ansible
pip install --user -r https://github.com/ansible-collections/azure/blob/dev/requirements-azure.txt
ansible-galaxy collection install azure.azcollection
```
{{< /terminal >}}

... and away we go, but this time I came across a few problems.

The first was the following error when installing the requirements using the remote `requirements-azure.txt` file:

{{< notice warning >}}
Failed to build cryptography
{{< /notice >}}

This was an easy one to fix; I just needed to run the following to get enough of the pre-requisites installed ...

{{< terminal title="Installation openssl & rust" >}}
``` terminfo
brew install openssl@1.1 rust
```
{{< /terminal >}}

Once installed, I then needed to update the `pip` command I was using, so it looks like this:

{{< terminal title="Installation openssl & rust" >}}
``` terminfo
env LDFLAGS="-L$(brew --prefix openssl@1.1)/lib" CFLAGS="-I$(brew --prefix openssl@1.1)/include" pip install --user -r https://github.com/ansible-collections/azure/blob/dev/requirements-azure.txt
```
{{< /terminal >}}

Hey presto, cryptography built and installed OK. However, things changed when running Ansible; I got the following error ...

{{< notice warning >}}
ModuleNotFoundError: No module named 'azure.mgmt.monitor.version'
{{< /notice >}}

Erm, how could that be? Everything was installed as expected with no errors after installing the correct version of OpenSSL and Rust. It turns out that my usual way of installing Ansible isn't actually the recommended way, so let's look at how I should have installed it using the following commands ...

{{< terminal title="It should just work, take two" >}}
``` terminfo
brew install openssl@1.1 rust
env LDFLAGS="-L$(brew --prefix openssl@1.1)/lib" CFLAGS="-I$(brew --prefix openssl@1.1)/include" pip install --user cryptography
pip install --user ansible
ansible-galaxy collection install azure.azcollection
pip install --user -r ~/.ansible/collections/ansible_collections/azure/azcollection/requirements-azure.txt
```
{{< /terminal >}}

As you can see, first of all by installing the `cryptography` module and its pre-requisites, then install Ansible and then the Azure collection. Once the Azure collection is installed, use the `requirements-azure.txt` which ships with the collection rather than remotely using the one straight from GitHub - this is because the one in GitHub is way ahead of the one which is the current release of the Azure collection on [Ansible Galaxy](https://galaxy.ansible.com).

While things "may work" if there is active development going on which has not made its way into the Ansible Galaxy release, then you may have all sorts of compatibility issues, just like I did.

Hopefully, this saves someone scratching their head for hours as I did as everything looked to have been correct, and the `azure.mgmt.monitor` module was 100% installed, just not the version which the collection was expecting.