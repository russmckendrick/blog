---
title: "Effortless Python environment management on macOS with Conda"
author: "Russ McKendrick"
date: 2024-04-06T07:30:00+01:00
description: "Learn how to efficiently manage Python environments on your MacBook Pro using Conda. This comprehensive guide covers installation, creating and activating environments, installing packages, and best practices for streamlining your Python development workflow."
draft: false
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

As mentioned in a [previous post](/2024/03/29/running-llms-locally-with-ollama/), I recently finished writing the second edition of Learn Ansible. This had me using Python a lot, and my one key takeaway is that managing Python has become a massive chore. Now, with the book complete, I thought I would strip back on my machine, start from scratch - or as close to clean as I could get - and develop a cleaner, more streamlined way of managing Python on my local machine.

I have tried a few methods in the past—see these posts from [December 2019](/2019/12/29/upgrade-python-on-macos/), [January 2021](/2021/01/10/managing-python-on-macos-big-sur/) and [October 2021](/2021/10/30/managing-python-on-macos-monterey/). While these worked, they quickly became a chore to maintain due to all the different things that were trying to use Python. For example, there is the version of Python built into macOS, Homebrew tries to maintain its own Python installations for packages it downloads, and then there is my stuff on top.

## Introducing Conda

I did a little research and chose Conda - which can be found [here](https://www.conda.io/). While we will cover the Conda command in this post - I am using [Miniconda](https://docs.anaconda.com/free/miniconda/).

Miniconda is described as the following:

> Miniconda is a free minimal installer for conda. It is a small bootstrap version of Anaconda that includes only conda, Python, the packages they both depend on, and a small number of other useful packages (like pip, zlib, and a few others).

So, as I wanted to keep things as simple as possible, I used Miniconda rather than the more full-fat Anaconda.

### Installing and configuring Miniconda on macOS

The installation guide for Miniconda is simple if you are using [Homebrew](https://brew.sh/), you just need to run the following command:

{{< terminal title="Installing Miniconda" >}}
```
brew install miniconda
```
{{< /terminal >}}

Once installed, we must ensure it is loaded when we open our terminal. To add the right lines to `~/.zshrc` run the following command:

{{< terminal title="Update the ~/.zshrc file" >}}
```
conda init zsh
```
{{< /terminal >}}

This adds the following code to the end of `~/.zshrc`:

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

I have already [updated my dotfiles](/2024/04/02/updating-my-dotfiles/) to include the above and also to use the [Powerline10k theme](https://github.com/romkatv/powerlevel10k) so it shows the Conda environment that is currently selected in my terminal:

{{< gallery match="images/my-terminal-prompt.png" sortOrder="assc" rowHeight="200" margins="5" thumbnailResizeOptions="600x600 q90 Lanczos" showExif=true previewType="blur" embedPreview=true loadJQuery=true >}}<br>

As you can see from the prompt above, where it shows ****base**** on the right-hand side - with ****base**** being the default environment.

## Adding an Ansible environment

In this example, I will create an environment for running Ansible; let's start by creating the environment itself.

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

### Activating the environment

With the dedicated Ansible environment created, we can activate using the following command: 

{{< terminal title="Activating the Ansible environment" >}}
```
conda activate ansible
```
{{< /terminal >}}

We can now check the path of the `python` binary by running `which python`:

{{< terminal title="Checking which python is being used" >}}
```
which python
/opt/homebrew/Caskroom/miniconda/base/envs/ansible/bin/python
```
{{< /terminal >}}

As you can see, it is using the `python` binary within our environment, which means that Ansible can now be installed along with some collections:

{{< terminal title="Installing Ansible and some collections" >}}
```
python -m pip install ansible
ansible-galaxy collection install azure.azcollection
python -m pip install -r ~/.ansible/collections/ansible_collections/azure/azcollection/requirements-azure.txt
```
{{< /terminal >}}

The screen below shows an example of what the terminal looks like when switched to the Ansible environment:

{{< gallery match="images/the-ansbile-env.png" sortOrder="assc" rowHeight="200" margins="5" thumbnailResizeOptions="600x600 q90 Lanczos" showExif=true previewType="blur" embedPreview=true loadJQuery=false >}}<br>

So far so good !!!

## Digging Deeper

Here are some notes on package management and virtual environment management. 

### Pip vs Conda

As well as being a Python environment manager, Conda also provides it own package management, so rather that running pip using 

{{< terminal title="Installing Ansible using pip" >}}
```
python -m pip install ansible
```
{{< /terminal >}}

I could have run the following command:

{{< terminal title="The Conda install command" >}}
```
conda install conda-forge::ansible
```
{{< /terminal >}}

This would install Ansible from the main [Anaconda](https://anaconda.org/) site, which hosts its own files at  [conda-forge/ansible](https://anaconda.org/conda-forge/ansible) for Ansible, if I had taken this route the installation would have looked like the following:

{{< terminal title="Going through the installation" >}}
```
Channels:
 - defaults
 - conda-forge
Platform: osx-arm64
Collecting package metadata (repodata.json): done
Solving environment: done

## Package Plan ##

  environment location: /opt/homebrew/Caskroom/miniconda/base/envs/ansible

  added / updated specs:
    - conda-forge::ansible

The following packages will be downloaded:

    package                    |            build
    ---------------------------|-----------------
    ansible-9.4.0              |     pyh707e725_0        20.7 MB  conda-forge
    ansible-core-2.16.5        |     pyh707e725_0         1.3 MB  conda-forge
    cryptography-42.0.5        |  py312hd4332d6_0         1.4 MB
    jinja2-3.1.3               |  py312hca03da5_0         327 KB
    markupsafe-2.1.3           |  py312h80987f9_0          24 KB
    packaging-23.2             |  py312hca03da5_0         169 KB
    pyyaml-6.0.1               |  py312h80987f9_0         172 KB
    resolvelib-0.8.1           |  py312hca03da5_0          30 KB
    yaml-0.2.5                 |       h1a28f6b_0          71 KB
    ------------------------------------------------------------
                                           Total:        24.1 MB

The following NEW packages will be INSTALLED:

  ansible            conda-forge/noarch::ansible-9.4.0-pyh707e725_0
  ansible-core       conda-forge/noarch::ansible-core-2.16.5-pyh707e725_0
  cffi               pkgs/main/osx-arm64::cffi-1.16.0-py312h80987f9_0
  cryptography       pkgs/main/osx-arm64::cryptography-42.0.5-py312hd4332d6_0
  jinja2             pkgs/main/osx-arm64::jinja2-3.1.3-py312hca03da5_0
  markupsafe         pkgs/main/osx-arm64::markupsafe-2.1.3-py312h80987f9_0
  packaging          pkgs/main/osx-arm64::packaging-23.2-py312hca03da5_0
  pycparser          pkgs/main/noarch::pycparser-2.21-pyhd3eb1b0_0
  pyyaml             pkgs/main/osx-arm64::pyyaml-6.0.1-py312h80987f9_0
  resolvelib         pkgs/main/osx-arm64::resolvelib-0.8.1-py312hca03da5_0
  yaml               pkgs/main/osx-arm64::yaml-0.2.5-h1a28f6b_0

Proceed ([y]/n)? n

CondaSystemExit: Exiting.

```
{{< /terminal >}}

However, in my case, as I wanted to keep things simple - I am sticking to what I know and will use `pip`.

I did, however, add the following `alias` for `pip` in my [dotfile](https://github.com/russmckendrick/dotfiles) to call `python -m pip` each time I run the `pip` command:

```
alias pip='python -m pip'
```

This means that if I run ￼`pip install ansible`￼ , the command ￼`python -m pip install ansible`￼ would be run, so I can be sure that I am not calling the `pip` executable from some other random place. 

### Installing a different Python version

Now, not every piece of code supports the latest and greatest version of Python. Luckily, as you might have already guessed, we can define what version of Python to install when you create your virtual environment using Conda.

{{< terminal title="Installing Python 3.10" >}}
```
conda create -n test python=3.10
```
{{< /terminal >}}

As you can see, we are requesting that Python 3.10 be installed instead of Python 3.12, which is what our other virtual environments use.

{{< terminal title="The output of installing Python 3.10" >}}
```
Channels:
 - defaults
Platform: osx-arm64
Collecting package metadata (repodata.json): done
Solving environment: done

## Package Plan ##

  environment location: /opt/homebrew/Caskroom/miniconda/base/envs/test

  added / updated specs:
    - python=3.10

The following packages will be downloaded:

    package                    |            build
    ---------------------------|-----------------
    pip-23.3.1                 |  py310hca03da5_0         2.7 MB
    python-3.10.14             |       hb885b13_0        13.0 MB
    setuptools-68.2.2          |  py310hca03da5_0         942 KB
    wheel-0.41.2               |  py310hca03da5_0         107 KB
    ------------------------------------------------------------
                                           Total:        16.7 MB

The following NEW packages will be INSTALLED:

  bzip2              pkgs/main/osx-arm64::bzip2-1.0.8-h80987f9_5
  ca-certificates    pkgs/main/osx-arm64::ca-certificates-2024.3.11-hca03da5_0
  libffi             pkgs/main/osx-arm64::libffi-3.4.4-hca03da5_0
  ncurses            pkgs/main/osx-arm64::ncurses-6.4-h313beb8_0
  openssl            pkgs/main/osx-arm64::openssl-3.0.13-h1a28f6b_0
  pip                pkgs/main/osx-arm64::pip-23.3.1-py310hca03da5_0
  python             pkgs/main/osx-arm64::python-3.10.14-hb885b13_0
  readline           pkgs/main/osx-arm64::readline-8.2-h1a28f6b_0
  setuptools         pkgs/main/osx-arm64::setuptools-68.2.2-py310hca03da5_0
  sqlite             pkgs/main/osx-arm64::sqlite-3.41.2-h80987f9_0
  tk                 pkgs/main/osx-arm64::tk-8.6.12-hb8d0fd4_0
  tzdata             pkgs/main/noarch::tzdata-2024a-h04d1e81_0
  wheel              pkgs/main/osx-arm64::wheel-0.41.2-py310hca03da5_0
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
#     $ conda activate test
#
# To deactivate an active environment, use
#
#     $ conda deactivate
```
{{< /terminal >}}

As you can see from the screen below, switching to the new virtual environment loads the older version:

{{< gallery match="images/different-python-versions.png" sortOrder="assc" rowHeight="200" margins="5" thumbnailResizeOptions="600x600 q90 Lanczos" showExif=true previewType="blur" embedPreview=true loadJQuery=false >}}<br>

### Managing Virtual Environments

You can list all of your virtual environments using the command below:

{{< terminal title="Listing all envs" >}}
```
conda env list
```
{{< /terminal >}}

This will return something like the following:

{{< terminal title="The output of conda env list" >}}
```
# conda environments:
#
base                  *  /opt/homebrew/Caskroom/miniconda/base
ansible                  /opt/homebrew/Caskroom/miniconda/base/envs/ansible
discogs                  /opt/homebrew/Caskroom/miniconda/base/envs/discogs
test                     /opt/homebrew/Caskroom/miniconda/base/envs/test
```
{{< /terminal >}}

Now let's remove the test virtual environment:

{{< terminal title="Removing the test env" >}}
```
conda remove -n test --all
```
{{< /terminal >}}

This will nuke everything to do with the test virtual environment:

{{< terminal title="The output of conda remove -n test --all" >}}
```
Remove all packages in environment /opt/homebrew/Caskroom/miniconda/base/envs/test:

## Package Plan ##

  environment location: /opt/homebrew/Caskroom/miniconda/base/envs/test

The following packages will be REMOVED:

  bzip2-1.0.8-h80987f9_5
  ca-certificates-2024.3.11-hca03da5_0
  libffi-3.4.4-hca03da5_0
  ncurses-6.4-h313beb8_0
  openssl-3.0.13-h1a28f6b_0
  pip-23.3.1-py310hca03da5_0
  python-3.10.14-hb885b13_0
  readline-8.2-h1a28f6b_0
  setuptools-68.2.2-py310hca03da5_0
  sqlite-3.41.2-h80987f9_0
  tk-8.6.12-hb8d0fd4_0
  tzdata-2024a-h04d1e81_0
  wheel-0.41.2-py310hca03da5_0
  xz-5.4.6-h80987f9_0
  zlib-1.2.13-h5a0b063_0

Proceed ([y]/n)? y

Preparing transaction: done
Verifying transaction: done
Executing transaction: done
Everything found within the environment (/opt/homebrew/Caskroom/miniconda/base/envs/test), including any conda environment configurations and any non-conda files, will be deleted. Do you wish to continue?
 (y/[n])? y
```
{{< /terminal >}}

### Updating packages

Even if, like me, you use `pip` there are still some packages managed by Conda in your Virtual environment, you can update them by switching to the virtual environment you want to update and then run:

{{< terminal title="Updating the Conda managed packages in your env" >}}
```
conda update --all
```
{{< /terminal >}}

## Conclusion

Managing Python environments can be a daunting task, especially when dealing with multiple projects and dependencies. However, by leveraging the power of Conda and Miniconda, you can streamline your Python environment management process and ensure a clean, efficient setup on your local machine.

With Conda, you can easily create isolated Python environments for different projects, specifying the exact Python version and package requirements. This allows you to maintain separate environments for each project, avoiding conflicts and ensuring compatibility.

By following the steps outlined in this post, you can install and configure Miniconda on your macOS system, create dedicated environments for tools like Ansible, and manage packages using either Conda's package management or the familiar `pip` command.

Additionally, Conda provides flexibility in installing different Python versions within each environment, enabling you to work with projects that require specific Python versions seamlessly.

With the ability to list, remove, and update virtual environments and packages, Conda offers a comprehensive solution for Python environment management. By incorporating Conda into your workflow, you can enhance your productivity, maintain a clean development setup, and efficiently manage your Python projects.

So, whether you're a beginner or an experienced Python developer, embracing Conda for Python environment management can greatly simplify your development process and help you focus on writing awesome code!
