---
author: Russ McKendrick
comments: true
date: 2014-02-23 12:00:00+00:00
image: assets/posts/4d1c4-1bg_9gkvybylc6d188yyoja.png
title: More Puppet
categories:
    - Tech
tags:
    - CentOS
    - DevOps
    - Puppet
---

I have been playing my [Digital Ocean](https://www.digitalocean.com/?refcode=52ec4dc3647e) server a lot recently. Breaking it, fixing it and then rebuilding it, while I had documented [my puppet installation](https://media-glass.es/2013/08/31/puppet-server-and-client-installation-centos-6.x/) it was getting to be a pain to copy and paste with each rebuild, so I pulled together a [few scripts](https://github.com/russmckendrick/puppet-install) from various sources to make the rebuilds a little less of a chore. To install fresh Puppet Master all I need to do now is run the following command;



    
    curl -fsS <a href="https://raw2.github.com/russmckendrick/puppet-install/master/install" target="_blank" data-href="https://raw2.github.com/russmckendrick/puppet-install/master/install">https://raw2.github.com/russmckendrick/puppet-install/master/install</a> | bash




and to install an agent run;



    
    curl -fsS <a href="https://raw2.github.com/russmckendrick/puppet-install/master/agent" target="_blank" data-href="https://raw2.github.com/russmckendrick/puppet-install/master/agent">https://raw2.github.com/russmckendrick/puppet-install/master/agent</a> | bash -s puppet.master.com




Finally I have put moved a non-personalised copy of [my main Puppet configuration into a GitHub repo](https://github.com/russmckendrick/puppet).




