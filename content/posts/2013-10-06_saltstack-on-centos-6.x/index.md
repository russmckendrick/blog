---
title: "SaltStack on CentOS 6.x"
description: "A concise tutorial on setting up SaltStack for centralized server management on CentOS, including master-minion setup and basic commands."
author: "Russ Mckendrick"
date: "2013-10-06T11:00:00+01:00"
tags:
  - "Linux"
  - "Automation"
  - "Infrastructure as Code"
cover:
  image: "/img/2013-10-06_saltstack-on-centos-6.x_0.png"
  alt: "A concise tutorial on setting up SaltStack for centralized server management on CentOS, including master-minion setup and basic commands."
lastmod: "2021-07-31T12:31:01+01:00"
category: ""
aliases:
  - "/saltstack-on-centos-6-x-b76a26a10a90"
---

Had a play with [SaltStack](http://saltstack.com/) today, it’s a good way to manage multiple machines from a central location. It runs as a Server (master) and client (minion).

First we need to install the Salt-Master, this assumes you are installing on CentOS and don’t mind having EPEL installed on both the master and minion ….

{{< terminal title="SaltStack on CentOS 6.x 1/3" >}}
```
# Install EPEL and Update on both the master and minions
yum update -y
yum install http://ftp.linux.ncsu.edu/pub/epel/6/i386/epel-release-6-8.noarch.rpm

# Install the salt-master
yum install salt-master
chkconfig salt-master on
sed -i ‘s/#interface: 0.0.0.0/interface: 0.0.0.0/g’ /etc/salt/master
service salt-master start

# Install the salt-minion
# Replace $salt-master.yourdomain.com with the FQDN of your salt-master

yum install salt-minion
chkconfig salt-minion on
sed -i ‘s/#master: salt/master: manager.yourdomain.com/g’ /etc/salt/minion
service salt-minion start
```
{{< /terminal >}}

Now we have a minion talking to the master we need to accept the certificate;

{{< terminal title="SaltStack on CentOS 6.x 2/3" >}}
```
salt-key -L
salt-key -A [hostname]
```
{{< /terminal >}}

Thats it, you can now run commands across all your machines e.g.

{{< terminal title="SaltStack on CentOS 6.x 3/3" >}}
```
salt ‘*’ test.ping
salt ‘*’ grains.ls
salt ‘*’ grains.items
salt ‘*’ cmd.has_exec service
salt ‘*’ cmd.run “service nginx stop”
salt ‘*’ cmd.run “service nginx start”
salt ‘*’ cmd.run “yum update -y”
```
{{< /terminal >}}

For further reading [RTFM](https://salt.readthedocs.org/en/latest/).
