---
title: "Effortless Python environment management on macOS with Conda"
author: "Russ McKendrick"
date: 2024-04-06T07:30:00+01:00
description: "Learn how to efficiently manage Python environments on your MacBook Pro using Conda. This comprehensive guide covers installation, creating and activating environments, installing packages, and best practices for streamlining your Python development workflow."
draft: true
showToc: true
cover:
    image: "cover.png"
    relative: true
tags:
  - "macOS"
  - "Python"
  - "Ansible"
  - "Code"
---

As mentioned in a [previous post](/2024/03/29/running-llms-locally-with-ollama/), I recently finished writing the second edition of Learn Ansible. This had me using Python a lot, and my one key takeaway is that managing Python has become a massive chore. Now, with the book complete, I thought I would strip back on my machine and start from scratch—or as close to clean as I could get—and come up with a cleaner, more streamlined way of managing Python on my local machine.

I have tried a few methods in the past, see these posts from [December 2019](/2019/12/29/upgrade-python-on-macos/), [January 2021](/2021/01/10/managing-python-on-macos-big-sur/) and [October 2021](/2021/10/30/managing-python-on-macos-monterey/) - while these worked it quickly became a chore to maintain due to all the different things that were trying to use Python - for example there is the version of Python built into macOS, Homebrew tries to maintain its own Python installations for packages it downloads and then there my stuff on top.

## Introducing Conda

I did a little research and decided to choose Conda - which can be found [here](https://www.conda.io/). While we will be covering the Conda command in this post - I am actually using [Miniconda](https://docs.anaconda.com/free/miniconda/).

Miniconda is described as the following:

> Miniconda is a free minimal installer for conda. It is a small bootstrap version of Anaconda that includes only conda, Python, the packages they both depend on, and a small number of other useful packages (like pip, zlib, and a few others).

As I wanted to keep things as simple as possible I thought I would be best to use that - rather than the more full fat Anaconda.

### Installing and configuring Miniconda on macOS

Installing Miniconda is simple using [Homebrew](https://brew.sh/), you just need to run the following command:

{{< terminal title="Installing Miniconda" >}}
```
brew install miniconda
```
{{< /terminal >}}

Once installed we need to make sure that is is loaded when we open our terminal, to add the right lines to `~/.zshrc` run the following command:

{{< terminal title="Update the ~/.zshrc file" >}}
```
conda init zsh
```
{{< /terminal >}}

{{< terminal title="Contents appended to ~/.zshrc" >}}
```
# >>> conda initialize >>>
# !! Contents within this block are managed by 'conda init' !!
__conda_setup="$('/opt/homebrew/Caskroom/miniconda/base/bin/conda' 'shell.zsh' 'hook' 2> /dev/null)"
if [ $? -eq 0 ]; then
    eval "$__conda_setup"
else
    if [ -f "/opt/homebrew/Caskroom/miniconda/base/etc/profile.d/conda.sh" ]; then
        . "/opt/homebrew/Caskroom/miniconda/base/etc/profile.d/conda.sh"
    else
        export PATH="/opt/homebrew/Caskroom/miniconda/base/bin:$PATH"
    fi
fi
unset __conda_setup
# <<< conda initialize
```
{{< /terminal >}}

I have already [updated my dotfiles](2024/04/02/updating-my-dotfiles/) to include the above and also to use the [Powerline10k theme](https://github.com/romkatv/powerlevel10k) so it shows the Conda environment that is currently selected in my terminal:

{{< img src="images/my-terminal-prompt.png" alt="My terminal prompt" >}}

As you can see from the prompt above, where it shows **base** on the right-hand side - with **base** being the default environment.

## Adding an Ansible environment

In this example, I am going to create an environment for running Ansible, let's start by creating the environment itself.

### Creating the environment

To add an environment for running just Ansible, I ran the following command:

{{< terminal title="Creating the Ansible environment" >}}
```
conda create -n ansible python=3.12
```
{{< /terminal >}}

The command gave me the following output:

{{< terminal title="Output of the create command" >}}
```
Channels:
 - defaults
Platform: osx-arm64
Collecting package metadata (repodata.json): done
Solving environment: done

## Package Plan ##

  environment location: /opt/homebrew/Caskroom/miniconda/base/envs/ansible

  added / updated specs:
    - python=3.12


The following packages will be downloaded:

    package                    |            build
    ---------------------------|-----------------
    bzip2-1.0.8                |       h80987f9_5         129 KB
    ca-certificates-2024.3.11  |       hca03da5_0         128 KB
    python-3.12.2              |       h99e199e_0        14.0 MB
    tzdata-2024a               |       h04d1e81_0         116 KB
    xz-5.4.6                   |       h80987f9_0         372 KB
    ------------------------------------------------------------
                                           Total:        14.8 MB

The following NEW packages will be INSTALLED:

  bzip2              pkgs/main/osx-arm64::bzip2-1.0.8-h80987f9_5
  ca-certificates    pkgs/main/osx-arm64::ca-certificates-2024.3.11-hca03da5_0
  expat              pkgs/main/osx-arm64::expat-2.5.0-h313beb8_0
  libcxx             pkgs/main/osx-arm64::libcxx-14.0.6-h848a8c0_0
  libffi             pkgs/main/osx-arm64::libffi-3.4.4-hca03da5_0
  ncurses            pkgs/main/osx-arm64::ncurses-6.4-h313beb8_0
  openssl            pkgs/main/osx-arm64::openssl-3.0.13-h1a28f6b_0
  pip                pkgs/main/osx-arm64::pip-23.3.1-py312hca03da5_0
  python             pkgs/main/osx-arm64::python-3.12.2-h99e199e_0
  readline           pkgs/main/osx-arm64::readline-8.2-h1a28f6b_0
  setuptools         pkgs/main/osx-arm64::setuptools-68.2.2-py312hca03da5_0
  sqlite             pkgs/main/osx-arm64::sqlite-3.41.2-h80987f9_0
  tk                 pkgs/main/osx-arm64::tk-8.6.12-hb8d0fd4_0
  tzdata             pkgs/main/noarch::tzdata-2024a-h04d1e81_0
  wheel              pkgs/main/osx-arm64::wheel-0.41.2-py312hca03da5_0
  xz                 pkgs/main/osx-arm64::xz-5.4.6-h80987f9_0
  zlib               pkgs/main/osx-arm64::zlib-1.2.13-h5a0b063_0


Proceed ([y]/n)? y

Downloading and Extracting Packages:

Preparing transaction: done
Verifying transaction: done
Executing transaction: done
#
# To activate this environment, use
#
#     $ conda activate ansible
#
# To deactivate an active environment, use
#
#     $ conda deactivate
```
{{< /terminal >}}

