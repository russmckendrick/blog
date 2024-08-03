---
title: "Moving to ZSH"
description: "Transition smoothly to ZSH on macOS Catalina with tips on setup, Oh My ZSH installation, theme customization, and porting existing configurations."
author: "Russ Mckendrick"
date: 2019-06-15T00:00:00.000Z
lastmod: 2021-07-31T12:35:23+01:00
tags:
 - macOS

cover:
    image: "/img/2019-06-15_moving-to-zsh_0.jpeg" 
    alt: "Transition smoothly to ZSH on macOS Catalina with tips on setup, Oh My ZSH installation, theme customization, and porting existing configurations."

images:
 - "/img/2019-06-15_moving-to-zsh_0.jpeg"
 - "/img/2019-06-15_moving-to-zsh_1.png"


aliases:
- "/moving-to-zsh-1b0cb5659afc"

---

After the [announcement a few weeks back](https://www.theverge.com/2019/6/4/18651872/apple-macos-catalina-zsh-bash-shell-replacement-features) that Apple would be defaulting to [zsh](http://zsh.sourceforge.net) in macOS Catalina I decided to take the plunge and make the switch on my current machines.

I have tried making the switch once before, but for one reason or another I ended up reverting back to Bash. This time I decided to do a little more reading up and also add the `.zshrc` file to [my dotfiles repo](https://github.com/russmckendrick/dotfiles) and move as much as my `.bash_profile` over as possible.

First of all, I started by installing zsh and a [Powerline font](https://github.com/powerline/fonts), as I already had Homebrew and Cask installed I simply needed to run;

```
$ brew install zsh$ brew cask install font-source-code-pro-for-powerline
```

Once I had the basics installed, rather than configuring it all myself I decided to install [Oh My ZSH](https://ohmyz.sh) and use that as a starting point, I did that by running;

```
$ sh -c "$(curl -fsSL https://raw.githubusercontent.com/robbyrussell/oh-my-zsh/master/tools/install.sh)"
```

Once that had completed, I enabled the [Agnoster ZSH theme](https://github.com/agnoster/agnoster-zsh-theme) and enabled the [Sauce Code Powerline font](https://github.com/ryanoasis/nerd-fonts/tree/master/patched-fonts/SourceCodePro) in iTerm2, this has left me a terminal which looks like the following;

![text](/img/2019-06-15_moving-to-zsh_1.png)

Moving over my existing aliases and more importantly, the excellent [z.sh](https://github.com/rupa/z) which is what I use to jump around folders when on the command line seem to work without any problems — which is where I think I had problems before.

So far, no complaints — it will be an interesting week using it at work and tweaking the settings.
