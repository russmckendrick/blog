---
title: "First Steps with Ansible"
description: "Explore Ansible for AWS automation, transitioning from manual scripting. Initiate playbook for VPC and ELB deployment."
author: "Russ Mckendrick"
date: 2014-12-14T12:00:00.000Z
lastmod: 2021-07-31T12:32:30+01:00

tags:
    - "Linux"
    - "Automation"
    - "Infrastructure as Code"
    - "DevOps"
    - "Ansible"
cover:
    image: "/img/2014-12-14_first-steps-with-ansible_0.png" 
images:
 - "/img/2014-12-14_first-steps-with-ansible_0.png"


aliases:
- "/first-steps-with-ansible-dd5f4615d6ea"

---

All of the posts on orchestration on here have been about [Puppet](/2014/01/12/vagrant-puppet/) on [CentOS](/2014/02/23/more-puppet/) however last week I had need to script an AWS architecture and then launch instances built with [Packer](https://www.packer.io/) into it.

After much swearing I managed to hack together a python script which used [Boto](https://github.com/boto/boto) to create a launch configuration and register it with an auto-scaling group, I then used a second script which re-cycled instances behind the Elastic Load Balancer which were launched with the previous launch configuration.

I decided there must be a more elegant way of doing this so I looked at Puppet using it to manage AWS, there are some modules available but there was a lot of people discussing the various ways to configure a VPC using Puppet. Then I remember that learning the basics of [Ansible](http://www.ansible.com/home) was on my list of things to do.

As Ansible is agent-less I needed to install it on my Mac, this is simple enough as you can use [Brew](http://brew.sh) ….

```
brew update
brew install ansible
```

… once install I used a CentOS 7 Vagrant box to work through a few [tutorials](https://docs.ansible.com/ansible/latest/getting_started/index.html) …

```
russ @ Russs-iMac in ~/Desktop/ansible
vagrant up
Bringing machine ‘default’ up with ‘virtualbox’ provider…
==> default: Importing base box ‘zoresvit/centos-7.0’…
==> default: Matching MAC address for NAT networking…
==> default: Checking if box ‘zoresvit/centos-7.0’ is up to date…
==> default: Setting the name of the VM: ansible-000dd0c7684e44d25776288b71d594e00234a0ad_default_1418570825018_9435
==> default: Clearing any previously set network interfaces…
==> default: Preparing network interfaces based on configuration…
default: Adapter 1: nat
default: Adapter 2: hostonly
==> default: Forwarding ports…
default: 22 => 2222 (adapter 1)
==> default: Running ‘pre-boot’ VM customizations…
==> default: Booting VM…
==> default: Waiting for machine to boot. This may take a few minutes…
default: SSH address: 127.0.0.1:2222
default: SSH username: vagrant
default: SSH auth method: private key
default: Warning: Connection timeout. Retrying…
==> default: Machine booted and ready!
==> default: Checking for guest additions in VM…
==> default: Setting hostname…
==> default: Configuring and enabling network interfaces…
==> default: Mounting shared folders…
default: /share => /Users/russ/Desktop/ansible/share
default: /vagrant => /Users/russ/Desktop/ansible
==> default: Running provisioner: ansible…

PLAY [all] ********************************************************************

GATHERING FACTS *************************************************************** 
ok: [default]

TASK: [common | install ntp] ************************************************** 
changed: [default]

TASK: [common | check ntpd service is stopped] ******************************** 
changed: [default]

TASK: [common | ntpdate] ****************************************************** 
skipping: [default]

TASK: [common | ntp config file] ********************************************** 
changed: [default]

TASK: [common | start ntpd service] ******************************************* 
changed: [default]

NOTIFIED: [common | restart ntpd] ********************************************* 
changed: [default]

PLAY RECAP ******************************************************************** 
default : ok=6 changed=5 unreachable=0 failed=0
```

… like all first steps using a new orchestration tool I had installed & configured NTPD.

The syntax itself isn’t too different from Puppet so it was easy to get the gist of what was going on. Once I had gotten my head around the basics I started on creating a [Playbook](https://docs.ansible.com/ansible/latest/playbook_guide/playbooks_intro.html) which configures a VPC and launches an Elastic Load Balancer , here is the current work in progress …

```
- name: install ntp
  yum: pkg=ntp state=installed
- name: check ntpd service is stopped
  shell: "service ntpd status | grep -q stopped; echo $?"
  register: result
- name: ntpdate
  command: ntpdate 0.uk.pool.ntp.org
  when: result.stdout == "0"
- name: ntp config file
  template: src=roles/common/templates/ntp.conf.j2 dest=/etc/ntp.conf owner=root group=root mode=0644
  notify:
    - restart ntpd
- name: start ntpd service
  service: name=ntpd state=started enabled=yes
```

Once I have everything working as expected I will post an update.
