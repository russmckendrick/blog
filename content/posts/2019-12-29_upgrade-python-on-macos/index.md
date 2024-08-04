---
title: "Upgrade Python on MacOS"
description: "Upgrade to Python 3 on macOS using pyenv for easy installation and maintenance of different Python versions."
author: "Russ Mckendrick"
date: "2019-12-29T16:21:00+01:00"
tags:
  - "macOS"
  - "Python"
cover:
  image: "/img/2019-12-29_upgrade-python-on-macos_0.jpeg"
  alt: "Upgrade to Python 3 on macOS using pyenv for easy installation and maintenance of different Python versions."
aliases:
  - "/upgrade-python-on-macos-b2e67aeece36"
---

The latest major version of Python 2 was originally release on 03/07/2010 and on 01/01/2020 Python 2 will be no more;

> We have decided that January 1, 2020, will be the day that we sunset Python 2. That means that we will not improve it anymore after that day, even if someone finds a security problem in it. You should upgrade to Python 3 as soon as you can.

Interestingly the latest version of macOS still ships with Python 2.7 as its default Python interpreter, however that won’t be for much longer as Apple are removing all Scripting Language Runtimes from future releases of macOS;

> Scripting language runtimes such as Python, Ruby, and Perl are included in macOS for compatibility with legacy software. Future versions of macOS won’t include scripting language runtimes by default, and might require you to install additional packages. If your software depends on scripting languages, it’s recommended that you bundle the runtime within the app.

So what’s the best way to upgrade to Python 3 on macOS? Having found myself stuck in dependancy hell before I decided do some reading and have settled on using [pyenv](https://www.mediaglasses.blog/p/152c96aa-4ff8-4827-ba21-da5abf725718/) which makes install and maintaining various versions of Python easy.

You can install it using [Homebrew](https://brew.sh/) with the following commands;

{{< terminal title="Upgrade Python on MacOS 1/4" >}}
```
$ brew update $ brew install pyenv
```
{{< /terminal >}}

Once installed, you simply need to install your desired version of Python, the current version at the time of writing is 3.8.0;

{{< terminal title="Upgrade Python on MacOS 2/4" >}}
```
$ pyenv install 3.8.0 $ pyenv global 3.8.0 $ pyenv version
```
{{< /terminal >}}

Now that the right version of newer version of Python is installed we can use the following command to make sure that the pyenv shims are correctly loaded each time you open a shell;

{{< terminal title="Upgrade Python on MacOS 3/4" >}}
```
$ echo -e 'if command -v pyenv 1>/dev/null 2>&1; then\\n eval "$(pyenv init -)"\\nfi' >> ~/.zshrc
```
{{< /terminal >}}

Once you have restarted your terminal session you should be able to run;

{{< terminal title="Upgrade Python on MacOS 4/4" >}}
```
$ python --version
```
{{< /terminal >}}

If everything has gone as planned you should see the following output;

![text](/img/2019-12-29_upgrade-python-on-macos_1.png)
