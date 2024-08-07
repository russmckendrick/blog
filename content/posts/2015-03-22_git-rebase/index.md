---
title: "Git + Rebase"
description: "Streamline your Git workflow with Russ Mckendrick's tips! Learn how to fork, add remotes, and rebase for maximum efficiency."
author: "Russ Mckendrick"
date: "2015-03-22T12:00:00+01:00"
tags:
  - "Tools"
  - "Code"
  - "GitHub"
cover:
  image: "/img/2015-03-22_git-rebase_0.png"
  alt: "Streamline your Git workflow with Russ Mckendrick's tips! Learn how to fork, add remotes, and rebase for maximum efficiency."
lastmod: "2021-07-31T12:32:52+01:00"
aliases:
  - "/git-rebase-b6180e17cf81"
---

As you may have noticed, the blog looks different (again). This is because I have moved from [Wordpress](https://wordpress.org "Wordpress") back to [Ghost](https://ghost.org "Ghost") using their [GhostPro](http://blog.ghost.org/introducing-ghostpro/ "GhostPro") offering.

One of the things I like about Ghost is the default theme, [Casper](https://github.com/TryGhost/Casper "Casper"). While I wanted to keep it there were a few things I wanted to tweak, such as removing the full page header image on main index.

When I have previously used Ghost I have forked the theme on GitHub and then manually messed about getting any updates from the original code in.

This time I decided that I should try and make a proper job of it, this would mean;

- Fork the theme as before
- Add the original repo as a remote upstream
- Make my changes and commit away as normal
- Whenever there is an update to “official” version of Casper, fetch the upstream and rebase.

The initial part was easy enough, I forked the code and added the remote upstream;

{{< terminal title="Git + Rebase 1/3" >}}
```
 git clone https://github.com/russmckendrick/Casper.git
 git remote add upstream https://github.com/TryGhost/Casper.git
```
{{< /terminal >}}

This should allow me to run the following commands when there was an update to Casper;

{{< terminal title="Git + Rebase 2/3" >}}
```
 git fetch upstream
 git rebase upstream/master
```
{{< /terminal >}}

I noticed today that there was an update made to the theme so I tried my first rebase;

{{< terminal title="Git + Rebase 3/3" >}}
```
 ⚡ git fetch upstream
 From https://github.com/TryGhost/Casper
 1b86190..025fa6e master -> upstream/master
 ⚡ git rebase upstream/master
 First, rewinding head to replay your work on top of it…
 Applying: Adding MediaGlasses Custom bits
 Applying: Adding Font Awesome CSS
 Applying: Adding Favicons
 Applying: Changing tags details
 Applying: Adding Twemoji and changing tag prefix
 Applying: Use last post as the header
```
{{< /terminal >}}

It worked :D. Will be interesting to see what happens when there is a bigger update to the original.
