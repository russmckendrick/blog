---
author: russmckendrick
comments: true
date: 2013-10-06 11:00:00+00:00
layout: post
current: post
class: post-template
cover: assets/posts/e2842-1p6hqwrk4zg__uvmjpfc2zq.png
link: http://mediaglasses.blog/2013/10/06/saltstack-on-centos-6-x/
slug: saltstack-on-centos-6-x
title: SaltStack on CentOS 6.x
wordpress_id: 1057
categories:
- Tech
tags:
- CentOS
- Shell
---

Had a play with [SaltStack](http://saltstack.com/) today, it’s a good way to manage multiple machines from a central location. It runs as a Server (master) and client (minion).




First we need to install the Salt-Master, this assumes you are installing on CentOS and don’t mind having EPEL installed on both the master and minion ….



    
    # Install EPEL and Update on both the master and minions<br>yum update -y<br>yum install <a href="http://ftp.linux.ncsu.edu/pub/epel/6/i386/epel-release-6-8.noarch.rpm" target="_blank" data-href="http://ftp.linux.ncsu.edu/pub/epel/6/i386/epel-release-6-8.noarch.rpm">http://ftp.linux.ncsu.edu/pub/epel/6/i386/epel-release-6-8.noarch.rpm</a>



    
    # Install the salt-master<br>yum install salt-master<br>chkconfig salt-master on<br>sed -i ‘s/#interface: 0.0.0.0/interface: 0.0.0.0/g’ /etc/salt/master<br>service salt-master start



    
    # Install the salt-minion<br># Replace $salt-master.yourdomain.com with the FQDN of your salt-master



    
    yum install salt-minion<br>chkconfig salt-minion on<br>sed -i ‘s/#master: salt/master: manager.yourdomain.com/g’ /etc/salt/minion<br>service salt-minion start




Now we have a minion talking to the master we need to accept the certificate;



    
    salt-key -L<br>salt-key -A [hostname]




Thats it, you can now run commands across all your machines e.g.



    
    salt ‘*’ test.ping<br>salt ‘*’ grains.ls<br>salt ‘*’ grains.items<br>salt ‘*’ cmd.has_exec service<br>salt ‘*’ cmd.run “service nginx stop”<br>salt ‘*’ cmd.run “service nginx start”<br>salt ‘*’ cmd.run “yum update -y”




For further reading [RTFM](https://salt.readthedocs.org/en/latest/).




