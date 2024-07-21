---
title: "Fail2Ban on CentOS 7"
description: "Protect your CentOS 7 server with fail2ban! Follow my guide to secure your system from unwanted SSH login attempts."
author: "Russ Mckendrick"
date: 2015-03-29T12:23:28.000Z
lastmod: 2021-07-31T12:32:54+01:00

tags:
    - "Linux"
    - "Security"

cover:
    image: "/img/2015-03-29_fail2ban-on-centos-7_0.png" 
    alt: "Protect your CentOS 7 server with fail2ban! Follow my guide to secure your system from unwanted SSH login attempts."

images:
 - "/img/2015-03-29_fail2ban-on-centos-7_0.png"


aliases:
- "/fail2ban-on-centos-7-4703f8101b0c"

---

One of the first things I do on a new server is install [fail2ban](http://www.fail2ban.org/wiki/index.php/Main_Page "fail2ban"). I have written about it before, but that was [back when I was still using CentOS 6](/2014/05/10/hackers/ "Hackers"). Now I am using CentOS 7 the installation has a few more steps.

Firstly, as EPEL is not enabled by standard on most CentOS 7 installations enable the repo and then install fail2ban.

```
 yum install -y epel-release && yum install -y fail2ban
```

Once installed you can run the following to setup a check and block for failed SSH logins (it bans for 24 hours after three login failures);

```
 cat >> /etc/fail2ban/jail.local << FAIL2BAN_CONFIG 
 [sshd]
 enabled = true
 maxretry = 3
 bantime = 86400
 FAIL2BAN_CONFIG
```

Now it’s time to start [firewalld](https://fedoraproject.org/wiki/FirewallD "firewalld") & fail2ban;

```
 systemctl start firewalld && systemctl start fail2ban
```

Before setting firewalld & fail2ban to start on boot now is probably the best time to make sure everything is working as expected. If it’s not you can add firewall rules using the following commands to, for example open http & https;

```
 [root@server ~]# firewall-cmd — list-services
 dhcpv6-client ssh
 [root@server ~]# firewall-cmd — permanent — zone=public — add-service=http
 success
 [root@server ~]# firewall-cmd — permanent — zone=public — add-service=https
 success
 [root@server ~]# systemctl restart firewalld
 [root@server ~]# firewall-cmd — list-services
 dhcpv6-client http https ssh
 [root@server ~]# 
```

Even worse, if you get kicked off the server instance and can no longer connect you should probably reboot your server instance and add rules for ssh.

If everything is working then set the services to start on boot using;

```
 systemctl enable firewalld
 systemctl enable fail2ban
```

Thats it, you can check what fail2ban is up to by typing;

```
 fail2ban-client status sshd
```

or you can check for errors using [journalctl](http://www.freedesktop.org/software/systemd/man/journalctl.html "journalctl");

```
 journalctl -lfu fail2ban
```

If everything has gone as planned you should see it start to see IP addresses being blocked;

```
 [root@server ~]# fail2ban-client status sshd
 Status for the jail: sshd
 |- Filter
 | |- Currently failed: 0
 | |- Total failed: 261
 | `- File list: /var/log/secure
 `- Actions
 |- Currently banned: 2
 |- Total banned: 2
 `- Banned IP list: 218.65.30.107 43.255.191.142
 [root@server ~]# 
```
