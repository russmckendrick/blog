---
title: "Update to Puppet Install Script"
description: "Effortless deployment of Puppet on CentOS/RHEL? Check out my updated installation script and streamline your automation setup today!"
author: "Russ Mckendrick"
date: "2015-07-12T11:00:00+01:00"
tags:
  - "Automation"
  - "Linux"
  - "Tools"
cover:
  image: "/img/2015-07-12_update-to-puppet-install-script_0.png"
  alt: "Effortless deployment of Puppet on CentOS/RHEL? Check out my updated installation script and streamline your automation setup today!"
lastmod: "2021-07-31T12:33:12+01:00"
aliases:
  - "/update-to-puppet-install-script-1c6b965d330c"
---

Around this time last year I blogged about [Upgrading my servers to CentOS 7](/2014/07/27/upgrading-my-servers-to-centos-7/), the post contained a link to a script which I wrote to deploy a Puppet Master & Agent and some updated instructions for installing on RHEL / CentOS 7.

As those instructions no longer work, and I needed to install a Puppet Master to have a play with I decided to update the installation script.

After a little reading it looks like installing a Puppet Master with Apache and Passenger is a little old fashioned since the release of [Puppet Server](https://puppetlabs.com/blog/puppet-server-bringing-soa-to-a-puppet-master-near-you).

The release of Puppet Server made it a lot easier to install a Puppet Master and also it allowed me merge the two scripts (one each for EL6 and EL7) into a single script.

The updated scripts can be found [in my GitHub account](https://github.com/russmckendrick/puppet-install) or to install Puppet Server you can run the following on either clean RHEL / CentOS 6 or 7 installation;

{{< terminal title="Update to Puppet Install Script 1/2" >}}
```
curl -fsS https://raw.githubusercontent.com/russmckendrick/puppet-install/master/install | bash
```
{{< /terminal >}}

and to install an agent;

{{< terminal title="Update to Puppet Install Script 2/2" >}}
```
curl -fsS https://raw.githubusercontent.com/russmckendrick/puppet-install/master/agent | bash -s puppet.master.com
```
{{< /terminal >}}

making sure to replace puppet.master.com with your freshly installed Puppet Server URL.

For more information please see the [README](https://github.com/russmckendrick/puppet-install/blob/master/README.md).
