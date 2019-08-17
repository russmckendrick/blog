---
author: Russ McKendrick
comments: true
date: 2015-03-22 12:00:00+00:00
image: assets/posts/bca2c-1mkjymqzal10iuytaywlyeg.png
title: Git + Rebase
categories:
     - Tech
tags:
     - Blog
     - Ghost
     - Git
     - GitHub
---

As you may have noticed, the blog looks different (again). This is because I have moved from [Wordpress](https://wordpress.org) back to [Ghost](https://ghost.org) using their [GhostPro](http://blog.ghost.org/introducing-ghostpro/) offering.

One of the things I like about Ghost is the default theme, [Casper](https://github.com/TryGhost/Casper). While I wanted to keep it there were a few things I wanted to tweak, such as removing the full page header image on main index.

When I have previously used Ghost I have [forked the theme](https://github.com/russmckendrick/Casper) on GitHub and then manually messed about getting any updates from the original code in.

This time I decided that I should try and make a proper job of it, this would mean;



 	
  * Fork the theme as before

 	
  * Add the original repo as a remote upstream

 	
  * Make my changes and commit away as normal

 	
  * Whenever there is an update to “official” version of Casper, fetch the upstream and rebase.


The initial part was easy enough, I forked the code and added the remote upstream;

    
     git clone <a href="https://github.com/russmckendrick/Casper.git" target="_blank" data-href="https://github.com/russmckendrick/Casper.git">https://github.com/russmckendrick/Casper.git</a>
     git remote add upstream <a href="https://github.com/TryGhost/Casper.git" target="_blank" data-href="https://github.com/TryGhost/Casper.git">https://github.com/TryGhost/Casper.git</a>


This should allow me to run the following commands when there was an update to Casper;

    
     git fetch upstream
     git rebase upstream/master


I noticed today that there was an update made to the theme so I tried my first rebase;

    
     ⚡ git fetch upstream
     From <a href="https://github.com/TryGhost/Casper" target="_blank" data-href="https://github.com/TryGhost/Casper">https://github.com/TryGhost/Casper</a>
     1b86190..025fa6e master -> upstream/master
     ⚡ git rebase upstream/master
     First, rewinding head to replay your work on top of it…
     Applying: Adding MediaGlasses Custom bits
     Applying: Adding Font Awesome CSS
     Applying: Adding Favicons
     Applying: Changing tags details
     Applying: Adding Twemoji and changing tag prefix
     Applying: Use last post as the header


It worked :D. Will be interesting to see what happens when there is a bigger update to the original.
