---
title: "Rocky Linux and Packer"
author: "Russ McKendrick"
date: 2021-08-28T15:52:25+01:00
description: ""
draft: false
showToc: true
cover:
    image: "cover.png"
    relative: true
tags:
  - "Packer"
  - "Linux"
  - "Tools"

---

It has been a while since I last looked at running [Packer](https://www.packer.io) locally, when I did [CentOS 8 had just been released](/2019/10/13/packer-centos-8/).

Since then, there has been a little drama around the on-going support of CentOS which is best summed up by the following post in [/r/sysadmin/](https://www.reddit.com/r/sysadmin/):

{{< reddit url="https://www.redditmedia.com/r/sysadmin/comments/k95w7b/centos_moving_to_a_rolling_release_model_will_no/?ref_source=embed&amp;ref=share&amp;embed=true&amp;theme=dark" height="330" >}}

Off the back of this announcement the [Rocky Linux project](https://rockylinux.org) has been announced, developed and then released. The project describes itself as follows:

> Rocky Linux is a community enterprise operating system designed to be 100% bug-for-bug compatible with America's top enterprise Linux distribution now that its downstream partner has shifted direction. It is under intensive development by the community. Rocky Linux is led by Gregory Kurtzer, founder of the CentOS project. Contributors are asked to reach out using the communication options offered on this site.

Also since my last blog post, Packer has officially [moved from JSON to HCL as it's preferred template language](https://groups.google.com/g/hashicorp-announce/c/DE7q11FRTvc/m/eyZj2aF4AgAJ), so the first thing I did was update my [CentOS 8 Packer config](https://github.com/russmckendrick/packer-centos8), once updated I decided to also create a Rocky Linux Vagrant box using the same template as the two operating systems, for the moment, are pretty interchangeable.

While the language used by Packer has changed, the structure I am using hasn't, to start with I am setting some variables, these let you define if the VM should build in headless mode or not, which shutdown command to run, the version number which is used in the resulting files and finally the URL to download the ISO from and it's checksum:

{{< terminal title="Set some variables" >}}
``` hcl
variable "headless" {
  type    = string
  default = "true"
}

variable "shutdown_command" {
  type    = string
  default = "sudo /sbin/halt -p"
}

variable "version" {
  type    = string
  default = "8.4-2105"
}

variable "url" {
  type    = string
  default = "https://download.rockylinux.org/pub/rocky/8/isos/x86_64/Rocky-8.4-x86_64-dvd1.iso"
}

variable "checksum" {
  type    = string
  default = "ffe2fae67da6702d859cfb0b321561a5d616ce87a963d8a25b018c9c3d52d9a4"
}
```
{{< /terminal >}}

Next up we have the configuration for the Virtualbox portion of the build:


{{< terminal title="Virtualbox" >}}
``` hcl
source "virtualbox-iso" "virtualbox" {
  boot_command           = ["<tab> text inst.ks=http://{{ .HTTPIP }}:{{ .HTTPPort }}/ks.cfg<enter><wait>"]
  disk_size              = "100000"
  guest_additions_path   = "VBoxGuestAdditions_{{ .Version }}.iso"
  guest_additions_sha256 = "b81d283d9ef88a44e7ac8983422bead0823c825cbfe80417423bd12de91b8046"
  guest_os_type          = "RedHat_64"
  hard_drive_interface   = "sata"
  headless               = "${var.headless}"
  http_directory         = "http"
  iso_checksum           = "sha256:${var.checksum}"
  iso_url                = "${var.url}"
  shutdown_command       = "${var.shutdown_command}"
  ssh_password           = "vagrant"
  ssh_timeout            = "20m"
  ssh_username           = "vagrant"
  vboxmanage             = [[ "modifyvm", "{{ .Name }}", "--memory", "2024"], [ "modifyvm", "{{ .Name }}", "--cpus", "2" ]]
}
```
{{< /terminal >}}

Followed by the VMWare definition:

{{< terminal title="VMWare" >}}
``` hcl
source "vmware-iso" "vmware" {
  boot_command                   = ["<tab> text inst.ks=http://{{ .HTTPIP }}:{{ .HTTPPort }}/ks.cfg<enter><wait>"]
  disk_size                      = "100000"
  guest_os_type                  = "centos-64"
  headless                       = "${var.headless}"
  http_directory                 = "http"
  iso_checksum                   = "sha256:${var.checksum}"
  iso_url                        = "${var.url}"
  shutdown_command               = "${var.shutdown_command}"
  ssh_password                   = "vagrant"
  ssh_timeout                    = "20m"
  ssh_username                   = "vagrant"
  tools_upload_flavor            = "linux"
  vmx_remove_ethernet_interfaces = "true"
}
```
{{< /terminal >}}

Finally, the build itself, this section triggers the build of one or both of the virtual machines - then it bundles the scripts and targets the newly built virtual machine once SSH is available. Once deployed it then outputs one or both of the Virtual Machines as a Vagrantbox:

{{< terminal title="Build" >}}
``` hcl
build {
  sources = ["source.virtualbox-iso.virtualbox", "source.vmware-iso.vmware"]

  provisioner "shell" {
    execute_command = "sudo {{ .Vars }} sh {{ .Path }}"
    scripts         = ["scripts/vagrant.sh", "scripts/update.sh", "scripts/vmtools.sh", "scripts/zerodisk.sh"]
  }

  post-processor "vagrant" {
    output = "Rocky-${var.version}-x86_64-${source.name}.box"
  }
}
```
{{< /terminal >}}

At the moment I only have Virtualbox installed on my machine to I ran the following command to build the image and output the Vagrantbox for Virtualbox:

{{< notice warning >}}
**Please note:** The following command will download a 9GB+ ISO file to your machine.
{{< /notice >}}

{{< terminal title="Build the Virtualbox VM" >}}
``` terminfo
packer build -only virtualbox-iso.virtualbox rocky.pkr.hcl
```
{{< /terminal >}}

If I had VMWare installed than I could have ran the following command to build just VMWare virtual machine:

{{< terminal title="Build VMware VM" >}}
``` terminfo
packer build -only vmware-iso.vmware rocky.pkr.hcl
```
{{< /terminal >}}


Or to build both the Virtualbox and VMWare virtual machines at once, I could have just ran:

{{< terminal title="Build both VMs" >}}
``` terminfo
packer build rocky.pkr.hcl
```
{{< /terminal >}}

I have already built and uploaded the [Vagrantbox to Vagrant Cloud](https://app.vagrantup.com/russmckendrick/boxes/rocky), so you want to just try Rocky Linux then you can use the `Vagrantfile` below:

{{< terminal title="The Vagrantfile" >}}
``` ruby
# -*- mode: ruby -*-
# vi: set ft=ruby :

API_VERSION = "2"
BOX_NAME    = "russmckendrick/rocky"
BOX_VERSION = "8.4"
BOX_IP      = "10.20.30.40"
DOMAIN      = "nip.io"
PRIVATE_KEY = "~/.ssh/id_rsa"
PUBLIC_KEY  = '~/.ssh/id_rsa.pub'

Vagrant.configure(API_VERSION) do |config|
  config.vm.box = BOX_NAME
  config.vm.box_version = BOX_VERSION
  config.vm.network "private_network", ip: BOX_IP
  config.vm.host_name = BOX_IP + '.' + DOMAIN
  config.vm.synced_folder ".", "/vagrant", disabled: true
  config.ssh.insert_key = false
  config.ssh.private_key_path = [PRIVATE_KEY, "~/.vagrant.d/insecure_private_key"]
  config.vm.provision "file", source: PUBLIC_KEY, destination: "~/.ssh/authorized_keys"

  config.vm.provider "virtualbox" do |v|
    v.memory = "2024"
    v.cpus = "2"
  end

  config.vm.provider "vmware_fusion" do |v|
    v.vmx["memsize"] = "2024"
    v.vmx["numvcpus"] = "2"
  end

end
```
{{< /terminal >}}

Once you have the file simply run the following commands to launch the Virtual Machine and SSH to it:

{{< terminal title="Launch the virtual machine and SSH to it" >}}
``` terminfo
vagrant up
vagrant ssh
```
{{< /terminal >}}

Once you have finished playing with the virtual machine you can stop or destroy it by running one of the following commands:

{{< terminal title="Stop or Destroy" >}}
``` terminfo
vagrant stop
vagrant destroy
```
{{< /terminal >}}

The full code for this post can be found in the [russmckendrick/packer-rocky](https://github.com/russmckendrick/packer-rocky) GitHub repo.
