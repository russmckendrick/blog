---
title: "Current Tools"
summary: "With macOS Catalina coming out soon I thought I would document what I currently have installed."
author: "Russ McKendrick"
date: 2019-09-07T18:36:07+01:00
image: "assets/headers/2019-09-07-current-tools.png"
draft: false
comments: true
categories:
  - Tech
tags: 
  - macOS
  - tools
---

As macOS Catalina is only a few weeks away I thought I would take a quick snapshot of what applications and tools are currently installed on my home MacBook Pro.

As per [other posts](/tags/tools/) I have using [Homebrew](https://brew.sh) to mange both the command-line tools;

``` bash
$ brew list
awscli     fontconfig  hugo    node       tree
azure-cli  hostess     m-cli   packer     zsh
cask       hub         mas     terraform
```

Also, I am using [Homebrew Cask](https://github.com/Homebrew/homebrew-cask) for non-app store desktop applications;

``` bash
$ brew cask list
adobe-creative-cloud                 iterm2            shadow          visual-studio-code
backblaze                            github            sonos           whatsapp
dash                                 google-chrome     spotify
drawio                               grammarly         sublime-text
font-source-code-pro-for-powerline   nordvpn           transmit
```

Finally, to manage App Store applications I am using [mas-cli](https://github.com/mas-cli/mas);

``` bash
$ mas list
1179623856 Pastebot (2.3)
1451177988 Carbonize (1.2.6)
406056744 Evernote (7.12)
803453959 Slack (4.0.3)
419330170 Moom (3.2.15)
1384080005 Tweetbot (3.3.1)
904280696 Things (3.9.2)
937984704 Amphetamine (4.2)
1333542190 1Password 7 (7.3.2)
```

This should give me a good list to work from in a few weeks time when I start my clean install of macOS Catalina - which given the changes to the way the underlying operating system works sounds like it is going to be a fun few weeks of tweaks.

Expect a follow post towards the end of the month :smiley:.
