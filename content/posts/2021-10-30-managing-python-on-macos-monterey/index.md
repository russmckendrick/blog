---
title: "Managing Python on macOS Monterey"
author: "Russ McKendrick"
date: 2021-10-30
description: "Just installed macOS Monterey and Python on my MacBook Pro! Easy peasy with pyenv. Check out my experience!"
draft: false
showToc: true
cover:
    image: "cover.png"
    relative: true
tags:
    - macOS
    - Python
---

This week was not only the release of macOS Monterey, but it was also new Mac Book Pro week for a lot of people, including myself. Given that it was alot of effot to install Python on [macOS Big Sur](/2021/01/10/managing-python-on-macos-big-sur/) I was a little worried that it would take the same amount of effort.

As I was starting a with a clean macOS Monterey installation and had already installed [Homebew](https://brew.sh) I just needed to run the following command to install [pyenv](https://github.com/pyenv/pyenv):

{{< terminal title="Install pyenv" >}}
``` terminfo
brew install pyenv
```
{{< /terminal >}}

Once installed, I ran the following to download and compile Python 3.10.0:


{{< terminal title="Install Python 3.10.0 using pyenv" >}}
``` terminfo
pyenv install 3.10.0
pyenv global 3.10.0
pyenv version
```
{{< /terminal >}}

The last command should return something similar to the following output:

{{< terminal title="Output of the command" >}}
```
$ pyenv version
3.10.0 (set by /Users/russ.mckendrick/.pyenv/version)
```
{{< /terminal >}}

Now that Python is installed and we have set version 3.10.0 to the default Python install used by pyenv, we need to run the following command to ensure that our preferred version is used whenever we open a new terminal session.

{{< notice info >}}
**Please note:** The command below assumes that you are using [ZSH](https://zsh.sourceforge.io), if you are using a different shell please check the file path to your RC file is correct.
{{< /notice >}}

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

{{< terminal title="Output of the command" >}}
```
$ python --version
Python 3.10.0
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

{{< terminal title="Install Ansible" >}}
``` terminfo
pip install --user ansible
ansible --version
```
{{< /terminal >}}

As you can see from the output below, Ansible was isntalled and using the correct version of Python:

{{< terminal title="Output of the command" >}}
```
$ ansible --version
ansible [core 2.11.6]
  config file = None
  configured module search path = ['/Users/russ.mckendrick/.ansible/plugins/modules', '/usr/share/ansible/plugins/modules']
  ansible python module location = /Users/russ.mckendrick/.local/lib/python3.10/site-packages/ansible
  ansible collection location = /Users/russ.mckendrick/.ansible/collections:/usr/share/ansible/collections
  executable location = /Users/russ.mckendrick/.local/bin/ansible
  python version = 3.10.0 (default, Oct 26 2021, 20:43:52) [Clang 13.0.0 (clang-1300.0.29.3)]
  jinja version = 3.0.2
  libyaml = True
```
{{< /terminal >}}

This was a massive improvement on last years experience as it was far from smooth on day one, so props to pyenv and Homebrew teams 👍
