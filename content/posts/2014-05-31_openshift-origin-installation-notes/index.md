---
title: "OpenShift Origin installation notes"
description: "Learn how to install OpenShift Origin on a CentOS 6.5 Digital Ocean Droplet with this step-by-step guide. Discover the key differences between installing on CentOS and Fedora 19, and find out how to overcome common pitfalls in the installation process. Includes a detailed list of required packages, configuration changes, and troubleshooting tips to help you get your own Platform as a Service up and running quickly."
author: "Russ Mckendrick"
date: 2014-05-31T11:00:00.000Z
lastmod: 2021-07-31T12:31:34+01:00
tags:
    - "Linux"
    - "Automation"
    - "DevOps"
    - "Docker"

cover:
    image: "/img/2014-05-31_openshift-origin-installation-notes_0.png" 
images:
 - "/img/2014-05-31_openshift-origin-installation-notes_0.png"


aliases:
- "/openshift-origin-installation-notes-52f0efd3790a"

---

Having ran a local copy of [OpenShift Origin](http://openshift.github.io/) using [VirtualBox](http://openshift.github.io/documentation/oo_deployment_guide_vm.html#virtualbox) I decided to have a go at running it on a [Digital Ocean](https://www.digitalocean.com/?refcode=52ec4dc3647e) Droplet running CentOS 6.5. This should be easy as there is [an installer](https://install.openshift.com/) which claims;

> You’re one shell command away from deploying your own Platform as a Service.

Well, sort of, after a few failed installs I finally managed it using the following (this assumes you are running a clean and minimal CentOS 6.5 installation)

```
yum update -y
yum install -y http://www.mirrorservice.org/sites/dl.fedoraproject.org/pub/epel/6/i386/epel-release-6-8.noarch.rpm
cat > /etc/yum.repos.d/openshift-origin-deps.repo <<”EOF”
[openshift-origin-deps]
name=OpenShift Origin Dependencies — EL6
baseurl=http://mirror.openshift.com/pub/origin-server/release/3/rhel-6/dependencies/x86_64
gpgcheck=0
EOF
yum install -y ruby193-ruby vim-enhanced unzip curl puppet httpd-tools augeas bind bind-utils
vim /etc/selinux/config # DigitalOcean disable SELinux so change this to enabled
reboot # Reboot to enable SELinux
scl enable ruby193 bash # Make sure that all Ruby is piped through the SCL installed Ruby 1.93 binary
sh <(curl -s https://install.openshift.com/) # See notes below before answering any questions !!!
reboot
```

So, the problem I was having with is that by default oo_install assumes you are running [Fedora 19](http://fedoraproject.org/en/about-fedora) and populates repos_base with [http://mirror.openshift.com/pub/origin-server/release/3/fedora-19/](http://mirror.openshift.com/pub/origin-server/release/3/fedora-19/) what [the install instructions](http://openshift.github.io/documentation/oo_install_users_guide.html) fail to say is that you need to replace this with [http://mirror.openshift.com/pub/origin-server/release/3/rhel-6](http://mirror.openshift.com/pub/origin-server/release/3/rhel-6) when prompted about the subscription configuration oo_install will use for the deployment.

You can view the output of a full oo_install run through [listed in this Gist](https://gist.github.com/russmckendrick/7ee0e73912a29d5cea47).

So, if I had run through this on a Fedora 19 Droplet, would this have been any different? In short, yes;

```
yum update -y
yum install -y ruby vim-enhanced unzip curl puppet httpd-tools augeas bind bind-utils
vim /etc/selinux/config # Change from disabled to enabled
reboot 
sh <(curl -s https://install.openshift.com/)
reboot
```

This is mostly because of Fedora is way ahead of RHEL 6 based installations, this however should all change shortly with the release of [RHEL 7](http://distrowatch.com/?newsid=08406) and [CentOS 7](http://seven.centos.org/).
