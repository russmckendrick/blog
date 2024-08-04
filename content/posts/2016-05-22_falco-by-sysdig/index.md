---
title: "Falco by sysdig"
description: "Discover Falco by Sysdig, a powerful behavioral security service monitoring system calls."
author: "Russ Mckendrick"
date: "2016-05-22T15:36:56+01:00"
tags:
  - "Linux"
  - "Security"
  - "Tools"
cover:
  image: "/img/2016-05-22_falco-by-sysdig_0.png"
  alt: "Discover Falco by Sysdig, a powerful behavioral security service monitoring system calls."
lastmod: "2021-07-31T12:33:53+01:00"
aliases:
  - "/falco-by-sysdig-9a1502438d47"
---

Earlier this week the guys over at [sysdig](https://sysdig.com/) announced the availability of Falco, a behavioral security service which is built on top of their core [Open Source sysdig engine](/2014/05/25/sysdig/). As is always the case when I try new things, I launched a [Digital Ocean](https://m.do.co/c/52ec4dc3647e) Droplet running CentOS 7.2. Once the Droplet was available I ran the command to [get the basics configured](/2015/06/28/digital-ocean-bootstrap/) on the droplet;

{{< terminal title="Falco by sysdig 1/6" >}}
```
curl -fsS https://raw.githubusercontent.com/russmckendrick/DOBootstrap/master/do-bootstrap.sh | bash
```
{{< /terminal >}}

Once the Droplet was configured I installed Falco using the repo provided by sysdig by running the following commands;

{{< terminal title="Falco by sysdig 2/6" >}}
```
rpm — import https://s3.amazonaws.com/download.draios.com/DRAIOS-GPG-KEY.public
curl -s -o /etc/yum.repos.d/draios.repo http://download.draios.com/stable/rpm/draios.repo
yum -y install kernel-devel-$(uname -r)
yum -y install falco
```
{{< /terminal >}}

With Falco installed, I started it up with the following command;

{{< terminal title="Falco by sysdig 3/6" >}}
```
service falco start
```
{{< /terminal >}}

and checked that everything was running as expected;

{{< terminal title="Falco by sysdig 4/6" >}}
```
[root@server ~]# service falco status
falco.service — LSB: Falco syscall monitoring agent
Loaded: loaded (/etc/rc.d/init.d/falco)
Active: active (running) since Sun 2016–05–22 12:27:29 BST; 22s ago
Docs: man:systemd-sysv-generator(8)
Process: 22019 ExecStart=/etc/rc.d/init.d/falco start (code=exited, status=0/SUCCESS)
CGroup: /system.slice/falco.service
└─22024 /usr/bin/falco — daemon — pidfile=/var/run/falco.pid

May 22 12:27:28 server.mckendrick.io systemd[1]: Starting LSB: Falco syscall monitoring agent…
May 22 12:27:29 server.mckendrick.io falco[22021]: Falco initialized with configuration file /etc/falco.yaml
May 22 12:27:29 server.mckendrick.io falco[22019]: Starting falco: Sun May 22 12:27:29 2016: Falco initialized with configuration file /etc/falco.yaml
May 22 12:27:29 server.mckendrick.io falco[22021]: Parsed rules from file /etc/falco_rules.yaml
May 22 12:27:29 server.mckendrick.io falco[22019]: Sun May 22 12:27:29 2016: Parsed rules from file /etc/falco_rules.yaml
May 22 12:27:29 server.mckendrick.io falco[22019]: [ OK ]
May 22 12:27:29 server.mckendrick.io systemd[1]: Started LSB: Falco syscall monitoring agent.
May 22 12:27:48 server.mckendrick.io systemd[1]: Started LSB: Falco syscall monitoring agent.
[root@server ~]#
```
{{< /terminal >}}

As you can, it was really straight forward to install. Next up I wanted to trigger a rule, looking through the [default ruleset](https://github.com/draios/falco/blob/dev/rules/falco_rules.yaml) I noticed the following;

{{< terminal title="Falco by sysdig 5/6" >}}
```
- macro: adduser_binaries
condition: proc.name in (adduser, deluser, addgroup, delgroup)
- rule: user_mgmt_binaries
desc: activity by any programs that can manage users, passwords, or permissions. sudo and su are excluded. Activity in containers is also excluded — some containers create custom users on top of a base linux distribution at startup.
condition: spawn_process and not proc.name in (su, sudo) and not container and (adduser_binaries or login_binaries or passwd_binaries or shadowutils_binaries)
output: “User management binary command run outside of container (user=%user.name command=%proc.cmdline)”
priority: WARNING
```
{{< /terminal >}}

So I added a user, as you can see it triggered the rule;

{{< terminal title="Falco by sysdig 6/6" >}}
```
[root@server ~]# adduser wibble
[root@server ~]# tail -2 messages
May 22 08:06:58 digitalocean falco: User management binary command run outside of container (user=root command=adduser wibble)
May 22 08:06:58 digitalocean falco: Sensitive file opened for reading by non-trusted program (user=root command=adduser wibble file=/etc/shadow)
```
{{< /terminal >}}

After this really quick installation and five minutes of messing about with the rules I can already think of several use cases for Falco and will be keeping a close eye on it.

You can find the GitHub repo for Falco at [https://github.com/draios/falco](https://github.com/draios/falco) and also the [announcement post here](https://sysdig.com/blog/sysdig-falco/).