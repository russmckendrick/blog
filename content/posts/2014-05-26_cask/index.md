---
title: "Cask"
description: "Learn how to use Cask with Homebrew for easy installation of macOS applications, saving time and simplifying setup processes for your favorite apps."
author: "Russ Mckendrick"
date: "2014-05-26T11:00:00+01:00"
tags:
  - "macOS"
  - "Tools"
cover:
  image: "/img/2014-05-26_cask_0.png"
  alt: "Learn how to use Cask with Homebrew for easy installation of macOS applications, saving time and simplifying setup processes for your favorite apps."
lastmod: "2021-07-31T12:31:31+01:00"
aliases:
  - "/cask-7ae6de06b3d4"
---

I did a clean installation of my laptop this weekend, rather than go through the list of apps I had installed and do a manual installation of each one using the “Download and drag” method I decided to use [Cask](https://github.com/Homebrew/homebrew-cask). Cask is a [Homebrew](http://brew.sh/) package which automates to the download and install part. Here is pretty much my entire installation process ….

```
ruby -e “$(curl -fsSL https://raw.github.com/Homebrew/homebrew/go/install)"
brew doctor
brew install caskroom/cask/brew-cask
brew cask install google-chrome
brew cask install dropbox
brew cask install google-drive
brew cask install sublime-text
brew cask install github
brew cask install spotify
brew cask install libreoffice
brew cask install virtualbox
brew cask install skype
```

The only downside is that it installs the packages into the users Application directory which set my OCD off, it was quickly remedied though by simply moving the link once I had installed everything I needed.
