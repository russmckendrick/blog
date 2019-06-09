---
author: russmckendrick
comments: true
date: 2014-07-12 11:00:00+00:00
layout: post
link: http://mediaglasses.blog/2014/07/12/first-play-with-centos-7-0/
slug: first-play-with-centos-7-0
title: First play with CentOS 7.0
wordpress_id: 1215
categories:
- Tech
tags:
- CentOS
- Digital Ocean
- EL7
---






![](/assets/posts/0575a-11laetu7o-0qvmw-uulixjw.png)




As I didn’t get chance to have a play with the pre-release CentOS 7.0 builds I decided to wait until [DigitalOcean](https://www.digitalocean.com/?refcode=52ec4dc3647e) lauched [their image](https://twitter.com/digitalocean/status/487664919127420928) which they did just in time for the weekend.




#### Check the IP Address




First thing I did was type in ifconfig and got …..



    
    [root@server ~]# ifconfig<br>-bash: ifconfig: command not found




….. not a good start, have dabbled with a [Fedora](https://fedoraproject.org) when I [installed OpenShift](https://media-glass.es/2014/05/31/openshift-notes/) I remembered about the ip command …..



    
    [root@server ~]# ip addr<br>1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN <br> link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00<br> inet 127.0.0.1/8 scope host lo<br> valid_lft forever preferred_lft forever<br> inet6 ::1/128 scope host <br> valid_lft forever preferred_lft forever<br>2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc pfifo_fast state UP qlen 1000<br> link/ether ff:ff:ff:ff:ff:ff brd ff:ff:ff:ff:ff:ff<br> inet 123.123.123.123/24 brd 123.123.123.255 scope global eth0<br> valid_lft forever preferred_lft forever<br> inet6 fe80::fe80:fe80:fe80:fe80/64 scope link <br> valid_lft forever preferred_lft forever




….. I can see a lot of muscle memory having to be re-learned.




#### Restarting services




Next up is a change I was expecting, the introduction of [systemd](http://en.wikipedia.org/wiki/Systemd) …..



    
    [root@server ~]# yum install httpd<br>Loaded plugins: fastestmirror<br>Loading mirror speeds from cached hostfile<br> * base: mirror.awanti.com<br> * extras: mirror.awanti.com<br> * updates: mirror.awanti.com<br>Resolving Dependencies<br> → Running transaction check<br> — -> Package httpd.x86_64 0:2.4.6–17.el7.centos.1 will be installed<br> → Finished Dependency Resolution



    
    Dependencies Resolved



    
    ======================================================================================================<br> Package Arch Version Repository Size<br>======================================================================================================<br>Installing:<br> httpd x86_64 2.4.6–17.el7.centos.1 base 2.7 M



    
    Transaction Summary<br>======================================================================================================<br>Install 1 Package



    
    Total download size: 2.7 M<br>Installed size: 9.3 M<br>Is this ok [y/d/N]: y<br>Downloading packages:<br>httpd-2.4.6–17.el7.centos.1.x86_64.rpm | 2.7 MB 00:00:01 <br>Running transaction check<br>Running transaction test<br>Transaction test succeeded<br>Running transaction<br> Installing : httpd-2.4.6–17.el7.centos.1.x86_64 1/1 <br> Verifying : httpd-2.4.6–17.el7.centos.1.x86_64 1/1



    
    Installed:<br> httpd.x86_64 0:2.4.6–17.el7.centos.1



    
    Complete!<br>[root@server ~]# service httpd restart<br>Redirecting to /bin/systemctl restart httpd.service




…. as you can see it did what I asked, but dropped some hints that I should have used `systemctl restart httpd`. What would `systemctl status httpd` give us …..



    
    [root@server ~]# systemctl status httpd<br>httpd.service — The Apache HTTP Server<br> Loaded: loaded (/usr/lib/systemd/system/httpd.service; disabled)<br> Active: active (running) since Sun 2014–07–13 13:24:45 EDT; 4s ago<br> Process: 21656 ExecStop=/bin/kill -WINCH ${MAINPID} (code=exited, status=0/SUCCESS)<br> Main PID: 21661 (httpd)<br> Status: “Processing requests…”<br> CGroup: /system.slice/httpd.service<br> ├─21661 /usr/sbin/httpd -DFOREGROUND<br> ├─21663 /usr/sbin/httpd -DFOREGROUND<br> ├─21664 /usr/sbin/httpd -DFOREGROUND<br> ├─21665 /usr/sbin/httpd -DFOREGROUND<br> ├─21666 /usr/sbin/httpd -DFOREGROUND<br> └─21667 /usr/sbin/httpd -DFOREGROUND



    
    Jul 13 13:24:45 server.domain.com systemd[1]: Starting The Apache HTTP Server…<br>Jul 13 13:24:45 server.domain.com systemd[1]: Started The Apache HTTP Server.




….. now thats a lot more useful that what serivce httpd status used to give.




#### Other highlights & changes




#### Version number




The initial release of CentOS 7.0 is actually 7.0–1406 (see the [numbering part of this notice](http://lists.centos.org/pipermail/centos-announce/2014-July/020393.html))




#### New Kernel




CentOS 7.0–1406 ships with 3.10.0–123, which is alot better than the previous 2.6.x kernel which shipped with CentOS 6




#### FirewallD




CentOS now comes with FirewallD, I can’t say I have ever used it before so more [reading](http://fedoraproject.org/wiki/Features/DynamicFirewall) is [needed](https://fedoraproject.org/wiki/FirewallD)




#### XFS




XFS is now the default file system when you install, though [DigitalOcean](https://www.digitalocean.com/?refcode=52ec4dc3647e) have stuck with ext4




#### Linux Containers




Docker (which I have written about [here](https://media-glass.es/2014/02/15/docker/), [here](https://media-glass.es/2014/04/27/more-docker/) and [here](https://media-glass.es/2014/05/04/yet-more-docker/)) is now fully support out of the box with no need to install [EPEL](https://fedoraproject.org/wiki/EPEL), in fact, at the time of writing the CentOS repo was more up-to-date than EPEL.



    
    [root@server ~]# yum list | grep docker<br>docker.x86_64 0.11.1–22.el7.centos extras <br>docker-registry.noarch 0.6.8–8.el7 extras 




#### Other software




Some changes to later software across the board, here are the highlights ……






  * 
[PHP](https://php.net/) is version 5.4.16


  * 
[Apache](https://httpd.apache.org/) is at version 2.4.6–17


  * 
[Ruby](https://www.ruby-lang.org/) is at version 2.0.0.353


  * 
[Python](https://www.python.org/) is at version 2.7.5–16


  * 
[Go](http://golang.org/) is at version 1.2–7


  * 
[MySQL](http://www.mysql.com/) has been replaced with [MariaDB](https://mariadb.org/) version 5.5.37


  * 
[PostgreSQL](http://www.postgresql.org/) is at version 9.2.7–1




