---
title: "Quick OpenStack Kilo Installation"
description: "Learn how to quickly install OpenStack Kilo on CentOS 7 using Vagrant and RedHat RDO. Follow step-by-step instructions for setting up a test environment."
author: "Russ Mckendrick"
date: "2015-05-24T11:00:00+01:00"
tags:
  - "Linux"
cover:
  image: "/img/2015-05-24_quick-openstack-kilo-installation_0.png"
  alt: "Learn how to quickly install OpenStack Kilo on CentOS 7 using Vagrant and RedHat RDO. Follow step-by-step instructions for setting up a test environment."
lastmod: "2021-07-31T12:33:06+01:00"
aliases:
  - "/quick-openstack-kilo-installation-89ea199853e3"
---

I am going to be playing with OpenStack over the next few weeks so I decided to create a Vagrant script which would bootstrap a working [OpenStack Kilo](https://wiki.openstack.org/wiki/ReleaseNotes/Kilo) installation using [RedHat RDO](https://www.rdoproject.org/ "RDO Project").

It uses my [CentOS 7 Vagrant box](https://vagrantcloud.com/russmckendrick/boxes/centos7) and works with both VirtualBox and VMWare Fusion.

To get it up and running create a folder for the Vagrantfile to live;

{{< terminal title="Quick OpenStack Kilo Installation 1/4" >}}
```
mkdir -p ~/Machines/OpenStack/
```
{{< /terminal >}}

Download a copy of the Vagrantfile;

{{< terminal title="Quick OpenStack Kilo Installation 2/4" >}}
```
curl -O https://gist.githubusercontent.com/russmckendrick/49700dbf18ac2d7fbbfa/raw/46c367fa9d257bab46affe15a19904c9d5171be9/Vagrantfile > ~/Machines/OpenStack/Vagrantfile
```
{{< /terminal >}}

and start the machine up;

{{< terminal title="Quick OpenStack Kilo Installation 3/4" >}}
```
 cd ~/Machines/OpenStack/
 vagrant up # for VirtualBox
 vagrant up — provider vmware_fusion # for VMWare Fusion
```
{{< /terminal >}}

It will take around 20 minutes to bootstrap the machine so make a cup of tea and watch this introduction to Kilo;

Feel free to reuse the Vagrantfile if you like;

{{< terminal title="Quick OpenStack Kilo Installation 4/4" >}}
```
# -*- mode: ruby -*-
# vi: set ft=ruby :
# Vagrantfile API/syntax version. Don't touch unless you know what you're doing!

VAGRANTFILE_API_VERSION = "2"
BOX_NAME = 'russmckendrick/centos7'
BOX_IP = '192.168.0.42'
HOSTNAME = 'rdo'
DOMAIN   = 'vagrant.dev'
Vagrant.require_version '>= 1.4.0'
Vagrant.configure(VAGRANTFILE_API_VERSION) do |config|

config.vm.box = BOX_NAME

config.vm.network :private_network, ip: BOX_IP

config.vm.host_name = HOSTNAME + '.' + DOMAIN

config.vm.synced_folder "./", "/vagrant", id: "vagrant-root",
    owner: "vagrant",
    group: "nobody",
    mount_options: ["dmode=777,fmode=755"]

config.vm.provider "virtualbox" do |v|
  v.memory = 4048
  v.cpus = 4
end

config.vm.provider "vmware_fusion" do |v|
  v.vmx["memsize"] = "4048"
  v.vmx["numvcpus"] = "4"
end

$script = <<SCRIPT
set -e
set -x
sudo systemctl stop NetworkManager
sudo systemctl disable NetworkManager
sudo systemctl enable network
sudo yum install -y https://rdoproject.org/repos/rdo-release.rpm
sudo yum install -y openstack-packstack
INTERNALIP=$(ifconfig | grep "inet" | grep "10.0.2" | awk '{ print $2 }')
EXTERNALIP=$(ifconfig | grep "inet" | grep "192.168" | awk '{ print $2 }')
sudo /usr/bin/packstack --gen-answer-file=/tmp/answers
sudo sed "s/$INTERNALIP/$EXTERNALIP/g" /tmp/answers > /tmp/answers-external
sudo /usr/bin/packstack --answer-file=/tmp/answers-external
echo ""
echo "**** Logins ******"
echo ""
sudo cat /root/keystonerc_admin
echo ""
SCRIPT

config.vm.provision "shell",
    inline: $script

end
```
{{< /terminal >}}
