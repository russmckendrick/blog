---
title: "Updating my dotfiles"
author: "Russ McKendrick"
date: 2024-04-02T07:30:00+01:00
description: "For the first time in nearly a decade, I updated my dotfiles blog post."
draft: falase
showToc: falase
cover:
    image: "cover.png"
    relative: true
tags:
  - "macos"
  - "code"
  - "life"
---

I decided to spring clean my Dotfiles repo, as it had been a while. Then I noticed that the last time I mentioned them on the blog was [nearly ten years ago](/2014/08/10/dotfiles/), so I wanted to give a quick update. The most significant change is that I have moved to using [Zsh](https://www.zsh.org/ "Zsh") and [Oh My Zsh](https://ohmyz.sh/) since Zsh became the default Shell in macOS.

{{< notice warning >}}
This is all VERY customised to my requirements, and there are a lot of hard-coded bits in there. You probably don't want to blindly copy and paste any of the commands below as things will break!!!
{{< /notice >}}

## Install everything needed for the dotfiles.

The commands below assume you are starting from a clean installation, which I do at least once a year. The first thing is to install Oh MyZsh:

{{< terminal title="Installing Oh My ZSH" >}}
```
sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
```
{{< /terminal >}}

Once installed, we can download and install the Fonts and Theme I use:

{{< terminal title="Installing the fonts and theme" >}}
```
brew tap homebrew/cask-fonts
brew install font-hack-nerd-font
git clone --depth=1 https://github.com/romkatv/powerlevel10k.git ${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}/themes/powerlevel10k
```
{{< /terminal >}}

There are some other tools called by the dot files, so lets install those too.

{{< terminal title="Installing other bits" >}}
```
brew install tree pygments ffmpeg yt-dlp visual-studio-code drawio thefuck
```
{{< /terminal >}}

## Pulling and setting up the dotfiles

First, we need to pull [my dotfiles repo](https://github.com/russmckendrick/dotfiles/):

{{< terminal title="Some Command" >}}
```
git clone git@github.com:russmckendrick/dotfiles.git ~/.dotfiles
```
{{< /terminal >}}

Then, create backups of all of the existing files:

{{< terminal title="Backup some files" >}}
```
mv ~/.zprofile ~/.dotfiles/backups/
mv ~/.zshrc ~/.dotfiles/backups/
mv ~/.gitconfig ~/.dotfiles/backups/
```
{{< /terminal >}}

Now we can create symbolic links to load contents from our `~/.dotfiles` folder:

{{< terminal title="Create the Symbolic Links" >}}
```
ln -s ~/.dotfiles/.zprofile ~/.zprofile
ln -s ~/.dotfiles/.zshrc ~/.zshrc
ln -s ~/.dotfiles/.gitconfig ~/.gitconfig
ln -s ~/.dotfiles/.hushlogin ~/.hushlogin
ln -s ~/.dotfiles/z.sh ~/.z.sh
```
{{< /terminal >}}

## What does it look like?

Below are some screens of what my current terminal looks like:

{{< gallery match="images/*" sortOrder="assc" rowHeight="200" margins="5" thumbnailResizeOptions="600x600 q90 Lanczos" showExif=true previewType="blur" embedPreview=true loadJQuery=true >}}<br>

You can also click on the link below to see it in action:

<a href="https://asciinema.org/a/PTUqbpxikms7nFWNs4R7OhMQR" target="_blank"><img src="https://asciinema.org/a/PTUqbpxikms7nFWNs4R7OhMQR.svg" class="no-zoom"/></a>

# Conclusion 
In this blog post, we walked through updating my dotfiles repository and setting up your development environment on a fresh macOS installation. I created a highly personalised and efficient terminal setup by using tools like Oh My Zsh, custom fonts, and a custom theme. While these dotfiles are tailored to my specific needs and may not be suitable for everyone to copy directly, they provide a great example of how to customize and streamline your development workflow. Keeping your dotfiles up to date and versioned in a repository is a great way to maintain consistency across your machines and make setting up new environments a breeze.

If you have any questions, feel free to leave a comment.
