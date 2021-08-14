---
title: "Installing Cobbler on CentOS 6.x"
author: "Russ Mckendrick"
date: 2013-10-13T11:00:00.000Z
lastmod: 2021-07-31T12:31:02+01:00

tags:
 - Tech
 - Centos
 - Shell

cover:
    image: "/img/2013-10-13_installing-cobbler-on-centos-6.x_0.png" 
images:
 - "/img/2013-10-13_installing-cobbler-on-centos-6.x_0.png"


aliases:
- "/installing-cobbler-on-centos-6-x-7039a8de0f6c"

---

I needed a simple way to mirror some repos, and potentially kickstart some servers at a future date. While something like [The Foreman](http://theforeman.org) would do the build side of things it doesn’t repo mirrors (yet). So I did an install of [Cobbler](http://www.cobblerd.org).

This turned out to be more stright forward than I thought, first you need to ensure [EPEL](http://fedoraproject.org/wiki/EPEL) is enabled ….

```
yum install http://ftp.linux.ncsu.edu/pub/epel/6/i386/epel-release-6-8.noarch.rpm
yum install cobbler cobbler-web pykickstart
chkconfig cobblerd on
chkconfig xinetd on
service httpd restart
service xinetd start
service cobblerd start
service cobblerd status
cobbler get-loaders
vim /etc/cobbler/modules.conf

# Make the following changes ….

[dns]
module = manage_dnsmasq
[dhcp]
module = manage_dnsmasq

[authentication]
module = authn_configfile
[authorization]
module = authz_allowall

# once done save and run the following ….
cobbler check
cobbler sync

# cobbler sets the username and password for the web interface to cobbler / cobbler, change that by running ….
htdigest /etc/cobbler/users.digest “Cobbler” cobbler
```

….. all done. You should be able to access your installation at …..

- [https://some.domain.com/cobbler_web](https://some.domain.com/cobbler_web/)/
- [http://some.domain.com/cobbler/](http://some.domain.com/cobbler/)

