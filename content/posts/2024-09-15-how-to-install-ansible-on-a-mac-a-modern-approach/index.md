---
title: "How to Install Ansible on a Mac: A Modern Approach"
author: "Russ McKendrick"
date: 2024-09-15T11:15:29+01:00
description: "A guide to installing and managing Ansible on macOS using Conda, with tips for handling collections and dependencies."
draft: true
showToc: true
cover:
    image: "cover.png"
    relative: true
    alt: "Ansible logo on a Mac background"
tags:
  - "ansible"
  - "macos"
  - "devops"
  - "python"
keywords:
  - "Ansible"
  - "Install Ansible Mac"
  - "macOS"
  - "Apple Silicon"
  - "Conda"
  - "Python"
---

As the DevOps landscape evolves, so do our methods for managing tools like Ansible. This post outlines my current preferred approach to installing and managing Ansible on macOS.

## The Traditional Homebrew Approach

For years, many macOS users, including myself, relied on Homebrew to install and maintain Ansible. The process was straightforward:

{{< terminal title="Installing Ansible using Homebrew" >}}
```text
brew install ansible
```
{{< /terminal >}}

While this method effectively managed the core Ansible installation, it became problematic as Ansible's ecosystem grew more complex.

### The Dependency Dilemma

As more collections moved away from the core Ansible distribution, managing prerequisites for various collections became increasingly challenging. Some collections had specific dependency requirements, leading to potential conflicts and a maintenance headache - especially when doing other Python development which have the same dependency requirements but you need to use other versions than those defined by the `requirements.txt` which ships with a collection.

## A Modern Solution: Conda for Ansible Management

Having experienced the pitfalls of Python dependency management, I've transitioned to using Conda for Ansible. This approach allows for a dedicated, isolated Ansible environment, mitigating the risks of "dependency hell."

### Step-by-Step Installation Process

1. **Create and activate a Conda environment for Ansible:**

{{< terminal title="Setting up Ansible environment with Conda" >}}
```text
conda create -n ansible python=3.12
conda activate ansible
```
{{< /terminal >}}

2. **Install Ansible within the environment:**

{{< terminal title="Installing Ansible in Conda environment" >}}
```text
python -m pip install ansible
```
{{< /terminal >}}

### Managing Ansible Collections

Once Ansible is installed, you can add collections and their dependencies using Ansible Galaxy and pip.

{{< notice tip >}}
Always ensure you're in your Ansible Conda environment by running `conda activate ansible` before executing the following commands.
{{< /notice >}}

For example, to install the Azure Collection and its dependencies:

{{< terminal title="Adding the Azure collection" >}}
```text
ansible-galaxy collection install azure.azcollection
python -m pip install -r ~/.ansible/collections/ansible_collections/azure/azcollection/requirements.txt
```
{{< /terminal >}}

### Upgrading Ansible and Collections

Keeping Ansible and its collections up-to-date is crucial. Here's how to do it:

1. **Upgrade Ansible:**

{{< terminal title="Upgrading Ansible" >}}
```text
python -m pip install ansible --upgrade
```
{{< /terminal >}}

2. **Upgrade a specific collection (e.g., Azure):**

{{< terminal title="Upgrading Azure Collection" >}}
```text
ansible-galaxy collection install azure.azcollection --upgrade
python -m pip install -r ~/.ansible/collections/ansible_collections/azure/azcollection/requirements.txt
```
{{< /terminal >}}

## Summary and Best Practices

Adopting Conda for Ansible management on macOS offers several advantages:

1. **Isolation**: Your Ansible setup exists in its own environment, preventing conflicts with other Python applications.
2. **Flexibility**: Easily manage different versions of Ansible for various projects.
3. **Dependency Control**: Better handle complex dependencies required by different Ansible collections.
4. **Consistency**: Ensure a consistent environment across different machines or team members.

To make the most of this setup:

- Regularly update both Ansible and its collections to benefit from the latest features and security patches.
- Explore [Conda's environment export](https://docs.conda.io/projects/conda/en/latest/user-guide/tasks/manage-environments.html#exporting-the-environment-yml-file) features to share your exact setup with team members.

By embracing this modern approach to Ansible management on macOS, you'll find yourself with a more maintainable, flexible, and robust Ansible environment. Happy automating!