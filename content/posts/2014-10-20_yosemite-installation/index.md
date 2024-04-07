---
title: "Yosemite Installation"
description: "Reflecting on my smoothest MacOS upgrade experience with Yosemite: a journey from backup to clean installation and setting up my essentials."
author: "Russ Mckendrick"
date: 2014-10-20T11:00:00.000Z
lastmod: 2021-07-31T12:32:06+01:00

tags:
    - "macOS"
    - "Tools"

cover:
    image: "/img/2014-10-20_yosemite-installation_0.png" 
images:
 - "/img/2014-10-20_yosemite-installation_0.png"


aliases:
- "/yosemite-installation-6bdf5d68ea1a"

---

This could be the most straight forward MacOS update I have ever performed (I have been doing them since [System 7.5](http://en.wikipedia.org/wiki/System_7)).

This time all three machines (iMac, MBP and MBA) worked first time with no dramas. As always the first thing I did was a full TimeMachine back-up (I have been burnt before) and then downloaded a copy of the Yosemite install from the AppStore. Rather than do an in-place upgrade I always do a clean installation, for the last three releases I have used the excellent [DiskMaker X (or Lion Disk Maker as it used to be known)](http://liondiskmaker.com). Once I have a USB installer I rebooted into the USB disk and then erased my primary hard drive using the disk utility, which is always a fun moment.

Once the new system had installed and I have logged in the first thing I do is install the [Command Line Tools](http://adcdownload.apple.com/Developer_Tools/command_line_tools_os_x_10.10_for_xcode__xcode_6.1/command_line_tools_for_osx_10.10_for_xcode_6.1.dmg), once they are installed [Brew](http://brew.sh/) can be installed and then [Cask](/2014/05/26/cask/) …….

```
ruby -e “$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"
brew doctor
brew install caskroom/cask/brew-cask
```

Now its time for the none AppStore software ….

```
brew cask install onepassword
brew cask install spotify
brew cask install sublime-text
brew cask install github
brew cask install libreoffice
brew cask install virtualbox
brew cask install skype
brew cask install panic-unison
brew cask install vagrant
brew cask install vyprvpn
brew cask install omnigraffle
brew cask install alfred
brew cask install sketch
brew cask install codekit
mv ~/Applications/* /Applications/
brew cask install adobe-creative-cloud
open /opt/homebrew-cask/Caskroom/adobe-creative-cloud/latest
brew tap homebrew/binary
brew install packer
brew install tree
sudo easy_install Pygments
sudo easy_install stormssh
sudo gem install jekyll
sudo gem install github-pages
```

Finally open the AppStore & install the rest ….

```
open /Applications/App\ Store.app
```

…. other than putting the Apps in the [dock](http://en.wikipedia.org/wiki/Dock_%28OS_X%29) and actually adding licenses etc that was it.

The only real issue I had was that the machine needed a reboot to kick [iCloud Drive](https://www.apple.com/uk/ios/whats-new/icloud-drive/) into life. The only thing I don’t like so far about the visual update to goto in the the Mini player in [iTunes 12](https://www.apple.com/uk/itunes/) you have to hover over the artwork in the player, which is ok. However, to return to the main window you have to click the window close icon which just feels wrong.

I suppose one little annoyance out of such a major update isn’t bad going, but grrrrrrr.
