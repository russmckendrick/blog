---
title: "Puppet Enterprise & AWS Security Groups"
description: "Russ Mckendrick tackles AWS security group hurdles installing Puppet Enterprise, resolves by temporarily allowing all traffic."
author: "Russ Mckendrick"
date: "2015-11-15T18:41:20+01:00"
tags:
  - "Automation"
  - "AWS"
cover:
  image: "/img/2015-11-15_puppet-enterprise-aws-security-groups_0.png"
  alt: "Russ Mckendrick tackles AWS security group hurdles installing Puppet Enterprise, resolves by temporarily allowing all traffic."
lastmod: "2021-07-31T12:33:31+01:00"
aliases:
  - "/puppet-enterprise-aws-security-groups-997ef7a75f7f"
---

This week I had to do a few installations of Puppet Enterprise on an EC2 instance. Although this seemed like a simple enough task, I did hit upon one annoying issue.

I was doing a Monolithic installation as it was just for testing, I had done this several times on [Digital Ocean](https://www.digitalocean.com/?refcode=52ec4dc3647e) and locally using a [Vagrant box](https://atlas.hashicorp.com/russmckendrick/) with no issue at all. Reading through the documenation I had to open the following

**8140**

- The Puppet master uses this port to accept inbound traffic/requests from Puppet agents.
- The PE console sends request to the Puppet master on this port.
- Certificate requests are passed over this port unless ca_port is set differently.

**443**

- This port provides host access to the PE console.
- The PE Console accepts HTTPS traffic from end-users on this port.

**61613**

- MCollective uses this port to accept inbound traffic/requests from Puppet agents for orchestration.
- Any host used to invoke orchestration commands must be able to reach MCollective on this port.

That seemed simple enough, however when I create a security group with those ports open to world, also as I was using the web based installer I opened port **3000** to my IP address, just in-case come script kiddie decided to do the installation for me.

Everything ran as expected until the installation got to “Waiting for Node Classifier to start” and then it hung;

```
PuppetDB configured.
Waiting for Node Classifier to start…
** HTTP_PROXY= http_proxy= HTTPS_PROXY= https_proxy= /opt/puppetlabs/puppet/bin/curl — tlsv1 -s — cacert /etc/puppetlabs/puppet/ssl/certs/ca.pem — key /opt/puppetlabs/server/data/console-services/certs/puppet.mckendrick.io.private_key.pem — cert /opt/puppetlabs/server/data/console-services/certs/puppet.mckendrick.io.cert.pem https://puppet.mckendrick.io:4433/classifier-api/v1/last-class-update | grep -q last_update.*[[:digit:]]
** HTTP_PROXY= http_proxy= HTTPS_PROXY= https_proxy= /opt/puppetlabs/puppet/bin/curl — tlsv1 -s — cacert /etc/puppetlabs/puppet/ssl/certs/ca.pem — key /opt/puppetlabs/server/data/console-services/certs/puppet.mckendrick.io.private_key.pem — cert /opt/puppetlabs/server/data/console-services/certs/puppet.mckendrick.io.cert.pem https://puppet.mckendrick.io:4433/classifier-api/v1/last-class-update | grep -q last_update.*[[:digit:]]
** HTTP_PROXY= http_proxy= HTTPS_PROXY= https_proxy= /opt/puppetlabs/puppet/bin/curl — tlsv1 -s — cacert /etc/puppetlabs/puppet/ssl/certs/ca.pem — key /opt/puppetlabs/server/data/console-services/certs/puppet.mckendrick.io.private_key.pem — cert /opt/puppetlabs/server/data/console-services/certs/puppet.mckendrick.io.cert.pem https://puppet.mckendrick.io:4433/classifier-api/v1/last-class-update | grep -q last_update.*[[:digit:]]
** HTTP_PROXY= http_proxy= HTTPS_PROXY= https_proxy= /opt/puppetlabs/puppet/bin/curl — tlsv1 -s — cacert /etc/puppetlabs/puppet/ssl/certs/ca.pem — key /opt/puppetlabs/server/data/console-services/certs/puppet.mckendrick.io.private_key.pem — cert /opt/puppetlabs/server/data/console-services/certs/puppet.mckendrick.io.cert.pem https://puppet.mckendrick.io:4433/classifier-api/v1/last-class-update | grep -q last_update.*[[:digit:]]
** HTTP_PROXY= http_proxy= HTTPS_PROXY= https_proxy= /opt/puppetlabs/puppet/bin/curl — tlsv1 -s — cacert /etc/puppetlabs/puppet/ssl/certs/ca.pem — key /opt/puppetlabs/server/data/console-services/certs/puppet.mckendrick.io.private_key.pem — cert /opt/puppetlabs/server/data/console-services/certs/puppet.mckendrick.io.cert.pem https://puppet.mckendrick.io:4433/classifier-api/v1/last-class-update | grep -q last_update.*[[:digit:]]
```

I tried running the curl command manually and got the same problem;

```
/opt/puppetlabs/puppet/bin/curl — tlsv1 -s — cacert /etc/puppetlabs/puppet/ssl/certs/ca.pem — key /opt/puppetlabs/server/data/console-services/certs/puppet.mckendrick.io.private_key.pem — cert /opt/puppetlabs/server/data/console-services/certs/puppet.mckendrick.io.cert.pem https://puppet.mckendrick.io:4433/classifier-api/v1/last-class-update
```

It was obviously an issue with the security group as when I added an allow all rule and re-ran the installer it worked without issue, however after the installation completed I removed the allow all rule and I could no longer login to the Puppet Enterprise Dashboard.

After repeating the installation a few times I managed to track the issue down to the way that Puppet interacts with itself. To resolve the issue I had to add an allow all for both external IP address and the internal IP address.

While this feels like a bit of a fudge it solved the issue with both the installer and the dashboard.

If anyone knows a more elegant fix for this please let me know in the comments below.
