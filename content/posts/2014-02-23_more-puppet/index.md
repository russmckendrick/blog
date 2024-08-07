---
title: "More Puppet"
description: "Efficient Puppet setup on CentOS with quick deployment scripts for Puppet Master and Agents, including a GitHub repo for easy configuration management."
author: "Russ Mckendrick"
date: "2014-02-23T12:00:00+01:00"
tags:
  - "Linux"
  - "Automation"
  - "Infrastructure as Code"
  - "DevOps"
cover:
  image: "/img/2014-02-23_more-puppet_0.png"
  alt: "Efficient Puppet setup on CentOS with quick deployment scripts for Puppet Master and Agents, including a GitHub repo for easy configuration management."
lastmod: "2021-07-31T12:31:15+01:00"
aliases:
  - "/more-puppet-8e6a77d14013"
---

I have been playing my [Digital Ocean](https://www.digitalocean.com/?refcode=52ec4dc3647e) server a lot recently. Breaking it, fixing it and then rebuilding it, while I had documented [my puppet installation](/2013/08/31/puppet-server-client-installation-centos-6.x/) it was getting to be a pain to copy and paste with each rebuild, so I pulled together a [few scripts](https://github.com/russmckendrick/puppet-install) from various sources to make the rebuilds a little less of a chore. To install fresh Puppet Master all I need to do now is run the following command;

{{< terminal title="More Puppet 1/2" >}}
```
curl -fsS https://raw2.github.com/russmckendrick/puppet-install/master/install | bash
```
{{< /terminal >}}

and to install an agent run;

{{< terminal title="More Puppet 2/2" >}}
```
curl -fsS https://raw2.github.com/russmckendrick/puppet-install/master/agent | bash -s puppet.master.com
```
{{< /terminal >}}

Finally I have put moved a non-personalised copy of [my main Puppet configuration into a GitHub repo](https://github.com/russmckendrick/puppet).
