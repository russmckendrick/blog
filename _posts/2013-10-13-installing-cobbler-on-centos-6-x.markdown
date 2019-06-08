---
author: russmckendrick
comments: true
date: 2013-10-13 11:00:00+00:00
layout: post
link: http://mediaglasses.blog/2013/10/13/installing-cobbler-on-centos-6-x/
slug: installing-cobbler-on-centos-6-x
title: Installing Cobbler on CentOS 6.x
wordpress_id: 1149
categories:
- Tech
tags:
- CentOS
- Shell
---






![]({{ site.baseurl }}/assets/posts/122aa-1id-18jyy8c991nkkkjlflw.png)




I needed a simple way to mirror some repos, and potentially kickstart some servers at a future date. While something like [The Foreman](http://theforeman.org) would do the build side of things it doesn’t repo mirrors (yet). So I did an install of [Cobbler](http://www.cobblerd.org).




This turned out to be more stright forward than I thought, first you need to ensure [EPEL](http://fedoraproject.org/wiki/EPEL) is enabled ….



    
    yum install <a href="http://ftp.linux.ncsu.edu/pub/epel/6/i386/epel-release-6-8.noarch.rpm" target="_blank" data-href="http://ftp.linux.ncsu.edu/pub/epel/6/i386/epel-release-6-8.noarch.rpm">http://ftp.linux.ncsu.edu/pub/epel/6/i386/epel-release-6-8.noarch.rpm</a><br>yum install cobbler cobbler-web pykickstart<br>chkconfig cobblerd on<br>chkconfig xinetd on<br>service httpd restart<br>service xinetd start<br>service cobblerd start<br>service cobblerd status<br>cobbler get-loaders<br>vim /etc/cobbler/modules.conf



    
    # Make the following changes ….



    
    [dns]<br>module = manage_dnsmasq<br>[dhcp]<br>module = manage_dnsmasq



    
    [authentication]<br>module = authn_configfile<br>[authorization]<br>module = authz_allowall



    
    # once done save and run the following ….<br>cobbler check<br>cobbler sync



    
    # cobbler sets the username and password for the web interface to cobbler / cobbler, change that by running ….<br>htdigest /etc/cobbler/users.digest “Cobbler” cobbler




….. all done. You should be able to access your installation at …..






  * 
[https://some.domain.com/cobbler_web](https://some.domain.com/cobbler_web/)/


  * [http://some.domain.com/cobbler/](http://some.domain.com/cobbler/)




