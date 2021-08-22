---
title: "Managing Python on macOS Big Sur"
author: "Russ Mckendrick"
date: 2021-01-10
description: ""
cover:
    image: "2021-01-10_managing-python-on-macos-big-sur.png" 
    relative: true
aliases:
    - "/managing-python-on-macos-big-sur-c120bfa34403"
tags:
    - Macos
    - Python

---

When Apple releases a new version of macOS it always takes a few months for everything to catchup, following my last blog post where I mentioned that I was [having problems installing Python on macOS Big Sur](https://www.mediaglasses.blog/2020/12/28/ansible-azure-and-macos-big-sur/)which meant that my preferred method of installing and managing Python using `pyenv`, which is [documented in this blog post](https://www.mediaglasses.blog/2019/12/29/upgrade-python-on-macos/), didn't work out of the box — and the workarounds suggested workarounds on GitHub made my shell really slow.

Luckily, I noticed that there was an update to both [Python](https://www.python.org/downloads/release/python-391/) and`pyenv` when I ran `brew update` today so decided to give `pyenv` another try, and it worked as expected.

First I manually installed some prerequisites suggested on various GitHub issues, just to be on the safe side:

{{< terminal title="Install some prerequisites" >}}
``` terminfo
brew install zlib sqlite bzip2 libiconv libzip
```
{{< /terminal >}}

Next up you can either install or upgrade to the latest version of `pyenv`, which during writing is `1.2.22`:

{{< terminal title="Install pyenv" >}}
``` terminfo
brew install pyenv
```
{{< /terminal >}}

If like me, you need to upgrade, then you can run:

{{< terminal title="Upgrade pyenv" >}}
``` terminfo
brew upgrade pyenv
```
{{< /terminal >}}

Once the latest version `pyenv` has been installed, run the following commands to install the latest stable version of Python, which is currently 3.9.1:

{{< terminal title="Install Python 3.9.1 using pyenv" >}}
``` terminfo
pyenv install 3.9.1
pyenv global 3.9.1
pyenv version
```
{{< /terminal >}}

Once installed, run the following command to make sure that the `pyenv` managed version of Python is picked up:

{{% alert theme="info"%}}**Update: 11/06/2021;** the command below has been updated to include a change to how the "pyenv init" command works.{{% /alert %}}

{{< terminal title="Make sure the pyenv version is used" >}}
``` terminfo
echo -e $'if command -v pyenv 1>/dev/null 2>&1; then\\n  export PYENV_ROOT="$HOME/.pyenv"\\n  export PATH="$PYENV_ROOT/bin:$PATH"\\n  eval "$(pyenv init --path)"\\n  eval "$(pyenv init -)"\\nfi' >> ~/.zshrc
```
{{< /terminal >}}

Open a new shell and run:

{{< terminal title="Check the python version" >}}
``` terminfo
python --version
which python
```
{{< /terminal >}}

This should return something like the following:

{{< terminal title="Output of the commands" >}}
```
$ python --version
Python 3.9.1
$ which python
/Users/russ.mckendrick/.pyenv/shims/python
```
{{< /terminal >}}

The final step is to make sure that `pip` is up-to-date, to do this run:

{{< terminal title="Update pip" >}}
``` terminfo
pip install --upgrade pip
```
{{< /terminal >}}

This fixed a few issues I had when I ran:

{{< terminal title="Install Ansible" >}}
``` terminfo
pip install --user ansible
```
{{< /terminal >}}

Which meant that I didn't need to use [my custom container anymore](/2020/12/28/ansible-azure-and-macos-big-sur/).