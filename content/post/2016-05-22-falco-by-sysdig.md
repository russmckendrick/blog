---
author: Russ McKendrick
comments: true
date: 2016-05-22 15:36:56+00:00
image: assets/posts/falco.png
title: Falco by sysdig
categories:
    - Tech
tags:
    - CentOS
    - Falco
    - Security
    - sysdig
---

Earlier this week the guys over at [sysdig](https://sysdig.com/) announced the availability of Falco, a behavioral security service which is built on top of their core [Open Source sysdig engine](/2014/05/25/sysdig/). As is always the case when I try new things, I launched a [Digital Ocean](https://m.do.co/c/52ec4dc3647e) Droplet running CentOS 7.2. Once the Droplet was available I ran the command to [get the basics configured](/2015/06/28/digital-ocean-bootstrap/) on the droplet;

    
    curl -fsS <a href="https://raw.githubusercontent.com/russmckendrick/DOBootstrap/master/do-bootstrap.sh" target="_blank" data-href="https://raw.githubusercontent.com/russmckendrick/DOBootstrap/master/do-bootstrap.sh">https://raw.githubusercontent.com/russmckendrick/DOBootstrap/master/do-bootstrap.sh</a> | bash


Once the Droplet was configured I installed Falco using the repo provided by sysdig by running the following commands;

    
    rpm — import <a href="https://s3.amazonaws.com/download.draios.com/DRAIOS-GPG-KEY.public" target="_blank" data-href="https://s3.amazonaws.com/download.draios.com/DRAIOS-GPG-KEY.public">https://s3.amazonaws.com/download.draios.com/DRAIOS-GPG-KEY.public</a>
    curl -s -o /etc/yum.repos.d/draios.repo <a href="http://download.draios.com/stable/rpm/draios.repo" target="_blank" data-href="http://download.draios.com/stable/rpm/draios.repo">http://download.draios.com/stable/rpm/draios.repo</a>
    yum -y install kernel-devel-$(uname -r)
    yum -y install falco


With Falco installed, I started it up with the following command;

    
    service falco start


and checked that everything was running as expected;

    
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


As you can, it was really straight forward to install. Next up I wanted to trigger a rule, looking through the [default ruleset](https://github.com/draios/falco/blob/dev/rules/falco_rules.yaml) I noticed the following;

    
    - macro: adduser_binaries
    condition: proc.name in (adduser, deluser, addgroup, delgroup)
    - rule: user_mgmt_binaries
    desc: activity by any programs that can manage users, passwords, or permissions. sudo and su are excluded. Activity in containers is also excluded — some containers create custom users on top of a base linux distribution at startup.
    condition: spawn_process and not proc.name in (su, sudo) and not container and (adduser_binaries or login_binaries or passwd_binaries or shadowutils_binaries)
    output: “User management binary command run outside of container (user=%user.name command=%proc.cmdline)”
    priority: WARNING


So I added a user, as you can see it triggered the rule;

    
    [root@server ~]# adduser wibble
    [root@server ~]# tail -2 messages
    May 22 08:06:58 digitalocean falco: User management binary command run outside of container (user=root command=adduser wibble)
    May 22 08:06:58 digitalocean falco: Sensitive file opened for reading by non-trusted program (user=root command=adduser wibble file=/etc/shadow)


After this really quick installation and five minutes of messing about with the rules I can already think of several use cases for Falco and will be keeping a close eye on it.

You can find the GitHub repo for Falco at [https://github.com/draios/falco](https://github.com/draios/falco) and also the [announcement post here](https://sysdig.com/blog/sysdig-falco/).
