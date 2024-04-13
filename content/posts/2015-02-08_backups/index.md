---
title: "Backups"
description: "Secure backups for WordPress with VaultPress and DigitalOcean."
author: "Russ Mckendrick"
date: 2015-02-08T12:00:00.000Z
lastmod: 2021-07-31T12:32:37+01:00

tags:
    - "macOS"

cover:
    image: "/img/2015-02-08_backups_0.png" 
images:
 - "/img/2015-02-08_backups_0.png"


aliases:
- "/backups-33ecd1d69db"

---

In my line of work one of the things you learn quickly is that there is no such thing as too many backups. Call me paranoid, but I would rather be spoilt for choice should the worst happen. So what backups do I have in place?

#### Website

While this website is nothing more than a place for me to dump my thoughts and various tech ramblings it does generate a small amount of traffic. I hate to think how much time I spent messing about with it over the last year and half, so while it is not the end of the world if it was to disappear it would be hours of work gone.

For the WordPress elements of the site I use [VaultPress](http://vaultpress.com) which is a paid service ($5 / month) for backing up WordPress settings, themes, plug-ins and content. Also as I use [DigitalOcean](https://www.digitalocean.com/?refcode=52ec4dc3647e), I enabled [backups](https://www.digitalocean.com/help/technical/backup/) when I created the Droplet. This means, if for any reason the worst happens I have not only a working disk image but also the actual content of the site.

#### Desktop Machines & Mobiles

Being a Mac user I use Apples iCloud to do sync of all of my browser settings, keychains, contacts, email, photos etc. This also takes care of the iPhone & iPad settings.

As I have both an iMac & a MacBook I use a 2TB drive connected to an [AirPort Extreme](https://www.apple.com/uk/airport-extreme/) as a [TimeMachine](http://www.apple.com/uk/support/timemachine/) drive (the base station is no where either of the Macs). This covers the big stuff like the iTunes library (which is currently 2,279 albums or 33,784 songs) etc.

#### Stuff

For command like configuration & settings like SSH keys etc I use a private GitHub repo, then there is various online services such as Google Drive and Dropbox for the remainder. Finally passwords are synced to my [Dashline](/tags/) account.

#### Security?

All third party services I use have two-factor authentication enabled and use unique passwords, also should anything happen to these services I don’t have all of my data stored in a single service so I should be OK
