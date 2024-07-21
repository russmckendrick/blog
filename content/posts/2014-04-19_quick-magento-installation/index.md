---
title: "Quick Magento Installation"
description: "Streamline Magento installations with n98-magerun, a handy command-line tool, for efficient setup and deployment of Magento with sample data."
author: "Russ Mckendrick"
date: 2014-04-19T11:00:00.000Z
lastmod: 2021-07-31T12:31:17+01:00
tags:
    - "Code"
    - "Tools"

cover:
    image: "/img/2014-04-19_quick-magento-installation_0.png" 
    alt: "Streamline Magento installations with n98-magerun, a handy command-line tool, for efficient setup and deployment of Magento with sample data."

images:
 - "/img/2014-04-19_quick-magento-installation_0.png"


aliases:
- "/quick-magento-installation-bd993fd21e8c"

---

As part of work I have to install Magento with its sample data a lot for proof of concepts, while the installation is simple it can quickly become a chore. Because of this I have started to use [n98-magerun](http://magerun.net/). It can be installed using the following commands;

```
curl -o n98-magerun.phar https://raw.github.com/netz98/n98-magerun/master/n98-magerun.phar
chmod +x ./n98-magerun.phar
cp ./n98-magerun.phar /usr/local/bin/
n98-magerun.phar self-update
```

Once installed you can do clean installation by running the following command where you would like Magento to be installed;

```
n98-magerun.phar install
```

for more on how to use n98-magerun [click here](https://github.com/netz98/n98-magerun/wiki).
