---
author: Russ McKendrick
comments: true
date: 2014-04-19 11:00:00+00:00
image: assets/posts/c2877-1btnvhhpk2c7h1uygnsjz3w.png
title: Quick Magento Installation
wordpress_id: 1145
categories:
    - Tech
tags:
    - Magento
    - Shell
---

As part of work I have to install Magento with its sample data a lot for proof of concepts, while the installation is simple it can quickly become a chore. Because of this I have started to use [n98-magerun](http://magerun.net/). It can be installed using the following commands;



    
    curl -o n98-magerun.phar <a href="https://raw.github.com/netz98/n98-magerun/master/n98-magerun.phar" target="_blank" data-href="https://raw.github.com/netz98/n98-magerun/master/n98-magerun.phar">https://raw.github.com/netz98/n98-magerun/master/n98-magerun.phar</a><br>chmod +x ./n98-magerun.phar<br>cp ./n98-magerun.phar /usr/local/bin/<br>n98-magerun.phar self-update




Once installed you can do clean installation by running the following command where you would like Magento to be installed;



    
    n98-magerun.phar install




for more on how to use n98-magerun [click here](https://github.com/netz98/n98-magerun/wiki).




