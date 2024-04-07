---
title: "Annoying Virtual Box bug"
description: "Solved a perplexing issue where static files weren't updating in Vagrant due to a long-standing VirtualBox bug with 'sendfile'."
author: "Russ Mckendrick"
date: 2014-11-02T12:43:13.000Z
lastmod: 2021-07-31T12:32:08+01:00

tags:
    - "macOS"
    - "Tools"

cover:
    image: "/img/2014-11-02_annoying-virtual-box-bug_0.png" 
images:
 - "/img/2014-11-02_annoying-virtual-box-bug_0.png"


aliases:
- "/annoying-virtual-box-bug-2ee3381104f5"

---

I am in the process of building a [Vagrant](https://www.vagrantup.com) Box for [work](https://www.reconnix.com). All was going great until I ended up having to spend the best part of two days trying to figure out why static files (css, javascript etc) were not being served after being updated on the host file system.

Turns out that [VirtualBox](https://www.virtualbox.org) has had a “bug” for around three years where if “[sendfile](http://man7.org/linux/man-pages/man2/sendfile.2.html)” is enabled in the web server you are running it won’t serve a file after it has been changed on the file system mounted from the host machine.

This function, a kernel call to copy files directly from disc to TCP, is used by both NGINX & Apache to help serve static content more efficiently.

The issue is documented here ….

- [https://www.virtualbox.org/ticket/9069](https://www.virtualbox.org/ticket/9069)
- [https://docs.vagrantup.com/v2/synced-folders/virtualbox.html](https://docs.vagrantup.com/v2/synced-folders/virtualbox.html)
- [http://wiki.nginx.org/Pitfalls#Config_Changes_Not_Reflected](http://wiki.nginx.org/Pitfalls#Config_Changes_Not_Reflected)
- [https://github.com/mitchellh/vagrant/issues/351#issuecomment-1339640](https://github.com/mitchellh/vagrant/issues/351#issuecomment-1339640)

…. hopefully this post will save anyone messing about [ETAGS](http://en.wikipedia.org/wiki/HTTP_ETag), [NFS](http://en.wikipedia.org/wiki/Network_File_System) or caching settings within their web server or applications for hours.

Also, it was a good lesson in Google early (hence the Picard faceplam) !!!
